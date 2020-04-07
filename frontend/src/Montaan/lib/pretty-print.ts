import Text from './Text';
import * as THREE from 'three';
import { SDFText } from './third_party/three-bmfont-text-modified';
import Style, { NodeStyle } from './railscasts';
import he from 'he';

interface PrettyPrintWorker extends Worker {
	callbacks: { [uid: number]: (result: any) => void };
	callbackUID: number;
	prettyPrint: PrettyPrinter;
}

type PrettyPrinter = (
	text: string,
	filename: string,
	callback: (result: PrettyPrintResult) => void,
	mimeType?: string
) => void;

type PrettyPrintResult = {
	language: string;
	value: string;
};

class PoolPrinter {
	workers: PrettyPrintWorker[] = [];

	constructor(workerCount: number) {
		for (var i = 0; i < workerCount; i++) {
			const prettyPrintWorker: PrettyPrintWorker = new Worker(
				'/js/prettyPrintWorker.js'
			) as PrettyPrintWorker;
			prettyPrintWorker.callbacks = {};
			prettyPrintWorker.callbackUID = 0;
			prettyPrintWorker.onmessage = function(event) {
				const pp = this as PrettyPrintWorker;
				pp.callbacks[event.data.id](event.data.result);
				delete pp.callbacks[event.data.id];
			};
			prettyPrintWorker.prettyPrint = function(
				string,
				filename,
				callback: (result: PrettyPrintResult) => void,
				mimeType
			) {
				var id = this.callbackUID++;
				this.callbacks[id] = callback;
				// if (/\.tsx$/.test(filename)) filename = filename.replace(/tsx$/, 'jsx');
				this.postMessage({ string, filename, id, mimeType });
			};
			this.workers.push(prettyPrintWorker);
		}
	}

	prettyPrint(
		text: string,
		filename: string,
		callback: (result: {
			verts: Float32Array;
			uvs: Float32Array;
			palette: THREE.Vector3[] | undefined;
			lineCount: number;
			sdfText: SDFText;
		}) => void,
		mimeType?: string
	): void {
		let leastBusyWorker = this.workers[0];
		let minCallbacks = Object.keys(leastBusyWorker.callbacks).length;
		this.workers.forEach((w) => {
			const callbackCount = Object.keys(w.callbacks).length;
			if (callbackCount < minCallbacks) {
				leastBusyWorker = w;
				minCallbacks = callbackCount;
			}
		});
		return leastBusyWorker.prettyPrint(
			text,
			filename,
			(result: PrettyPrintResult) => {
				const geo = this.createPrettyPrintGeometry(text, result);
				callback(geo);
			},
			mimeType
		);
	}

	createPrettyPrintGeometry(text: string, result: PrettyPrintResult) {
		const geometry = Text.createText({
			text,
			mode: 'pre',
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
		return {
			verts: geometry.getAttribute('position').array as Float32Array,
			uvs: geometry.getAttribute('uv').array as Float32Array,
			palette,
			lineCount,
			sdfText,
		};
	}
}

export default new PoolPrinter(10);
