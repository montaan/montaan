import QFrameAPI from '../../../lib/api';

export interface FSEntry {
	name: string;
	title: string;
	entries: null | { [filename: string]: FSEntry };
	fetched?: boolean | number;

	action?: string;
	filesystem?: IFilesystem;
	parent?: FSEntry;
	contentObject?: any;
	index?: number;
	text?: THREE.Object3D;
}

export class NotImplementedError extends Error {}

export interface IFilesystem {
	readDir(path: string): Promise<FSEntry[]>;
	readFile(path: string): Promise<ArrayBuffer>;
	writeFile(path: string, contents: ArrayBuffer): Promise<boolean>;
	rm(path: string): Promise<boolean>;
	rmdir(path: string): Promise<boolean>;
}

type Constructor<T> = {
	new (...args: any[]): T;
};

export class Namespace implements IFilesystem {
	root: FSEntry;
	constructor(rootFS: FSEntry) {
		this.root = rootFS;
	}

	findFilesystemForPath(path: string) {
		const fs = getFilesystemForPath(this.root, path);
		if (!fs || !fs.filesystem || !fs.filesystem.filesystem)
			throw new Error('Filesystem not found for path ' + path);
		return { relativePath: fs.relativePath, filesystem: fs.filesystem.filesystem };
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

class Filesystem implements IFilesystem {
	url: string;
	api: QFrameAPI;

	constructor(url: string, api: QFrameAPI) {
		this.url = url;
		this.api = api;
	}

	async readDir(path: string) {
		throw new NotImplementedError("Filesystem doesn't support reads");
		return [];
	}
	async readFile(path: string) {
		throw new NotImplementedError("Filesystem doesn't support reads");
		return new ArrayBuffer(0);
	}
	async writeFile(path: string, contents: ArrayBuffer) {
		throw new NotImplementedError("Filesystem doesn't support writes");
		return true;
	}
	async rm(path: string) {
		throw new NotImplementedError("Filesystem doesn't support writes");
		return true;
	}
	async rmdir(path: string) {
		throw new NotImplementedError("Filesystem doesn't support writes");
		return true;
	}
}

class MontaanGitFileSystem extends Filesystem {
	repo: string;
	ref: string;

	constructor(url: string, api: QFrameAPI) {
		super(url, api);
		const urlSegments = url.split('/');
		this.repo = urlSegments.slice(0, -1).join('/');
		this.ref = urlSegments[urlSegments.length - 1];
	}

	async readDir(path: string) {
		return await this.api.post('/_/repo/dir', { repo: this.repo, path: path, head: this.ref });
	}

	async readFile(path: string) {
		return this.api.postType(
			'/_/repo/checkout',
			{ repo: this.repo, path: path, head: this.ref },
			{},
			'arrayBuffer'
		);
	}

	async writeFile(path: string, contents: ArrayBuffer) {
		throw new NotImplementedError("montaanGit doesn't support writes");
		return true;
	}

	async rm(path: string) {
		throw new NotImplementedError("montaanGit doesn't support writes");
		return true;
	}

	async rmdir(path: string) {
		throw new NotImplementedError("montaanGit doesn't support writes");
		return true;
	}
}

const RegisteredFileSystems: { [fsType: string]: Constructor<Filesystem> } = {
	montaanGit: MontaanGitFileSystem,
};

function getFSType(url: string) {
	return 'montaanGit';
}

function createFSTree(name: string, url: string, fsType: string): FSEntry {
	return {
		name,
		title: name,
		entries: {},
		fetched: false,
		filesystem: new RegisteredFileSystems[fsType](url),
	};
}

function mount(fileTree: FSEntry, url: string, mountPoint: string, fsType: string) {
	if (!fsType) fsType = getFSType(url);
	const cleanedMountPoint = mountPoint.replace(/\/+$/, '');
	const mountPointSegments = cleanedMountPoint.split('/');
	const fsEntry = getPathEntry(fileTree, mountPointSegments.slice(0, -1).join('/'));
	if (!fsEntry) throw new Error('fileTree does not contain path');
	const name = mountPointSegments[mountPointSegments.length - 1];
	if (!fsEntry.entries) throw new Error('mountPoint is not a directory');
	fsEntry.entries[name] = createFSTree(name, url, fsType);
	return fileTree;
}

export function getPathEntry(fileTree: FSEntry, path: string): FSEntry | null {
	path = path.replace(/\/+$/, '');
	var segments = path.split('/');
	while (segments[0] === '') {
		segments.shift();
	}
	var branch = fileTree;
	for (var i = 0; i < segments.length; i++) {
		var segment = segments[i];
		if (!branch.entries) return null;
		branch = branch.entries[segment];
		if (!branch) return null;
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

type ExtendedFSEntry = { fsEntry: FSEntry; point?: number[]; search?: string };

export function getFSEntryForURL(namespace: FSEntry, url: string): ExtendedFSEntry | null {
	const [treePath, coords] = url.split('#');
	const point =
		(coords && /^[\.\d]+(,[\.\d]+)*$/.test(coords) && coords.split(',').map(parseFloat)) ||
		undefined;
	const search =
		(coords && /^find:/.test(coords) && decodeURIComponent(coords.slice(5))) || undefined;
	const fs = getFilesystemForPath(namespace, treePath);
	if (!fs) return null;
	const fsEntry = getPathEntry(fs.filesystem, fs.relativePath);
	if (!fsEntry) return null;
	return { fsEntry, point, search };
}
