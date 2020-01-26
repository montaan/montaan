import React from 'react';
import { withRouter } from 'react-router-dom';
import { Helmet } from 'react-helmet';

import MainView from './components/MainView';
import CommitControls from './components/CommitControls';
import CommitInfo from './components/CommitInfo';
import Search from './components/Search';
import Breadcrumb from './components/Breadcrumb';
import RepoSelector from './components/RepoSelector';

import utils from './lib/utils';
import { parseCommits } from './lib/parse_commits';
import { authorCmp } from './lib/parse_diff';
import { getPathEntry, getFullPath } from './lib/filetree';

const fullscreenSupported =
	(document.exitFullscreen ||
		document.webkitExitFullscreen ||
		document.webkitExitFullScreen ||
		document.mozCancelFullScreen ||
		document.msExitFullscreen) &&
	!window.navigator.standalone;

var searchResultsTimeout;
var searchQueryNumber = 0;

const HitType = {
	DOCUMENTATION: 0,
	DEFINITION: 1,
	USE: 2,
	TEST: 3,
};

class MainApp extends React.Component {
	emptyState = {
		repoPrefix: '',
		commitFilter: {},
		searchQuery: '',
		commits: [],
		activeCommitData: {},
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
	};

	constructor(props) {
		super(props);
		this.state = { ...this.emptyState, repos: [] };
		window.setNavigationTarget = this.setNavigationTarget;
		this.repoTimeout = false;
		this.commitIndex = 0;
		if (props.userInfo) this.updateUserRepos(props.userInfo);
		if (props.match && props.match.params.user) {
			this.state.repoPrefix = props.match.params.user + '/' + props.match.params.name;
			this.setRepo(props.match.params.name, props.match.params.user);
		}
	}

	parseFiles(text, repoPrefix, changedFiles = []) {
		const fileTree = utils.parseFileList(text, {}, true, repoPrefix + '/');
		for (var i = 0; i < changedFiles.length; i++) {
			const { path, renamed, action } = changedFiles[i];
			const fsEntry = getPathEntry(fileTree.tree, repoPrefix + '/' + (renamed || path));
			if (fsEntry) fsEntry.action = action;
		}
		return fileTree;
	}

	setRepo = async (repoPath, userName = this.props.userInfo.name) => {
		clearTimeout(this.repoTimeout);
		clearInterval(this.animatedFiles);
		clearInterval(this.randomLinksInterval);
		this.commitIndex = 0;
		const repoPrefix = userName + '/' + repoPath;
		const repoInfo = await this.props.api.get('/repo/view/' + repoPrefix);
		if (repoInfo.status) {
			this.setState({ repoError: repoInfo });
			return;
		}
		this.setState({ ...this.emptyState, processing: true, repoPrefix });
		if (repoInfo[0] && repoInfo[0].processing) {
			this.repoTimeout = setTimeout(() => this.setRepo(repoPath, userName), 1000);
			return;
		}
		console.time('load files');
		const files = await this.props.api.post('/repo/tree', {
			repo: repoPrefix,
			hash: 'HEAD',
		});
		console.timeEnd('load files');
		console.time('parse files');
		const fileTree = this.parseFiles(files, repoPrefix);
		console.timeEnd('parse files');
		const commitsOpen = this.state.activeCommitData.commits;
		this.setState({ ...this.emptyState, repoPrefix, fileTree });
		console.time('load commitObj');
		const commitObj = await this.props.api.getType(
			'/repo/fs/' + repoPrefix + '/log.json',
			'json'
		);
		console.timeEnd('load commitObj');
		console.time('parse commitObj');
		const commitData = parseCommits(commitObj, fileTree.tree, repoPrefix);
		console.timeEnd('parse commitObj');
		this.setState({ processing: false, commitData });
		if (commitsOpen) this.setActiveCommits(commitData.commits);
		// this.animateRandomLinks(fileTree.tree, files.split("\0"), repoPrefix);
	};

	animateRandomLinks(fileTree, files, repoPrefix) {
		const del = document.createElement('div');
		for (var i = 0; i < 2; i++)
			for (var j = 0; j < 200; j++) {
				var el = document.createElement('div');
				el.style.border = '1px solid red';
				el.style.width = '4px';
				el.style.height = '1px';
				el.style.top = 2 + j * 4 + 'px';
				if (i) el.style.right = '10px';
				else el.style.left = '10px';
				el.style.zIndex = 20000;
				el.style.position = 'fixed';
				del.appendChild(el);
			}
		document.body.appendChild(del);
		this.randomLinksInterval = setInterval(() => {
			const links = [];
			for (var i = 0, l = Math.random() * 100; i < l; i++) {
				const src =
					Math.random() > 0.5
						? del.childNodes[(Math.random() * 400) | 0]
						: getPathEntry(
								fileTree,
								repoPrefix + '/' + files[(Math.random() * files.length) | 0]
						  );
				const dst =
					Math.random() > 0.5
						? del.childNodes[(Math.random() * 400) | 0]
						: getPathEntry(
								fileTree,
								repoPrefix + '/' + files[(Math.random() * files.length) | 0]
						  );
				const color = { r: Math.random(), g: Math.random(), b: Math.random() };
				links.push({ src, dst, color });
			}
			this.setLinks(links);
		}, 16);
	}

