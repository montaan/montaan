// src/components/MainApp/MainApp.tsx

import React from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { Helmet } from 'react-helmet';

import MainView from '../MainView';

import Breadcrumb from '../Breadcrumb';

import utils from '../Utils/utils';
import { CommitData } from '../CommitParser/parse_commits';
import { authorCmp, Commit } from '../CommitParser/parse-diff';
import {
	getPathEntry,
	getFullPath,
	readDirs,
	registerFileSystem,
	getAllFilesystemsForPath,
	mountURL,
	FSDirEntry,
	Filesystem,
	mount,
	readThumbnails,
} from '../Filesystems';

import styles from './MainApp.module.scss';
import { QFrameAPI } from '../../lib/api';
import { FSEntry } from '../Filesystems';
import WorkQueue from '../../lib/WorkQueue';

import { MontaanGitFilesystem } from '../Filesystems/MontaanGitFilesystem';
import { MontaanUserReposFilesystem, RepoInfo } from '../Filesystems/MontaanUserReposFilesystem';

registerFileSystem('montaanGit', MontaanGitFilesystem);
registerFileSystem('montaanUserRepos', MontaanUserReposFilesystem);

export interface MainAppProps extends RouteComponentProps {
	match: any;
	userInfo: UserInfo;
	api: QFrameAPI;
	apiPrefix: string;
}

export type TreeLinkKey = Element | FSEntry | string;

export interface TreeLink {
	src: TreeLinkKey;
	dst: TreeLinkKey;
	srcPoint?: number[];
	dstPoint?: number[];
	color: { r: number; g: number; b: number };
}

type TreeLinkIndex = Map<TreeLinkKey, TreeLink[]>;

export interface SearchResult {
	filename: string;
	line: number;
	snippet?: string;
	hitType: number;
}

export class UserInfo {
	name: string;
	static mock: UserInfo;
	constructor(name: string) {
		this.name = name;
	}
}

UserInfo.mock = new UserInfo('foo');

export interface FileTree {
	count: number;
	tree: FSDirEntry;
}

export interface GoToTarget {
	fsEntry: FSEntry;
	line?: number;
	col?: number;
}

export interface FileContents {
	content: ArrayBuffer;
	path: string;
	hash: string;
	original?: ArrayBuffer;
}

export interface CommitFilter {
	path?: string;
	author?: string;
	authorSearch?: string;
	search?: string;
	date?: string;
}

export class ActiveCommitData {
	static mock = new ActiveCommitData();
	commits: Commit[] = [];
	authors: string[] = [];
	authorCommitCounts: { [author: string]: number } = {};
	files: any[] = [];
}

interface MainAppState {
	commitFilter: CommitFilter;
	searchQuery: string;
	activeCommitData?: ActiveCommitData;
	fileTree: FileTree;
	commitLog: string;
	commitChanges: string;
	files: string;
	searchResults: SearchResult[];
	navigationTarget: string;
	goToTarget?: GoToTarget;
	frameRequestTime: number;
	searchLinesRequest: number;
	diffsLoaded: number;
	fileContents?: FileContents;
	links: TreeLink[];
	dependencies: TreeLink[];
	dependencySrcIndex: TreeLinkIndex;
	dependencyDstIndex: TreeLinkIndex;
	repoError: any;
	commitData?: CommitData;
	navUrl: string;
	searchHover?: any;
	treeLoaded: boolean;
	fileTreeUpdated: number;
	commitsVisible: boolean;
}

export interface FSState extends MainAppState {
	setCommitData: (commitData?: CommitData) => void;
	setDependencies: (dependencies: TreeLink[]) => void;
	setCommitFilter: (repo: string, commitFilter: CommitFilter) => void;
	loadDiff: (repo: string, commit: Commit) => Promise<void>;
	loadFile: (repo: string, hash: string, path: string) => Promise<void>;
	loadFileDiff: (repo: string, hash: string, previousHash: string, path: string) => Promise<void>;
	closeFile: () => void;
	setCommitsVisible: (commitsVisible: boolean) => void;
	setLinks: (links: TreeLink[]) => void;
	addLinks: (links: TreeLink[]) => void;
	setSearchQuery: (repo: string, branch: string, query: string) => void;
	updateSearchLines: () => void;
	setSearchHover: (el: HTMLElement, url: string) => void;
	clearSearchHover: (el: HTMLElement) => void;
	createRepo: (name: string, url?: string) => Promise<RepoInfo>;
	renameRepo: (repo: RepoInfo, newName: string) => Promise<void>;
	addTreeListener: (pattern: RegExp, callback: (fsEntry: FSEntry) => void) => void;
	removeTreeListener: (pattern: RegExp, callback: (fsEntry: FSEntry) => void) => void;
}

