#!/usr/bin/env yarn ts-node

import { updateComponent } from './updateComponent';
import path from 'path';

if (!module.parent) {
	const files = process.argv.slice(2);
	updateComponents(files);
}

export function updateComponents(files: string[]): void {
	const components = new Set<string>();
	files.forEach((file) => {
		const dir = path.dirname(file);
		components.add(dir);
	});
	for (let dir of components.keys()) {
		const segments = dir.split(/[\/\\]/);
		const srcIndex = segments.lastIndexOf('src');
		if (srcIndex >= 0) {
			const target = segments.slice(srcIndex + 1, segments.length - 1).join(path.sep);
			const name = segments[segments.length - 1];
			if (target && name) {
				updateComponent(target, name);
			}
		}
	}
}