	async animateFileTreeHistory(commits, repoPrefix) {
		clearInterval(this.animatedFiles);
		const fileTrees = await Promise.all(
			commits.map(async (commit) => {
				const files = await this.props.api.post('/repo/tree', {
					repo: repoPrefix,
					hash: commit.sha,
				});
				return this.parseFiles(files, repoPrefix, commit.files);
			})
		);
		this.animatedFiles = setInterval(() => {
			const idx = commits.length - 1 - this.commitIndex;
			this.commitIndex = (this.commitIndex + 1) % commits.length;
			this.setState({ fileTree: fileTrees[idx] });
		}, 16);
	}

	setCommitFilter = (commitFilter) => {
		this.setState({ commitFilter });
		this.setActiveCommits(this.filterCommits(commitFilter));
	};

	setSearchQuery = (searchQuery) => {
		this.setState({ searchQuery });
		this.searchString(searchQuery);
	};

	setNavigationTarget = (navigationTarget) => {
		if (this.state.navigationTarget !== navigationTarget) this.setState({ navigationTarget });
	};

	setActiveCommits = (activeCommits) => {
		const authorList = activeCommits.map((c) => c.author);
		const authorCommitCounts = {};
		authorList.forEach((key) => {
			if (!authorCommitCounts[key]) authorCommitCounts[key] = 0;
			authorCommitCounts[key]++;
		});
		const authors = utils.uniq(authorList, authorCmp);
		const files = [];
		this.setState({
			activeCommitData: {
				commits: activeCommits,
				authors,
				authorCommitCounts,
				files,
			},
		});
	};

