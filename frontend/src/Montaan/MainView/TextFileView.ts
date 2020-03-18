import prettyPrintWorker from '../lib/pretty-print';
import * as THREE from 'three';
import { FSEntry } from '../lib/filesystem';
import QFrameAPI from '../../lib/api';

import Layout, { SDFTextMesh } from '../lib/Layout';
import { Intersection } from 'three';
import { BBox } from '../lib/Geometry';
import NavTarget from './NavTarget';

type PrettyPrintResult = {
	language: string;
	value: string;
};

type NodeStyle = {
	color: number;
	bold: 0 | 1;
	italic: 0 | 1;
	underline: 0 | 1;
	text: string;
};

export default class TextFileView extends THREE.Object3D {
	MAX_SIZE = 1e5;
	fsEntry: FSEntry;
	model: THREE.Mesh;
	api: QFrameAPI;
	yield: any;
	path: string;
	requestFrame: any;
	fullyVisible: boolean = false;
	loadListeners: (() => void)[];
	textMesh?: SDFTextMesh;
	textScale: number = 0;
	textX: number = 0;
	textYZero: number = 0;
	textY: number = 0;
	textHeight: number = 0;
	textWidth: number = 0;
	lineCount: number = 0;
	canHighlight: boolean = true;

	constructor(
		fsEntry: FSEntry,
		model: THREE.Mesh,
		fullPath: string,
		api: QFrameAPI,
		yieldFn: any,
		requestFrame: any
	) {
		super();
		this.visible = false;
		this.fsEntry = fsEntry;
		this.model = model;
		this.api = api;
		this.yield = yieldFn;
		this.path = fullPath;
		this.requestFrame = requestFrame;
		this.loadListeners = [];
	}

	dispose() {
		if (this.textMesh) {
			this.textMesh.geometry.dispose();
			this.remove(this.textMesh);
			this.textMesh = undefined;
		}
		this.loadListeners.splice(0);
	}

	goToCoords(coords: number[]) {
		if (this.textHeight > 0) return this.__goToCoords(coords);
		else
			return new Promise((resolve, reject) => {
				this.loadListeners.push(() => resolve(this.__goToCoords(coords)));
			});
	}

	goToSearch(search: string) {
		if (this.textHeight > 0) return this.__goToSearch(search);
		else
			return new Promise((resolve, reject) => {
				this.loadListeners.push(() => resolve(this.__goToSearch(search)));
			});
	}

	__goToCoords(coords: number[]) {
		if (this.textHeight <= 0 || !this.textMesh) return false;
		const line = coords[0];
		let textYOff = -(this.lineCount - (line + 0.5)) * 44;
		if (line === 0) {
			const realHeight = window.innerHeight / ((window.pageZoom || 100) / 100);
			const heightInLines = realHeight / 22;
			textYOff += 0.5 * heightInLines * 44;
		}
		let textX = 18 * 80;
		const targetPoint = new THREE.Vector3(textX, textYOff, 10000);
		targetPoint.applyMatrix4(this.textMesh.matrixWorld);
		return { targetPoint };
	}

	__goToSearch(search: string) {
		if (this.textHeight <= 0 || !this.textMesh) return false;
		const text = this.textMesh.geometry.layout._opt.text;
		let line = 1;
		let index = 0;
		if (search.startsWith('/')) {
			const lastSlash = search.lastIndexOf('/');
			const re = new RegExp(search.slice(1, lastSlash), search.slice(lastSlash + 1));
			const res = re.exec(text);
			if (res) index = res.index;
		} else index = text.indexOf(search);
		for (let i = 0; i < index; i++) if (text.charCodeAt(i) === 10) line++;
		return this.goToCoords([line]);
	}

	getHighlightRegion(coords: number[]) {
		return {
			c0: new THREE.Vector3(),
			c1: new THREE.Vector3(),
			c2: new THREE.Vector3(),
			c3: new THREE.Vector3(),
		};
	}

	loaded() {
		this.loadListeners.splice(0).forEach((f) => f());
	}

	onclick(ev: MouseEvent, intersection: Intersection, bbox: BBox, navTarget: NavTarget) {
		if (bbox.width > 0.2) {
			if (navTarget.fsEntry === this.fsEntry) {
				if (navTarget.coords.length > 0 || navTarget.search.length > 0) {
					return false;
				}
			}
			return [0];
		}
		return false;
	}

	ontick(t: number, dt: number): void {}

	static hex: string[] = (() => {
		const hex = [];
		for (let i = 0; i < 256; i++) hex[i] = (i < 16 ? ' 0' : ' ') + i.toString(16);
		return hex;
	})();

