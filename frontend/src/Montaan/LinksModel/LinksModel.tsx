import { FSEntry } from '../Filesystems';
import { TreeLink } from '../MainApp';
import * as THREE from 'three';
import { ParseTargetSignature } from '../MainView/main';

export default class LinksModel {
	linksUpdatedOn: number = -1;
	links: TreeLink[] = [];
	model: THREE.LineSegments;
	lineGeo: THREE.BufferGeometry;
	screenPointToWorldPoint: (x: number, y: number) => THREE.Vector3;
	parseTarget: ParseTargetSignature;
	requestFrame: () => void;

	constructor(
		screenPointToWorldPoint: (x: number, y: number) => THREE.Vector3,
		parseTarget: ParseTargetSignature,
		requestFrame: () => void
	) {
		this.screenPointToWorldPoint = screenPointToWorldPoint;
		this.parseTarget = parseTarget;
		this.requestFrame = requestFrame;

		this.lineGeo = new THREE.BufferGeometry();
		this.lineGeo.setAttribute(
			'position',
			new THREE.BufferAttribute(new Float32Array(40000 * 3), 3)
		);
		this.lineGeo.setAttribute(
			'color',
			new THREE.BufferAttribute(new Float32Array(40000 * 3), 3)
		);
		this.model = new THREE.LineSegments(
			this.lineGeo,
			new THREE.LineBasicMaterial({
				color: new THREE.Color(1.0, 1.0, 1.0),
				opacity: 0.2,
				transparent: true,
				depthWrite: false,
				depthTest: false,
				vertexColors: THREE.VertexColors,
			})
		);
		this.model.frustumCulled = false;
		(this.model as any).ontick = () => {
			this.model.visible = this.links.length > 0;
		};
	}

	// Linkage lines ////////////////////////////////////////////////////////////////////////////////

	updateLinks(currentFrame: number) {
		if (this.linksUpdatedOn !== currentFrame) {
			this.setLinks(this.links);
			this.linksUpdatedOn = currentFrame;
		}
	}

	updateLineBetweenElements(
		geo: THREE.BufferGeometry,
		index: number,
		color: { r: number; g: number; b: number } | undefined,
		bboxA: { left: any; top: any },
		bboxB: { left: any; top: any }
	) {
		var av = this.screenPointToWorldPoint(bboxA.left, bboxA.top);
		var bv = this.screenPointToWorldPoint(bboxB.left, bboxB.top);
		this.setLine(geo, index, av, av, av, bv, bv, bv, color);
	}

	updateLineBetweenEntryAndElement(
		geo: THREE.BufferGeometry,
		index: number,
		color: { r: number; g: number; b: number } | undefined,
		model: THREE.Object3D,
		fsEntry: FSEntry,
		coords: number[] | undefined,
		bbox: { bottom: number; top: number; left: any }
	) {
		var a = new THREE.Vector3(fsEntry.x, fsEntry.y, fsEntry.z);
		a.applyMatrix4(model.matrixWorld);
		var b = a;

		const line = coords ? coords[0] : 0;

		var av = new THREE.Vector3(a.x + 0.05 * fsEntry.scale, a.y + 0.05 * fsEntry.scale, a.z);
		var bv, aUp;

		if (!bbox || bbox.bottom < 0 || bbox.top > window.innerHeight) {
			bv = new THREE.Vector3(
				b.x - fsEntry.scale * 0.5 - 0.02,
				av.y + 0.05 * fsEntry.scale, // + 0.01 * 3.15,
				av.z - fsEntry.scale * 0.5
			);
			aUp = new THREE.Vector3(
				av.x - fsEntry.scale * 0.075,
				av.y + 0.05 * fsEntry.scale,
				av.z
			);
		} else {
			bv = this.screenPointToWorldPoint(bbox.left, bbox.top);
			aUp = new THREE.Vector3(av.x, av.y, av.z);
			if (line > 0 && fsEntry.contentObject) {
				const lineBBox = fsEntry.contentObject.getHighlightRegion([line]);
				lineBBox.topLeft.y = (lineBBox.topLeft.y + lineBBox.bottomLeft.y) * 0.5;
				aUp = av = lineBBox.topLeft;
			}
		}
		this.setLine(geo, index, av, aUp, aUp, bv, bv, bv, color);
	}

	updateLineBetweenEntries(
		geo: THREE.BufferGeometry,
		index: number,
		color: { r: number; g: number; b: number } | undefined,
		modelA: THREE.Object3D,
		entryA: FSEntry,
		coordsA: number[] | undefined,
		lineCountA: number,
		modelB: THREE.Object3D,
		entryB: FSEntry,
		coordsB: number[] | undefined,
		lineCountB: number
	) {
		var a = entryA;
		var b = entryB;

		const lineA = coordsA ? coordsA[0] : 0;
		const lineB = coordsB ? coordsB[0] : 0;

		var av = new THREE.Vector3(a.x, a.y + a.scale * (a.isDirectory ? 0.5 : 0), a.z);
		av.applyMatrix4(modelA.matrixWorld);

		var bv = new THREE.Vector3(b.x, b.y + b.scale * (b.isDirectory ? 0.5 : 1), b.z);
		bv.applyMatrix4(modelB.matrixWorld);

		if (lineA > 0 && entryA.contentObject) {
			const lineBBox = entryA.contentObject.getHighlightRegion([lineA]);
			lineBBox.topLeft.y = (lineBBox.topLeft.y + lineBBox.bottomLeft.y) * 0.5;
			av = lineBBox.topLeft;
		}
		if (lineB > 0 && entryB.contentObject) {
			const lineBBox = entryB.contentObject.getHighlightRegion([lineB]);
			lineBBox.topLeft.y = (lineBBox.topLeft.y + lineBBox.bottomLeft.y) * 0.5;
			bv = lineBBox.topLeft;
		}

		var aUp = new THREE.Vector3(
			a.x + (a.x < b.x ? 1 : -1) * 0.1 * entryA.scale,
			a.y +
				(0.1 + 0.01 * (entryB.size % 10)) * entryA.scale +
				a.scale * (a.isDirectory ? 0.5 : 0),
			Math.max(a.z, b.z) + 1 * entryA.scale
		);
		aUp.applyMatrix4(modelA.matrixWorld);
		var bUp = new THREE.Vector3(
			b.x + (a.x > b.x ? 1 : -1) * 0.1 * entryB.scale,
			b.y + b.scale + (0.1 + 0.01 * (entryB.size % 10)) * entryB.scale,
			Math.max(a.z, b.z) + 1 * entryB.scale
		);
		bUp.applyMatrix4(modelB.matrixWorld);
		this.setLine(geo, index, av, aUp, aUp, bUp, bUp, bv, color);
	}

