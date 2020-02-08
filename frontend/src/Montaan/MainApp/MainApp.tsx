// src/components/MainApp/MainApp.tsx

import React from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { Helmet } from 'react-helmet';

import * as THREE from 'three';

import MainView from '../MainView';
import CommitControls from '../CommitControls';
import CommitInfo from '../CommitInfo';
import Search from '../Search';
import Breadcrumb from '../Breadcrumb';
import RepoSelector, { Repo } from '../RepoSelector';

import utils from '../lib/utils';
import { parseCommits, CommitData, RawCommitData } from '../lib/parse_commits';
import { authorCmp, Commit, CommitFile } from '../lib/parse-diff';
import { getPathEntry, getFullPath } from '../lib/filetree';

import styles from './MainApp.module.scss';

export interface MainAppProps extends RouteComponentProps {
	match: any;
	userInfo: any;
	api: any;
	apiPrefix: string;
}

export interface FSEntry {
	title: string;
	entries: null | { [filename: string]: FSEntry };
}

export interface TreeLink {
	src: Element | FSEntry | string;
	dst: Element | FSEntry | string;
	color: { r: number; g: number; b: number };
}

export interface SearchResult {
	fsEntry: FSEntry;
	filename: string;
	line: number;
	snippet?: string;
	hitType: number;
}

export interface UserInfo {
	name: string;
}

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
	repos: Repo[];
	repoError: any;
	processing: boolean;
	processingCommits: boolean;
	commitData: null | CommitData;
	navUrl: string;
	ref: string;
	searchHover?: any;
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

class MainApp extends React.Component<MainAppProps, MainAppState> {
	emptyState = {
		repoPrefix: '',
		commitFilter: {},
		searchQuery: '',
		commits: [],
		activeCommitData: null,
		fileTree: { count: 0, tree: { title: '', entries: {} } },
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
		processingCommits: true,
		processing: true,
		repoError: '',
	};

	repoTimeout: number;
	commitIndex: number;

	constructor(props: MainAppProps) {
		super(props);
		var repoPrefix = '';
		if (props.match && props.match.params.user) {
			repoPrefix = props.match.params.user + '/' + props.match.params.name;
		}
		this.state = {
			...this.emptyState,
			repos: [],
			navUrl: '',
			commitData: null,
			ref: 'HEAD',
			repoPrefix,
		};
		this.repoTimeout = 0;
		this.commitIndex = 0;
		if (props.userInfo) this.updateUserRepos(props.userInfo);
		if (props.match && props.match.params.user) {
			this.setRepo(props.match.params.name, props.match.params.user);
		}
	}

