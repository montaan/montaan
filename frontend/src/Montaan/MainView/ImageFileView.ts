import * as THREE from 'three';
import { FSEntry } from '../lib/filesystem';
import QFrameAPI from '../../lib/api';
import { BufferGeometry } from 'three';

const emptyMaterial = new THREE.MeshBasicMaterial();

export default class ImageFileView extends THREE.Mesh {
	fsEntry: FSEntry;
	model: THREE.Mesh;
	api: QFrameAPI;
	yield: any;
	path: string;
	fontTexture: THREE.Texture;
	geometry: BufferGeometry;
	material: THREE.MeshBasicMaterial;
	requestFrame: any;
	fullyVisible: boolean = false;
	loadListeners: (() => void)[];

	constructor(
		fsEntry: FSEntry,
		model: THREE.Mesh,
		fullPath: string,
		api: QFrameAPI,
		yieldFn: any,
		requestFrame: any,
		fontTexture: THREE.Texture
	) {
		super();
		this.visible = false;
		this.fsEntry = fsEntry;
		this.model = model;
		this.api = api;
		this.yield = yieldFn;
		this.path = fullPath;
		this.fontTexture = fontTexture;
		this.requestFrame = requestFrame;
		this.loadListeners = [];

		this.geometry = new THREE.PlaneBufferGeometry(1, 1);
		this.material = emptyMaterial;
		this.scale.multiplyScalar(fsEntry.scale * 0.5);
		this.position.set(
			fsEntry.x + fsEntry.scale * 0.25,
			fsEntry.y + fsEntry.scale * 0.5,
			fsEntry.z
		);
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

	load(src: string) {
		var img = new Image();
		img.crossOrigin = 'anonymous';
		img.src = src;
		const obj = this;
		img.onload = function() {
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
				obj.visible = true;
				obj.loaded();
				obj.requestFrame();
			}
		};
	}
}