	static pad: string[] = [
		'         ',
		'        ',
		'       ',
		'      ',
		'     ',
		'    ',
		'   ',
		'  ',
		' ',
		'',
	];

	static hexDump(u8: Uint8Array): string {
		if (u8.byteLength > 1e4) return '';
		const pad = TextFileView.pad;
		const hex = TextFileView.hex;
		let accumulator = ['HEXDUMP'];
		for (let i = 0; i < u8.length; i++) {
			if (i % 64 === 0) accumulator.push(`\n${pad[Math.log10(i) | 0]}${i} `);
			accumulator.push(hex[u8[i]]);
		}
		return accumulator.join('');
	}

	static wordWrap(contents: string, filename: string): string {
		const wordWrapWidth = /\.(md|txt)$/i.test(filename) ? 120 : undefined;
		if (wordWrapWidth) {
			contents = contents
				.split('\n')
				.map((l) => {
					if (l.length > 120) {
						const spaces = (l.match(/^\s{0,120}/) || [''])[0];
						const cropSpaces = spaces.slice(0, Math.min(spaces.length, 40));
						const rest = l.slice(spaces.length);
						const words = rest.split(' ');
						const lineBreakLength = 120 - cropSpaces.length;
						let lineLength = spaces.length;
						let s = spaces;
						const lineBreak = '\n' + cropSpaces;
						var re = new RegExp('.{1,' + lineBreakLength + '}', 'g');
						for (let i = 0; i < words.length; i++) {
							const w = words[i];
							if (lineLength + w.length >= lineBreakLength) {
								if (w.length >= lineBreakLength) {
									const prefix = w.substring(0, lineBreakLength - lineLength);
									s += prefix + lineBreak;
									const suffix = w.substring(lineBreakLength - lineLength);
									const bits = suffix.match(re) || [''];
									s += bits.slice(0, -1).join(lineBreak) + lineBreak;
									s += bits[bits.length - 1] + ' ';
									lineLength = bits[bits.length - 1].length + 1;
								} else {
									s += lineBreak + w + ' ';
									lineLength = w.length + 1;
								}
							} else {
								s += w + ' ';
								lineLength += w.length + 1;
							}
						}
						return s;
					}
					return l;
				})
				.join('\n');
		}
		return contents;
	}

