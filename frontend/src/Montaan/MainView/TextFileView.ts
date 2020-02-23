import prettyPrintWorker from '../lib/pretty-print';
import * as THREE from 'three';
import { FSEntry } from '../lib/filesystem';
import QFrameAPI from '../../lib/api';

import createText, { SDFTextGeometry } from '../lib/third_party/three-bmfont-text-modified';
import SDFShader from '../lib/third_party/three-bmfont-text-modified/shaders/msdf';
import Layout from '../lib/Layout';
import Colors from '../lib/Colors';
import { BufferGeometry } from 'three';

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

interface ISDFTextGeometry extends THREE.BufferGeometry {
	layout: {
		width: number;
		height: number;
	};
}

type GoToLine = (fsEntry: FSEntry, line: number) => void;
type GoToSearch = (fsEntry: FSEntry, search: string) => void;

const emptyMaterial = new THREE.RawShaderMaterial();
const emptyGeometry = (new SDFTextGeometry() as unknown) as ISDFTextGeometry;

export default class TextFileView extends THREE.Mesh {
	MAX_SIZE = 1e5;
	fsEntry: FSEntry;
	api: QFrameAPI;
	yield: any;
	path: string;
	fontTexture: THREE.Texture;
	material: THREE.RawShaderMaterial;
	geometry: ISDFTextGeometry;
	requestFrame: any;

	constructor(
		fontTexture: THREE.Texture,
		fsEntry: FSEntry,
		fullPath: string,
		api: QFrameAPI,
		yieldFn: any,
		requestFrame: any,
		goToLine: GoToLine,
		goToSearch: GoToSearch
	) {
		super();
		this.visible = false;
		this.fsEntry = fsEntry;
		this.api = api;
		this.yield = yieldFn;
		this.path = fullPath;
		this.fontTexture = fontTexture;
		this.material = emptyMaterial;
		this.requestFrame = requestFrame;
		this.geometry = emptyGeometry;
		this.load(fullPath);
		this.goToFSEntryTextAtLine = goToLine;
		this.goToFSEntryTextAtSearch = goToSearch;
	}

	goToFSEntryTextAtLine(fsEntry: FSEntry, line: any) {
		throw new Error('Method not implemented.');
	}
	goToFSEntryTextAtSearch(fsEntry: FSEntry, search: any) {
		throw new Error('Method not implemented.');
	}

	ontick(t: number, dt: number): void {}

	async load(fullPath: string) {
		let responseBuffer = (await this.api.getType(
			'/repo/file' + fullPath,
			{},
			'arrayBuffer'
		)) as ArrayBuffer;
		if (responseBuffer.byteLength > this.MAX_SIZE || !this.parent) return;

		const u8 = new Uint8Array(responseBuffer);
		const isBinary = u8.slice(0, 4096).some((x) => x < 9);
		var responseText = '';
		if (isBinary) {
			if (responseBuffer.byteLength > 1e4) return;
			const hex = [];
			for (let i = 0; i < 256; i++) hex[i] = (i < 16 ? ' 0' : ' ') + i.toString(16);
			const pad = [
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
			let accumulator = ['HEXDUMP'];
			for (let i = 0; i < u8.length; i++) {
				if (i % 64 === 0) accumulator.push(`\n${pad[Math.log10(i) | 0]}${i} `);
				accumulator.push(hex[u8[i]]);
			}
			responseText += accumulator.join('');
		} else {
			responseText = new TextDecoder().decode(responseBuffer);
		}

		await this.yield();

		let contents = responseText.replace(/\r/g, '');
		if (contents.length === 0) return;

		const wordWrapWidth = /\.(md|txt)$/i.test(this.fsEntry.name) ? 120 : undefined;
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

		const fsEntry = this.fsEntry;

		prettyPrintWorker.prettyPrint(contents, fsEntry.name, async (result: PrettyPrintResult) => {
			if (!this.parent) return;
			await this.yield();
			this.geometry = ((await createText(
				{
					font: Layout.font,
					text: contents,
					mode: 'pre',
				},
				this.yield
			)) as unknown) as ISDFTextGeometry;
			if (result.language) {
				const { nodeStyles, palette, lineCount } = await this.parsePrettyPrintResult(
					result
				);
				const verts = this.geometry.attributes.position.array as Float32Array;
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
				this.material = this.makeTextMaterial(palette);
				fsEntry.lineCount = lineCount;
			} else {
				let lineCount = 0;
				for (let i = 0; i < contents.length; i++)
					if (contents.charCodeAt(i) === 10) lineCount++;
				this.material = this.makeTextMaterial();
				fsEntry.lineCount = lineCount;
			}
			this.visible = true;
			this.material.uniforms.opacity.value = 0;
			this.ontick = function(t, dt) {
				if (this.material.uniforms.opacity.value === 1) return;
				this.material.uniforms.opacity.value += dt / 1000 / 0.5;
				if (this.material.uniforms.opacity.value > 1) {
					this.material.uniforms.opacity.value = 1;
				}
				this.requestFrame();
			};

			var textScale = Math.min(
				0.5 / (this.geometry.layout.width + 60),
				1 / ((this.geometry.layout.height + 30) / 0.75)
			);
			var scale = fsEntry.scale * textScale;
			var vAspect = Math.min(
				1,
				(this.geometry.layout.height + 30) /
					0.75 /
					((this.geometry.layout.width + 60) / 0.5)
			);
			this.material.depthTest = false;
			this.scale.multiplyScalar(scale);
			this.scale.y *= -1;
			this.position.set(fsEntry.x, fsEntry.y, fsEntry.z);
			this.fsEntry = fsEntry;
			this.position.x += fsEntry.scale * textScale * 30;
			this.position.y -= fsEntry.scale * textScale * 7.5;
			this.position.y += fsEntry.scale * 0.25;

			fsEntry.textScale = textScale;
			fsEntry.textXZero = this.position.x;
			fsEntry.textX =
				this.position.x +
				scale * Math.min(40 * 30 + 60, this.geometry.layout.width + 60) * 0.5;
			fsEntry.textYZero = this.position.y + fsEntry.scale * 0.75;
			fsEntry.textY = this.position.y + fsEntry.scale * 0.75 - scale * 900;
			fsEntry.textHeight = scale * this.geometry.layout.height;

			this.position.y += fsEntry.scale * 0.75 * (1 - vAspect);

			if (fsEntry.targetLine) {
				const { line, search } = fsEntry.targetLine;
				fsEntry.targetLine = null;
				if (line !== undefined) this.goToFSEntryTextAtLine(fsEntry, line);
				else if (search !== undefined) this.goToFSEntryTextAtSearch(fsEntry, search);
			}
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

	makeTextMaterial(
		palette: THREE.Vector3[] | null = null,
		fontTexture: THREE.Texture = this.fontTexture
	): THREE.RawShaderMaterial {
		if (palette === null) palette = [];
		if (palette.length < 8) {
			palette = palette.slice();
			while (palette.length < 8) {
				palette.push(
					palette[palette.length - 1] ||
						new THREE.Vector3(
							Colors.textColor.r,
							Colors.textColor.g,
							Colors.textColor.b
						)
				);
			}
		}
		return new THREE.RawShaderMaterial(
			SDFShader({
				map: fontTexture,
				side: THREE.DoubleSide,
				transparent: true,
				color: 0xffffff,
				palette: palette,
				polygonOffset: true,
				polygonOffsetFactor: -0.5,
				polygonOffsetUnits: 0.5,
				depthTest: false,
				depthWrite: false,
			})
		);
	}
}
