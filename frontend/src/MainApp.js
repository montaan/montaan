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

const apiPrefix = 'http://localhost:8008/_';
const repoPrefix = 'kig/tabletree';

const fullscreenSupported = (document.exitFullscreen||document.webkitExitFullscreen||document.webkitExitFullScreen||document.mozCancelFullScreen||document.msExitFullscreen) && !window.navigator.standalone;

var searchResultsTimeout;
var searchQueryNumber = 0;

class MainApp extends React.Component {
    
    constructor() {
        super()
        this.state = {
            commitFilter: {},
            searchQuery: '',
            commits: [],
            activeCommits: [],
            fileTree: {name: '', entries: {}},
            commitLog: '',
            commitChanges: '',
            files: '',
            searchResults: [],
            navigationTarget: '',
            frameRequestTime: 0
        };
        window.setNavigationTarget = this.setNavigationTarget;
        fetch(apiPrefix+'/repo/fs/'+repoPrefix+'/log.txt').then(res => res.text()).then(this.setCommitLog);
        fetch(apiPrefix+'/repo/fs/'+repoPrefix+'/changes.txt').then(res => res.text()).then(this.setCommitChanges);
        fetch(apiPrefix+'/repo/fs/'+repoPrefix+'/files.txt').then(res => res.text()).then(this.setFiles);
    }

    requestFrame = () => this.setState({frameRequestTime: this.state.frameRequestTime++ % 1048576});

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
            var res = await fetch(apiPrefix+'/repo/search', {method: "POST", body: JSON.stringify({repo:repoPrefix, query:rawQuery})});
            var lines = (await res.text()).split("\n");
            if (searchQueryNumber !== myNumber) return;
            const codeSearchResults = lines.map(line => {
                const lineNumberMatch = line.match(/^([^:]+):(\d+):(.*)$/);
                if (lineNumberMatch) {
                    const [_, filename, lineStr, snippet] = lineNumberMatch;
                    const line = parseInt(lineStr);
                    return {fsEntry: getPathEntry(this.state.fileTree, repoPrefix + "/" + filename), line, snippet};
                }
            }).filter(l => l);
            searchResults = this.searchTree(query, this.state.fileTree, codeSearchResults);
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
        // 		return {fsEntry: getPathEntry(this.state.fileTree, r.ref.replace(/^\./, repoPrefix).replace(/:\d+\/\d+$/, '')), line, lineCount};
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

    updateActiveCommitSetDiffs() {
        const el = document.getElementById('commitList');
        while (el.firstChild) el.removeChild(el.firstChild);
        el.dataset.count = window.activeCommitSet.length;

        el.appendChild(createCalendar(window.activeCommitSet.map(c => c.date)));

        const trackedPaths = [this.state.navigationTarget];
        const trackedIndex = {};
        trackedIndex[this.state.navigationTarget] = true;

        window.activeCommitSet.forEach(c => {
            var div = document.createElement('div');
            var hashSpan = span('commit-hash', c.sha);
            var dateSpan = span('commit-date', c.date.toString());
            var authorSpan = span('commit-author', `${c.author.name} <${c.author.email}>`);
            var messageSpan = span('commit-message', c.message);
            var diffSpan = span('commit-diff', '');
            if (c.diff && !c.diffEl) c.diffEl = formatDiff(c.diff, trackedPaths, trackedIndex);
            if (c.diffEl) diffSpan.appendChild(c.diffEl);
            var toggle = span('commit-toggle', 'Full info');
            var toggleDiffs = span('commit-toggle-diffs', 'All changes');
            toggle.onmousedown = function(ev) { ev.preventDefault(); div.classList.toggle('expanded'); };
            toggleDiffs.onmousedown = function(ev) { ev.preventDefault(); div.classList.toggle('expanded-diffs'); };
            div.append(toggle, hashSpan, dateSpan, authorSpan, messageSpan, toggleDiffs, diffSpan);
            el.appendChild(div);
        });
    }

    updateActiveCommitSetAuthors(authors, authorCommitCounts) {
        var el = document.getElementById('authorList');
        while (el.firstChild) el.removeChild(el.firstChild);
        el.dataset.count = authors.length;
        var originalCommitSet = window.activeCommitSet;
        var filteredByAuthor = false;
        authors.forEach(({name, email}) => {
            var div = document.createElement('div');
            var key = name + ' <' + email + '>';
            div.dataset.commitCount = authorCommitCounts[key];
            var nameSpan = span('author-name', name);
            var emailSpan = span('author-email', email);
            div.append(nameSpan, emailSpan);
            div.onmousedown = function(ev) {
                ev.preventDefault();
                if (filteredByAuthor === this) {
                    window.activeCommitSet = originalCommitSet;
                    filteredByAuthor = false;
                } else {
                    window.activeCommitSet = originalCommitSet.filter(c => (c.author.name + ' <' + c.author.email + '>') === key);
                    filteredByAuthor = this;
                }
                this.updateActiveCommitSetDiffs();
            };
            el.appendChild(div);
        });
    }