declare global {
	interface Navigator {
		standalone?: boolean;
	}
}

const isInWebAppiOS = window.navigator.standalone === true;
const isInWebAppChrome =
	window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
const fullscreenSupported = document.exitFullscreen && !isInWebAppChrome && !isInWebAppiOS;

var searchResultsTimeout = 0;
var searchQueryNumber = 0;

const HitType = {
	DOCUMENTATION: 0,
	DEFINITION: 1,
	USE: 2,
	TEST: 3,
};

type LoadDirWorkItem = { tree: FileTree; paths: string[]; dropEntries: FSEntry[] };
const LoadDirWorkQueue = new WorkQueue<LoadDirWorkItem>();
let LoadDirWorkQueueLocked = false;

type LoadThumbnailsWorkItem = { tree: FileTree; thumbnails: { path: string; z: number }[] };
const LoadThumbnailsWorkQueue = new WorkQueue<LoadThumbnailsWorkItem>();
let LoadThumbnailsWorkQueueLocked = false;

class MainApp extends React.Component<MainAppProps, MainAppState> {
	emptyState = {
		commitFilter: {},
		searchQuery: '',
		commitData: undefined,
		activeCommitData: undefined,
		commitLog: '',
		commitChanges: '',
		files: '',
		searchResults: [],
		navigationTarget: '',
		goToTarget: undefined,
		frameRequestTime: 0,
		searchLinesRequest: 0,
		diffsLoaded: 0,
		fileContents: undefined,
		links: [],
		dependencies: [],
		dependencySrcIndex: new Map<TreeLinkKey, TreeLink[]>(),
		dependencyDstIndex: new Map<TreeLinkKey, TreeLink[]>(),
		repoError: '',
		treeLoaded: false,
		fileTreeUpdated: 0,
	};

	repoTimeout: number;
	commitIndex: number;

	animatedFiles: number;
	lockRequests: boolean = false;
	requestKey: number = 0;

	constructor(props: MainAppProps) {
		super(props);
		this.state = {
			...this.emptyState,
			fileTree: { count: 0, tree: new FSDirEntry() },
			navUrl: '',
			commitsVisible: false,
		};
		this.state.fileTree.tree.nameIndex = new Map();
		this.repoTimeout = 0;
		this.commitIndex = 0;
		this.animatedFiles = 0;
		if (this.props.userInfo) {
			const tree = this.state.fileTree.tree;
			const user = this.props.userInfo.name;
			mountURL(tree, `montaanUserRepos:///${user}`, `/${user}`, this.props.api);
		}
		(window as any).mountFSEntry = this.mountFSEntry;
		(window as any).mount = this.mount;
		(window as any).mountURL = this.mountURL;
	}

	mount = async (parentPath: string, name: string, filesystem: Filesystem) => {
		const parentEntry = getPathEntry(this.state.fileTree.tree, parentPath);
		if (!parentEntry) throw new Error('Path not found');
		const fsEntry = mount(this.state.fileTree.tree, parentPath + '/' + name, filesystem);
		this.setState({ fileTreeUpdated: this.state.fileTreeUpdated + 1 });
		return fsEntry;
	};

	mountURL = async (parentPath: string, name: string, url: string) => {
		const parentEntry = getPathEntry(this.state.fileTree.tree, parentPath);
		if (!parentEntry) throw new Error('Path not found');
		const fsEntry = mountURL(
			this.state.fileTree.tree,
			url,
			parentPath + '/' + name,
			this.props.api
		);
		this.setState({ fileTreeUpdated: this.state.fileTreeUpdated + 1 });
		return fsEntry;
	};

