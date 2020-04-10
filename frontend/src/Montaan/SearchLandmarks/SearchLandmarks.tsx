import * as THREE from 'three';
import { SearchResult, TreeLink } from '../MainApp';
import { FSEntry } from '../lib/filesystem';
import { ParseTargetSignature } from '../MainView/main';

export default class SearchLandmarks {
	searchLine: THREE.LineSegments;
	searchResults: SearchResult[] = [];
	links: TreeLink[] = [];
	model: THREE.Object3D;
	previousSearchResults: SearchResult[] = [];
	searchLis: HTMLElement[] = [];
	screenPointToWorldPoint: (x: number, y: number) => THREE.Vector3;
	parseTarget: ParseTargetSignature;

	// Search result connection lines ////////////////////////////////////////////////////////////////////////////////

	constructor(
		screenPointToWorldPoint: (x: number, y: number) => THREE.Vector3,
		parseTarget: ParseTargetSignature
	) {
		this.parseTarget = parseTarget;
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

	addScreenLine(geo: THREE.BufferGeometry, fsEntry: FSEntry, index: number, line: number) {
		const a = new THREE.Vector3(fsEntry.x, fsEntry.y, fsEntry.z);
		a.applyMatrix4(this.model.matrixWorld);
		let av, aUp;

		if (line > 0 && fsEntry.contentObject) {
			const lineBBox = fsEntry.contentObject.getHighlightRegion([line]);
			lineBBox.topLeft.y = (lineBBox.topLeft.y + lineBBox.bottomLeft.y) * 0.5;
			aUp = av = lineBBox.topLeft;
		} else {
			av = new THREE.Vector3(a.x, a.y + (fsEntry.isDirectory ? 0.5 : 0) * fsEntry.scale, a.z);
			aUp = new THREE.Vector3(
				av.x - fsEntry.scale * 0.075,
				av.y + 0.05 * fsEntry.scale,
				av.z
			);
		}

		const bv = new THREE.Vector3(
			a.x - fsEntry.scale * 0.5 - 0.02,
			av.y + 0.01 * 3.15,
			av.z - fsEntry.scale * 0.5
		);

		let off = index * 4;
		const attr = geo.getAttribute('position') as THREE.BufferAttribute;
		const verts = attr.array as Float32Array;
		off *= 3;
		let v;
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
		attr.needsUpdate = true;
		attr.updateRange.count = (index + 1) * 4 * 3;
		geo.drawRange.count = (index + 1) * 4;
	}

	updateSearchLines() {
		if (this.searchResults !== this.previousSearchResults) {
			this.clearSearchLine();
			this.previousSearchResults = this.searchResults;
			this.searchLis = [].slice.call(document.body.querySelectorAll('#searchResults > li'));
		}
		const lis = this.searchLis;
		const verts = (this.searchLine.geometry as THREE.BufferGeometry).getAttribute('position')
			.array;
		if (lis.length <= verts.length / 3 / 4) {
			for (let i = 0, geoIndex = 0, l = lis.length; i < l; i++) {
				const li = lis[i] as any;
				const result = li.result as SearchResult;
				const entry = this.parseTarget(result.filename);
				if (entry) {
					this.addScreenLine(
						this.searchLine.geometry as THREE.BufferGeometry,
						entry.fsEntry,
						geoIndex,
						result.line
					);
					geoIndex++;
				}
			}
		}
	}

	clearSearchLine() {
		(this.searchLine.geometry as THREE.BufferGeometry).drawRange.count = 0;
	}
}
