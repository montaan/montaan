import QFrameAPI from '../../../lib/api';
import React from 'react';
import FileView from '../../FileViews/FileView';
import { SDFText } from '../third_party/three-bmfont-text-modified';

export const EmptyLabelGeometry = SDFText;

export interface FSEntry {
	labelGeometry: SDFText;
	distanceFromCenter: number;
	mode: any;
	type: any;
	hash: any;
	name: string;
	title: string;
	entries?: Map<string, FSEntry>;
	parent?: FSEntry;
	filesystem?: IFilesystem;
	size: number;

	fetched?: boolean | number;
	building?: boolean;

	x: number;
	y: number;
	z: number;
	scale: number;

	filesBox: {};
	color?: number[];

	data: any;

	contentObject?: FileView;

	index?: number;
	vertexIndex: number;
	textVertexIndex: number;

	lastIndex: number;
	lastVertexIndex: number;
	lastTextVertexIndex: number;

	navigationCoords?: { coords?: number[]; search?: string };
	lineCount: number;

	action?: string;
}

export class NotImplementedError extends Error {}

export interface IFilesystem {
	mountPoint: FSEntry;
	readDir(path: string): Promise<FSEntry | null>;
	readFile(path: string): Promise<ArrayBuffer>;
	writeFile(path: string, contents: ArrayBuffer): Promise<boolean>;
	rm(path: string): Promise<boolean>;
	rmdir(path: string): Promise<boolean>;
	getUIComponents(state: any): React.ReactElement;
}

type Constructor<T> = {
	new (...args: any[]): T;
};

export class Namespace implements IFilesystem {
	mountPoint: FSEntry;
	constructor(mountPoint: FSEntry) {
		this.mountPoint = mountPoint;
	}

	findFilesystemForPath(path: string) {
		const fs = getFilesystemForPath(this.mountPoint, path);
		if (!fs || !fs.filesystem || !fs.filesystem.filesystem)
			throw new Error('Filesystem not found for path ' + path);
		return { relativePath: fs.relativePath, filesystem: fs.filesystem.filesystem };
	}

	getUIComponents(state: any): React.ReactElement {
		return <div key={'/'}></div>;
	}

	async readDir(path: string) {
		const { relativePath, filesystem } = this.findFilesystemForPath(path);
		return filesystem.readDir(relativePath);
	}

	async readFile(path: string) {
		const { relativePath, filesystem } = this.findFilesystemForPath(path);
		return filesystem.readFile(relativePath);
	}

	async writeFile(path: string, contents: ArrayBuffer) {
		const { relativePath, filesystem } = this.findFilesystemForPath(path);
		return filesystem.writeFile(relativePath, contents);
	}
	async rm(path: string) {
		const { relativePath, filesystem } = this.findFilesystemForPath(path);
		return filesystem.rm(relativePath);
	}
	async rmdir(path: string) {
		const { relativePath, filesystem } = this.findFilesystemForPath(path);
		return filesystem.rmdir(relativePath);
	}
}

export class Filesystem implements IFilesystem {
	url: URL;
	api: QFrameAPI;
	mountPoint: FSEntry;

	constructor(url: string, api: QFrameAPI, fsEntry: FSEntry) {
		this.url = new URL(url);
		this.api = api;
		this.mountPoint = fsEntry;
	}

	getUIComponents(state: any): React.ReactElement {
		const path = getFullPath(this.mountPoint);
		return <div key={path}></div>;
	}

	async readDir(path: string): Promise<FSEntry | null> {
		throw new NotImplementedError("Filesystem doesn't support reads");
	}
	async readFile(path: string): Promise<ArrayBuffer> {
		throw new NotImplementedError("Filesystem doesn't support reads");
	}
	async writeFile(path: string, contents: ArrayBuffer): Promise<boolean> {
		throw new NotImplementedError("Filesystem doesn't support writes");
	}
	async rm(path: string): Promise<boolean> {
		throw new NotImplementedError("Filesystem doesn't support writes");
	}
	async rmdir(path: string): Promise<boolean> {
		throw new NotImplementedError("Filesystem doesn't support writes");
	}
}

export const RegisteredFileSystems: Map<string, Constructor<Filesystem>> = new Map();

export function registerFileSystem(fsType: string, filesystem: Constructor<Filesystem>) {
	RegisteredFileSystems.set(fsType, filesystem);
}

export function unregisterFileSystem(fsType: string) {
	RegisteredFileSystems.delete(fsType);
}

export function getFSType(url: string) {
	return url.split(':')[0];
}

export function createFSTree(name: string, url: string, fsType?: string, api?: QFrameAPI): FSEntry {
	const fs = fsType && RegisteredFileSystems.get(fsType);
	const fsEntry: FSEntry = {
		name,
		title: name,
		entries: new Map(),
		fetched: false,
		filesystem: undefined,
		size: 0,
		scale: 0,
		mode: '',
		type: '',
		hash: '',

		x: 0,
		y: 0,
		z: 0,
		distanceFromCenter: 1e9,

		navigationCoords: undefined,
		lineCount: 0,

		filesBox: {},
		lastIndex: -1,
		lastVertexIndex: -1,
		lastTextVertexIndex: -1,
		textVertexIndex: -1,
		vertexIndex: -1,

		data: undefined,
		labelGeometry: SDFText.mock,
	};
	if (fs) fsEntry.filesystem = new fs(url, api, fsEntry);
	return fsEntry;
}

