import * as THREE from 'three';
import { FSEntry } from '../../lib/filesystem';
import QFrameAPI from '../../../lib/api';

import Text, { SDFTextMesh } from '../../lib/Text';
import { BBox } from '../../lib/Geometry';
import NavTarget from '../../lib/NavTarget';
import FileView, { ContentBBox, EmptyContentBBox } from '../FileView';
import { BufferGeometry } from 'three';
import { SDFTextGeometry } from '../../lib/third_party/three-bmfont-text-modified';

import PrettyPrinter from '../../PrettyPrinter/PrettyPrinter';

export default class TextFileView extends FileView {
	MAX_SIZE = 3e5;
	fullyVisible: boolean = false;
	textMesh?: SDFTextMesh;
	textScale: number = 0;
	textX: number = 0;
	textYZero: number = 0;
	textY: number = 0;
	textHeight: number = 0;
	textWidth: number = 0;
	lineCount: number = 0;

	constructor(
		fsEntry: FSEntry,
		model: THREE.Mesh,
		fullPath: string,
		api: QFrameAPI,
		requestFrame: any
	) {
		super(fsEntry, model, fullPath, api, requestFrame);
		this.canHighlight = true;
	}

	dispose() {
		this.loadListeners.splice(0);
		this.ontick = function(t, dt) {
			if (this.textMesh) {
				this.textMesh.material.uniforms.opacity.value -= dt / 1000 / 0.25;
				if (this.textMesh.material.uniforms.opacity.value < 0) {
					this.textMesh.material.uniforms.opacity.value = 0;
					this.textMesh.geometry.dispose();
					this.remove(this.textMesh);
					this.textMesh = undefined;
					this.parent?.remove(this);
				}
				this.requestFrame();
			} else {
				this.parent?.remove(this);
			}
			this.requestFrame();
		};
		if (!this.textMesh) {
			this.parent?.remove(this);
		}
		this.requestFrame();
	}

	async goToCoords(coords: number[]): Promise<THREE.Vector3 | undefined> {
		if (this.textHeight > 0) return this.__goToCoords(coords);
		else
			return new Promise((resolve, reject) => {
				this.loadListeners.push(() => resolve(this.__goToCoords(coords)));
			});
	}

	async goToSearch(search: string): Promise<THREE.Vector3 | undefined> {
		if (this.textHeight > 0) return this.__goToSearch(search);
		else
			return new Promise((resolve, reject) => {
				this.loadListeners.push(() => resolve(this.__goToSearch(search)));
			});
	}

	__goToCoords(coords: number[]): THREE.Vector3 | undefined {
		if (this.textHeight <= 0 || !this.textMesh) return undefined;
		const line = coords[0];
		let textYOff = -(this.lineCount - (line + 0.5)) * 44;
		if (line === 0) {
			const realHeight = window.innerHeight / ((window.pageZoom || 100) / 100);
			const heightInLines = realHeight / 22;
			textYOff += 0.5 * heightInLines * 44;
		}
		let textX = 18 * 80;
		const targetPoint = new THREE.Vector3(textX, textYOff, 10000);
		this.updateWorldMatrix(true, true);
		targetPoint.applyMatrix4(this.textMesh.matrixWorld);
		return targetPoint;
	}

	__goToSearch(search: string): THREE.Vector3 | undefined {
		if (this.textHeight <= 0 || !this.textMesh) return undefined;
		const text = this.textMesh.geometry.sdfText.layout.options.text;
		let line = 1;
		let index = 0;
		if (search.startsWith('/')) {
			const lastSlash = search.lastIndexOf('/');
			const re = new RegExp(search.slice(1, lastSlash), search.slice(lastSlash + 1));
			const res = re.exec(text);
			if (res) index = res.index;
		} else index = text.indexOf(search);
		for (let i = 0; i < index; i++) if (text.charCodeAt(i) === 10) line++;
		return this.__goToCoords([line]);
	}

	getHighlightRegion(coords: number[]): ContentBBox {
		if (!this.textMesh) return EmptyContentBBox;
		const line = coords[0];
		let textYOff = -(this.lineCount - line + 1) * 44 + 16;
		const m = this.textMesh.matrixWorld;
		const topLeft = new THREE.Vector3(0, textYOff - 44, 0).applyMatrix4(m);
		const topRight = new THREE.Vector3(this.textWidth, textYOff - 44, 0).applyMatrix4(m);
		const bottomLeft = new THREE.Vector3(0, textYOff, 0).applyMatrix4(m);
		const bottomRight = new THREE.Vector3(this.textWidth, textYOff, 0).applyMatrix4(m);
		return new ContentBBox(topLeft, topRight, bottomLeft, bottomRight);
	}

	loaded() {
		this.loadListeners.splice(0).forEach((f) => f());
	}

	onclick(ev: MouseEvent, intersection: THREE.Intersection, bbox: BBox, navTarget: NavTarget) {
		if (bbox.width > 0.2) {
			if (navTarget.fsEntry === this.fsEntry) {
				if (navTarget.coords.length > 0 || navTarget.search.length > 0) {
					return undefined;
				}
			}
			return [0];
		}
		return undefined;
	}

