import * as THREE from 'three';
import { SDFTextGeometry, SDFText } from './third_party/three-bmfont-text-modified';
import { BMFont } from './third_party/layout-bmfont-text-modified';
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
	constructor() {}

	prettyPrint(
		font: BMFont,
		text: string,
		filename: string,
		mimeType?: string
	): PrettyPrintGeometry {
		let ext = filename;
		if (filename.indexOf('.') !== -1) {
			const exts = filename.split('.');
			ext = exts[exts.length - 1];
		}
		const language = hljs.getLanguage(ext);
		let result: PrettyPrintResult;
		if (language) {
			const ppResult = hljs.highlight(ext, text, true);
			result = {
				value: ppResult.value,
				language: language.aliases ? language.aliases[0] : ppResult.language || ext,
			};
		} else {
			result = { value: text, language: undefined };
		}
		const geo = this.createPrettyPrintGeometry(font, text, result);
		return geo;
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
		delete sdfText.layout.options.font;
		delete sdfText.layout.options.measure;
		delete sdfText.layout.computeMetrics;
		delete sdfText.position;
		delete sdfText.uv;
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