    showFileCommitsClick = (ev) => {
        var fsEntry = getPathEntry(window.FileTree, this.state.navigationTarget);
        if (fsEntry) {
            window.activeCommitSet = this.findCommitsForPath(this.state.navigationTarget);
            const authorList = window.activeCommitSet.map(c => c.author);
            const authorCommitCounts = {};
            authorList.forEach(author => {
                const key = author.name + ' <' + author.email + '>';
                if (!authorCommitCounts[key]) authorCommitCounts[key] = 0;
                authorCommitCounts[key]++;
            });
            const authors = utils.uniq(authorList, this.authorCmp);
            this.updateActiveCommitSetAuthors(authors, authorCommitCounts);
            this.updateActiveCommitSetDiffs();
            Promise.all(window.activeCommitSet.map(async c => {
                if (!c.diff) {
                    const diff = await (await fetch(apiPrefix + '/repo/diff', {method: 'POST', body: JSON.stringify({repo: repoPrefix, hash: c.sha})})).text();
                    c.diff = diff;
                }
            })).then(this.updateActiveCommitSetDiffs);
            this.showCommitsForFile(fsEntry);
            this.requestFrame();
        } else {
            window.activeCommitSet = [];
            this.updateActiveCommitSetAuthors([]);
            this.updateActiveCommitSetDiffs();
        }
    };

    setCommitFilter = commitFilter => this.setState({commitFilter});
    setSearchQuery = searchQuery => {
        this.setState({searchQuery});
        this.searchString(searchQuery);
    };
    setActiveCommits = activeCommits => this.setState({activeCommits});
    setCommits = commits => this.setState({commits, activeCommits: commits});
    setFileTree = fileTree => this.setState({fileTree});
    setCommitLog = commitLog => this.setState({commitLog});
    setCommitChanges = commitChanges => this.setState({commitChanges});
    setFiles = files => this.setState({files});
    setNavigationTarget = navigationTarget => this.setState({navigationTarget});

    parseCommits(commitLog, commitChanges, files) {
        const {
            authorTree, commitTree, commits, commitIndex, authors, commitsFSEntry, lineGeo, touchedFiles
        } = parseCommits(commitLog, commitChanges, files);

    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextState.commitLog && nextState.commitChanges && nextState.files &&
            !(this.state.commitLog && this.state.commitChanges && this.state.files)) {
            //this.parseCommits(nextState.commitLog, nextState.commitChanges, nextState.files);
        }
        return true;
    }

    fullscreenOnClick(ev) {
        var d = document;
        if (d.fullscreenElement||d.webkitFullscreenElement||d.webkitFullScreenElement||d.mozFullScreenElement||d.msFullscreenElement) {
            (d.exitFullscreen||d.webkitExitFullscreen||d.webkitExitFullScreen||d.mozCancelFullScreen||d.msExitFullscreen).call(d);
        } else {
            var e = document.body;
            (e.requestFullscreen||e.webkitRequestFullscreen||e.webkitRequestFullScreen||e.mozRequestFullScreen||e.msRequestFullscreen).call(e);
        }
    }

    render() {
        return (
            <div>
                <div id="debug" />
                {fullscreenSupported && <div id="fullscreen" onClick={this.fullscreenOnClick} />}
                <div id="loader" />

                <Search goToFSEntryTextAtLine={window.goToFSEntryTextAtLine} goToFSEntry={window.goToFSEntry} navigationTarget={this.state.navigationTarget} requestFrame={this.requestFrame} searchResults={this.state.searchResults}  setSearchQuery={this.setSearchQuery} searchQuery={this.state.searchQuery} commitFilter={this.state.commitFilter} setCommitFilter={this.setCommitFilter}/>
                <Breadcrumb navigationTarget={this.state.navigationTarget} commitFilter={this.state.commitFilter} setCommitFilter={this.setCommitFilter} />
                <CommitControls navigationTarget={this.state.navigationTarget} searchQuery={this.state.searchQuery} commitFilter={this.state.commitFilter} setCommitFilter={this.setCommitFilter} />
                <CommitInfo activeCommits={window.activeCommitSet} navigationTarget={this.state.navigationTarget} searchQuery={this.state.searchQuery} commitFilter={this.state.commitFilter} setCommitFilter={this.setCommitFilter} />

                <MainView frameRequestTime={this.state.frameRequestTime} apiPrefix={apiPrefix} repoPrefix={repoPrefix} navigationTarget={this.state.navigationTarget} searchResults={this.state.searchResults} commitLog={this.state.commitLog} commitChanges={this.state.commitChanges} files={this.state.files} searchQuery={this.state.searchQuery} commitFilter={this.state.commitFilter} />
            </div>
        );
    }
}

export default MainApp;
