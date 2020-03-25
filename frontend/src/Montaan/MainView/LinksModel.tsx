import { FSEntry } from '../lib/filesystem';
import { TreeLink } from '../MainApp';
import * as THREE from 'three';
import { ParseTargetSignature } from './main';

export default class LinksModel {
	linksUpdatedOn: number = -1;
	links: TreeLink[] = [];
	model: THREE.Object3D;
	lineModel: THREE.LineSegments;
	lineGeo: THREE.BufferGeometry;
	screenPointToWorldPoint: (x: number, y: number) => THREE.Vector3;
	parseTarget: ParseTargetSignature;

	constructor(
		screenPointToWorldPoint: (x: number, y: number) => THREE.Vector3,
		parseTarget: ParseTargetSignature
	) {
		this.screenPointToWorldPoint = screenPointToWorldPoint;
		this.parseTarget = parseTarget;
		this.model = new THREE.Object3D();

		this.lineGeo = new THREE.BufferGeometry();
		this.lineGeo.setAttribute(
			'position',
			new THREE.BufferAttribute(new Float32Array(40000 * 3), 3)
		);
		this.lineGeo.setAttribute(
			'color',
			new THREE.BufferAttribute(new Float32Array(40000 * 3), 3)
		);
		this.lineModel = new THREE.LineSegments(
			this.lineGeo,
			new THREE.LineBasicMaterial({
				color: new THREE.Color(1.0, 1.0, 1.0),
				opacity: 1,
				transparent: true,
				depthWrite: false,
				vertexColors: THREE.VertexColors,
			})
		);
		this.lineModel.frustumCulled = false;
		(this.lineModel as any).ontick = () => {
			this.lineModel.visible = this.links.length > 0;
		};
		this.model.add(this.lineModel);
		this.model.add(this.lineModel);
	}

	// Linkage lines ////////////////////////////////////////////////////////////////////////////////

	updateLinks(currentFrame: number) {
		if (this.linksUpdatedOn !== currentFrame) {
			this.setLinks(this.links, true);
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

		var verts = geo.getAttribute('position').array as Float32Array;
		var off = index * 3;
		var v;
		v = av;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		v = av;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		v = av;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		v = bv;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		v = bv;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		v = bv;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;

		if (color) {
			verts = geo.getAttribute('color').array as Float32Array;
			off = index * 3;
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
			v = color;
			verts[off++] = v.r;
			verts[off++] = v.g;
			verts[off++] = v.b;
		}
	}

	updateLineBetweenEntryAndElement(
		geo: THREE.BufferGeometry,
		index: number,
		color: { r: number; g: number; b: number } | undefined,
		model: THREE.Object3D,
		fsEntry: FSEntry,
		coords: number[] | undefined,
		lineCount: number,
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
			if (line > 0 && fsEntry.contentObject && fsEntry.contentObject.textHeight) {
				const textYOff = ((line + 0.5) / lineCount) * fsEntry.contentObject.textHeight;
				const textLinePos = new THREE.Vector3(
					fsEntry.contentObject.textXZero,
					fsEntry.contentObject.textYZero - textYOff,
					fsEntry.z
				);
				textLinePos.applyMatrix4(this.model.matrixWorld);
				aUp = av = textLinePos;
			}
		}

		var verts = geo.getAttribute('position').array as Float32Array;
		var off = index * 3;
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
		v = bv;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		v = bv;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;

		if (color) {
			verts = geo.getAttribute('color').array as Float32Array;
			off = index * 3;
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
			v = color;
			verts[off++] = v.r;
			verts[off++] = v.g;
			verts[off++] = v.b;
		}
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

		var av = new THREE.Vector3(a.x, a.y, a.z);
		av.applyMatrix4(modelA.matrixWorld);

		var bv = new THREE.Vector3(b.x, b.y + b.scale, b.z);
		bv.applyMatrix4(modelB.matrixWorld);

		if (lineA > 0 && entryA.contentObject && entryA.contentObject.textHeight) {
			const textYOff = ((lineA + 0.5) / lineCountA) * entryA.contentObject.textHeight;
			const textLinePos = new THREE.Vector3(
				entryA.contentObject.textXZero,
				entryA.contentObject.textYZero - textYOff,
				entryA.z
			);
			textLinePos.applyMatrix4(modelA.matrixWorld);
			av = textLinePos;
		}
		if (lineB > 0 && entryB.contentObject && entryB.contentObject.textHeight) {
			const textYOff = ((lineB + 0.5) / lineCountB) * entryB.contentObject.textHeight;
			const textLinePos = new THREE.Vector3(
				entryB.contentObject.textXZero,
				entryB.contentObject.textYZero - textYOff,
				entryB.z
			);
			textLinePos.applyMatrix4(modelB.matrixWorld);
			av = textLinePos;
		}

		var aUp = new THREE.Vector3(
			a.x + (a.x < b.x ? 1 : -1) * 0.1 * entryA.scale,
			a.y + (0.1 + 0.01 * (entryB.size % 10)) * entryA.scale,
			Math.max(a.z, b.z) + 1 * entryA.scale
		);
		aUp.applyMatrix4(modelA.matrixWorld);
		var bUp = new THREE.Vector3(
			b.x + (a.x > b.x ? 1 : -1) * 0.1 * entryB.scale,
			b.y + b.scale + (0.1 + 0.01 * (entryB.size % 10)) * entryB.scale,
			Math.max(a.z, b.z) + 1 * entryB.scale
		);
		bUp.applyMatrix4(modelB.matrixWorld);

		var verts = geo.getAttribute('position').array as Float32Array;
		var off = index * 3;
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
		v = bUp;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		v = bUp;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		v = bv;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;

		if (color) {
			verts = geo.getAttribute('color').array as Float32Array;
			off = index * 3;
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
			v = color;
			verts[off++] = v.r;
			verts[off++] = v.g;
			verts[off++] = v.b;
		}
	}

	setLinks(links: TreeLink[], updateOnlyElements = false) {
		if (this.lineGeo) {
			const geo = this.lineGeo;
			const verts = geo.getAttribute('position').array as Float32Array;

			for (let i = links.length; i < this.links.length; i++) {
				let j = i * 6 * 3;
				for (let k = 0; k < 18; k++) verts[j + k] = -100;
			}
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
					if (!dst) continue;
					this.updateLineBetweenEntryAndElement(
						geo,
						i * 6,
						l.color,
						model,
						dst.fsEntry,
						dst.point,
						dst.fsEntry.lineCount,
						bbox
					);
				} else if (dstIsElem) {
					const bbox = (l.dst as Element).getBoundingClientRect();
					const dst = this.parseTarget(l.src as string | FSEntry, l.srcPoint);
					if (!dst) continue;
					this.updateLineBetweenEntryAndElement(
						geo,
						i * 6,
						l.color,
						model,
						dst.fsEntry,
						dst.point,
						dst.fsEntry.lineCount,
						bbox
					);
				} else if (!updateOnlyElements) {
					const src = this.parseTarget(l.src as string | FSEntry, l.srcPoint);
					const dst = this.parseTarget(l.dst as string | FSEntry, l.dstPoint);
					if (!dst || !src) continue;
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
			(geo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
			(geo.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
		}
	}
}
