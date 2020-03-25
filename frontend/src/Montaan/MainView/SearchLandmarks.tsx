import * as THREE from 'three';
import { SearchResult, TreeLink } from '../MainApp';

export default class SearchLandmarks {
	searchLine: THREE.LineSegments;
	searchResults: SearchResult[] = [];
	links: TreeLink[] = [];
	model: THREE.Object3D;
	previousSearchResults: SearchResult[] = [];
	searchLis: HTMLElement[] = [];
	screenPointToWorldPoint: (x: number, y: number) => THREE.Vector3;

	// Search result connection lines ////////////////////////////////////////////////////////////////////////////////

	constructor(screenPointToWorldPoint: (x: number, y: number) => THREE.Vector3) {
		this.screenPointToWorldPoint = screenPointToWorldPoint;
		this.model = new THREE.Object3D();

		var searchLine = new THREE.LineSegments(
			new THREE.BufferGeometry(),
			new THREE.LineBasicMaterial({
				color: 0xff0000,
				opacity: 1,
				transparent: true,
				depthTest: false,
				depthWrite: false,
				// linewidth: 2 * (window.devicePixelRatio || 1)
			})
		);
		this.searchLine = searchLine;
		searchLine.frustumCulled = false;
		(searchLine.geometry as THREE.BufferGeometry).setAttribute(
			'position',
			new THREE.BufferAttribute(new Float32Array(40000 * 3), 3)
		);

		(searchLine as any).ontick = () => {
			searchLine.visible = this.searchResults && this.searchResults.length > 0;
		};

		this.model.add(searchLine);
	}

	addScreenLine(
		geo: THREE.BufferGeometry,
		fsEntry: {
			x: number | undefined;
			y: number | undefined;
			z: number | undefined;
			scale: number;
			textHeight: number;
			textXZero: number | undefined;
			textYZero: number;
		},
		bbox: { bottom: number; top: number; left: any } | null,
		index: number,
		line: number,
		lineCount: number
	) {
		var a = new THREE.Vector3(fsEntry.x, fsEntry.y, fsEntry.z);
		a.applyMatrix4(this.model.matrixWorld);
		var b = a,
			bv,
			aUp;

		var av = new THREE.Vector3(a.x + 0.05 * fsEntry.scale, a.y + 0.05 * fsEntry.scale, a.z);

		var off = index * 4;
		if (!bbox || bbox.bottom < 0 || bbox.top > window.innerHeight) {
			bv = new THREE.Vector3(
				b.x - fsEntry.scale * 0.5 - 0.02,
				av.y + 0.05 * fsEntry.scale + 0.01 * 3.15,
				av.z - fsEntry.scale * 0.5
			);
			aUp = new THREE.Vector3(
				av.x - fsEntry.scale * 0.075,
				av.y + 0.05 * fsEntry.scale,
				av.z
			);
		} else {
			b = this.screenPointToWorldPoint(bbox.left, bbox.top + 24);
			bv = new THREE.Vector3(b.x, b.y, b.z);
			aUp = new THREE.Vector3(av.x, av.y, av.z);
			if (line > 0 && fsEntry.textHeight) {
				const textYOff = ((line + 0.5) / lineCount) * fsEntry.textHeight;
				const textLinePos = new THREE.Vector3(
					fsEntry.textXZero,
					fsEntry.textYZero - textYOff,
					fsEntry.z
				);
				textLinePos.applyMatrix4(this.model.matrixWorld);
				aUp = av = textLinePos;
			}
		}

		const verts = geo.getAttribute('position').array as Float32Array;
		off *= 3;
		var v;
		v = av;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		v = aUp;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		v = aUp;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		v = bv;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		(geo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
	}

	updateSearchLines() {
		var needsUpdate = false;
		if (this.searchResults !== this.previousSearchResults) {
			this.clearSearchLine();
			this.previousSearchResults = this.searchResults;
			needsUpdate = true;
			this.searchLis = [].slice.call(document.body.querySelectorAll('#searchResults > li'));
		}
		const lis = this.searchLis;
		var verts = (this.searchLine.geometry as THREE.BufferGeometry).getAttribute('position')
			.array;
		if (needsUpdate && lis.length <= verts.length / 3 / 4) {
			for (var i = 0, l = lis.length; i < l; i++) {
				var li = lis[i] as any;
				this.addScreenLine(
					this.searchLine.geometry as THREE.BufferGeometry,
					li.result.fsEntry,
					null,
					i,
					li.result.line,
					li.result.fsEntry.lineCount
				);
			}
		}
	}

	clearSearchLine() {
		var verts = (this.searchLine.geometry as THREE.BufferGeometry).getAttribute('position')
			.array as Float32Array;
		for (
			var i = this.searchResults.length * 4 * 3;
			i < this.previousSearchResults.length * 4 * 3;
			i++
		) {
			verts[i] = 0;
		}
		((this.searchLine.geometry as THREE.BufferGeometry).getAttribute(
			'position'
		) as THREE.BufferAttribute).needsUpdate = true;
	}
}
