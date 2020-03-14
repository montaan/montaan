// src/components/MainApp/MainApp.tsx

import React from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { Helmet } from 'react-helmet';

import MainView from '../MainView';
import CommitControls from '../CommitControls';
import CommitInfo from '../CommitInfo';
import Search from '../Search';
import TourSelector from '../TourSelector';
import Breadcrumb from '../Breadcrumb';
import RepoSelector from '../RepoSelector';

import utils from '../lib/utils';
import { CommitData } from '../lib/parse_commits';
import { authorCmp, Commit, CommitFile } from '../lib/parse-diff';
import { getPathEntry, getFullPath, mount, readDir, registerFileSystem } from '../lib/filesystem';

import styles from './MainApp.module.scss';
import TreeView from '../TreeView';
import { QFrameAPI } from '../../lib/api';
import Player from '../Player';
import { FSEntry, createFSTree } from '../lib/filesystem';
import Introduction from '../Introduction';
import WorkQueue from '../lib/WorkQueue';

import MontaanGitFilesystem from '../lib/filesystem/MontaanGitFilesystem';
import MontaanUserReposFilesystem, { RepoInfo } from '../lib/filesystem/MontaanUserReposFilesystem';

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
	fsEntry: FSEntry;
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
	tree: FSEntry;
}

export interface GoToTarget {
	fsEntry: FSEntry;
	line?: number;
	col?: number;
}

export interface FileContents {
	content: string;
	path: string;
	hash: string;
	original?: string;
}

export interface CommitFilter {
	path?: string;
	author?: string;
	authorSearch?: string;
	search?: string;
	date?: string;
}

export interface ActiveCommitData {
	commits: Commit[];
	authors: string[];
	authorCommitCounts: { [author: string]: number };
	files: any[];
}

interface MainAppState {
	repoPrefix: string;
	commitFilter: CommitFilter;
	searchQuery: string;
	commits: Commit[];
	activeCommitData: null | ActiveCommitData;
	fileTree: FileTree;
	commitLog: string;
	commitChanges: string;
	files: string;
	searchResults: SearchResult[];
	navigationTarget: string;
	goToTarget: null | GoToTarget;
	frameRequestTime: number;
	searchLinesRequest: number;
	diffsLoaded: number;
	fileContents: null | FileContents;
	links: TreeLink[];
	dependencies: TreeLink[];
	dependencySrcIndex: TreeLinkIndex;
	dependencyDstIndex: TreeLinkIndex;
	repos: RepoInfo[];
	repoError: any;
	processing: boolean;
	processingCommits: boolean;
	commitData: null | CommitData;
	navUrl: string;
	ref: string;
	searchHover?: any;
	treeLoaded: boolean;
	fileTreeUpdated: number;
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

class MainApp extends React.Component<MainAppProps, MainAppState> {
	emptyState = {
		repoPrefix: '',
		commitFilter: {},
		searchQuery: '',
		commits: [],
		activeCommitData: null,
		commitLog: '',
		commitChanges: '',
		files: '',
		searchResults: [],
		navigationTarget: '',
		goToTarget: null,
		frameRequestTime: 0,
		searchLinesRequest: 0,
		diffsLoaded: 0,
		fileContents: null,
		links: [],
		dependencies: [],
		dependencySrcIndex: new Map<TreeLinkKey, TreeLink[]>(),
		dependencyDstIndex: new Map<TreeLinkKey, TreeLink[]>(),
		processingCommits: false,
		processing: false,
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
		var repoPrefix = '';
		if (props.match && props.match.params.user) {
			repoPrefix = props.match.params.user + '/' + props.match.params.name;
		}
		this.state = {
			...this.emptyState,
			fileTree: { count: 0, tree: createFSTree('', '') },
			repos: [],
			navUrl: '',
			commitData: null,
			ref: 'HEAD',
			repoPrefix,
		};
		this.repoTimeout = 0;
		this.commitIndex = 0;
		this.animatedFiles = 0;
		if (this.props.userInfo) {
			const tree = this.state.fileTree.tree;
			const user = this.props.userInfo.name;
			mount(tree, `montaanUserRepos:///${user}`, `/${user}`, this.props.api);
		}
	}

	componentDidMount() {
		if (this.props.userInfo) this.updateUserRepos(this.props.userInfo);
	}

