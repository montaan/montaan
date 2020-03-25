import * as THREE from 'three';
import { FSEntry } from '../lib/filesystem';
import { SearchResult } from '../MainApp';
import Geometry from '../lib/Geometry';
import Colors from '../lib/Colors';

export default class HighlightedLines {
	highlightedResults: SearchResult[] = [];
	highlightLater: [FSEntry, number][] = [];
	model: THREE.Mesh;
	highlightIndex: number = 1;

	// Highlighting lines ////////////////////////////////////////////////////////////////////////////////

	constructor() {
		this.highlightedResults = [];
		this.highlightLater = [];
		this.model = new THREE.Mesh(
			new THREE.Geometry(),
			new THREE.MeshBasicMaterial({
				side: THREE.DoubleSide,
				color: 0xff0000,
				opacity: 0.33,
				transparent: true,
				depthTest: false,
				depthWrite: false,
			})
		);
		this.model.frustumCulled = false;
		this.highlightIndex = 1;
		for (let i = 0; i < 40000; i++) {
			(this.model.geometry as THREE.Geometry).vertices.push(new THREE.Vector3());
		}
		for (let i = 0; i < 10000; i++) {
			let off = i * 4;
			(this.model.geometry as THREE.Geometry).faces.push(
				new THREE.Face3(off, off + 1, off + 2),
				new THREE.Face3(off, off + 2, off + 3)
			);
		}
		(this.model as any).ontick = () => {
			this.model.visible = this.highlightIndex > 0;
			if (this.highlightLater.length > 0) {
				const later = this.highlightLater.splice(0);
				for (let i = 0; i < later.length; i++)
					this.addHighlightedLine(later[i][0], later[i][1]);
			}
		};
	}

	setGoToHighlight(fsEntry: any, line: any) {
		this.addHighlightedLine(fsEntry, line, 0);
	}

	addHighlightedLine(fsEntry: FSEntry, line: number, indexOverride = -1) {
		if (fsEntry.contentObject && fsEntry.contentObject.canHighlight) {
			var geo = this.model.geometry as THREE.Geometry;
			var index = indexOverride;
			if (indexOverride < 0) {
				index = this.highlightIndex;
				this.highlightIndex++;
			}

			const { c0, c1, c2, c3 } = fsEntry.contentObject.getHighlightRegion([line]);
			var off = index * 4;

			geo.vertices[off++].copy(c0);
			geo.vertices[off++].copy(c1);
			geo.vertices[off++].copy(c2);
			geo.vertices[off++].copy(c3);

			geo.verticesNeedUpdate = true;
		} else {
			this.highlightLater.push([fsEntry, line]);
		}
	}

	clearSearchHighlights() {
		var geo = this.model.geometry as THREE.Geometry;
		var verts = geo.vertices;
		for (var i = 0; i < verts.length; i++) {
			var v = verts[i];
			v.x = v.y = v.z = 0;
		}
		geo.verticesNeedUpdate = true;
		this.highlightIndex = 1;
		this.highlightLater = [];
	}

	highlightResults(results: SearchResult[], ca: THREE.BufferAttribute) {
		this.highlightedResults.forEach(function(highlighted) {
			if (highlighted.fsEntry.index === undefined) return;
			Geometry.setColor(
				ca.array as Float32Array,
				highlighted.fsEntry.index,
				Colors[highlighted.fsEntry.entries === null ? 'getFileColor' : 'getDirectoryColor'](
					highlighted.fsEntry
				)
			);
		});
		this.clearSearchHighlights();
		for (var i = 0; i < results.length; i++) {
			var fsEntry = results[i].fsEntry;
			if (fsEntry.index === undefined) continue;
			if (fsEntry.entries !== null && results[i].line === 0) {
				Geometry.setColor(
					ca.array as Float32Array,
					fsEntry.index,
					fsEntry.entries === null ? [1, 0, 0] : [0.6, 0, 0]
				);
			} else if (fsEntry.entries === null && results[i].line > 0) {
				this.addHighlightedLine(fsEntry, results[i].line);
			}
		}
		this.highlightedResults = results;
		ca.needsUpdate = true;
	}
}