export function mount(fileTree: FSEntry, url: string, mountPoint: string, api: QFrameAPI) {
	const fsType = getFSType(url);
	const cleanedMountPoint = mountPoint.replace(/\/+$/, '');
	const mountPointSegments = cleanedMountPoint.split('/');
	const fsEntry = getPathEntry(fileTree, mountPointSegments.slice(0, -1).join('/'));
	if (!fsEntry) throw new Error('fileTree does not contain path');
	const name = mountPointSegments[mountPointSegments.length - 1];
	if (!fsEntry.entries) throw new Error('mountPoint is not a directory');
	const fs = createFSTree(name, url, fsType, api);
	fs.parent = fsEntry;
	fsEntry.entries.set(name, fs);
	return fs;
}

export function getPathEntry(fileTree: FSEntry, path: string): FSEntry | null {
	path = path.replace(/\/+$/, '');
	var segments = path.split('/');
	while (segments[0] === '') {
		segments.shift();
	}
	var branch: FSEntry | undefined = fileTree;
	for (var i = 0; i < segments.length; i++) {
		var segment = segments[i];
		if (!branch.entries) return null;
		branch = branch.entries.get(segment);
		if (!branch) return null;
	}
	return branch;
}

export function getNearestPathEntry(fileTree: FSEntry, path: string): FSEntry | null {
	path = path.replace(/\/+$/, '');
	var segments = path.split('/');
	while (segments[0] === '') {
		segments.shift();
	}
	var branch: FSEntry | undefined = fileTree;
	var last = fileTree;
	for (var i = 0; i < segments.length; i++) {
		var segment = segments[i];
		if (!branch.entries) return last;
		branch = branch.entries.get(segment);
		if (!branch) return last;
		last = branch;
	}
	return branch;
}

export function getFullPath(fsEntry: FSEntry): string {
	if (!fsEntry.parent) return '';
	return getFullPath(fsEntry.parent) + '/' + fsEntry.name;
}

export function getSiblings(fileTree: FSEntry, path: string): string[] {
	path = path.replace(/\/[^/]+\/*$/, '');
	var fsEntry = getPathEntry(fileTree, path);
	if (!fsEntry || !fsEntry.entries) return [];
	return Object.keys(fsEntry.entries).map((n) => path + '/' + n);
}

type FSPath = { filesystem: FSEntry; relativePath: string };

export function getFilesystemForPath(namespace: FSEntry, path: string): FSPath | null {
	let relativePath = '';
	let fsEntry = getPathEntry(namespace, path);
	if (!fsEntry) return null;
	while (!fsEntry.filesystem) {
		relativePath = '/' + fsEntry.name + relativePath;
		if (!fsEntry.parent) break;
		fsEntry = fsEntry.parent;
	}
	return { relativePath, filesystem: fsEntry };
}

export function getAllFilesystemsForPath(namespace: FSEntry, path: string): FSEntry[] {
	const segments = path.split('/');
	const list: FSEntry[] = [];
	let fsEntry: FSEntry | undefined = namespace;
	if (fsEntry.filesystem) list.push(fsEntry);
	for (let i = 1; i < segments.length; i++) {
		const segment = segments[i];
		if (!fsEntry || !fsEntry.entries) break;
		fsEntry = fsEntry.entries.get(segment);
		if (fsEntry && fsEntry.filesystem) list.push(fsEntry);
	}
	return list;
}

export type ExtendedFSEntry = { fsEntry: FSEntry; point?: number[]; search?: string };

export function getFSEntryForURL(namespace: FSEntry, url: string): ExtendedFSEntry | undefined {
	const [treePath, coords] = url.split('#');
	const point =
		(coords && /^[.\d]+(,[.\d]+)*$/.test(coords) && coords.split(',').map(parseFloat)) ||
		undefined;
	const search =
		(coords && /^find:/.test(coords) && decodeURIComponent(coords.slice(5))) || undefined;
	const fs = getFilesystemForPath(namespace, treePath);
	if (!fs) return undefined;
	const fsEntry = getPathEntry(fs.filesystem, fs.relativePath);
	if (!fsEntry) return undefined;
	return { fsEntry, point, search };
}

export function getNearestFSEntryForURL(
	namespace: FSEntry,
	url: string
): ExtendedFSEntry | undefined {
	const [treePath, coords] = url.split('#');
	const point =
		(coords && /^[.\d]+(,[.\d]+)*$/.test(coords) && coords.split(',').map(parseFloat)) ||
		undefined;
	const search =
		(coords && /^find:/.test(coords) && decodeURIComponent(coords.slice(5))) || undefined;
	const fsEntry = getNearestPathEntry(namespace, treePath);
	if (!fsEntry) return undefined;
	return { fsEntry, point, search };
}

export async function readDir(tree: FSEntry, path: string): Promise<void> {
	const fs = getFilesystemForPath(tree, path);
	if (fs) {
		const { filesystem, relativePath } = fs;
		if (filesystem.filesystem) {
			const dir = await filesystem.filesystem.readDir(relativePath);
			const targetDir = getPathEntry(filesystem, relativePath);
			// if (targetDir && targetDir.name === 'backend') debugger;
			if (!dir || !targetDir || !targetDir.entries || !dir.entries) return;
			for (let i of dir.entries.keys()) {
				const fsEntry = dir.entries.get(i);
				if (!targetDir.entries.get(i) && fsEntry) {
					targetDir.entries.set(i, fsEntry);
					fsEntry.parent = targetDir;
				}
			}
			const deletions = [];
			for (let i of targetDir.entries.keys()) {
				if (!dir.entries.has(i)) {
					deletions.push(i);
				}
			}
			for (let i = 0; i < deletions.length; i++) {
				targetDir.entries.delete(deletions[i]);
			}
		}
	}
}

export async function readFile(tree: FSEntry, path: string): Promise<ArrayBuffer | undefined> {
	const fs = getFilesystemForPath(tree, path);
	if (fs) {
		const { filesystem, relativePath } = fs;
		if (filesystem.filesystem) {
			return filesystem.filesystem.readFile(relativePath);
		}
	}
}
