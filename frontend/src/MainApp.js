import React from 'react';
import MainView from './components/MainView';
import CommitControls from './components/CommitControls';
import CommitInfo from './components/CommitInfo';
import Search from './components/Search';
import Breadcrumb from './components/Breadcrumb';
import utils from './lib/utils';

import { parseCommits } from './lib/parse_commits';
import { span, formatDiff, authorCmp, createCalendar } from './lib/parse_diff';
import { getPathEntry, getFullPath, getSiblings } from './lib/filetree';

const fullscreenSupported = (document.exitFullscreen||document.webkitExitFullscreen||document.webkitExitFullScreen||document.mozCancelFullScreen||document.msExitFullscreen) && !window.navigator.standalone;

var searchResultsTimeout;
var searchQueryNumber = 0;

class MainApp extends React.Component {
    
    emptyState = {
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
        diffsLoaded: 0,
        fileContents: null,
        links: []
    };

    constructor(props) {
        super(props);
        this.state = {...this.emptyState};
        window.setNavigationTarget = this.setNavigationTarget;
        this.setRepo(props.repoPrefix);
    }

    parseFiles(text) { return utils.parseFileList(text, {}, undefined, this.props.repoPrefix+'/'); }

    async setRepo(repoPrefix) {
        console.time('load files');
        const files = await (await fetch(this.props.apiPrefix+'/repo/fs/'+repoPrefix+'/files.txt')).text();
        console.timeEnd('load files');
        console.time('parse files');
        const fileTree = this.parseFiles(files);
        console.timeEnd('parse files');
        this.setState({...this.emptyState, fileTree});
        console.time('load commitObj');
        const commitObj = await (await fetch(this.props.apiPrefix+'/repo/fs/'+repoPrefix+'/log.json')).json();
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

    setNavigationTarget = navigationTarget => this.setState({navigationTarget});

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
        var content = await (await fetch(this.props.apiPrefix + "/repo/checkout", {
            method: 'POST', body: JSON.stringify({repo: this.props.repoPrefix, hash, path})})).text();
        this.setState({fileContents: {path, content, hash}});
    };

    loadFileDiff = async (hash, previousHash, path) => {
        path = path.replace(/^\//, '');
        const contentF = (await fetch(this.props.apiPrefix + "/repo/checkout", {
            method: 'POST', body: JSON.stringify({repo: this.props.repoPrefix, hash, path})})).text();
        const originalF = (await fetch(this.props.apiPrefix + "/repo/checkout", {
            method: 'POST', body: JSON.stringify({repo: this.props.repoPrefix, hash: previousHash, path})})).text();
        const content = await contentF;
        const original = await originalF;
        this.setState({fileContents: {path, original, content, hash}});
    };

    closeFile = () => this.setState({fileContents: null});

    loadDiff = async (commit) => {
        const diff = await (await fetch(this.props.apiPrefix + "/repo/diff", {
            method: 'POST', body: JSON.stringify({repo: this.props.repoPrefix, hash: commit.sha})})).text();
        commit.diff = diff;
        this.setState({diffsLoaded: ++this.state.diffsLoaded % 1048576});
    };

    requestFrame = () => this.setState({frameRequestTime: ++this.state.frameRequestTime % 1048576});

    filterCommits(commitFilter) {
		var path = (commitFilter.path || '').substring(this.props.repoPrefix.length + 2);
        var author = commitFilter.author;

        if (path.length === 0 && !author) return this.state.commitData.commits;

        const commits = [];
        const allCommits = this.state.commitData.commits;
        const il = allCommits.length;
        for (var i = 0; i < il; ++i) {
            const c = allCommits[i];
            const files = c.files;
            const jl = files.length;
            var pathHit = !path;
            for (var j = 0; !pathHit && j < jl; ++j) {
                const f = files[j];
                if (f.renamed && f.renamed.startsWith(path)) {
                    if (f.renamed === path) path = f.path;
                    pathHit = true;
                    break;
                }
                pathHit = (f.path.startsWith(path));
            }
            const authorHit = !author || authorCmp(author, c.author) === 0;
            if (pathHit && authorHit) commits.push(c);
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
            var res = await fetch(this.props.apiPrefix+'/repo/search', {method: "POST", body: JSON.stringify({repo:this.props.repoPrefix, query:rawQuery})});
            var lines = (await res.text()).split("\n");
            if (searchQueryNumber !== myNumber) return;
            const codeSearchResults = lines.map(line => {
                const lineNumberMatch = line.match(/^([^:]+):(\d+):(.*)$/);
                if (lineNumberMatch) {
                    const [_, filename, lineStr, snippet] = lineNumberMatch;
                    const line = parseInt(lineStr);
                    return {fsEntry: getPathEntry(this.state.fileTree.tree, this.props.repoPrefix + "/" + filename), line, snippet};
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
        // 		return {fsEntry: getPathEntry(this.state.fileTree.tree, r.ref.replace(/^\./, this.props.repoPrefix).replace(/:\d+\/\d+$/, '')), line, lineCount};
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
		path = path.substring(this.props.repoPrefix.length + 2);
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

    render() {
        return (
            <div id="mainApp">
                <div id="debug" />
                {fullscreenSupported && <div id="fullscreen" onClick={this.fullscreenOnClick} />}
                <div id="loader" />

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
                    repoPrefix={this.props.repoPrefix}
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
                    repoPrefix={this.props.repoPrefix}
                    navigationTarget={this.state.navigationTarget}
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

export default MainApp;
