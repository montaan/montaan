import * as THREE from 'three';
import { SDFTextGeometry, SDFText } from '../Text/third_party/three-bmfont-text-modified';
import { BMFont } from '../Text/third_party/layout-bmfont-text-modified';
import Style, { NodeStyle } from './railscasts';
import he from 'he';
import hljs from 'highlight.js';
import * as Comlink from 'comlink';

type PrettyPrintResult = {
	language?: string;
	value: string;
};

export type PrettyPrintGeometry = {
	verts: Float32Array;
	uvs: Float32Array;
	palette: THREE.Vector3[] | undefined;
	lineCount: number;
	sdfText: SDFText;
};

export class PrettyPrinter {
	font?: BMFont;

	setFont(font: BMFont) {
		this.font = font;
	}

	prettyPrint(buffer: ArrayBuffer, filename: string, mimeType?: string): PrettyPrintGeometry {
		if (!this.font) throw new Error('Font not set');

		const u8 = new Uint8Array(buffer);
		const isBinary = u8.slice(0, 4096).some((x) => x < 9);
		const text = isBinary
			? PrettyPrinter.hexDump(u8)
			: PrettyPrinter.wordWrap(new TextDecoder().decode(buffer).replace(/\r/g, ''), filename);

		const font = this.font;
		let ext = filename;
		if (filename.indexOf('.') !== -1) {
			const extensions = filename.split('.');
			ext = extensions[extensions.length - 1];
		}
		const language = hljs.getLanguage(ext);
		let result: PrettyPrintResult;
		if (language) {
			const highlightResult = hljs.highlight(ext, text, true);
			result = {
				value: highlightResult.value,
				language: language.aliases ? language.aliases[0] : highlightResult.language || ext,
			};
		} else {
			result = { value: text, language: undefined };
		}
		const geometry = this.createPrettyPrintGeometry(font, text, result);
		return Comlink.transfer(geometry, [geometry.verts.buffer, geometry.uvs.buffer]);
	}

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
		const pad = PrettyPrinter.pad;
		const hex = PrettyPrinter.hex;
		let accumulator = ['HEXDUMP'];
		for (let i = 0; i < u8.length; i++) {
			if (i % 64 === 0) accumulator.push(`\n${pad[Math.log10(i) | 0]}${i} `);
			accumulator.push(hex[u8[i]]);
		}
		return accumulator.join('');
	}

	static wordWrap(contents: string, filename: string): string {
		const wordWrapWidth = /\.(md|txt)$/i.test(filename) ? 120 : undefined;
		if (false && wordWrapWidth) {
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

	createPrettyPrintGeometry(
		font: BMFont,
		text: string,
		result: PrettyPrintResult
	): PrettyPrintGeometry {
		const geometry = new SDFTextGeometry({
			text,
			mode: 'pre',
			font,
		});
		let lineCount = 0;
		for (let i = 0; i < text.length; i++) {
			if (text.charCodeAt(i) === 10) lineCount++;
		}
		let palette: THREE.Vector3[] | undefined = undefined;
		if (result.language) {
			let i = 0;
			const stack = [];
			const tag = /<[^>]*>/g;
			palette = [];
			const paletteIndex = new Map();
			const nodeStyles: NodeStyle[] = [];
			while (true) {
				const token = tag.exec(result.value);
				if (!token) {
					nodeStyles.push(
						Style.resolve(
							he.decode(result.value.slice(i)),
							stack.flat(1e9),
							palette,
							paletteIndex
						)
					);
					break;
				}
				if (i !== token.index) {
					nodeStyles.push(
						Style.resolve(
							he.decode(result.value.slice(i, token.index)),
							stack.flat(1e9),
							palette,
							paletteIndex
						)
					);
				}
				i = token.index + token[0].length;
				if (token[0][1] === '/') {
					stack.pop();
				} else {
					const classMatch = token[0].match(/class="([^"]+)"/);
					stack.push(classMatch ? classMatch[1].split(' ') : []);
				}
			}
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
			}
		}
		const sdfText = geometry.sdfText;
		delete sdfText.layout.options;
		delete sdfText.layout.computeMetrics;
		delete sdfText.position;
		delete sdfText.uv;
		delete sdfText.layout.glyphs;
		delete sdfText.visibleGlyphs;
		return {
			verts: geometry.getAttribute('position').array as Float32Array,
			uvs: geometry.getAttribute('uv').array as Float32Array,
			palette,
			lineCount,
			sdfText,
		};
	}
}

Comlink.expose(new PrettyPrinter());