	loadFile = async (hash, path) => {
		path = path.replace(/^\//, '');
		var content = await this.props.api.post('/repo/checkout', {
			repo: this.state.repoPrefix,
			hash,
			path,
		});
		this.setState({ fileContents: { path, content, hash } });
	};

	loadFileDiff = async (hash, previousHash, path) => {
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

	loadDiff = async (commit) => {
		const diff = await this.props.api.post('/repo/diff', {
			repo: this.state.repoPrefix,
			hash: commit.sha,
		});
		commit.diff = diff;
		this.setState({ diffsLoaded: ++this.state.diffsLoaded % 1048576 });
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

	filterCommits(commitFilter) {
		var path = (commitFilter.path || '').substring(this.state.repoPrefix.length + 2);
		var author = commitFilter.author;
		var authorSearch = commitFilter.authorSearch;
		var search = commitFilter.search;
		var date = commitFilter.date;
		var year, month, day;

		if (date) [year, month, day] = date.split('-').map((v) => parseInt(v));
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
			var searchHit = !search || c.message.includes(search);
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
					(f.renamed && f.renamed.includes(search));
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

	searchTree(query, fileTree, results, rawQueryRE) {
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
			// this.console.log(fileTree);
		}
		for (var i in fileTree.entries) {
			this.searchTree(query, fileTree.entries[i], results);
		}
		return results;
	}

	searchSort(a, b) {
		var h = a.hitType - b.hitType;
		if (h === 0) h = a.filename.localeCompare(b.filename);
		if (h === 0) h = a.line - b.line;
		return h;
	}

	getHitType(rawQueryRE, filename, snippet) {
		if (/(^|\/)doc(s|umentation)?\//i.test(filename)) return HitType.DOCUMENTATION;
		if (/(^|\/)tests?\//i.test(filename)) return HitType.TEST;
		if (snippet && rawQueryRE.test(snippet)) return HitType.DEFINITION;
		return HitType.USE;
	}

	async search(query, rawQuery) {
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
				.map((line) => {
					const lineNumberMatch = line.match(/^([^:]+):(\d+):(.*)$/);
					if (lineNumberMatch) {
						// eslint-disable-next-line
						const [_, filename, lineStr, snippet] = lineNumberMatch;
						const line = parseInt(lineStr);
						const hitType = this.getHitType(rawQueryRE, filename, snippet);
						return {
							fsEntry: getPathEntry(
								this.state.fileTree.tree,
								this.state.repoPrefix + '/' + filename
							),
							filename,
							line,
							snippet,
							hitType,
						};
					}
					return undefined;
				})
				.filter((l) => l);
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

	searchString(searchQuery) {
		if (searchQuery === '') {
			this.setState({ searchResults: [] });
		} else {
			var segs = searchQuery.split(/\s+/);
			var re = [];
			try {
				re = segs.map(function(r) {
					return new RegExp(r, 'i');
				});
			} catch (e) {}
			this.search(re, searchQuery);
		}
	}

	findCommitsForPath(path) {
		path = path.substring(this.state.repoPrefix.length + 2);
		return this.state.commitData.commits.filter((c) =>
			c.files.some((f) => {
				if (f.renamed && f.renamed.startsWith(path)) {
					if (f.renamed === path) path = f.path;
					return true;
				}
				if (f.path.startsWith(path)) return true;
				return false;
			})
		);
	}

	showFileCommitsClick = (ev) => {
		this.setCommitFilter({ path: this.state.navigationTarget });
		this.requestFrame();
	};

	fullscreenOnClick(ev) {
		var d = document;
		if (
			d.fullscreenElement ||
			d.webkitFullscreenElement ||
			d.webkitFullScreenElement ||
			d.mozFullScreenElement ||
			d.msFullscreenElement
		) {
			(
				d.exitFullscreen ||
				d.webkitExitFullscreen ||
				d.webkitExitFullScreen ||
				d.mozCancelFullScreen ||
				d.msExitFullscreen
			).call(d);
		} else {
			var e = document.body;
			(
				e.requestFullscreen ||
				e.webkitRequestFullscreen ||
				e.webkitRequestFullScreen ||
				e.mozRequestFullScreen ||
				e.msRequestFullscreen
			).call(e);
		}
	}

	goToFSEntryTextAtLine = (fsEntry, line) => this.setState({ goToTarget: { fsEntry, line } });
	goToFSEntry = (fsEntry) => this.setState({ goToTarget: { fsEntry } });

	setLinks = (links) => this.setState({ links });
	addLinks = (links) => this.setLinks(this.state.links.concat(links));

	async updateUserRepos(userInfo) {
		if (!userInfo) return this.setState({ repos: [] });
		const repos = await this.props.api.post('/repo/list');
		this.setState({ repos });
		if (this.state.repoPrefix === '' && repos.length > 0) {
			this.setRepo(repos[0].name, userInfo.name);
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		if (nextProps.userInfo !== this.props.userInfo) this.updateUserRepos(nextProps.userInfo);
		if (nextProps.match && nextProps.match !== this.props.match) {
			var repoPrefix = nextProps.match.params.user + '/' + nextProps.match.params.name;
			if (repoPrefix !== this.state.repoPrefix) {
				this.setRepo(nextProps.match.params.name, nextProps.match.params.user);
			}
		}

		return true;
	}

	createRepo = async (name, url) => {
		if (!url) url = undefined;
		await this.props.api.post('/repo/create', { name, url });
		this.updateUserRepos(this.props.userInfo);
	};

	dots() {
		var s = '';
		var count = (Date.now() / 1000) % 3;
		for (var i = 0; i < count; i++) {
			s += '.';
		}
		return s;
	}

	render() {
		const title = this.state.repoPrefix ? '🏔 ' + this.state.repoPrefix : 'Montaan 🏔';
		return (
			<div id="mainApp" className={this.processing ? 'loading' : 'loaded'}>
				<Helmet meta={[{ name: 'author', content: 'Montaan' }]}>
					<link rel="canonical" href="https://montaan.com/" />
					<meta name="description" content="Montaan." />
					<title>{title}</title>
				</Helmet>

				<div id="debug" />
				{fullscreenSupported && <div id="fullscreen" onClick={this.fullscreenOnClick} />}
				<div id="loader" />

				{this.state.processing && (
					<div id="processing">
						<div>{this.state.repoPrefix}</div>
						<div>Processing{this.dots()}</div>
					</div>
				)}
				{this.state.repoError && <div id="repoError">{this.state.repoError}</div>}

				<RepoSelector
					setRepo={this.setRepo}
					repos={this.state.repos}
					createRepo={this.createRepo}
					userInfo={this.props.userInfo}
				/>
				<Search
					goToFSEntryTextAtLine={this.goToFSEntryTextAtLine}
					goToFSEntry={this.goToFSEntry}
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
					addLinks={this.addLinks}
					setLinks={this.setLinks}
					links={this.state.links}
				/>
				<Breadcrumb
					navigationTarget={this.state.navigationTarget}
					commitFilter={this.state.commitFilter}
					setCommitFilter={this.setCommitFilter}
					addLinks={this.addLinks}
					setLinks={this.setLinks}
					links={this.state.links}
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
					activeCommitData={this.state.activeCommitData}
					diffsLoaded={this.state.diffsLoaded}
					fileTree={this.state.fileTree}
					commitData={this.state.commitData}
					frameRequestTime={this.state.frameRequestTime}
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
				/>
			</div>
		);
	}
}

export default withRouter(MainApp);
