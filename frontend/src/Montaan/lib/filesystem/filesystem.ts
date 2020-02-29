import QFrameAPI from '../../../lib/api';
import utils from '../utils';

export interface FSEntry {
	data: any;
	textVertexIndex: number;
	vertexIndex: number;
	filesBox: {};
	color?: number[];
	lastIndex: number;
	lastVertexIndex: number;
	lastTextVertexIndex: number;
	scale: number;

	x: number;
	y: number;
	z: number;

	textScale: number;
	textXZero: number;
	textX: number;
	textYZero: number;
	textY: number;
	textHeight: number;
	targetLine: any;
	lineCount: number;

	name: string;
	title: string;
	entries: null | { [filename: string]: FSEntry };
	fetched?: boolean | number;
	building?: boolean;

	action?: string;
	filesystem?: IFilesystem;
	parent?: FSEntry;
	contentObject?: any;
	index?: number;
	text?: THREE.Object3D;
}

export class NotImplementedError extends Error {}

export interface IFilesystem {
	readDir(path: string): Promise<FSEntry | null>;
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

class MontaanUserReposFilesystem extends Filesystem {
	name: string;

	constructor(url: string, api: QFrameAPI) {
		super(url, api);
		this.name = url;
	}

	async readDir(path: string): Promise<FSEntry | null> {
		const tree = createFSTree('', '');
		(await this.api.get('/repo/list')).forEach((repo: { name: string }) => {
			const fsEntry = mount(
				tree,
				`${this.name}/${repo.name}/HEAD`,
				`/${repo.name}`,
				'montaanGit',
				this.api
			);
			fsEntry.data = repo;
		});
		return tree;
	}

	async readFile(path: string): Promise<ArrayBuffer> {
		throw new NotImplementedError("montaanUserRepos doesn't support readFile");
	}

	async writeFile(path: string, contents: ArrayBuffer): Promise<boolean> {
		throw new NotImplementedError("montaanUserRepos doesn't support writes");
	}

	async rm(path: string): Promise<boolean> {
		throw new NotImplementedError("montaanUserRepos doesn't support writes");
	}

	async rmdir(path: string): Promise<boolean> {
		throw new NotImplementedError("montaanUserRepos doesn't support writes");
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

	async readDir(path: string): Promise<FSEntry> {
		let reqPath = path;
		if (reqPath === '') reqPath = '.';
		if (reqPath[0] === '/') reqPath = '.' + reqPath;
		reqPath += '/';
		const pathBuf: ArrayBuffer = await this.api.postType(
			'/repo/tree',
			{ repo: this.repo, paths: [reqPath], hash: this.ref, recursive: false },
			{},
			'arrayBuffer'
		);
		const tree = utils.parseFileList_(pathBuf, true, '');
		return getPathEntry(tree.tree, path) || tree.tree;
	}

	async readFile(path: string) {
		return this.api.postType(
			'/repo/checkout',
			{ repo: this.repo, path: path, head: this.ref },
			{},
			'arrayBuffer'
		);
	}

	async writeFile(path: string, contents: ArrayBuffer): Promise<boolean> {
		throw new NotImplementedError("montaanGit doesn't support writes");
	}

	async rm(path: string): Promise<boolean> {
		throw new NotImplementedError("montaanGit doesn't support writes");
	}

	async rmdir(path: string): Promise<boolean> {
		throw new NotImplementedError("montaanGit doesn't support writes");
	}
}

const RegisteredFileSystems: { [fsType: string]: Constructor<Filesystem> } = {
	montaanGit: MontaanGitFileSystem,
	montaanUserRepos: MontaanUserReposFilesystem,
};

export function getFSType(url: string) {
	return 'montaanGit';
}

export function createFSTree(name: string, url: string, fsType?: string, api?: QFrameAPI): FSEntry {
	return {
		name,
		title: name,
		entries: {},
		fetched: false,
		filesystem: fsType ? new RegisteredFileSystems[fsType](url, api) : undefined,
		scale: 0,

		x: 0,
		y: 0,
		z: 0,

		textScale: 0,
		textXZero: 0,
		textX: 0,
		textYZero: 0,
		textY: 0,
		textHeight: 0,
		targetLine: undefined,
		lineCount: 0,

		filesBox: {},
		lastIndex: -1,
		lastVertexIndex: -1,
		lastTextVertexIndex: -1,
		textVertexIndex: -1,
		vertexIndex: -1,

		data: undefined,
	};
}

export function mount(
	fileTree: FSEntry,
	url: string,
	mountPoint: string,
	fsType: string,
	api: QFrameAPI
) {
	if (!fsType) fsType = getFSType(url);
	const cleanedMountPoint = mountPoint.replace(/\/+$/, '');
	const mountPointSegments = cleanedMountPoint.split('/');
	const fsEntry = getPathEntry(fileTree, mountPointSegments.slice(0, -1).join('/'));
	if (!fsEntry) throw new Error('fileTree does not contain path');
	const name = mountPointSegments[mountPointSegments.length - 1];
	if (!fsEntry.entries) throw new Error('mountPoint is not a directory');
	const fs = createFSTree(name, url, fsType, api);
	fs.parent = fsEntry;
	fsEntry.entries[name] = fs;
	return fs;
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
		(coords && /^[.\d]+(,[.\d]+)*$/.test(coords) && coords.split(',').map(parseFloat)) ||
		undefined;
	const search =
		(coords && /^find:/.test(coords) && decodeURIComponent(coords.slice(5))) || undefined;
	const fs = getFilesystemForPath(namespace, treePath);
	if (!fs) return null;
	const fsEntry = getPathEntry(fs.filesystem, fs.relativePath);
	if (!fsEntry) return null;
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
			for (let i in dir.entries) {
				if (!targetDir.entries[i]) {
					targetDir.entries[i] = dir.entries[i];
					dir.entries[i].parent = targetDir;
				}
			}
			const deletions = [];
			for (let i in targetDir.entries) {
				if (!dir.entries[i]) {
					deletions.push(i);
				}
			}
			for (let i = 0; i < deletions.length; i++) {
				delete targetDir.entries[deletions[i]];
			}
		}
	}
}
