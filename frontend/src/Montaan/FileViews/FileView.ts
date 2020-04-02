import { FSEntry } from '../lib/filesystem';
import QFrameAPI from '../../lib/api';
import * as THREE from 'three';
import { BBox } from '../lib/Geometry';
import NavTarget from '../lib/NavTarget';

export class ContentBBox {
	topLeft: THREE.Vector3;
	topRight: THREE.Vector3;
	bottomLeft: THREE.Vector3;
	bottomRight: THREE.Vector3;
	constructor(
		topLeft: THREE.Vector3,
		topRight: THREE.Vector3,
		bottomLeft: THREE.Vector3,
		bottomRight: THREE.Vector3
	) {
		this.topLeft = topLeft;
		this.topRight = topRight;
		this.bottomLeft = bottomLeft;
		this.bottomRight = bottomRight;
	}
}

export const EmptyContentBBox = new ContentBBox(
	new THREE.Vector3(),
	new THREE.Vector3(),
	new THREE.Vector3(),
	new THREE.Vector3()
);

export default class FileView extends THREE.Object3D {
	fsEntry: FSEntry;
	model: THREE.Mesh;
	api: QFrameAPI;
	path: string;
	requestFrame: any;
	loadListeners: (() => void)[];
	canHighlight: boolean = false;

	constructor(
		fsEntry: FSEntry,
		model: THREE.Mesh,
		fullPath: string,
		api: QFrameAPI,
		requestFrame: any
	) {
		super();
		this.visible = false;
		this.fsEntry = fsEntry;
		this.model = model;
		this.api = api;
		this.path = fullPath;
		this.requestFrame = requestFrame;
		this.loadListeners = [];
	}

	dispose() {
		this.loadListeners.splice(0);
	}

	async goToCoords(coords: number[]): Promise<THREE.Vector3 | undefined> {
		return undefined;
	}

	async goToSearch(search: string): Promise<THREE.Vector3 | undefined> {
		return undefined;
	}

	getHighlightRegion(coords: number[]): ContentBBox {
		return EmptyContentBBox;
	}

	loaded() {
		this.loadListeners.splice(0).forEach((f) => f());
	}

	onclick(
		ev: MouseEvent,
		intersection: THREE.Intersection,
		bbox: BBox,
		navTarget: NavTarget
	): number[] | undefined {
		return undefined;
	}

	load(arrayBufferPromise: Promise<ArrayBuffer | undefined>): void {}

	ontick(t: number, dt: number): void {}
}