	async updateUserRepos(userInfo: UserInfo) {
		if (!userInfo) return this.setState({ repos: [] });
		const tree = this.state.fileTree.tree;
		if (!tree.entries) return;

		const user = this.props.userInfo.name;

		if (!tree.entries[user]) {
			mount(tree, `montaanUserRepos:///${user}`, `/${user}`, this.props.api);
		}

		await this.requestDirs([`/${user}`], []);
		if (!tree.entries[user]) return;
		const repoEntries = tree.entries[user].entries;
		if (!repoEntries) return;
		const repos = Object.keys(repoEntries).map((name) => repoEntries[name].data);
		await this.assertPathLoaded(this.props.location.pathname);

		this.setState({
			navUrl:
				this.props.location.pathname +
				this.props.location.search +
				this.props.location.hash,
			repos,
			processing: false,
			fileTreeUpdated: this.state.fileTreeUpdated + 1,
		});
	}

	async assertPathLoaded(path: string) {
		const prefixes = this.getPathPrefixes(path).filter((p) => {
			const entry = getPathEntry(this.state.fileTree.tree, p);
			return !entry || (entry.entries && !entry.fetched);
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

	processDirRequest = async ({ tree, paths, dropEntries }: LoadDirWorkItem) => {
		let files;
		let fileTreeDrop = tree;
		if (paths.length > 0) {
			files = Promise.all(paths.map((p) => readDir(tree.tree, p)));
		}
		if (dropEntries.length > 0) {
			dropEntries.forEach((fsEntry) => {
				fsEntry.entries = {};
				fsEntry.fetched = false;
				fsEntry.building = false;
			});
		}
		if (paths.length > 0) {
			await files;
			paths.forEach((p) => {
				const entry = getPathEntry(fileTreeDrop.tree, p);
				if (entry) entry.fetched = true;
			});
		}
		fileTreeDrop.count = 0;
		utils.traverseTree(fileTreeDrop, () => fileTreeDrop.count++);
		// console.log(fileTreeDrop);
		this.setState({ fileTreeUpdated: this.state.fileTreeUpdated + 1 });
	};

	requestDirs = async (paths: string[], dropEntries: FSEntry[]) => {
		if (LoadDirWorkQueueLocked) return;
		LoadDirWorkQueue.clear();
		if (paths.length === 0 && dropEntries.length === 0) return;
		const n = 5;
		for (let i = 0; i < paths.length; i += n) {
			LoadDirWorkQueue.push(this.processDirRequest, {
				tree: this.state.fileTree,
				paths: paths.slice(i, i + n),
				dropEntries: i === 0 ? dropEntries : [],
			});
		}
	};

	parseFiles(text: string, repoPrefix: string, changedFiles: CommitFile[] = []) {
		const fileTree = utils.parseFileList(text, {}, true, repoPrefix + '/');
		if (this.state.repos) {
			const reposEntry = fileTree.tree.entries[this.props.userInfo.name];
			this.state.repos.forEach((repo: any) => {
				if (!reposEntry.entries[repo.name]) {
					reposEntry.entries[repo.name] = {
						entries: {},
						size: 0,
						title: repo.name,
						name: repo.name,
						parent: reposEntry,
						index: undefined,
					};
				}
			});
		}
		for (var i = 0; i < changedFiles.length; i++) {
			const { path, renamed, action } = changedFiles[i];
			const fsEntry = getPathEntry(fileTree.tree, repoPrefix + '/' + (renamed || path));
			if (fsEntry) fsEntry.action = action;
		}
		return fileTree;
	}

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

	async animateFileTreeHistory(commits: Commit[], repoPrefix: string) {
		window.clearInterval(this.animatedFiles);
		const fileTrees = await Promise.all(
			commits.map(async (commit) => {
				console.log(commit.sha);
				const files = await this.props.api.postType(
					'/repo/tree',
					{
						repo: repoPrefix,
						hash: commit.sha,
						paths: [''],
						recursive: true,
					},
					{},
					'arrayBuffer'
				);
				return this.parseFiles(files, repoPrefix, commit.files);
			})
		);
		this.animatedFiles = window.setInterval(() => {
			if (this.state.treeLoaded) {
				const idx = commits.length - 1 - this.commitIndex;
				this.commitIndex = (this.commitIndex + 1) % commits.length;
				this.setState({ fileTree: fileTrees[idx], treeLoaded: false });
			}
		}, 16);
	}

	setCommitFilter = (commitFilter: any) => {
		this.setState({ commitFilter });
		this.setActiveCommits(this.filterCommits(commitFilter));
	};

	setSearchQuery = (searchQuery: string) => {
		this.setState({ searchQuery });
		this.searchString(searchQuery);
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

	loadFile = async (hash: string, path: string) => {
		path = path.replace(/^\//, '');
		var content = await this.props.api.post('/repo/checkout', {
			repo: this.state.repoPrefix,
			hash,
			path,
		});
		this.setState({ fileContents: { path, content, hash } });
	};

	loadFileDiff = async (hash: string, previousHash: string, path: string) => {
		path = path.replace(/^\//, '');
		const contentF = await this.props.api.post('/repo/checkout', {
			repo: this.state.repoPrefix,
			hash,
			path,
		});
		const originalF = await this.props.api.post('/repo/checkout', {
			repo: this.state.repoPrefix,
			hash: previousHash,
			path,
		});
		const content = await contentF;
		const original = await originalF;
		this.setState({ fileContents: { path, original, content, hash } });
	};

	closeFile = () => this.setState({ fileContents: null });

	loadDiff = async (commit: Commit) => {
		const diff = await this.props.api.post('/repo/diff', {
			repo: this.state.repoPrefix,
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

	filterCommits(commitFilter: CommitFilter): Commit[] {
		if (!this.state.commitData) return [];

		var path = (commitFilter.path || '').substring(this.state.repoPrefix.length + 2);
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
		for (var i in fileTree.entries) {
			this.searchTree(query, fileTree.entries[i], results, rawQueryRE);
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

	async search(query: RegExp[], rawQuery: string) {
		clearTimeout(searchResultsTimeout);
		var searchResults = [];
		if (rawQuery.length > 2) {
			const rawQueryRE = new RegExp(
				rawQuery.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') +
					'[a-zA-Z0-9_]*\\s*(\\([^)]*\\)\\s*\\{|=([^=]|$))'
			);
			var myNumber = ++searchQueryNumber;
			var text = await this.props.api.post('/repo/search', {
				repo: this.state.repoPrefix,
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
						const fullPath = '/' + this.state.repoPrefix + '/' + filename;
						return {
							fsEntry: getPathEntry(this.state.fileTree.tree, fullPath),
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
		// if (this.state.searchIndex) {
		// 	console.time('token search');
		// 	lunrResults = this.state.searchIndex.search(rawQuery);
		// 	lunrResults = lunrResults.map(function(r) {
		// 		const lineNumberMatch = r.ref.match(/:(\d+)\/(\d+)$/);
		// 		const [_, lineStr, lineCountStr] = (lineNumberMatch || ['0','0','0']);
		// 		const line = parseInt(lineStr);
		// 		const lineCount = parseInt(lineCountStr);
		// 		return {fsEntry: getPathEntry(this.state.fileTree.tree, r.ref.replace(/^\./, this.state.repoPrefix).replace(/:\d+\/\d+$/, '')), line, lineCount};
		// 	});
		// 	console.timeEnd('token search');
		// }
	}

	searchString(searchQuery: string) {
		this.clearSearchHover(this.state.searchHover);
		if (searchQuery === '') {
			this.setState({ searchResults: [] });
		} else {
			const re = [];
			try {
				re[0] = new RegExp(searchQuery, 'i');
			} catch (e) {}
			this.search(re, searchQuery);
		}
	}

	findCommitsForPath(path: string): Commit[] {
		if (!this.state.commitData) return [];
		path = path.substring(this.state.repoPrefix.length + 2);
		return this.state.commitData.commits.filter((c: Commit) =>
			c.files.some((f: CommitFile) => {
				if (f.renamed && f.renamed.startsWith(path)) {
					if (f.renamed === path) path = f.path;
					return true;
				}
				if (f.path.startsWith(path)) return true;
				return false;
			})
		);
	}

	showFileCommitsClick = (ev: any) => {
		this.setCommitFilter({ path: this.state.navigationTarget });
		this.requestFrame();
	};

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

	createRepo = async (name: string, url?: string) => {
		if (!url) url = undefined;
		const repo = await this.props.api.post('/repo/create', { name, url });
		this.updateUserRepos(this.props.userInfo);
		return repo as RepoInfo;
	};

	renameRepo = async (repo: RepoInfo, newName: string) => {
		const res = await this.props.api.post('/repo/rename', { name: repo.name, newName });
		if (res === 'OK') {
			this.updateUserRepos(this.props.userInfo);
			if (this.props.userInfo.name + '/' + repo.name === this.state.repoPrefix) {
				this.props.history.push(
					this.props.location.pathname.replace(
						this.state.repoPrefix,
						this.props.userInfo.name + '/' + newName
					) +
						this.props.location.search +
						this.props.location.hash
				);
			}
		}
	};

	dots() {
		var s = '';
		var count = (Date.now() / 1000) % 3;
		for (var i = 0; i < count; i++) {
			s += '.';
		}
		return s;
	}

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
		while (target) {
			if (target.dataset.filename) {
				this.props.history.push('/ilmari/montaan/' + target.dataset['filename'] + '#0');
				ev.preventDefault();
				return;
			}
			target = target.parentElement;
		}
	};

	render() {
		const titlePrefix = /Chrome/.test(navigator.userAgent) ? '' : '🏔 ';
		const title = this.state.navigationTarget
			? titlePrefix + this.state.navigationTarget + ' - Montaan'
			: 'Montaan 🏔';
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

				{this.state.processing && (
					<div id="processing">
						<div>{this.state.repoPrefix}</div>
						<div>Processing{this.dots()}</div>
					</div>
				)}
				{this.state.repoError && <div id="repoError">{this.state.repoError}</div>}

				{this.state.repoPrefix === '' && this.state.repos.length === 0 && (
					<Introduction userInfo={this.props.userInfo} />
				)}

				<RepoSelector
					repos={this.state.repos}
					createRepo={this.createRepo}
					renameRepo={this.renameRepo}
				/>

				<Search
					navigationTarget={this.state.navigationTarget}
					requestFrame={this.requestFrame}
					searchResults={this.state.searchResults}
					setSearchQuery={this.setSearchQuery}
					searchQuery={this.state.searchQuery}
					commitFilter={this.state.commitFilter}
					setCommitFilter={this.setCommitFilter}
					activeCommitData={this.state.activeCommitData}
					updateSearchLines={this.updateSearchLines}
					commitData={this.state.commitData}
					setSearchHover={this.setSearchHover}
					clearSearchHover={this.clearSearchHover}
				/>
				<Breadcrumb
					navigationTarget={this.state.navigationTarget}
					fileTree={this.state.fileTree}
				/>
				<TourSelector
					repoPrefix={this.state.repoPrefix}
					fileTree={this.state.fileTree}
					navigationTarget={this.state.navigationTarget}
					api={this.props.api}
				/>
				<Player
					repoPrefix={this.state.repoPrefix}
					fileTree={this.state.fileTree}
					navigationTarget={this.state.navigationTarget}
					api={this.props.api}
				/>
				<CommitControls
					activeCommitData={this.state.activeCommitData}
					commitData={this.state.commitData}
					navigationTarget={this.state.navigationTarget}
					searchQuery={this.state.searchQuery}
					diffsLoaded={this.state.diffsLoaded}
					commitFilter={this.state.commitFilter}
					setCommitFilter={this.setCommitFilter}
					addLinks={this.addLinks}
					setLinks={this.setLinks}
					links={this.state.links}
				/>
				<CommitInfo
					activeCommitData={this.state.activeCommitData}
					commitData={this.state.commitData}
					navigationTarget={this.state.navigationTarget}
					showFileCommitsClick={this.showFileCommitsClick}
					searchQuery={this.state.searchQuery}
					repoPrefix={this.state.repoPrefix}
					diffsLoaded={this.state.diffsLoaded}
					commitFilter={this.state.commitFilter}
					setCommitFilter={this.setCommitFilter}
					fileContents={this.state.fileContents}
					loadFile={this.loadFile}
					loadFileDiff={this.loadFileDiff}
					closeFile={this.closeFile}
					loadDiff={this.loadDiff}
					addLinks={this.addLinks}
					setLinks={this.setLinks}
					links={this.state.links}
				/>
				{this.props.location.search === '?beta' ? (
					<TreeView
						navUrl={this.state.navUrl}
						activeCommitData={this.state.activeCommitData}
						diffsLoaded={this.state.diffsLoaded}
						fileTree={this.state.fileTree}
						commitData={this.state.commitData}
						frameRequestTime={this.state.frameRequestTime}
						api={this.props.api}
						repoPrefix={this.state.repoPrefix}
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
					/>
				) : (
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
						fileTreeUpdated={this.state.fileTreeUpdated}
					/>
				)}
			</div>
		);
	}
}

export default withRouter(MainApp);
