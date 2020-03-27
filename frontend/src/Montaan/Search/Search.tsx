import React from 'react';
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import styles from './Search.module.scss';
import { FSEntry } from '../lib/filesystem';
import { SearchResult } from '../MainApp';

export interface SearchProps extends RouteComponentProps {
	setSearchQuery: (repo: string, query: string) => void;
	setSearchHover: (li: any, url: string) => void;
	clearSearchHover: (li: any) => void;
	repoPrefix: string;
	navigationTarget: string;
	searchQuery: string;
	searchResults: SearchResult[];
	updateSearchLines: () => void;
}

type HitTypes = { [index: number]: boolean };

interface SearchState {
	visibleCount: number;
	resultCount: number;
	allVisible: boolean;
	visible: boolean;
	hitTypes: HitTypes;
}

function onCollapseResult(
	this: any,
	ev: {
		preventDefault: () => void;
		stopPropagation: () => void;
		shiftKey: any;
	}
) {
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

class Search extends React.Component<SearchProps, SearchState> {
	constructor(props: SearchProps) {
		super(props);
		this.state = {
			visibleCount: 0,
			resultCount: 0,
			allVisible: false,
			visible: false,
			hitTypes: { 0: true, 1: true, 2: true, 3: true },
		};
	}

	searchOnInput = (ev: { target: { value: any } }) =>
		this.props.setSearchQuery(this.props.repoPrefix, ev.target.value);

	createResultLink(result: {
		line: number;
		filename: string;
		hitType: number;
		snippet?: string;
	}) {
		const self = this;
		const { line } = result;
		const li = document.createElement('li') as any;
		li.filename = result.filename;
		li.hitType = result.hitType;
		li.resultURL = result.filename + (line > 0 ? `#${line}` : '');

		const title = document.createElement('div');
		title.className = styles.searchTitle;
		title.textContent = fsEntry.title;
		if (line > 0) {
			title.textContent = line + ':';
		}
		const fullPath = document.createElement('div');
		fullPath.className = styles.searchFullPath;
		fullPath.textContent = li.filename.replace(/^\/[^/]*\/[^/]*\//, '/');
		li.result = result;
		li.onmouseover = function(ev: any) {
			if (ev.target.parentNode === this) self.props.setSearchHover(this, this.resultURL);
		};
		li.onmouseout = function(ev: any) {
			if (ev.target === this) self.props.clearSearchHover(this);
		};
		li.onclick = function(ev: any) {
			if (ev.target.className === styles.collapseToggle) return;
			ev.preventDefault();
			ev.stopPropagation();
			self.props.history.push(this.resultURL);
		};
		li.appendChild(title);
		li.appendChild(fullPath);
		if (result.snippet) {
			var snippet = document.createElement('div');
			snippet.className = styles.searchSnippet;
			snippet.textContent = result.snippet;
			li.appendChild(snippet);
		}
		return li;
	}

	getHitTypeName(hitType: number) {
		switch (hitType) {
			case 0:
				return 'Documentation';
			case 1:
				return 'Definitions';
			case 2:
				return 'Uses';
			case 3:
				return 'Tests';
			default:
				throw Error('Unknown hit type ' + hitType);
		}
	}

	onToggleHitType = (ev: { preventDefault: () => void; target: { hitType: any } }) => {
		ev.preventDefault();
		const hitType = ev.target.hitType;
		this.toggleHitType(hitType);
	};

	setHitType = (hitType: number, value: boolean) => {
		var hitTypes = { ...this.state.hitTypes };
		hitTypes[hitType] = value;
		this.setState({ hitTypes });
	};
	toggleHitType = (hitType: number) => this.setHitType(hitType, !this.state.hitTypes[hitType]);

	populateSearchResults(searchResults: SearchResult[], allVisible: boolean, hitTypes: HitTypes) {
		const searchResultsEl = document.getElementById('searchResults');
		if (!searchResultsEl) return;
		searchResultsEl.innerHTML = '';
		const results = [];
		const resIndex: { [hitType: number]: { [filename: string]: any } } = {
			0: {},
			1: {},
			2: {},
			3: {},
		};
		for (let i = 0; i < searchResults.length; i++) {
			const r = searchResults[i];
			if (!resIndex[r.hitType][r.filename]) {
				const result = {
					hitType: r.hitType,
					line: 0,
					filename: r.filename,
					lineResults: [] as any[],
				};
				resIndex[r.hitType][r.filename] = result;
				results.push(result);
			}
			if (r.line > 0) resIndex[r.hitType][r.filename].lineResults.push(r);
		}
		var hitType = -1;
		for (let i = 0; i < results.length; i++) {
			const result = results[i];
			if (result.hitType !== hitType) {
				hitType = result.hitType;
				var div = document.createElement('div') as any;
				div.className = styles.resultType + (hitTypes[hitType] ? '' : styles.collapsed);
				div.textContent = this.getHitTypeName(hitType);
				div.hitType = hitType;
				div.isTypeControl = true;
				div.onmousedown = this.onToggleHitType;
				searchResultsEl.appendChild(div);
			}
			const li = this.createResultLink(result);
			li.fileHit = true;
			const collapseDiv = document.createElement('div');
			collapseDiv.className = styles.collapseToggle;
			collapseDiv.onmousedown = onCollapseResult;
			li.appendChild(collapseDiv);
			if (result.lineResults) {
				const ul = document.createElement('ul');
				result.lineResults.forEach((r) => {
					r.hitType = result.hitType;
					ul.appendChild(this.createResultLink(r));
				});
				li.appendChild(ul);
			}
			searchResultsEl.appendChild(li);
		}
		this.updateSearchResults(this.props.navigationTarget, allVisible, hitTypes);
	}

	updateSearchResults(navigationPath: string, allVisible: any, hitTypes: HitTypes) {
		const searchResultsEl = document.getElementById('searchResults');
		if (!searchResultsEl) return;
		const lis = [].slice.call(searchResultsEl.childNodes);
		var visibleCount = 0;
		for (var i = 0; i < lis.length; i++) {
			const li = lis[i] as any;
			if (li.isTypeControl) {
				li.classList.toggle(styles.collapsed, !hitTypes[li.hitType]);
				continue;
			}
			if (
				hitTypes[li.hitType] &&
				(allVisible ||
					!navigationPath ||
					li.filename.startsWith(navigationPath + '/') ||
					li.filename === navigationPath)
			) {
				li.classList.add(styles['in-view']);
				visibleCount++;
			} else li.classList.remove(styles['in-view']);
		}
		this.setState({ resultCount: lis.length, visibleCount });
	}

	shouldComponentUpdate(nextProps: SearchProps, nextState: SearchState) {
		if (this.props.searchResults !== nextProps.searchResults) {
			this.populateSearchResults(
				nextProps.searchResults,
				nextState.allVisible,
				nextState.hitTypes
			);
		} else if (
			this.props.navigationTarget !== nextProps.navigationTarget ||
			this.state.allVisible !== nextState.allVisible ||
			this.state.hitTypes !== nextState.hitTypes
		) {
			this.updateSearchResults(
				nextProps.navigationTarget,
				nextState.allVisible,
				nextState.hitTypes
			);
		}
		if (this.props.searchQuery !== nextProps.searchQuery)
			this.setState({ visible: !!nextProps.searchQuery });
		return true;
	}

	toggleAllVisible = () => this.setState({ allVisible: !this.state.allVisible });
	hideResults = () => this.setState({ visible: false });

	render() {
		return (
			<>
				<input
					className={styles.searchInput}
					autoCorrect="off"
					autoCapitalize="off"
					placeholder="Search files"
					value={this.props.searchQuery}
					onChange={this.searchOnInput}
					data-filename={'frontend/' + __filename.replace(/\\/g, '/')}
				/>
				<div
					className={
						styles.searchResults + (this.state.visible ? ' ' + styles.visible : '')
					}
					data-filename={'frontend/' + __filename.replace(/\\/g, '/')}
				>
					<div className="close" onClick={this.hideResults}>
						<FontAwesomeIcon icon={faTimes} />
					</div>
					<div className={styles.searchInfo}>
						<h3>
							{this.state.resultCount} hits, {this.state.visibleCount} in view
						</h3>
						<Button onClick={this.toggleAllVisible}>
							{this.state.allVisible ? 'Crop to view' : 'Show all'}
						</Button>
					</div>
					<ul id="searchResults" onScroll={this.props.updateSearchLines}></ul>
				</div>
			</>
		);
	}
}

export default withRouter(Search);
