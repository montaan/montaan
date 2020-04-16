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
		const segments = dir.split(path.sep);
		const target = segments[segments.length - 2];
		const name = segments[segments.length - 1];
		updateComponent(target, name);
	}
}