	async load(src: string) {
		let responseBuffer;
		try {
			responseBuffer = await (await fetch(src)).arrayBuffer();
		} catch (e) {
			console.error(e);
			return;
		}
		if (responseBuffer.byteLength > this.MAX_SIZE || !this.parent) return;

		const u8 = new Uint8Array(responseBuffer);
		const isBinary = u8.slice(0, 4096).some((x) => x < 9);
		const contents = isBinary
			? TextFileView.hexDump(u8)
			: TextFileView.wordWrap(
					new TextDecoder().decode(responseBuffer).replace(/\r/g, ''),
					this.fsEntry.name
			  );

		if (contents.length === 0) return;

		await this.yield();

		const fsEntry = this.fsEntry;

		prettyPrintWorker.prettyPrint(contents, fsEntry.name, async (result: PrettyPrintResult) => {
			if (!this.parent) return;
			await this.yield();
			const geometry = await Layout.createText(
				{
					text: contents,
					mode: 'pre',
				},
				this.yield
			);
			let material: THREE.RawShaderMaterial;
			if (result.language) {
				const { nodeStyles, palette, lineCount } = await this.parsePrettyPrintResult(
					result
				);
				const verts = geometry.getAttribute('position').array as Float32Array;
				for (let i = 0, off = 3; i < nodeStyles.length; i++) {
					const t = nodeStyles[i];
					for (let j = 0; j < t.text.length; j++) {
						const c = t.text.charCodeAt(j);
						if (c === 10 || c === 32 || c === 9 || c === 13) continue;
						for (let k = 0; k < 6; k++) {
							if (t.italic) {
								verts[off - 3] += (k <= 3 && k !== 0 ? -1 : 1) * 2.5;
							}
							verts[off] = t.color + 256 * t.bold;
							off += 4;
						}
					}
					if (off % 12004 === 12003) await this.yield();
				}
				material = Layout.makeTextMaterial(palette);
				this.lineCount = lineCount;
			} else {
				let lineCount = 0;
				for (let i = 0; i < contents.length; i++)
					if (contents.charCodeAt(i) === 10) lineCount++;
				material = Layout.makeTextMaterial();
				this.lineCount = lineCount;
			}

			this.textMesh = new SDFTextMesh();
			this.textMesh.geometry = geometry;
			this.textMesh.material = material;
			this.add(this.textMesh);

			this.visible = true;
			material.uniforms.opacity.value = 0;
			this.ontick = function(t, dt) {
				if (this.fullyVisible) return;
				material.uniforms.opacity.value += dt / 1000 / 0.5;
				if (material.uniforms.opacity.value > 1) {
					material.uniforms.opacity.value = 1;
					this.fullyVisible = true;
				}
				this.requestFrame();
			};

			var textScale = Math.min(
				1 / (geometry.layout.width + 60),
				1 / ((geometry.layout.height + 30) / 0.75)
			);
			var vAspect = Math.min(
				1,
				(geometry.layout.height + 30) / 0.75 / ((geometry.layout.width + 60) / 1)
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
			this.textX = Math.min(40 * 30 + 60, geometry.layout.width + 60) * 0.5;
			this.textYZero = 0.75;
			this.textY = 0.75 - textScale * 7.5;
			this.textWidth = geometry.layout.width;
			this.textHeight = geometry.layout.height;

			this.loaded();
			this.requestFrame();
		});
	}

	async fillElement(html: string, element: HTMLElement) {
		let i = 0,
			start = 0,
			spanStack = [],
			stackLen = 0,
			prefix = '',
			tagStart = 0,
			inTag = false,
			closeSpan = false,
			lines = 0,
			totalLines = 1,
			chars = 0;
		const lt = '<'.charCodeAt(0);
		const gt = '>'.charCodeAt(0);
		const slash = '/'.charCodeAt(0);
		for (; i < html.length; i++) {
			var ch = html.charCodeAt(i);
			chars++;
			if (ch === 10) {
				lines++;
				totalLines++;
			} else if (ch === lt) {
				tagStart = i;
				closeSpan = false;
				inTag = true;
			} else if (i - 1 === tagStart && ch === slash) {
				closeSpan = true;
				stackLen -= 2;
			} else if (!closeSpan && ch === gt) {
				inTag = false;
				spanStack[stackLen++] = tagStart;
				spanStack[stackLen++] = i + 1;
			}
			if (!inTag && (lines > 100 || chars > 3000)) {
				const str = html.substring(start, i + 1);
				const d = document.createElement('template');
				d.innerHTML = prefix + str;
				prefix = '';
				for (let k = 0; k < stackLen; k += 2) {
					prefix += html.substring(spanStack[k], spanStack[k + 1]);
				}
				element.appendChild(d.content);
				await this.yield();
				lines = 0;
				chars = 0;
				start = i + 1;
			}
		}
		if (start < i) {
			const str = html.substring(start);
			const d = document.createElement('template');
			d.innerHTML = prefix + str;
			element.appendChild(d.content);
			await this.yield();
		}
		return totalLines;
	}

	async collectNodeStyles(
		doc: HTMLElement,
		nodeStyles: NodeStyle[],
		palette: THREE.Vector3[],
		paletteIndex: { [color: string]: number }
	) {
		await this.yield();
		const style = getComputedStyle(doc);
		const colorString = style.color || 'inherit';
		if (!paletteIndex[colorString]) {
			paletteIndex[colorString] = palette.length;
			var c = new THREE.Color(colorString);
			palette.push(new THREE.Vector3(c.r, c.g, c.b));
		}
		const color = paletteIndex[colorString];
		const bold = style.fontWeight !== 'normal' ? 1 : 0;
		const italic = style.fontStyle === 'italic' ? 1 : 0;
		const underline = style.textDecoration === 'underline' ? 1 : 0;
		for (var i = 0; i < doc.childNodes.length; i++) {
			const cc = doc.childNodes[i] as HTMLElement;
			if (cc.tagName) {
				await this.collectNodeStyles(cc, nodeStyles, palette, paletteIndex);
			} else {
				nodeStyles.push({
					color: color,
					bold: bold,
					italic: italic,
					underline: underline,
					text: cc.textContent || '',
				});
			}
		}
	}

	async parsePrettyPrintResult(result: PrettyPrintResult) {
		await this.yield();
		const doc = document.createElement('pre');
		doc.className = 'hljs ' + result.language;
		doc.style.display = 'none';
		document.body.appendChild(doc);

		const lineCount = await this.fillElement(result.value, doc);

		const paletteIndex = {};
		const palette: THREE.Vector3[] = [];
		const nodeStyles: NodeStyle[] = [];
		await this.collectNodeStyles(doc, nodeStyles, palette, paletteIndex);
		document.body.removeChild(doc);
		return { nodeStyles, palette, lineCount };
	}
}
