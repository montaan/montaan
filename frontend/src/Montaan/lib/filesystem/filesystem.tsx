import QFrameAPI from '../../../lib/api';
import React from 'react';
import FileView from '../../FileViews/FileView';
import { SDFText } from '../third_party/three-bmfont-text-modified';
import { BBox } from '../Geometry';

export const EmptyLabelGeometry = SDFText;

export class FSEntry {
	labelGeometry: SDFText = SDFText.mock;
	distanceFromCenter: number = 0;
	mode: string = '';
	type: string = '';
	hash: string = '';
	name: string;
	title: string;
	entries: Map<string, FSEntry> = new Map();
	isDirectory: boolean = false;
	parent?: FSEntry;
	filesystem?: IFilesystem;
	size: number = 0;

	fetched?: boolean = false;

	x: number = 0;
	y: number = 0;
	z: number = 0;
	scale: number = 1;

	rx: number = 0;
	ry: number = 0;
	rz: number = 0;
	relativeScale: number = -1;

	filesBox: {} = {};
	color?: number[];

	data?: any;

	contentObject?: FileView;

	index?: number;
	vertexIndex: number = -1;
	textVertexIndex: number = -1;

	lastIndex: number = -1;
	lastVertexIndex: number = -1;
	lastTextVertexIndex: number = -1;

	navigationCoords?: { coords?: number[]; search?: string };
	lineCount: number = 0;

	action?: string;
	bbox: BBox = new BBox();
	nameIndex?: Map<string, FSEntry[]>;

	constructor(name: string = '') {
		this.name = name;
		this.title = name;
	}
}

export class FSDirEntry extends FSEntry {
	isDirectory: boolean = true;
}

export class NotImplementedError extends Error {}

export interface IFilesystem {
	mountPoint?: FSEntry;
	readDir(path: string): Promise<FSEntry | null>;
	readDirs(paths: string[]): Promise<(FSEntry | null)[]>;
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

	async readDirs(paths: string[]) {
		const filesystems = new Map<IFilesystem, string[]>();
		paths.forEach((path) => {
			const { relativePath, filesystem } = this.findFilesystemForPath(path);
			let fs = filesystems.get(filesystem);
			if (!fs) {
				fs = [];
				filesystems.set(filesystem, fs);
			}
			fs.push(relativePath);
		});
		const promises = [];
		for (let fs of filesystems.entries()) {
			promises.push(fs[0].readDirs(fs[1]));
		}
		return (await Promise.all(promises)).flat();
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
	options: any;
	mountPoint?: FSEntry;
	gid: string;

	static gid: number = 0;

	constructor(options: any) {
		this.options = options;
		this.gid = (Filesystem.gid++).toString();
	}

	getUIComponents(state: any): React.ReactElement {
		return <div key={this.gid}></div>;
	}

	async readDir(path: string): Promise<FSEntry | null> {
		throw new NotImplementedError("Filesystem doesn't support reads");
	}
	async readDirs(paths: string[]): Promise<(FSEntry | null)[]> {
		const promises = paths.map((path) => this.readDir(path));
		return Promise.all(promises);
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

export function mountURL(fileTree: FSEntry, url: string, mountPoint: string, api: QFrameAPI) {
	const fsType = getFSType(url);
	const filesystem = RegisteredFileSystems.get(fsType);
	if (!filesystem) throw new Error("Couldn't find a registered filesystem for URL: " + url);
	const fs = new filesystem({ url, api });
	return mount(fileTree, mountPoint, fs);
}

export function mount(fileTree: FSEntry, mountPoint: string, filesystem: Filesystem | undefined) {
	const cleanedMountPoint = mountPoint.replace(/\/+$/, '');
	const mountPointSegments = cleanedMountPoint.split('/');
	const fsEntry = getPathEntry(fileTree, mountPointSegments.slice(0, -1).join('/'));
	if (!fsEntry)
		throw new Error(
			'fileTree does not contain path: ' + mountPointSegments.slice(0, -1).join('/')
		);
	const name = mountPointSegments[mountPointSegments.length - 1];
	if (!fsEntry.isDirectory)
		throw new Error(
			'mountPoint is not a directory: ' + mountPointSegments.slice(0, -1).join('/')
		);
	const fs = new FSDirEntry(name);
	if (filesystem) {
		fs.filesystem = filesystem;
		filesystem.mountPoint = fs;
	}
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
		if (!branch.isDirectory) return null;
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
		if (!branch.isDirectory) return last;
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
	if (!fsEntry || !fsEntry.isDirectory) return [];
	return Array.from(fsEntry.entries.keys()).map((n) => path + '/' + n);
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
		if (!fsEntry || !fsEntry.isDirectory) break;
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
			if (dir) applyDir(filesystem, dir, relativePath);
		}
	}
}

export async function readDirs(tree: FSEntry, paths: string[]): Promise<void> {
	const filesystems = new Map<FSEntry, { path: string; relativePath: string }[]>();
	const pathEntries = new Map<string, FSEntry | null>();
	paths.forEach((path) => {
		const fsPath = getFilesystemForPath(tree, path);
		if (!fsPath) return null;
		const { filesystem, relativePath } = fsPath;
		let fs = filesystems.get(filesystem);
		if (!fs) {
			fs = [];
			filesystems.set(filesystem, fs);
		}
		fs.push({ path, relativePath });
		pathEntries.set(path, null);
	});
	const promises: Promise<void>[] = [];
	Array.from(filesystems.entries()).forEach((entry) => {
		const fsEntry = entry[0];
		const pathObjects = entry[1];
		if (fsEntry.filesystem) {
			const relativePaths: string[] = [];
			const paths: string[] = [];
			pathObjects.forEach(({ path, relativePath }) => {
				paths.push(path);
				relativePaths.push(relativePath);
			});
			promises.push(
				fsEntry.filesystem.readDirs(relativePaths).then((entries) =>
					entries.forEach((dir, i) => {
						if (dir) applyDir(fsEntry, dir, relativePaths[i]);
					})
				)
			);
		}
	});
	await Promise.all(promises);
}

function applyDir(tree: FSEntry, dir: FSEntry, relativePath: string) {
	const targetDir = getPathEntry(tree, relativePath);
	// if (targetDir && targetDir.name === 'backend') debugger;
	if (!targetDir || !targetDir.isDirectory) return;
	dir.isDirectory = true;
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

export async function readFile(tree: FSEntry, path: string): Promise<ArrayBuffer | undefined> {
	const fs = getFilesystemForPath(tree, path);
	if (fs) {
		const { filesystem, relativePath } = fs;
		if (filesystem.filesystem) {
			return filesystem.filesystem.readFile(relativePath);
		}
	}
}