	mountFSEntry = async (parentPath: string, name: string, fsEntry: FSEntry) => {
		const parentEntry = getPathEntry(this.state.fileTree.tree, parentPath);
		if (!parentEntry) throw new Error('Path not found');
		fsEntry.name = fsEntry.title = name;
		parentEntry.entries.set(fsEntry.name, fsEntry);
		fsEntry.parent = parentEntry;
		this.setState({ fileTreeUpdated: this.state.fileTreeUpdated + 1 });
		return fsEntry;
	};

	componentDidMount() {
		if (this.props.userInfo) this.updateUserRepos(this.props.userInfo);
	}

	async updateUserRepos(userInfo: UserInfo) {
		if (!userInfo) return;
		const tree = this.state.fileTree.tree;
		if (!tree.isDirectory) return;

		const user = this.props.userInfo.name;

		if (!tree.entries.has(user)) {
			mountURL(tree, `montaanUserRepos:///${user}`, `/${user}`, this.props.api);
		}

		await this.assertPathLoaded(this.props.location.pathname);

		this.setState({
			navUrl:
				this.props.location.pathname +
				this.props.location.search +
				this.props.location.hash,
			fileTreeUpdated: this.state.fileTreeUpdated + 1,
		});
	}

	async assertPathLoaded(path: string) {
		const prefixes = this.getPathPrefixes(path).filter((p) => {
			const entry = getPathEntry(this.state.fileTree.tree, p);
			return !entry || (entry.isDirectory && !entry.fetched);
		});
		LoadDirWorkQueueLocked = true;
		for (let i = 0; i < prefixes.length; i++) {
			await this.processDirRequest({
				tree: this.state.fileTree,
				paths: [prefixes[i]],
				dropEntries: [],
			});
		}
		LoadDirWorkQueueLocked = false;
	}

	getPathPrefixes(path: string) {
		const { prefixes } = path.split('/').reduce(
			(a, s) => {
				a.prefix += s + '/';
				a.prefixes.push(a.prefix);
				return a;
			},
			{ prefix: '', prefixes: [] as string[] }
		);
		return prefixes;
	}

	treeListeners: Map<RegExp, ((fsEntry: FSEntry) => void)[]> = new Map();

	addTreeListener = (pattern: RegExp, callback: (fsEntry: FSEntry) => void) => {
		if (!this.treeListeners.has(pattern)) {
			this.treeListeners.set(pattern, []);
		}
		const listeners = this.treeListeners.get(pattern)!;
		listeners.push(callback);
	};

	removeTreeListener = (pattern: RegExp, callback: (fsEntry: FSEntry) => void) => {
		if (!this.treeListeners.has(pattern)) return;
		const listeners = this.treeListeners.get(pattern)!;
		const idx = listeners.indexOf(callback);
		listeners.splice(idx, 1);
		if (listeners.length === 0) this.treeListeners.delete(pattern);
	};

	processDirRequest = async ({ tree, paths, dropEntries }: LoadDirWorkItem) => {
		let dirs;
		let fileTreeDrop = tree;
		if (paths.length > 0) {
			dirs = readDirs(tree.tree, paths);
		}
		if (dropEntries.length > 0) {
			dropEntries.forEach((fsEntry) => {
				fsEntry.entries = new Map();
				fsEntry.fetched = false;
			});
		}
		if (paths.length > 0) {
			await dirs;
			paths.forEach((p) => {
				const entry = getPathEntry(fileTreeDrop.tree, p);
				if (entry) {
					entry.fetched = true;
					utils.traverseFSEntry(
						entry,
						(fsEntry: FSEntry, path: string) => {
							if (tree.tree.nameIndex) {
								let idx = tree.tree.nameIndex.get(fsEntry.name);
								if (!idx) {
									idx = [];
									tree.tree.nameIndex.set(fsEntry.name, idx);
								}
								if (!idx.includes(fsEntry)) idx.push(fsEntry);
							}
						},
						''
					);
				}
			});
		}
		fileTreeDrop.count = 0;
		// utils.traverseTree(fileTreeDrop, () => fileTreeDrop.count++);
		// console.log(fileTreeDrop);
		this.setState({ fileTreeUpdated: this.state.fileTreeUpdated + 1 });
	};