	parseFiles(text: string, repoPrefix: string, changedFiles = []) {
		const fileTree = utils.parseFileList(text, {}, true, repoPrefix + '/');
		if (this.state.repos) {
			const reposEntry = fileTree.tree.entries[this.props.userInfo.name];
			this.state.repos.forEach((repo: any) => {
				if (!reposEntry.entries[repo.name]) {
					reposEntry.entries[repo.name] = {
						entries: {},
						size: 0,
						title: repo.name,
						parent: reposEntry,
						index: 0,
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

	setRepo = async (repoPath: string, userName = this.props.userInfo.name, ref = 'HEAD') => {
		clearTimeout(this.repoTimeout);
		// clearInterval(this.animatedFiles);
		// clearInterval(this.randomLinksInterval);
		this.commitIndex = 0;
		const repoPrefix = userName + '/' + repoPath;
		const repoInfo = await this.props.api.get('/repo/view/' + repoPrefix);
		if (repoInfo.status) {
			this.setState({ repoError: repoInfo });
			return;
		}
		this.setState({ ...this.emptyState, processing: true, repoPrefix, ref });
		if (repoInfo[0] && repoInfo[0].processing) {
			this.repoTimeout = window.setTimeout(() => this.setRepo(repoPath, userName), 1000);
			return;
		}
		console.time('load files');
		const files = await this.props.api.postType(
			'/repo/tree',
			{
				repo: repoPrefix,
				hash: ref,
				paths: [''],
				recursive: true,
			},
			{},
			'arrayBuffer'
		);
		console.timeEnd('load files');
		console.time('parse files');
		const fileTree = this.parseFiles(files, repoPrefix);
		console.timeEnd('parse files');
		const commitsOpen = this.state.activeCommitData !== null;
		this.setState({ ...this.emptyState, processing: false, repoPrefix, fileTree });
		console.time('load commitObj');
		const commitObj = (await this.props.api.getType(
			'/repo/fs/' + repoPrefix + '/log.json',
			{},
			'json'
		)) as RawCommitData;
		console.timeEnd('load commitObj');
		console.time('parse commitObj');
		const commitData = parseCommits(commitObj);
		console.timeEnd('parse commitObj');
		this.setState({ processingCommits: false, commitData });
		if (commitsOpen) this.setActiveCommits(commitData.commits);
		this.setState({ navUrl: this.props.location.pathname + this.props.location.hash });
		try {
			const deps = (await this.props.api.getType(
				'/repo/fs/' + repoPrefix + '/deps.json',
				{},
				'json'
			)) as { modules: { source: string; dependencies: { resolved: string }[] }[] };
			const links: { src: FSEntry; dst: FSEntry; color: THREE.Color }[] = [];
			deps.modules.forEach(({ source, dependencies }, i) => {
				var src = getPathEntry(fileTree.tree, repoPrefix + '/' + source);
				if (!src) return;
				const color = new THREE.Color().setHSL((i / 7) % 1, 0.5, 0.6);
				dependencies.forEach(({ resolved }) => {
					var dst = getPathEntry(fileTree.tree, repoPrefix + '/' + resolved);
					if (!dst) return;
					links.push({ src, dst, color });
				});
			});
			this.setLinks(links);
		} catch (err) {
			/* No deps */
		}
		// this.animateRandomLinks(fileTree.tree, files.split("\0"), repoPrefix);
	};

	// animateRandomLinks(fileTree, files, repoPrefix) {
	// 	const del = document.createElement('div');
	// 	for (var i = 0; i < 2; i++)
	// 		for (var j = 0; j < 200; j++) {
	// 			var el = document.createElement('div');
	// 			el.style.border = '1px solid red';
	// 			el.style.width = '4px';
	// 			el.style.height = '1px';
	// 			el.style.top = 2 + j * 4 + 'px';
	// 			if (i) el.style.right = '10px';
	// 			else el.style.left = '10px';
	// 			el.style.zIndex = 20000;
	// 			el.style.position = 'fixed';
	// 			del.appendChild(el);
	// 		}
	// 	document.body.appendChild(del);
	// 	this.randomLinksInterval = setInterval(() => {
	// 		const links = [];
	// 		for (var i = 0, l = Math.random() * 100; i < l; i++) {
	// 			const src =
	// 				Math.random() > 0.5
	// 					? del.childNodes[(Math.random() * 400) | 0]
	// 					: getPathEntry(
	// 							fileTree,
	// 							repoPrefix + '/' + files[(Math.random() * files.length) | 0]
	// 					  );
	// 			const dst =
	// 				Math.random() > 0.5
	// 					? del.childNodes[(Math.random() * 400) | 0]
	// 					: getPathEntry(
	// 							fileTree,
	// 							repoPrefix + '/' + files[(Math.random() * files.length) | 0]
	// 					  );
	// 			const color = { r: Math.random(), g: Math.random(), b: Math.random() };
	// 			links.push({ src, dst, color });
	// 		}
	// 		this.setLinks(links);
	// 	}, 16);
	// }

	// async animateFileTreeHistory(commits, repoPrefix) {
	// 	clearInterval(this.animatedFiles);
	// 	const fileTrees = await Promise.all(
	// 		commits.map(async (commit) => {
	// 			const files = await this.props.api.post('/repo/tree', {
	// 				repo: repoPrefix,
	// 				hash: commit.sha,
	// 			});
	// 			return this.parseFiles(files, repoPrefix, commit.files);
	// 		})
	// 	);
	// 	this.animatedFiles = setInterval(() => {
	// 		const idx = commits.length - 1 - this.commitIndex;
	// 		this.commitIndex = (this.commitIndex + 1) % commits.length;
	// 		this.setState({ fileTree: fileTrees[idx] });
	// 	}, 16);
	// }

	requestDirs = async (paths: string[]) => {
		const files = await this.props.api.postType(
			'/repo/tree',
			{
				repo: this.state.repoPrefix,
				hash: this.state.ref,
				paths: paths.map((p) => p.slice(this.state.repoPrefix.length + 2) + '/'),
				recursive: false,
			},
			{},
			'arrayBuffer'
		);
		const fileTree = utils.parseFileList_(
			files,
			true,
			this.state.repoPrefix + '/',
			this.state.fileTree
		);
		this.setState({ fileTree });
	};

	requestDitchDirs = async (fsEntries: FSEntry[]) => {
		fsEntries.forEach((fsEntry) => (fsEntry.entries = {}));
		var count = 0;
		utils.traverseTree(this.state.fileTree, () => count++);
		const fileTree = { ...this.state.fileTree, count };
		this.setState({ fileTree });
	};

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

	goToFSEntryTextAtLine = (fsEntry: FSEntry, line: number) =>
		this.setState({ goToTarget: { fsEntry, line } });
	goToFSEntry = (fsEntry: FSEntry) => this.setState({ goToTarget: { fsEntry } });

	setLinks = (links: TreeLink[]) => this.setState({ links });
	addLinks = (links: TreeLink[]) => this.setLinks(this.state.links.concat(links));

	async updateUserRepos(userInfo: UserInfo) {
		if (!userInfo) return this.setState({ repos: [] });
		const repos = await this.props.api.post('/repo/list');
		this.setState({ repos });
		if (this.state.repoPrefix === '' && repos.length > 0) {
			this.setRepo(repos[0].name, userInfo.name);
		}
	}

	shouldComponentUpdate(nextProps: MainAppProps, nextState: MainAppState) {
		if (nextProps.userInfo !== this.props.userInfo) this.updateUserRepos(nextProps.userInfo);
		if (nextProps.match && nextProps.match !== this.props.match) {
			var repoPrefix = nextProps.match.params.user + '/' + nextProps.match.params.name;
			if (repoPrefix !== this.state.repoPrefix) {
				this.setRepo(nextProps.match.params.name, nextProps.match.params.user);
			}
		}
		if (nextProps.location !== this.props.location) {
			this.setState({ navUrl: nextProps.location.pathname + nextProps.location.hash });
		}

		return true;
	}

	createRepo = async (name: string, url?: string) => {
		if (!url) url = undefined;
		const repo = await this.props.api.post('/repo/create', { name, url });
		this.updateUserRepos(this.props.userInfo);
		return repo as Repo;
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

	render() {
		const titlePrefix = /Chrome/.test(navigator.userAgent) ? '' : '🏔 ';
		const title = this.state.repoPrefix
			? titlePrefix + this.state.repoPrefix.split('/')[1] + ' - Montaan'
			: 'Montaan 🏔';
		return (
			<div id="mainApp" className={styles.MainApp}>
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

				<RepoSelector repos={this.state.repos} createRepo={this.createRepo} />
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

				<MainView
					goToTarget={this.state.goToTarget}
					navUrl={this.state.navUrl}
					activeCommitData={this.state.activeCommitData}
					diffsLoaded={this.state.diffsLoaded}
					fileTree={this.state.fileTree}
					commitData={this.state.commitData}
					frameRequestTime={this.state.frameRequestTime}
					api={this.props.api}
					apiPrefix={this.props.apiPrefix}
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
					requestDitchDirs={this.requestDitchDirs}
				/>
			</div>
		);
	}
}

export default withRouter(MainApp);
