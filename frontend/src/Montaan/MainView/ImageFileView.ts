import * as THREE from 'three';
import { FSEntry } from '../lib/filesystem';
import QFrameAPI from '../../lib/api';
import { Intersection } from 'three';
import { BBox } from '../lib/Geometry';

const emptyMaterial = new THREE.MeshBasicMaterial();

interface ImageMesh extends THREE.Mesh {
	material: THREE.MeshBasicMaterial;
}

export default class ImageFileView extends THREE.Mesh {
	fsEntry: FSEntry;
	model: THREE.Mesh;
	api: QFrameAPI;
	yield: any;
	path: string;
	mesh: ImageMesh;
	requestFrame: any;
	fullyVisible: boolean = false;
	loadListeners: (() => void)[];
	canHighlight: boolean = false;

	constructor(
		fsEntry: FSEntry,
		model: THREE.Mesh,
		fullPath: string,
		api: QFrameAPI,
		yieldFn: any,
		requestFrame: any
	) {
		super();
		this.visible = false;
		this.fsEntry = fsEntry;
		this.model = model;
		this.api = api;
		this.yield = yieldFn;
		this.path = fullPath;
		this.requestFrame = requestFrame;
		this.loadListeners = [];

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
		if (this.geometry) {
			this.geometry.dispose();
		}
		this.loadListeners.splice(0);
	}

	onclick(ev: MouseEvent, intersection: Intersection, bbox: BBox) {
		return false;
	}

	loaded() {
		this.loadListeners.splice(0).forEach((f) => f());
	}

	goToCoords(coords: number[]) {
		return false;
	}

	goToSearch(search: string) {
		return false;
	}

	getHighlightRegion(coords: number[]) {
		return {
			c0: new THREE.Vector3(),
			c1: new THREE.Vector3(),
			c2: new THREE.Vector3(),
			c3: new THREE.Vector3(),
		};
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
