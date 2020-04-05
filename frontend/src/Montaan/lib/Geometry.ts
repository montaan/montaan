import utils from './utils';
import { FSEntry } from './filesystem';

import * as THREE from 'three';

export interface IBufferGeometryWithFileCount extends THREE.BufferGeometry {
	maxFileCount: number;
}

export class BBox {
	minX: number = 0;
	minY: number = 0;
	maxX: number = 0;
	maxY: number = 0;
	width: number = 0;
	height: number = 0;
	onScreen: boolean = false;
	a: THREE.Vector3 = new THREE.Vector3();
	b: THREE.Vector3 = new THREE.Vector3();
	c: THREE.Vector3 = new THREE.Vector3();
	d: THREE.Vector3 = new THREE.Vector3();
}

export default {
	quadCount: 2,

	vertsPerFile: 6 * 2,

	findFSEntry: function(
		ev: any,
		camera: THREE.Camera,
		models: THREE.Mesh[],
		fsIndex: FSEntry[],
		highlighted?: FSEntry
	) {
		const intersections = utils.findIntersectionsUnderEvent(ev, camera, models);

		if (intersections.length > 0) {
			const intersection = intersections.find((o) => o.faceIndex !== undefined);
			if (intersection === undefined) return undefined;
			const faceIndex = intersection.faceIndex || 0;
			let fsEntry: FSEntry | undefined =
				fsIndex[Math.floor(faceIndex / (2 * this.quadCount))];

			while (
				fsEntry &&
				this.getFSEntryBBox(fsEntry, intersection.object as THREE.Mesh, camera).width < 0.2
			) {
				if (fsEntry.parent === highlighted) {
					break;
				}
				fsEntry = fsEntry.parent;
			}
			const anyIntersection: any = intersection;
			anyIntersection.fsEntry = fsEntry;
			return anyIntersection;
		}
	},

	matrixInsideFrustum: function(m: THREE.Matrix4, modelViewMatrix: any, camera: any) {
		const n = this.mTmp4.copy(m);
		this.projectMatrixToFrustum(n, modelViewMatrix, camera);
		const a = this.qTmp1.set(0, 0, 0).applyMatrix4(n);
		const b = this.qTmp2.set(0, 0, 1).applyMatrix4(n);
		const c = this.qTmp3.set(0, 1, 0).applyMatrix4(n);
		const d = this.qTmp4.set(0, 1, 1).applyMatrix4(n);
		const e = this.qTmp5.set(1, 0, 0).applyMatrix4(n);
		const f = this.qTmp6.set(1, 0, 1).applyMatrix4(n);
		const g = this.qTmp7.set(1, 1, 0).applyMatrix4(n);
		const h = this.qTmp8.set(1, 1, 1).applyMatrix4(n);
		const maxX = Math.max(a.x, b.x, c.x, d.x, e.x, f.x, g.x, h.x);
		const minX = Math.min(a.x, b.x, c.x, d.x, e.x, f.x, g.x, h.x);
		const minY = Math.min(a.y, b.y, c.y, d.y, e.y, f.y, g.y, h.y);
		const maxY = Math.max(a.y, b.y, c.y, d.y, e.y, f.y, g.y, h.y);
		return maxX > -1 && minX < 1 && maxY > -1 && minY < 1;
	},

	matrixCoversFrustum: function(m: any, camera: any) {
		return false;
	},

	matrixAtFrustumCenter: function(m: any, camera: any) {
		return false;
	},

	matrixIsBigOnScreen: function(m: any, camera: any) {
		return false;
	},

	qTmp1: new THREE.Vector3(),
	qTmp2: new THREE.Vector3(),
	qTmp3: new THREE.Vector3(),
	qTmp4: new THREE.Vector3(),
	qTmp5: new THREE.Vector3(),
	qTmp6: new THREE.Vector3(),
	qTmp7: new THREE.Vector3(),
	qTmp8: new THREE.Vector3(),
	mTmp4: new THREE.Matrix4(),

	getQuadBBox: function(
		quadIndex: number,
		model: THREE.Mesh,
		camera: THREE.Camera,
		bbox: BBox = new BBox()
	): BBox {
		const vertexOff = quadIndex * 6 * this.quadCount;
		const a = this.qTmp1;
		const b = this.qTmp2;
		const c = this.qTmp3;
		const d = this.qTmp4;
		this.projectVertexToFrustum(a, vertexOff, model, camera);
		this.projectVertexToFrustum(b, vertexOff + 1, model, camera);
		this.projectVertexToFrustum(c, vertexOff + 2, model, camera);
		this.projectVertexToFrustum(d, vertexOff + 5, model, camera);
		const minX = Math.min(a.x, b.x, c.x, d.x);
		const maxX = Math.max(a.x, b.x, c.x, d.x);
		const minY = Math.min(a.y, b.y, c.y, d.y);
		const maxY = Math.max(a.y, b.y, c.y, d.y);
		bbox.minX = minX;
		bbox.minY = minY;
		bbox.maxX = maxX;
		bbox.maxY = maxY;
		bbox.width = maxX - minX;
		bbox.height = maxY - minY;
		bbox.onScreen = maxX > -1 && minX < 1 && maxY > -1 && minY < 1;
		bbox.a.copy(a);
		bbox.b.copy(b);
		bbox.c.copy(c);
		bbox.d.copy(d);
		return bbox;
	},

	getFSEntryBBox: function(fsEntry: FSEntry, model: THREE.Mesh, camera: THREE.Camera): BBox {
		const a = this.qTmp1;
		const b = this.qTmp2;
		const c = this.qTmp3;
		const d = this.qTmp4;
		const xOff = 0;
		const yOff = fsEntry.scale * (fsEntry.isDirectory ? 0.5 : 0);
		const xScale = fsEntry.scale * (fsEntry.isDirectory ? 1 : 1);
		const yScale = fsEntry.scale * (fsEntry.isDirectory ? 0.7 : 1);
		a.set(fsEntry.x + xOff, fsEntry.y + yOff, fsEntry.z);
		b.set(fsEntry.x + xOff + xScale, fsEntry.y + yOff, fsEntry.z);
		c.set(fsEntry.x + xOff + xScale, fsEntry.y + yOff + yScale, fsEntry.z);
		d.set(fsEntry.x + xOff, fsEntry.y + yOff + yScale, fsEntry.z);
		this.projectVector3ToFrustum(a, model, camera);
		this.projectVector3ToFrustum(b, model, camera);
		this.projectVector3ToFrustum(c, model, camera);
		this.projectVector3ToFrustum(d, model, camera);
		const minX = Math.min(a.x, b.x, c.x, d.x);
		const maxX = Math.max(a.x, b.x, c.x, d.x);
		const minY = Math.min(a.y, b.y, c.y, d.y);
		const maxY = Math.max(a.y, b.y, c.y, d.y);
		const bbox = fsEntry.bbox;
		bbox.minX = minX;
		bbox.minY = minY;
		bbox.maxX = maxX;
		bbox.maxY = maxY;
		bbox.width = maxX - minX;
		bbox.height = maxY - minY;
		bbox.onScreen = maxX > -1 && minX < 1 && maxY > -1 && minY < 1;
		bbox.a.copy(a);
		bbox.b.copy(b);
		bbox.c.copy(c);
		bbox.d.copy(d);
		return bbox;
	},

	bboxAtFrustumCenter: function(bbox: BBox, model: THREE.Mesh, camera: THREE.Camera) {
		return bbox.maxX > 0 && bbox.minX < 0 && bbox.maxY > 0 && bbox.minY < 0;
	},

	bboxDistanceToFrustumCenter: function(bbox: BBox, model: THREE.Mesh, camera: THREE.Camera) {
		const avgX = (bbox.minX + bbox.maxX) / 2;
		const avgY = (bbox.minY + bbox.maxY) / 2;
		const d = Math.sqrt(avgX * avgX + avgY * avgY);
		return d;
	},

	bboxInsideFrustum: function(bbox: BBox, model: THREE.Mesh, camera: THREE.Camera) {
		return bbox.maxX > -1 && bbox.minX < 1 && bbox.maxY > -1 && bbox.minY < 1;
	},

	bboxCoversFrustum: function(bbox: BBox, model: THREE.Mesh, camera: THREE.Camera) {
		// const { a, b, c, d, minX, maxX, minY, maxY } = bbox;
		// Bounding box covers frustum
		return bbox.maxX > 1 && bbox.minX < -1 && bbox.maxY > 1 && bbox.minY < -1;
		// if (!(maxX > 1 && minX < -1 && maxY > 1 && minY < -1)) return false;
		// // All the four corners of the frustum are inside the quad a, b, c, d.
		// const points = [a, b, c, d];
		// return (
		// 	this.pointInsidePolygon(-1, -1, points) &&
		// 	this.pointInsidePolygon(1, -1, points) &&
		// 	this.pointInsidePolygon(-1, 1, points) &&
		// 	this.pointInsidePolygon(1, 1, points)
		// );
	},

	pointInsidePolygon: function(x: number, y: number, points: { y: number; x: number }[]) {
		let count = 0;
		for (let i = 1; i < points.length; i++) {
			const a = points[i - 1];
			const b = points[i];
			count += this.lineIntersect(x, y, 1e9, x, a.x, a.y, b.x, b.y) ? 1 : 0;
		}
		const a = points[points.length - 1];
		const b = points[0];
		count += this.lineIntersect(x, y, 1e9, x, a.x, a.y, b.x, b.y) ? 1 : 0;
		return count % 2 === 1;
	},

	lineIntersectsFrustum: function(a: { y: number; x: number }, b: { y: number; x: number }) {
		if (
			(a.y < -1 && b.y < -1) ||
			(a.y > 1 && b.y > 1) ||
			(a.x < -1 && b.x < -1) ||
			(a.x > 1 && b.x > 1)
		) {
			return false;
		}
		return (
			this.lineIntersect(a.x, a.y, b.x, b.y, -1, -1, 1, -1) ||
			this.lineIntersect(a.x, a.y, b.x, b.y, -1, 1, 1, 1) ||
			this.lineIntersect(a.x, a.y, b.x, b.y, -1, -1, -1, 1) ||
			this.lineIntersect(a.x, a.y, b.x, b.y, 1, -1, 1, 1)
		);
	},

	lineIntersect: function(
		x1: number,
		y1: number,
		x2: number,
		y2: number,
		x3: number,
		y3: number,
		x4: number,
		y4: number
	) {
		const EPS = 1e-6;

		const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
		const numera = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
		const numerb = (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3);

		/* Are the line coincident? */
		if (Math.abs(numera) < EPS && Math.abs(numerb) < EPS && Math.abs(denom) < EPS) {
			const x = (x1 + x2) / 2;
			const y = (y1 + y2) / 2;
			return { x, y };
		}

		/* Are the line parallel */
		if (Math.abs(denom) < EPS) {
			return false;
		}

		/* Is the intersection along the the segments */
		const mua = numera / denom;
		const mub = numerb / denom;
		if (mua < 0 || mua > 1 || mub < 0 || mub > 1) {
			return false;
		}
		const x = x1 + mua * (x2 - x1);
		const y = y1 + mua * (y2 - y1);
		return { x, y };
	},

	projectMatrixToFrustum: function(
		m: THREE.Matrix4,
		modelViewMatrix: THREE.Matrix4,
		camera: THREE.Camera
	) {
		m.multiply(modelViewMatrix);
		m.multiply(camera.projectionMatrix);
		return m;
	},

	projectVertexToFrustum: function(
		u: THREE.Vector3,
		vertexIndex: number,
		model: THREE.Mesh,
		camera: THREE.Camera
	) {
		const off = vertexIndex * 3;
		const v = (model.geometry as any).attributes.position.array;
		u.set(v[off + 0], v[off + 1], v[off + 2]);
		u.applyMatrix4(model.modelViewMatrix);
		u.applyMatrix4(camera.projectionMatrix);
	},

	projectVector3ToFrustum: function(u: THREE.Vector3, model: THREE.Mesh, camera: THREE.Camera) {
		u.applyMatrix4(model.matrixWorld);
		u.applyMatrix4(camera.matrixWorldInverse);
		u.applyMatrix4(camera.projectionMatrix);
	},

	vertexInsideFrustumTmp: new THREE.Vector3(),
	vertexInsideFrustum: function(vertexIndex: any, model: any, camera: any) {
		const u = this.vertexInsideFrustumTmp;
		this.projectVertexToFrustum(u, vertexIndex, model, camera);
		// window.debug.textContent = ([u.x, u.y, u.z]).join(", ");
		return u.x < 1 && u.x > -1 && u.y < 1 && u.y > -1 && u.z < 1 && u.z > -1;
	},

	makeGeometry: function(fileCount: number) {
		const geo = new THREE.BufferGeometry() as IBufferGeometryWithFileCount;
		geo.maxFileCount = fileCount;

		const verts = new Float32Array(fileCount * 3 * 6 * this.quadCount);
		const colorVerts = new Float32Array(fileCount * 3 * 6 * this.quadCount);

		geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
		geo.setAttribute('color', new THREE.BufferAttribute(colorVerts, 3));

		return geo;
	},

	resizeGeometry: function(geo: IBufferGeometryWithFileCount, fileCount: number) {
		geo.maxFileCount = fileCount;

		const verts = new Float32Array(fileCount * 3 * 6 * this.quadCount);
		const colorVerts = new Float32Array(fileCount * 3 * 6 * this.quadCount);

		verts.set(geo.getAttribute('position').array);
		colorVerts.set(geo.getAttribute('color').array);

		geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
		geo.setAttribute('color', new THREE.BufferAttribute(colorVerts, 3));

		return geo;
	},

	setColor: function(verts: Float32Array, index: number, color: number[]) {
		let i = index * 18 * this.quadCount;
		const dx = color[0],
			dy = color[1],
			dz = color[2];
		const x = 1 - (1 - dx) * 0.85;
		const y = 1 - (1 - dy) * 0.85;
		const z = 1 - (1 - dz) * 0.85;

		verts[i++] = dx;
		verts[i++] = dy;
		verts[i++] = dz;
		verts[i++] = dx;
		verts[i++] = dy;
		verts[i++] = dz;
		verts[i++] = x;
		verts[i++] = y;
		verts[i++] = z;

		verts[i++] = x;
		verts[i++] = y;
		verts[i++] = z;
		verts[i++] = dx;
		verts[i++] = dy;
		verts[i++] = dz;
		verts[i++] = x;
		verts[i++] = y;
		verts[i++] = z;

		for (let j = 1; j < this.quadCount; j++) {
			verts[i++] = dx * 0.5;
			verts[i++] = dy * 0.5;
			verts[i++] = dz * 0.5;
			verts[i++] = dx * 0.5;
			verts[i++] = dy * 0.5;
			verts[i++] = dz * 0.5;
			verts[i++] = dx * 0.73;
			verts[i++] = dy * 0.73;
			verts[i++] = dz * 0.73;

			verts[i++] = dx * 0.73;
			verts[i++] = dy * 0.73;
			verts[i++] = dz * 0.73;
			verts[i++] = dx * 0.5;
			verts[i++] = dy * 0.5;
			verts[i++] = dz * 0.5;
			verts[i++] = dx * 0.73;
			verts[i++] = dy * 0.73;
			verts[i++] = dz * 0.73;
		}
	},

	makeQuad: function(
		verts: Float32Array,
		index: number,
		x: number,
		y: number,
		w: number,
		h: number,
		z: number
	) {
		let i = index * 18 * this.quadCount;

		verts[i++] = x;
		verts[i++] = y;
		verts[i++] = z;
		verts[i++] = x + w;
		verts[i++] = y;
		verts[i++] = z;
		verts[i++] = x;
		verts[i++] = y + h;
		verts[i++] = z;

		verts[i++] = x;
		verts[i++] = y + h;
		verts[i++] = z;
		verts[i++] = x + w;
		verts[i++] = y;
		verts[i++] = z;
		verts[i++] = x + w;
		verts[i++] = y + h;
		verts[i++] = z;

		verts[i++] = x + w * 0.1;
		verts[i++] = y - h * 0.025;
		verts[i++] = z - h * 0.2;
		verts[i++] = x + w * 0.9;
		verts[i++] = y - h * 0.025;
		verts[i++] = z - h * 0.2;
		verts[i++] = x;
		verts[i++] = y;
		verts[i++] = z;

		verts[i++] = x;
		verts[i++] = y;
		verts[i++] = z;
		verts[i++] = x + w * 0.9;
		verts[i++] = y - h * 0.025;
		verts[i++] = z - h * 0.2;
		verts[i++] = x + w;
		verts[i++] = y;
		verts[i++] = z;

		// verts[i++] = x;
		// verts[i++] = y + h;
		// verts[i++] = z-h*0.2;
		// verts[i++] = x + w;
		// verts[i++] = y + h;
		// verts[i++] = z-h*0.2;
		// verts[i++] = x;
		// verts[i++] = y + h;
		// verts[i++] = z;

		// verts[i++] = x;
		// verts[i++] = y + h;
		// verts[i++] = z;
		// verts[i++] = x + w;
		// verts[i++] = y + h;
		// verts[i++] = z-h*0.2;
		// verts[i++] = x + w;
		// verts[i++] = y + h;
		// verts[i++] = z;

		// verts[i++] = x;
		// verts[i++] = y;
		// verts[i++] = z-h*0.2;
		// verts[i++] = x;
		// verts[i++] = y + h;
		// verts[i++] = z-h*0.2;
		// verts[i++] = x;
		// verts[i++] = y;
		// verts[i++] = z;

		// verts[i++] = x;
		// verts[i++] = y;
		// verts[i++] = z;
		// verts[i++] = x;
		// verts[i++] = y + h;
		// verts[i++] = z-h*0.2;
		// verts[i++] = x;
		// verts[i++] = y + h;
		// verts[i++] = z;

		// verts[i++] = x + w;
		// verts[i++] = y;
		// verts[i++] = z-h*0.2;
		// verts[i++] = x + w;
		// verts[i++] = y + h;
		// verts[i++] = z-h*0.2;
		// verts[i++] = x + w;
		// verts[i++] = y;
		// verts[i++] = z;

		// verts[i++] = x + w;
		// verts[i++] = y;
		// verts[i++] = z;
		// verts[i++] = x + w;
		// verts[i++] = y + h;
		// verts[i++] = z-h*0.2;
		// verts[i++] = x + w;
		// verts[i++] = y + h;
		// verts[i++] = z;

		return i / 3;
	},
};
