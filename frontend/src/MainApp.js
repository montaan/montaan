import React from 'react';
import { withRouter } from "react-router-dom";

import MainView from './components/MainView';
import CommitControls from './components/CommitControls';
import CommitInfo from './components/CommitInfo';
import Search from './components/Search';
import Breadcrumb from './components/Breadcrumb';
import RepoSelector from './components/RepoSelector';

import utils from './lib/utils';
import { parseCommits } from './lib/parse_commits';
import { span, formatDiff, authorCmp, createCalendar } from './lib/parse_diff';
import { getPathEntry, getFullPath, getSiblings } from './lib/filetree';

const fullscreenSupported = (document.exitFullscreen||document.webkitExitFullscreen||document.webkitExitFullScreen||document.mozCancelFullScreen||document.msExitFullscreen) && !window.navigator.standalone;

var searchResultsTimeout;
var searchQueryNumber = 0;

class MainApp extends React.Component {
    
    emptyState = {
        repoPrefix: '',
        commitFilter: {},
        searchQuery: '',
        commits: [],
        activeCommits: [],
        fileTree: {title: '', entries: {}},
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
        links: []
    };

    constructor(props) {
        super(props);
        this.state = {...this.emptyState, repos: []};
        window.setNavigationTarget = this.setNavigationTarget;
        if (props.userInfo) this.updateUserRepos(props.userInfo);
        if (props.match && props.match.params.user) {
            this.state.repoPrefix = props.match.params.user + '/' + props.match.params.name;
            this.setRepo(props.match.params.name, props.match.params.user);
        }
    }

    parseFiles(text, repoPrefix) { return utils.parseFileList(text, {}, undefined, repoPrefix+'/'); }

    async setRepo(repoPath, userName=this.props.userInfo.name) {
        const repoPrefix = userName + '/' + repoPath;
        console.time('load files');
        const files = await this.props.api.get('/repo/fs/'+repoPrefix+'/files.txt');
        console.timeEnd('load files');
        console.time('parse files');
        const fileTree = this.parseFiles(files, repoPrefix);
        console.timeEnd('parse files');
        this.setState({...this.emptyState, repoPrefix, fileTree});
        console.time('load commitObj');
        const commitObj = await this.props.api.getType('/repo/fs/'+repoPrefix+'/log.json', 'json');
        console.timeEnd('load commitObj');
        console.time('parse commitObj');
        const commitData = parseCommits(commitObj, fileTree.tree, repoPrefix);
        console.timeEnd('parse commitObj');
        this.setState({commitData, activeCommits: commitData.commits});
    }
    
    setCommitFilter = commitFilter => {
        this.setState({commitFilter});
        this.setActiveCommits(this.filterCommits(commitFilter));
    };

    setSearchQuery = searchQuery => {
        this.setState({searchQuery});
        this.searchString(searchQuery);
    };

    setNavigationTarget = navigationTarget => {
        if (this.state.navigationTarget !== navigationTarget) this.setState({navigationTarget});
    };

    setActiveCommits = activeCommits => {
        const authorList = activeCommits.map(c => c.author);
        const authorCommitCounts = {};
        authorList.forEach(key => {
            if (!authorCommitCounts[key]) authorCommitCounts[key] = 0;
            authorCommitCounts[key]++;
        });
        const authors = utils.uniq(authorList, authorCmp);
        const files = [];
        this.setState({activeCommitData: {commits: activeCommits, authors, authorCommitCounts, files}});
    };

    loadFile = async (hash, path) => {
        path = path.replace(/^\//, '');
        var content = await this.props.api.post("/repo/checkout", {repo: this.state.repoPrefix, hash, path});
        this.setState({fileContents: {path, content, hash}});
    };

    loadFileDiff = async (hash, previousHash, path) => {
        path = path.replace(/^\//, '');
        const contentF = await this.props.api.post("/repo/checkout", {repo: this.state.repoPrefix, hash, path});
        const originalF = await this.props.api.post("/repo/checkout", {repo: this.state.repoPrefix, hash: previousHash, path});
        const content = await contentF;
        const original = await originalF;
        this.setState({fileContents: {path, original, content, hash}});
    };

    closeFile = () => this.setState({fileContents: null});

    loadDiff = async (commit) => {
        const diff = await this.props.api.post("/repo/diff", {repo: this.state.repoPrefix, hash: commit.sha});
        commit.diff = diff;
        this.setState({diffsLoaded: ++this.state.diffsLoaded % 1048576});
    };

    requestFrame = () => this.setState({frameRequestTime: ++this.state.frameRequestTime % 1048576});

    updateSearchLines = () => {
        this.setState({searchLinesRequest: ++this.state.searchLinesRequest % 1048576});
    }

    filterCommits(commitFilter) {
		var path = (commitFilter.path || '').substring(this.state.repoPrefix.length + 2);
        var author = commitFilter.author;
        var authorSearch = commitFilter.authorSearch;
        var search = commitFilter.search;

        if (authorSearch) authorSearch = authorSearch.toLowerCase();

        if (path.length === 0 && !author && !search && !authorSearch) return this.state.commitData.commits;

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
                pathHit = pathHit || (f.path.startsWith(path));
                searchHit = searchHit || f.path.includes(search) || (f.renamed && f.renamed.includes(search));
            }
            const authorHit = !author || authorCmp(author, c.author) === 0;
            const authorSearchHit = !authorSearch || c.author.toLowerCase().includes(authorSearch);
            if (pathHit && authorHit && searchHit && authorSearchHit) commits.push(c);
        }
        return commits;
    }

