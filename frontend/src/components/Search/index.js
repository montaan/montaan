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
        this.state = {
            visibleCount: 0, 
            resultCount: 0, 
            allVisible: false, 
            visible: false,
            hitTypes: {0: true, 1: true, 2: true, 3: true}
        };
    }

    searchOnInput = (ev) => this.props.setSearchQuery(ev.target.value);

    createResultLink(result) {
        const self = this;
        const {fsEntry, line} = result;
        const li = document.createElement('li');
        li.fullPath = result.fullPath;
        li.hitType = result.hitType;
        const title = document.createElement('div');
        title.className = styles.searchTitle;
        title.textContent = fsEntry.title;
        if (line > 0) {
            title.textContent = line + ":";
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
            if (ev.target.className === styles.collapseToggle) return;
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

    getHitTypeName(hitType) {
        switch (hitType) {
            case 0: return "Documentation"; break;
            case 1: return "Definitions"; break;
            case 2: return "Uses"; break;
            case 3: return "Tests"; break;
        }
    }

    onToggleHitType = (ev) => {
        ev.preventDefault();
        const hitType = ev.target.hitType;
        this.toggleHitType(hitType);
    }

    setHitType = (hitType, value) => {
        var hitTypes = {...this.state.hitTypes};
        hitTypes[hitType] = value;
        this.setState({hitTypes});
    }
    toggleHitType = (hitType) => this.setHitType(hitType, !this.state.hitTypes[hitType]);

    onCollapseResult(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        this.parentNode.classList.toggle(styles.collapsed);
        if (ev.shiftKey) {
            const collapsed = this.parentNode.classList.contains(styles.collapsed);
            const lis = this.parentNode.parentNode.childNodes;
            for (var i = 0; i < lis.length; i++) {
                if (lis[i].isTypeControl) continue;
                lis[i].classList.toggle(styles.collapsed, collapsed);
            }
        }
    }

    populateSearchResults(searchResults, allVisible, hitTypes) {
        window.searchResults.innerHTML = '';
        const results = [];
        const resIndex = {0:{}, 1:{}, 2:{}, 3:{}};
        for (var i=0; i<searchResults.length; i++) {
            const r = searchResults[i];
            const fullPath = getFullPath(r.fsEntry);
            r.fullPath = fullPath;
            if (!resIndex[r.hitType][fullPath]) {
                const result = {fsEntry: r.fsEntry, hitType: r.hitType, line: 0, fullPath, lineResults: []};
                resIndex[r.hitType][fullPath] = result;
                results.push(result);
            }
            if (r.line > 0) resIndex[r.hitType][fullPath].lineResults.push(r);
        }
        var hitType = -1;
        for (var i=0; i<results.length; i++) {
            const result = results[i];
            if (result.hitType !== hitType) {
                hitType = result.hitType;
                var div = document.createElement('div');
                div.className = styles.resultType + (hitTypes[hitType] ? '' : styles.collapsed);
                div.textContent = this.getHitTypeName(hitType);
                div.hitType = hitType;
                div.isTypeControl = true;
                div.onmousedown = this.onToggleHitType;
                window.searchResults.appendChild(div);
            }
            const li = this.createResultLink(result);
            li.fileHit = true;
            const collapseDiv = document.createElement('div');
            collapseDiv.className = styles.collapseToggle;
            collapseDiv.onmousedown = this.onCollapseResult;
            li.appendChild(collapseDiv);
            if (result.lineResults) {
                const ul = document.createElement('ul');
                result.lineResults.forEach(r => {
                    r.hitType = result.hitType;
                    ul.appendChild(this.createResultLink(r));
                });
                li.appendChild(ul);
            }
            window.searchResults.appendChild(li);
        }
        this.updateSearchResults(this.props.navigationTarget, allVisible, hitTypes);
    }

    updateSearchResults(navigationPath, allVisible, hitTypes) {
        const lis = [].slice.call(window.searchResults.childNodes);
        var visibleCount = 0;
        for (var i = 0; i < lis.length; i++) {
            const li = lis[i];
            if (li.isTypeControl) {
                li.classList.toggle(styles.collapsed, !hitTypes[li.hitType]);
                continue;
            }
            if (hitTypes[li.hitType] && (allVisible || !navigationPath || li.fullPath.startsWith(navigationPath + '/') || li.fullPath === navigationPath)) {
                li.classList.add(styles['in-view']);
                visibleCount++;
            } else li.classList.remove(styles['in-view']);
        }
        this.setState({resultCount: lis.length, visibleCount});
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (this.props.searchResults !== nextProps.searchResults) {
            this.populateSearchResults(nextProps.searchResults, nextState.allVisible, nextState.hitTypes);
        } else if (
            this.props.navigationTarget !== nextProps.navigationTarget || 
            this.state.allVisible !== nextState.allVisible ||
            this.state.hitTypes !== nextState.hitTypes
        ) {
            this.updateSearchResults(nextProps.navigationTarget, nextState.allVisible, nextState.hitTypes);
        }
        if (this.props.searchQuery !== nextProps.searchQuery) this.setState({visible: !!nextProps.searchQuery});
        return true;
    }

    toggleAllVisible = () => this.setState({allVisible: !this.state.allVisible});
    hideResults = () => this.setState({visible: false});

    render() {
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