	processThumbnailRequest = async ({ tree, thumbnails }: LoadThumbnailsWorkItem) => {
		let thumbResults;
		if (thumbnails.length > 0) {
			thumbResults = readThumbnails(tree.tree, thumbnails);
		}
		if (thumbnails.length > 0) {
			await thumbResults;
			thumbnails.forEach((p) => {
				const entry = getPathEntry(tree.tree, p.path);
				if (entry) {
					entry.fetched = true;
				}
			});
		}
		this.setState({ fileTreeUpdated: this.state.fileTreeUpdated + 1 });
	};

	requestDirs = async (paths: string[], dropEntries: FSEntry[]) => {
		if (LoadDirWorkQueueLocked) return;
		LoadDirWorkQueue.clear();
		if (paths.length === 0 && dropEntries.length === 0) return;
		const n = 8;
		for (let i = 0; i < paths.length; i += n) {
			LoadDirWorkQueue.push(this.processDirRequest, {
				tree: this.state.fileTree,
				paths: paths.slice(i, i + n),
				dropEntries: i === 0 ? dropEntries : [],
			});
		}
	};

	requestThumbnails = async (thumbnails: { path: string; z: number }[]) => {
		if (LoadThumbnailsWorkQueueLocked) return;
		LoadThumbnailsWorkQueue.clear();
		if (thumbnails.length === 0) return;
		const n = 32;
		for (let i = 0; i < thumbnails.length; i += n) {
			LoadThumbnailsWorkQueue.push(this.processThumbnailRequest, {
				tree: this.state.fileTree,
				thumbnails: thumbnails.slice(i, i + n),
			});
		}
	};

	showAllDependencies = () => {
		this.setLinks(this.state.dependencies);
	};

	showFileDependencies = (path: string) => {
		this.setLinks(this.state.dependencies.filter(({ src }) => src === path));
	};

	showFileUsers = (path: string) => {
		this.setLinks(this.state.dependencies.filter(({ dst }) => dst === path));
	};

	showFileDependencyGraph = (path: string) => {
		// Traverse graph from path and set connected part as links
	};

	setCommitData = (commitData?: CommitData) => {
		this.setState({ commitData, activeCommitData: undefined, commitFilter: {} });
		if (commitData) this.setActiveCommits(commitData.commits);
	};

	setCommitFilter = (repo: string, commitFilter: CommitFilter = {}) => {
		this.setState({ commitFilter });
		this.setActiveCommits(this.filterCommits(repo, commitFilter));
	};

	setSearchQuery = (repo: string, branch: string, searchQuery: string) => {
		this.setState({ searchQuery });
		this.searchString(repo, branch, searchQuery);
	};

	setNavigationTarget = (navigationTarget: string) => {
		if (this.state.navigationTarget !== navigationTarget) this.setState({ navigationTarget });
	};

	setActiveCommits = (activeCommits: any[]) => {
		const authorList = activeCommits.map((c) => c.author);
		const authorCommitCounts: { [author: string]: number } = {};
		authorList.forEach((key) => {
			if (!authorCommitCounts[key]) authorCommitCounts[key] = 0;
			authorCommitCounts[key]++;
		});
		const authors = utils.uniq(authorList, authorCmp);
		const files: any[] = [];
		this.setState({
			activeCommitData: {
				commits: activeCommits,
				authors,
				authorCommitCounts,
				files,
			},
		});
	};