	// getTextPosition(
	// 	fsEntry: FSEntry,
	// 	intersection: { point: THREE.Vector3; object: { matrixWorld: THREE.Matrix4 } }
	// ) {
	// 	const fv = new THREE.Vector3(
	// 		fsEntry.contentObject.textXZero,
	// 		fsEntry.contentObject.textYZero,
	// 		fsEntry.z
	// 	);
	// 	const pv = new THREE.Vector3().copy(intersection.point);
	// 	const inv = new THREE.Matrix4().getInverse(intersection.object.matrixWorld);
	// 	pv.applyMatrix4(inv);
	// 	const uv = new THREE.Vector3().subVectors(pv, fv);
	// 	uv.divideScalar(fsEntry.scale * fsEntry.contentObject.textScale);
	// 	uv.y /= 38;
	// 	uv.x /= 19;

	// 	const line = Math.floor(-uv.y);
	// 	const col = Math.floor(uv.x + 1);
	// 	return { line, col };
	// }

	// handleTextClick(ev: any, fsEntry: FSEntry, intersection: any, openInIFrame: boolean = false) {
	// 	const { line, col } = this.getTextPosition(fsEntry, intersection);
	// 	const text = fsEntry.contentObject.geometry.layout.options.text;
	// 	const lineStr = text.split('\n')[line - 1];
	// 	const urlRE = /https?:\/\/[a-z0-9.%$#@&?/_-]+/gi;
	// 	var hit = null;
	// 	while ((hit = urlRE.exec(lineStr))) {
	// 		const startIndex = hit.index;
	// 		const endIndex = hit.index + hit[0].length - 1;
	// 		if (col >= startIndex && col <= endIndex) {
	// 			if (openInIFrame) {
	// 				// Open link in a floating iframe added to the tree.
	// 				// On render, update the matrix of the iframe's 3D transform.
	// 				// This can only be done on Electron as X-Frame-Options: DENY
	// 				// disables cross-origin iframes.
	// 				var iframe = document.createElement('iframe');
	// 				iframe.src = hit[0];
	// 				iframe.style.border = '10px solid white';
	// 				iframe.style.backgroundColor = 'white';
	// 				iframe.style.position = 'absolute';
	// 				iframe.style.right = '10px';
	// 				iframe.style.top = 96 + 'px';
	// 				iframe.style.zIndex = '2';
	// 				iframe.style.width = '600px';
	// 				iframe.style.height = 'calc(100vh - 106px)';
	// 				if (document.body) document.body.appendChild(iframe);
	// 				return true;
	// 			} else {
	// 				// Open link in a new window.
	// 				window.open(hit[0]);
	// 				return true;
	// 			}
	// 		}
	// 	}
	// 	return false;
	// }

	ontick(t: number, dt: number): void {}

	async load(arrayBufferPromise: Promise<ArrayBuffer | undefined>) {
		const responseBuffer = await arrayBufferPromise;
		if (responseBuffer === undefined) return;
		if (!this.parent) return;
		if (responseBuffer.byteLength > this.MAX_SIZE || responseBuffer.byteLength === 0) return;

		const fsEntry = this.fsEntry;

		const { verts, uvs, palette, lineCount, sdfText } = await PrettyPrinter.prettyPrint(
			responseBuffer,
			fsEntry.name
		);

		if (!this.parent) return;

		const material = Text.makeTextMaterial(palette);
		const geometry = new BufferGeometry() as SDFTextGeometry;
		geometry.setAttribute('position', new THREE.BufferAttribute(verts, 4));
		geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
		geometry.sdfText = sdfText;
		this.lineCount = lineCount;
		this.textMesh = new SDFTextMesh();
		this.textMesh.geometry = geometry;
		this.textMesh.material = material;
		this.add(this.textMesh);

		this.visible = true;
		material.uniforms.opacity.value = 0;
		this.ontick = function(t, dt) {
			material.uniforms.opacity.value += dt / 1000 / 0.5;
			if (material.uniforms.opacity.value > 1) {
				material.uniforms.opacity.value = 1;
				delete this.ontick;
			}
			this.requestFrame();
		};

		var textScale = Math.min(
			1 / (geometry.sdfText.layout.width + 60),
			1 / ((geometry.sdfText.layout.height + 30) / 0.75)
		);
		var vAspect = Math.min(
			1,
			(geometry.sdfText.layout.height + 30) /
				0.75 /
				((geometry.sdfText.layout.width + 60) / 1)
		);
		material.depthTest = false;

		this.position.set(fsEntry.x, fsEntry.y, fsEntry.z);
		this.scale.set(fsEntry.scale, fsEntry.scale, fsEntry.scale);

		this.textMesh.scale.multiplyScalar(textScale);
		this.textMesh.scale.y *= -1;
		this.fsEntry = fsEntry;
		this.textMesh.position.x += textScale * 30;
		this.textMesh.position.y -= textScale * 7.5;
		this.textMesh.position.y += 0.25 + 0.75 * (1 - vAspect);

		this.textScale = textScale;
		this.textX = Math.min(40 * 30 + 60, geometry.sdfText.layout.width + 60) * 0.5;
		this.textYZero = 0.75;
		this.textY = 0.75 - textScale * 7.5;
		this.textWidth = geometry.sdfText.layout.width;
		this.textHeight = geometry.sdfText.layout.height;

		this.loaded();
		this.requestFrame();
	}
}
