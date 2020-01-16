import React from 'react';
import './style.css';

import { getPathEntry, getFullPath, getSiblings } from '../../lib/filetree';

export default class CommitControls extends React.Component {
    constructor(props) {
        super(props);

    }

    searchOnInput = (ev) => this.props.setSearchQuery(ev.target.value);

    createResultLink(result) {
        const self = this;
        const {fsEntry, line} = result;
        const li = document.createElement('li');
        li.fullPath = result.fullPath;
        const title = document.createElement('div');
        title.className = 'searchTitle';
        title.textContent = fsEntry.title;
        if (line > 0) {
            title.textContent += ":" + line;
        }
        const fullPath = document.createElement('div');
        fullPath.className = 'searchFullPath';
        fullPath.textContent = li.fullPath.replace(/^\/[^\/]*\/[^\/]*\//, '/');
        li.result = result;
        li.addEventListener('mouseover', function(ev) {
            this.classList.add('hover');
            self.props.requestFrame();
        }, false);
        li.addEventListener('mouseout', function(ev) {
            this.classList.remove('hover');
            self.props.requestFrame();
        }, false);
        li.onclick = function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            if (this.result.line > 0) {
                self.props.goToFSEntryTextAtLine(this.result.fsEntry, this.result.line);
            } else {
                self.props.goToFSEntry(this.result.fsEntry);
            }
        };
        li.appendChild(title);
        li.appendChild(fullPath);
        if (result.snippet){
            var snippet = document.createElement('div');
            snippet.className = 'searchSnippet prettyPrint';
            snippet.textContent = result.snippet;
            li.appendChild(snippet);
        }
        return li;
    }

    populateSearchResults(searchResults) {
        window.searchResults.innerHTML = '';
        const results = [];
        const resIndex = {};
        for (var i=0; i<searchResults.length; i++) {
            const r = searchResults[i];
            const fullPath = getFullPath(r.fsEntry);
            r.fullPath = fullPath;
            if (!resIndex[fullPath]) {
                const result = {fsEntry: r.fsEntry, line: 0, fullPath, lineResults: []};
                resIndex[fullPath] = result;
                results.push(result);
            }
            if (r.line > 0) resIndex[fullPath].lineResults.push(r);
        }
        results.forEach(r => r.lineResults.sort((a,b) => a.line - b.line));
        for (var i=0; i<results.length; i++) {
            const result = results[i];
            const li = this.createResultLink(result);
            if (result.lineResults) {
                const ul = document.createElement('ul');
                result.lineResults.forEach(r => ul.appendChild(this.createResultLink(r)));
                li.appendChild(ul);
            }
            window.searchResults.appendChild(li);
        }
        this.updateSearchResults(this.props.navigationTarget);
    }

    updateSearchResults(navigationPath) {
        const lis = [].slice.call(window.searchResults.querySelectorAll('li'));
        for (var i = 0; i < lis.length; i++) {
            const li = lis[i];
            if (!navigationPath || li.fullPath.startsWith(navigationPath + '/') || li.fullPath === navigationPath) li.classList.add('in-view');
            else li.classList.remove('in-view');
        }
    }

    shouldComponentUpdate(nextProps) {
        if (this.props.navigationTarget !== nextProps.navigationTarget) this.updateSearchResults(nextProps.navigationTarget);
        if (this.props.searchResults !== nextProps.searchResults) this.populateSearchResults(nextProps.searchResults);
        return true;
    }

    render() {
        return (
            <>
                <input id="searchInput" autoCorrect="off" autoCapitalize="off" placeholder="Search files" value={this.props.searchQuery} onChange={this.searchOnInput}/>
                <button id="searchButton" onClick={this.searchOnInput}>Search</button>
                <ul id="searchResults" onScroll={this.props.updateSearchLines}></ul>
            </>
        );
    }
}