	loadFile = async (repo: string, hash: string, path: string) => {
		path = path.replace(/^\//, '');
		var content = await this.props.api.post('/repo/checkout', {
			repo,
			hash,
			path,
		});
		this.setState({ fileContents: { path, content, hash } });
	};

	loadFileDiff = async (repo: string, hash: string, previousHash: string, path: string) => {
		path = path.replace(/^\//, '');
		const contentF = await this.props.api.post('/repo/checkout', {
			repo,
			hash,
			path,
		});
		const originalF = await this.props.api.post('/repo/checkout', {
			repo,
			hash: previousHash,
			path,
		});
		const content = await contentF;
		const original = await originalF;
		this.setState({ fileContents: { path, original, content, hash } });
	};

	closeFile = () => this.setState({ fileContents: undefined });

	loadDiff = async (repo: string, commit: Commit) => {
		const diff = await this.props.api.post('/repo/diff', {
			repo,
			hash: commit.sha,
		});
		commit.diff = diff;
		this.setState({ diffsLoaded: (this.state.diffsLoaded + 1) % 1048576 });
	};

	requestFrame = () =>
		this.setState({
			frameRequestTime: (this.state.frameRequestTime + 1) % 1048576,
		});

	updateSearchLines = () => {
		this.setState({
			searchLinesRequest: (this.state.searchLinesRequest + 1) % 1048576,
		});
	};

	filterCommits(repo: string, commitFilter: CommitFilter): Commit[] {
		if (!this.state.commitData) return [];

		var path = (commitFilter.path || '').substring(repo.length + 2);
		var author = commitFilter.author;
		var authorSearch = commitFilter.authorSearch;
		var search = commitFilter.search || '';
		var date = commitFilter.date;
		var year, month, day;

		if (date) [year, month, day] = date.split('-').map((v: string) => parseInt(v));
		if (authorSearch) authorSearch = authorSearch.toLowerCase();

		if (path.length === 0 && !author && !search && !authorSearch && !date)
			return this.state.commitData.commits;

		const commits = [];
		const allCommits = this.state.commitData.commits;
		const il = allCommits.length;
		for (var i = 0; i < il; ++i) {
			const c = allCommits[i];
			const files = c.files;
			const jl = files.length;
			var pathHit = !path;
			var searchHit = !search || !!(c.message && c.message.includes(search));
			for (var j = 0; j < jl; ++j) {
				const f = files[j];
				if (f.renamed && f.renamed.startsWith(path)) {
					if (f.renamed === path) path = f.path;
					pathHit = true;
				}
				pathHit = pathHit || f.path.startsWith(path);
				searchHit =
					searchHit ||
					f.path.includes(search) ||
					!!(f.renamed && f.renamed.includes(search));
			}
			const authorHit = !author || authorCmp(author, c.author) === 0;
			const authorSearchHit = !authorSearch || c.author.toLowerCase().includes(authorSearch);
			var dateHit = !date;
			if (year !== undefined) {
				dateHit = year === c.date.getUTCFullYear();
				if (dateHit && month !== undefined) {
					dateHit = dateHit && month === c.date.getUTCMonth() + 1;
					if (dateHit && day !== undefined) {
						dateHit = dateHit && day === c.date.getUTCDate();
					}
				}
			}
			if (pathHit && authorHit && searchHit && authorSearchHit && dateHit) commits.push(c);
		}
		return commits;
	}

	searchTree(query: RegExp[], fileTree: FSEntry, results: any[], rawQueryRE: RegExp) {
		if (
			query.every(function(re) {
				return re.test(fileTree.title);
			})
		) {
			const filename = getFullPath(fileTree);
			results.push({
				fsEntry: fileTree,
				line: 0,
				filename,
				hitType: this.getHitType(rawQueryRE, filename, undefined),
			});
		}
		if (fileTree.isDirectory) {
			for (let fsEntry of fileTree.entries.values()) {
				this.searchTree(query, fsEntry, results, rawQueryRE);
			}
		}
		return results;
	}

	searchSort(a: any, b: any) {
		var h = a.hitType - b.hitType;
		if (h === 0) h = a.filename.localeCompare(b.filename);
		if (h === 0) h = a.line - b.line;
		return h;
	}

	getHitType(rawQueryRE: RegExp, filename: string, snippet?: string) {
		if (/(^|\/)doc(s|umentation)?\//i.test(filename)) return HitType.DOCUMENTATION;
		if (/(^|\/)tests?\//i.test(filename)) return HitType.TEST;
		if (snippet && rawQueryRE.test(snippet)) return HitType.DEFINITION;
		return HitType.USE;
	}

	async search(repo: string, branch: string, query: RegExp[], rawQuery: string) {
		clearTimeout(searchResultsTimeout);
		var searchResults = [];
		if (rawQuery.length > 2) {
			const rawQueryRE = new RegExp(
				rawQuery.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') +
					'[a-zA-Z0-9_]*\\s*(\\([^)]*\\)\\s*\\{|=([^=]|$))'
			);
			var myNumber = ++searchQueryNumber;
			var text = await this.props.api.post('/repo/search', {
				repo,
				query: rawQuery,
			});
			var lines = text.split('\n');
			if (searchQueryNumber !== myNumber) return;
			const codeSearchResults = lines
				.map((line: string) => {
					const lineNumberMatch = line.match(/^([^:]+):(\d+):(.*)$/);
					if (lineNumberMatch) {
						// eslint-disable-next-line
						const [_, filename, lineStr, snippet] = lineNumberMatch;
						const line = parseInt(lineStr);
						const hitType = this.getHitType(rawQueryRE, filename, snippet);
						const fullPath = '/' + repo + '/' + branch + '/' + filename;
						return {
							filename: fullPath,
							line,
							snippet,
							hitType,
						};
					}
					return undefined;
				})
				.filter((l: string | undefined) => l !== undefined);
			searchResults = this.searchTree(
				query,
				this.state.fileTree.tree,
				codeSearchResults,
				rawQueryRE
			);
		}
		searchResults.sort(this.searchSort);
		this.setState({ searchResults });
	}

	searchString(repo: string, branch: string, searchQuery: string) {
		this.clearSearchHover(this.state.searchHover);
		if (searchQuery === '') {
			this.setState({ searchResults: [] });
		} else {
			const re = [];
			try {
				re[0] = new RegExp(searchQuery, 'i');
			} catch (e) {}
			this.search(repo, branch, re, searchQuery);
		}
	}

	fullscreenOnClick(ev: any) {
		var d = document;
		if (d.fullscreenElement) {
			d.exitFullscreen();
		} else {
			var e = document.body;
			e.requestFullscreen();
		}
	}

	setLinks = (links: TreeLink[]) => this.setState({ links });
	addLinks = (links: TreeLink[]) => this.setLinks(this.state.links.concat(links));

	setDependencies = (dependencies: TreeLink[]) => this.setState({ dependencies });

	setCommitsVisible = (commitsVisible: boolean) => this.setState({ commitsVisible });

	shouldComponentUpdate(nextProps: MainAppProps, nextState: MainAppState) {
		if (nextProps.userInfo !== this.props.userInfo) this.updateUserRepos(nextProps.userInfo);
		if (nextProps.location !== this.props.location) {
			this.assertPathLoaded(nextProps.location.pathname).then(() =>
				this.setState({
					navUrl:
						nextProps.location.pathname +
						nextProps.location.search +
						nextProps.location.hash,
				})
			);
		}

		return true;
	}

	createRepo = async (name: string, url?: string): Promise<RepoInfo> => {
		if (!url) url = undefined;
		const repo = await this.props.api.post('/repo/create', { name, url });
		this.updateUserRepos(this.props.userInfo);
		return repo as RepoInfo;
	};

	renameRepo = async (repo: RepoInfo, newName: string): Promise<void> => {
		const res = await this.props.api.post('/repo/rename', { name: repo.name, newName });
		if (res === 'OK') {
			this.updateUserRepos(this.props.userInfo);
			if (this.props.userInfo.name + '/' + repo.name) {
				this.props.history.push(
					this.props.location.pathname.replace(
						repo.name,
						this.props.userInfo.name + '/' + newName
					) +
						this.props.location.search +
						this.props.location.hash
				);
			}
		}
	};

	setSearchHover = (el: HTMLElement, url: string) => {
		if (this.state.links.find((v) => v.src === el)) return;
		const links = this.state.links.slice();
		const idx = links.findIndex((v) => v.src === this.state.searchHover);
		if (idx !== -1) links.splice(idx, 1);
		this.setState({ searchHover: el });
		links.push({ src: el, dst: url, color: { r: 1, g: 0, b: 0 } });
		this.setLinks(links);
	};

	clearSearchHover = (el: HTMLElement) => {
		if (this.state.searchHover === el) {
			const idx = this.state.links.findIndex((v) => v.src === el);
			if (idx !== -1) {
				var links = this.state.links.slice();
				links.splice(idx, 1);
				this.setState({ searchHover: null });
				this.setLinks(links);
			}
		}
	};

	onTreeLoaded = () => {
		this.setState({ treeLoaded: true });
	};

	goToSelf = (ev: React.MouseEvent) => {
		let target: HTMLElement | null = ev.target as HTMLElement;
		while (target && target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
			if (target.dataset.filename) {
				this.props.history.push(
					'/ilmari/montaan/master/' + target.dataset['filename'] + '#0'
				);
				ev.preventDefault();
				return;
			}
			target = target.parentElement;
		}
	};

	getPathFilesystems() {
		return getAllFilesystemsForPath(this.state.fileTree.tree, this.state.navigationTarget);
	}

	render() {
		const titlePrefix = /Chrome/.test(navigator.userAgent) ? '' : '🏔 ';
		const title = this.state.navigationTarget
			? titlePrefix + this.state.navigationTarget + ' - Montaan'
			: 'Montaan 🏔';
		const fsComponents: React.ReactElement[] = [];
		const fsState: FSState = {
			...this.state,
			setCommitData: this.setCommitData,
			setDependencies: this.setDependencies,
			setCommitFilter: this.setCommitFilter,
			loadDiff: this.loadDiff,
			loadFile: this.loadFile,
			loadFileDiff: this.loadFileDiff,
			closeFile: this.closeFile,
			setCommitsVisible: this.setCommitsVisible,
			setLinks: this.setLinks,
			addLinks: this.addLinks,

			setSearchQuery: this.setSearchQuery,
			updateSearchLines: this.updateSearchLines,
			setSearchHover: this.setSearchHover,
			clearSearchHover: this.clearSearchHover,

			createRepo: this.createRepo,
			renameRepo: this.renameRepo,
			addTreeListener: this.addTreeListener,
			removeTreeListener: this.removeTreeListener,
		};
		this.getPathFilesystems().forEach((fsEntry) => {
			fsComponents.push(fsEntry.filesystem!.getUIComponents(fsState));
		});
		return (
			<div
				id="mainApp"
				className={styles.MainApp}
				data-filename={'frontend/' + __filename.replace(/\\/g, '/')}
				onContextMenu={this.goToSelf}
			>
				<Helmet meta={[{ name: 'author', content: 'Montaan' }]}>
					<link rel="canonical" href="https://montaan.com/" />
					<meta name="description" content="Montaan." />
					<title>{title}</title>
				</Helmet>

				<div id="debug" />
				{fullscreenSupported && <div id="fullscreen" onClick={this.fullscreenOnClick} />}

				{this.state.repoError && <div id="repoError">{this.state.repoError}</div>}

				<Breadcrumb
					navigationTarget={this.state.navigationTarget}
					fileTree={this.state.fileTree}
					fileTreeUpdated={this.state.fileTreeUpdated}
				/>
				{fsComponents}
				<MainView
					navUrl={this.state.navUrl}
					treeLoaded={this.onTreeLoaded}
					activeCommitData={this.state.activeCommitData}
					diffsLoaded={this.state.diffsLoaded}
					fileTree={this.state.fileTree}
					commitData={this.state.commitData}
					frameRequestTime={this.state.frameRequestTime}
					api={this.props.api}
					navigationTarget={this.state.navigationTarget}
					searchLinesRequest={this.state.searchLinesRequest}
					searchResults={this.state.searchResults}
					searchQuery={this.state.searchQuery}
					commitFilter={this.state.commitFilter}
					addLinks={this.addLinks}
					setLinks={this.setLinks}
					links={this.state.links}
					setNavigationTarget={this.setNavigationTarget}
					requestDirs={this.requestDirs}
					requestThumbnails={this.requestThumbnails}
					fileTreeUpdated={this.state.fileTreeUpdated}
				/>
			</div>
		);
	}
}

export default withRouter(MainApp);
