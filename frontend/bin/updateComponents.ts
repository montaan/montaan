#!/usr/bin/env yarn ts-node

import { updateComponent } from './updateComponent';
import path from 'path';
import glob from 'glob';

if (!module.parent) {
	const files = process.argv.slice(2);
	updateComponents(files);
}

export function updateComponents(files: string[]): void {
	const components: { [dir: string]: number } = {};
	files.forEach((file) => {
		const dir = path.dirname(file);
		const stories = glob.sync(path.join(dir, '*.stories.tsx'));
		if (stories.length > 0) {
			components[dir] = 1;
		}
	});
	for (let dir in components) {
		const segments = dir.split(path.sep);
		const target = segments[segments.length - 2];
		const name = segments[segments.length - 1];
		updateComponent(target, name);
	}
}
