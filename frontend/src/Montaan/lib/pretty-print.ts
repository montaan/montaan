import * as Comlink from 'comlink';
import { PrettyPrintGeometry } from './pretty-print.worker';
import Text from './Text';
import * as THREE from 'three';

/* eslint-disable import/no-webpack-loader-syntax */
import PrettyPrintWorker from 'worker-loader!./pretty-print.worker';

export class PrettyPrinter {
	workers: any[] = [];
	workerIndex: number = 0;

	constructor(workerCount: number = 10) {
		for (let i = 0; i < workerCount; i++) {
			this.workers.push(Comlink.wrap(new PrettyPrintWorker()));
		}
	}

	getWorker() {
		const worker = this.workers[this.workerIndex++];
		if (this.workerIndex >= this.workers.length) {
			this.workerIndex = 0;
		}
		return worker;
	}

	async prettyPrint(
		text: string,
		filename: string,
		mimeType?: string
	): Promise<PrettyPrintGeometry> {
		const result = await this.getWorker().prettyPrint(Text.font, text, filename, mimeType);
		if (result.palette) {
			result.palette = result.palette.map(
				(v: { x: number; y: number; z: number }) => new THREE.Vector3(v.x, v.y, v.z)
			);
		}
		return result;
	}
}

export default new PrettyPrinter();
