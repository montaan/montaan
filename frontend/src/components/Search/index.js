import React from 'react';
import Button from "react-bootstrap/Button";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons'

import { getPathEntry, getFullPath, getSiblings } from '../../lib/filetree';

import strict from '../../lib/strictProxy.js'
import styles_ from './css/style.module.scss';
const styles = strict(styles_, 'components/Search/css/style.module.scss');

export default class CommitControls extends React.Component {
    constructor(props) {
        super(props);
        this.state = {visibleCount: 0, resultCount: 0, allVisible: false, visible: false};
    }

    searchOnInput = (ev) => this.props.setSearchQuery(ev.target.value);

    createResultLink(result) {
        const self = this;
        const {fsEntry, line} = result;
        const li = document.createElement('li');
        li.fullPath = result.fullPath;
        const title = document.createElement('div');
        title.className = styles.searchTitle;
        title.textContent = fsEntry.title;
        if (line > 0) {
            title.textContent += ":" + line;
        }
        const fullPath = document.createElement('div');
        fullPath.className = styles.searchFullPath;
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
            snippet.className = styles.searchSnippet;
            snippet.textContent = result.snippet;
            li.appendChild(snippet);
        }
        return li;
    }

    populateSearchResults(searchResults, allVisible) {
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
            li.fileHit = true;
            if (result.lineResults) {
                const ul = document.createElement('ul');
                result.lineResults.forEach(r => ul.appendChild(this.createResultLink(r)));
                li.appendChild(ul);
            }
            window.searchResults.appendChild(li);
        }
        this.updateSearchResults(this.props.navigationTarget, allVisible);
    }

    updateSearchResults(navigationPath, allVisible) {
        const lis = [].slice.call(window.searchResults.childNodes);
        var visibleCount = 0;
        for (var i = 0; i < lis.length; i++) {
            const li = lis[i];
            if (allVisible || !navigationPath || li.fullPath.startsWith(navigationPath + '/') || li.fullPath === navigationPath) {
                li.classList.add(styles['in-view']);
                visibleCount++;
            } else li.classList.remove(styles['in-view']);
        }
        this.setState({resultCount: lis.length, visibleCount});
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (this.props.searchResults !== nextProps.searchResults) {
            this.populateSearchResults(nextProps.searchResults, nextState.allVisible);
        } else if (
            this.props.navigationTarget !== nextProps.navigationTarget || 
            this.state.allVisible !== nextState.allVisible
        ) {
            this.updateSearchResults(nextProps.navigationTarget, nextState.allVisible);
        }
        if (this.props.searchQuery !== nextProps.searchQuery) this.setState({visible: !!nextProps.searchQuery});
        return true;
    }

    toggleAllVisible = () => this.setState({allVisible: !this.state.allVisible});
    hideResults = () => this.setState({visible: false});

    render() {
        console.log(this.props.searchResults);
        return (
            <>
                <input className={styles.searchInput} autoCorrect="off" autoCapitalize="off" placeholder="Search files" value={this.props.searchQuery} onChange={this.searchOnInput}/>
                <div className={styles.searchResults + (this.state.visible ? ' '+styles.visible : '')}>
                    <div className="close" onClick={this.hideResults}><FontAwesomeIcon icon={faTimes} /></div>
                    <div className={styles.searchInfo}>
                        <h3>{this.state.resultCount} hits, {this.state.visibleCount} in view</h3>
                        <Button onClick={this.toggleAllVisible}>
                            {this.state.allVisible ? "Crop to view" : "Show all"}
                        </Button>
                    </div>
                    <ul id="searchResults" onScroll={this.props.updateSearchLines}></ul>
                </div>
            </>
        );
    }
}
