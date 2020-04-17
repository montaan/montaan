import * as THREE from 'three';
import { FSEntry } from '../../Filesystems';
import QFrameAPI from '../../../lib/api';
import FileView from '..';
import { BBox } from '../../Geometry/Geometry';
import NavTarget from '../../NavTarget/NavTarget';

const emptyMaterial = new THREE.MeshBasicMaterial();

interface ImageMesh extends THREE.Mesh {
	material: THREE.MeshBasicMaterial;
}

export default class ImageFileView extends FileView {
	mesh: ImageMesh;
	fullyVisible: boolean = false;

	constructor(
		fsEntry: FSEntry,
		model: THREE.Mesh,
		fullPath: string,
		api: QFrameAPI,
		requestFrame: any
	) {
		super(fsEntry, model, fullPath, api, requestFrame);

		const geometry = new THREE.PlaneBufferGeometry(1, 1);
		const material = emptyMaterial;
		const image = new THREE.Mesh(geometry, material) as ImageMesh;
		this.mesh = image;
		this.add(this.mesh);
		this.mesh.scale.multiplyScalar(0.7);
		this.mesh.position.set(0.5, 0.65, 0);
		this.scale.multiplyScalar(fsEntry.scale);
		this.position.copy((fsEntry as unknown) as THREE.Vector3);
	}

	dispose() {
		this.loadListeners.splice(0);
		this.ontick = function(t, dt) {
			if (this.mesh && this.mesh.material) {
				this.mesh.material.opacity -= dt / 1000 / 0.25;
				if (this.mesh.material.opacity < 0) {
					this.mesh.material.opacity = 0;
					if (this.mesh.material && this.mesh.material.map) {
						this.mesh.material.map.dispose();
					}
					if (this.mesh.geometry) {
						this.mesh.geometry.dispose();
					}
					this.remove(this.mesh);
					this.parent?.remove(this);
				}
				this.requestFrame();
			} else {
				this.parent?.remove(this);
			}
			this.requestFrame();
		};
		if (!(this.mesh && this.mesh.material)) {
			this.parent?.remove(this);
		}
		this.requestFrame();
	}

	async goToCoords(coords: number[]): Promise<THREE.Vector3 | undefined> {
		if (this.mesh.material.map) return this.__goToCoords(coords);
		else
			return new Promise((resolve, reject) => {
				this.loadListeners.push(() => resolve(this.__goToCoords(coords)));
			});
	}

	__goToCoords(coords: number[]): THREE.Vector3 | undefined {
		if (!this.mesh.material.map) return undefined;
		const image = this.mesh.material.map.image;
		const { width, height } = image;
		const [x, y, z] = coords;
		const targetPoint = new THREE.Vector3(x / width, y / height, 2 / z);
		this.updateWorldMatrix(true, true);
		targetPoint.applyMatrix4(this.mesh.matrixWorld);
		return targetPoint;
	}

	onclick(ev: MouseEvent, intersection: THREE.Intersection, bbox: BBox, navTarget: NavTarget) {
		if (bbox.width > 0.2) {
			if (navTarget.fsEntry === this.fsEntry) {
				if (navTarget.coords.length > 0 || navTarget.search.length > 0) {
					return undefined;
				}
			}
			return [0, 0, 1];
		}
		return undefined;
	}

	async load(arrayBufferPromise: Promise<ArrayBuffer | HTMLImageElement | undefined>) {
		const buf = await arrayBufferPromise;
		if (buf === undefined) return;
		const img = buf instanceof HTMLImageElement ? buf : new Image();
		img.decoding = 'async';
		if (buf instanceof HTMLImageElement) {
			await img.decode();
		} else {
			let type = undefined;
			if (/\.svg(z|\.gz)?$/i.test(this.path)) type = 'image/svg+xml';
			else if (/\.png$/i.test(this.path)) type = 'image/png';
			else if (/\.jpe?g$/i.test(this.path)) type = 'image/jpeg';
			const url = URL.createObjectURL(new Blob([buf], { type }));
			img.src = url;
			await img.decode();
			URL.revokeObjectURL(url);
		}
		if (!this.parent) return;
		var maxD = Math.max(img.width, img.height);
		this.mesh.scale.x *= img.width / maxD;
		this.mesh.scale.y *= img.height / maxD;
		this.mesh.material = new THREE.MeshBasicMaterial({
			map: new THREE.Texture(img),
			transparent: true,
			depthTest: false,
			depthWrite: false,
			opacity: 0,
		});
		if (this.mesh.material.map) this.mesh.material.map.needsUpdate = true;
		this.ontick = function(t, dt) {
			this.mesh.material.opacity += dt / 1000 / 0.5;
			if (this.mesh.material.opacity > 1) {
				this.mesh.material.opacity = 1;
				delete this.ontick;
			}
			this.requestFrame();
		};
		this.visible = true;
		this.loaded();
		this.requestFrame();
	}
}
