import * as THREE from 'three';
import { FSEntry } from '../lib/filesystem';
import QFrameAPI from '../../lib/api';
import FileView from './FileView';

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
		yieldFn: any,
		requestFrame: any
	) {
		super(fsEntry, model, fullPath, api, yieldFn, requestFrame);

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
		if (this.mesh.material && this.mesh.material.map) {
			this.mesh.material.map.dispose();
		}
		if (this.mesh.geometry) {
			this.mesh.geometry.dispose();
		}
		this.loadListeners.splice(0);
	}

	load(src: string) {
		var img = new Image();
		img.crossOrigin = 'anonymous';
		img.src = src;
		const obj = this.mesh;
		img.onload = () => {
			if (obj.parent) {
				var maxD = Math.max(img.width, img.height);
				obj.scale.x *= img.width / maxD;
				obj.scale.y *= img.height / maxD;
				obj.material = new THREE.MeshBasicMaterial({
					map: new THREE.Texture(img),
					transparent: true,
					depthTest: false,
					depthWrite: false,
				});
				if (obj.material.map) obj.material.map.needsUpdate = true;
				this.visible = true;
				this.loaded();
				this.requestFrame();
			}
		};
	}
}