    searchTree(query, fileTree, results) {
        if (query.every(function(re) { return re.test(fileTree.title); })) {
            results.push({fsEntry: fileTree, line: 0});
            // this.console.log(fileTree);
        }
        for (var i in fileTree.entries) {
            this.searchTree(query, fileTree.entries[i], results);
        }
        return results;
    }

    async search(query, rawQuery) {
        clearTimeout(searchResultsTimeout);
        var searchResults = [];
        if (rawQuery.length > 2) {
            var myNumber = ++searchQueryNumber;
            var text = await this.props.api.post('/repo/search', {repo:this.state.repoPrefix, query:rawQuery});
            var lines = text.split("\n");
            if (searchQueryNumber !== myNumber) return;
            const codeSearchResults = lines.map(line => {
                const lineNumberMatch = line.match(/^([^:]+):(\d+):(.*)$/);
                if (lineNumberMatch) {
                    const [_, filename, lineStr, snippet] = lineNumberMatch;
                    const line = parseInt(lineStr);
                    return {fsEntry: getPathEntry(this.state.fileTree.tree, this.state.repoPrefix + "/" + filename), line, snippet};
                }
            }).filter(l => l);
            searchResults = this.searchTree(query, this.state.fileTree.tree, codeSearchResults);
        }
        this.setState({searchResults});
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
            this.setState({searchResults: []});
        } else {
            var segs = searchQuery.split(/\s+/);
            var re = [];
            try { re = segs.map(function(r) { return new RegExp(r, "i"); }); } catch(e) {}
            this.search(re, searchQuery);
        }
    }

	findCommitsForPath(path) {
		path = path.substring(this.state.repoPrefix.length + 2);
		return this.state.commitData.commits.filter(c => c.files.some(f => {
			if (f.renamed && f.renamed.startsWith(path)) {
				if (f.renamed === path) path = f.path;
				return true;
			}
			if (f.path.startsWith(path)) return true;
		}));
	}

    showFileCommitsClick = (ev) => {
        this.setCommitFilter({path: this.state.navigationTarget});
        this.requestFrame();
    };

    fullscreenOnClick(ev) {
        var d = document;
        if (d.fullscreenElement||d.webkitFullscreenElement||d.webkitFullScreenElement||d.mozFullScreenElement||d.msFullscreenElement) {
            (d.exitFullscreen||d.webkitExitFullscreen||d.webkitExitFullScreen||d.mozCancelFullScreen||d.msExitFullscreen).call(d);
        } else {
            var e = document.body;
            (e.requestFullscreen||e.webkitRequestFullscreen||e.webkitRequestFullScreen||e.mozRequestFullScreen||e.msRequestFullscreen).call(e);
        }
    }

    goToFSEntryTextAtLine = (fsEntry, line) => this.setState({goToTarget: {fsEntry, line}});
    goToFSEntry = (fsEntry) => this.setState({goToTarget: {fsEntry}});

    setLinks = (links) => this.setState({links});
    addLinks = (links) => this.setLinks(this.state.links.concat(links));

    async updateUserRepos(userInfo) {
        if (!userInfo) return this.setState({repos: []});
        const repos = await this.props.api.post('/repo/list');
        this.setState({repos});
        if (this.state.repoPrefix === '' && repos.length > 0) {
            this.setRepo(repos[0].name, userInfo.name);
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps.userInfo !== this.props.userInfo) this.updateUserRepos(nextProps.userInfo);
        return true;
    }

    createRepo = async (name, url) => {
        const res = await this.props.api.post('/repo/create', {name, url});
        this.updateUserRepos(this.props.userInfo);
    }

    render() {
        return (
            <div id="mainApp">
                <div id="debug" />
                {fullscreenSupported && <div id="fullscreen" onClick={this.fullscreenOnClick} />}
                <div id="loader" />

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
                    showFileCommitsClick={this.showFileCommitsClick}
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