	emptyVector: THREE.Vector3 = new THREE.Vector3();
	clearLine(geo: THREE.BufferGeometry, index: number) {
		const v = this.emptyVector;
		this.setLine(geo, index, v, v, v, v, v, v, undefined);
	}

	setLinks(links: TreeLink[]) {
		if (this.lineGeo) {
			const geo = this.lineGeo;
			geo.drawRange.count = links.length * 6;
			this.links = links;
			for (let i = 0; i < links.length; i++) {
				const l = links[i];
				const model = this.model;
				const srcIsElem = l.src instanceof Element;
				const dstIsElem = l.dst instanceof Element;

				if (srcIsElem && dstIsElem) {
					const bboxA = (l.src as Element).getBoundingClientRect();
					const bboxB = (l.dst as Element).getBoundingClientRect();
					this.updateLineBetweenElements(geo, i * 6, l.color, bboxA, bboxB);
				} else if (srcIsElem) {
					const bbox = (l.src as Element).getBoundingClientRect();
					const dst = this.parseTarget(l.dst as string | FSEntry, l.dstPoint);
					if (!dst) {
						this.clearLine(geo, i * 6);
						continue;
					}
					this.updateLineBetweenEntryAndElement(
						geo,
						i * 6,
						l.color,
						model,
						dst.fsEntry,
						dst.point,
						bbox
					);
				} else if (dstIsElem) {
					const bbox = (l.dst as Element).getBoundingClientRect();
					const dst = this.parseTarget(l.src as string | FSEntry, l.srcPoint);
					if (!dst) {
						this.clearLine(geo, i * 6);
						continue;
					}
					this.updateLineBetweenEntryAndElement(
						geo,
						i * 6,
						l.color,
						model,
						dst.fsEntry,
						dst.point,
						bbox
					);
				} else {
					const src = this.parseTarget(l.src as string | FSEntry, l.srcPoint);
					const dst = this.parseTarget(l.dst as string | FSEntry, l.dstPoint);
					if (!dst || !src) {
						this.clearLine(geo, i * 6);
						continue;
					}
					this.updateLineBetweenEntries(
						geo,
						i * 6,
						l.color,
						model,
						src.fsEntry,
						src.point,
						src.fsEntry.lineCount,
						model,
						dst.fsEntry,
						dst.point,
						dst.fsEntry.lineCount
					);
				}
			}
			const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
			const colorAttr = geo.getAttribute('color') as THREE.BufferAttribute;
			posAttr.needsUpdate = true;
			posAttr.updateRange.count = links.length * 6 * 3;
			colorAttr.needsUpdate = true;
			colorAttr.updateRange.count = links.length * 6 * 3;
			this.requestFrame();
		}
	}

	setLine(
		geo: THREE.BufferGeometry,
		index: number,
		v1: THREE.Vector3,
		v2: THREE.Vector3,
		v3: THREE.Vector3,
		v4: THREE.Vector3,
		v5: THREE.Vector3,
		v6: THREE.Vector3,
		color?: { r: number; g: number; b: number }
	) {
		{
			const verts = geo.getAttribute('position').array as Float32Array;
			let off = index * 3;
			let v;
			v = v1;
			verts[off++] = v.x;
			verts[off++] = v.y;
			verts[off++] = v.z;
			v = v2;
			verts[off++] = v.x;
			verts[off++] = v.y;
			verts[off++] = v.z;
			v = v3;
			verts[off++] = v.x;
			verts[off++] = v.y;
			verts[off++] = v.z;
			v = v4;
			verts[off++] = v.x;
			verts[off++] = v.y;
			verts[off++] = v.z;
			v = v5;
			verts[off++] = v.x;
			verts[off++] = v.y;
			verts[off++] = v.z;
			v = v6;
			verts[off++] = v.x;
			verts[off++] = v.y;
			verts[off++] = v.z;
		}

		if (color) {
			const verts = geo.getAttribute('color').array as Float32Array;
			let off = index * 3;
			let v = color;
			verts[off++] = v.r;
			verts[off++] = v.g;
			verts[off++] = v.b;
			v = color;
			verts[off++] = v.r;
			verts[off++] = v.g;
			verts[off++] = v.b;
			v = color;
			verts[off++] = v.r;
			verts[off++] = v.g;
			verts[off++] = v.b;
			v = color;
			verts[off++] = v.r;
			verts[off++] = v.g;
			verts[off++] = v.b;
			v = color;
			verts[off++] = v.r;
			verts[off++] = v.g;
			verts[off++] = v.b;
			v = color;
			verts[off++] = v.r;
			verts[off++] = v.g;
			verts[off++] = v.b;
		}
	}
}
