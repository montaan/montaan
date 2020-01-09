import React from 'react';
import MainView from './components/MainView';
import CommitControls from './components/CommitControls';
import CommitInfo from './components/CommitInfo';
import Search from './components/Search';
import Breadcrumb from './components/Breadcrumb';

import { getPathEntry, getFullPath, getSiblings } from './lib/filetree';

const apiPrefix = 'http://localhost:8008/_';
const repoPrefix = 'kig/tabletree';

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
            fileTree: {},
            commitLog: '',
            commitChanges: '',
            files: '',
            searchResults: [],
            navigationTarget: ''
        };
        window.setNavigationTarget = this.setNavigationTarget;
        fetch(apiPrefix+'/repo/fs/'+repoPrefix+'/log.txt').then(res => res.text()).then(this.setCommitLog);
        fetch(apiPrefix+'/repo/fs/'+repoPrefix+'/changes.txt').then(res => res.text()).then(this.setCommitChanges);
        fetch(apiPrefix+'/repo/fs/'+repoPrefix+'/files.txt').then(res => res.text()).then(this.setFiles);
    }

    requestFrame = () => window.changed = true;

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
                    return {fsEntry: getPathEntry(window.FileTree, repoPrefix + "/" + filename), line, snippet};
                }
            }).filter(l => l);
            searchResults = this.searchTree(query, window.FileTree, codeSearchResults);
        }
        this.setState({searchResults});
        // if (window.SearchIndex) {
        // 	console.time('token search');
        // 	lunrResults = window.SearchIndex.search(rawQuery);
        // 	lunrResults = lunrResults.map(function(r) {
        // 		const lineNumberMatch = r.ref.match(/:(\d+)\/(\d+)$/);
        // 		const [_, lineStr, lineCountStr] = (lineNumberMatch || ['0','0','0']); 
        // 		const line = parseInt(lineStr);
        // 		const lineCount = parseInt(lineCountStr);
        // 		return {fsEntry: getPathEntry(window.FileTree, r.ref.replace(/^\./, repoPrefix).replace(/:\d+\/\d+$/, '')), line, lineCount};
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

    render() {
        return (
            <div>
                <div id="debug"></div>
                <div id="fullscreen"></div>
                <div id="loader"></div>

                <Search goToFSEntryTextAtLine={window.goToFSEntryTextAtLine} goToFSEntry={window.goToFSEntry} navigationTarget={this.state.navigationTarget} requestFrame={this.requestFrame} searchResults={this.state.searchResults}  setSearchQuery={this.setSearchQuery} searchQuery={this.state.searchQuery} commitFilter={this.state.commitFilter} setCommitFilter={this.setCommitFilter}/>
                <Breadcrumb navigationTarget={this.state.navigationTarget} commitFilter={this.state.commitFilter} setCommitFilter={this.setCommitFilter} />
                <CommitControls navigationTarget={this.state.navigationTarget} searchQuery={this.state.searchQuery} commitFilter={this.state.commitFilter} setCommitFilter={this.setCommitFilter} />
                <CommitInfo navigationTarget={this.state.navigationTarget} searchQuery={this.state.searchQuery} commitFilter={this.state.commitFilter} setCommitFilter={this.setCommitFilter} />

                <MainView navigationTarget={this.state.navigationTarget} searchResults={this.state.searchResults} commitLog={this.state.commitLog} commitChanges={this.state.commitChanges} files={this.state.files} searchQuery={this.state.searchQuery} commitFilter={this.state.commitFilter} />
            </div>
        );
    }
}

export default MainApp;
