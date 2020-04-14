// src/TARGET/NAME/NAME.ts

import  { ContentBBox, EmptyContentBBox }, FileView from '../FileView';
import { FSEntry } from '../../Filesystems';
import QFrameAPI from '../../../lib/api';
import { BBox } from '../../Geometry/Geometry';
import NavTarget from '../../NavTarget/NavTarget';

export default class NAME extends FileView {
	MAX_SIZE:number = 1000000;

	constructor(
		fsEntry: FSEntry,
		model: THREE.Mesh,
		fullPath: string,
		api: QFrameAPI,
		requestFrame: any
	) {
		super(fsEntry, model, fullPath, api, requestFrame);
	}

	async load(arrayBufferPromise: Promise<ArrayBuffer | undefined>) {
		const responseBuffer = await arrayBufferPromise;
		if (responseBuffer === undefined) return;
		if (!this.parent) return;
		if (responseBuffer.byteLength > this.MAX_SIZE || responseBuffer.byteLength === 0) return;
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

	onclick(
		ev: MouseEvent,
		intersection: THREE.Intersection,
		bbox: BBox,
		navTarget: NavTarget
	): number[] | undefined {
		return undefined;
	}

	async load(arrayBufferPromise: Promise<ArrayBuffer | undefined>): Promise<void> {}

}
