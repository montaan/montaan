// src/components/CommitInfo/index.tsx

import React from 'react';
import {
	span,
	formatDiff,
	createCalendar,
	CalendarMouseEventHandler,
	CalendarElement,
	Commit,
} from '../../lib/parse-diff';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
// import prettyPrintWorker from '../../lib/pretty_print';
import Editor, { DiffEditor, monaco, Monaco } from '@monaco-editor/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';

import styles from './css/style.module.scss';

monaco.config({
	urls: {
		monacoLoader: '/vs/loader.js',
		monacoBase: '/vs',
	},
});

declare global {
	interface Window {
		monaco: Monaco;
	}
}

interface CommitInfoProps {
	loadFileDiff(sha: string, previousSha: string, path: string, el?: HTMLElement): void;
	loadFile(sha: string, path: string, el: HTMLElement): void;

	commitFilter: any;
	setCommitFilter(commitFilter: any): void;

	navigationTarget: string;
	repoPrefix: string;

	closeFile(): void;
	loadDiff(commit: Commit): Promise<string>;

	activeCommitData: {
		authors: string[];
		authorCommitCounts: { [propType: string]: number };
		commits: Commit[];
	};

	commitData: {
		commits: Commit[];
		commitIndex: { [propType: string]: Commit };
	};

	fileContents: {
		content: string;
		path: string;
		hash: string;
		original?: string;
	};

	showFileCommitsClick(event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void;
}

interface CommitInfoState {
	visible: boolean;
	authorSort: string;
	commitFilter: any;
}

class CommitInfo extends React.Component<CommitInfoProps, CommitInfoState> {
	searchTimeout: number;

	constructor(props: CommitInfoProps) {
		super(props);
		this.state = { visible: false, authorSort: 'commits', commitFilter: undefined };
		this.searchTimeout = 0;
	}

	showFile = (sha: string, previousSha: string, path: string, el: HTMLElement) => {
		if (previousSha) this.props.loadFileDiff(sha, previousSha, path, el);
		else this.props.loadFile(sha, path, el);
	};

	pad2(v: string) {
		if (v.length === 1) return '0' + v;
		return v;
	}

	setDateFilter(date: string) {
		if (this.props.commitFilter.date === date)
			this.props.setCommitFilter({ ...this.props.commitFilter, date: undefined });
		else this.props.setCommitFilter({ ...this.props.commitFilter, date });
	}

	onYearClick: CalendarMouseEventHandler = (ev) => {
		const target = ev.target as CalendarElement;
		if (target.classList.contains('calendar-year')) {
			this.setDateFilter(target.dataset.year || '');
		}
	};
	onMonthClick: CalendarMouseEventHandler = (ev) => {
		const target = ev.target as CalendarElement;
		if (target.classList.contains('calendar-month') && target.parentElement) {
			this.setDateFilter(
				(target.parentElement.dataset.year || '') +
					'-' +
					this.pad2(target.dataset.month || '')
			);
		}
	};
	onDayClick: CalendarMouseEventHandler = (ev) => {
		const target = ev.target as CalendarElement;
		this.setDateFilter(target.dataset.fullDate || '');
	};

	updateActiveCommitSetDiffs(activeCommits: Commit[]) {
		const el = document.getElementById('commitList');
		if (!el) return;
		while (el.firstChild) el.removeChild(el.firstChild);
		if (!activeCommits) return;
		el.dataset.count = activeCommits.length.toString();

		const calendar = createCalendar(
			activeCommits,
			this.onYearClick,
			this.onMonthClick,
			this.onDayClick
		);
		el.appendChild(calendar);

		const commitHeight = 30;

		const commitsEl = document.createElement('div');
		commitsEl.className = 'commits';
		commitsEl.style.position = 'relative';
		commitsEl.style.height = commitHeight * activeCommits.length + 'px';

		var visible: { [propType: number]: HTMLElement } = {};

		// If div height > 1Mpx, switch over to 1Mpx high scroll div for jumping big chunks + onwheel to fine-tune.
		// The scroll is pretty useless at that point anyhow, so it doesn't need "scroll this for long enough and you'll see all the commits"
		// Deal with showing diff details, show them in a different element.

		if (!el.parentElement) return;

		el.parentElement.onscroll = function(ev) {
			if (!el.parentElement) return;
			var bbox = el.parentElement.getBoundingClientRect();
			var startIndex =
				Math.max(0, bbox.top - commitsEl.getBoundingClientRect().top) / commitHeight;
			var startIndexInt = Math.floor(startIndex);
			var endIndexInt = Math.min(
				activeCommits.length - 1,
				Math.ceil(startIndex + bbox.height / commitHeight)
			);
			for (var i = startIndexInt; i <= endIndexInt; i++) {
				if (!visible[i]) {
					visible[i] = makeCommit(
						activeCommits[i],
						i * commitHeight,
						activeCommits[i + 1]
					);
					commitsEl.appendChild(visible[i]);
				}
			}
			for (var n in visible) {
				const ni = parseInt(n);
				if (ni < startIndexInt || ni > endIndexInt) {
					visible[n].remove();
					delete visible[n];
				}
			}
		};

		const trackedPaths = [
			this.props.navigationTarget.substring(this.props.repoPrefix.length + 1),
		];
		const trackedIndex: { [propType: string]: boolean } = {};
		trackedIndex[this.props.navigationTarget] = true;

		for (var i = 0; i < activeCommits.length; i++) {
			const files = activeCommits[i].files;
			for (var j = 0; j < files.length; j++) {
				const file = files[j];
				if (file.renamed === 'dev/null') continue;
				const dstPath = file.renamed || file.path;
				for (var k = 0; k < trackedPaths.length; k++)
					if (dstPath.startsWith(trackedPaths[k])) break;
				const inPath = k !== trackedPaths.length;
				if (inPath) {
					var path = dstPath;
					if (!trackedIndex[path]) {
						trackedPaths.push(path);
						trackedIndex[path] = true;
					}
					if (file.renamed) {
						path = file.path;
						if (!trackedIndex[path]) {
							trackedPaths.push(path);
							trackedIndex[path] = true;
						}
					}
				}
			}
		}

		const makeCommit = (c: Commit, top: number, previousCommit: Commit) => {
			var div = document.createElement('div');
			div.style.position = 'absolute';
			div.style.top = top + 'px';
			var hashSpan = span('commit-hash', c.sha);
			var dateSpan = span('commit-date', c.date.toUTCString());
			var authorSpan = span('commit-author', c.author);
			var messageSpan = span('commit-message', c.message);
			var toggleDiffs = span('commit-toggle-diffs', 'All changes');
			div.onmousedown = async (ev) => {
				ev.preventDefault();
				const diffView = document.getElementById('diffView');
				if (!diffView) return;
				this.props.closeFile();
				if (
					diffView.firstChild &&
					diffView.firstChild.textContent === hashSpan.textContent
				) {
					while (diffView.firstChild) diffView.removeChild(diffView.firstChild);
					return;
				}
				while (diffView.firstChild) diffView.removeChild(diffView.firstChild);
				if (c.diff == null) await this.props.loadDiff(c);
				diffView.classList.remove('expanded-diffs');
				diffView.classList.add('expanded');
				const diffSpan = span('commit-diff');
				diffSpan.appendChild(
					formatDiff(
						c.sha,
						c.diff || '',
						trackedPaths,
						previousCommit && previousCommit.sha,
						this.showFile
					)
				);
				diffView.append(
					hashSpan.cloneNode(true),
					dateSpan.cloneNode(true),
					authorSpan.cloneNode(true),
					messageSpan.cloneNode(true),
					toggleDiffs,
					diffSpan
				);
			};
			toggleDiffs.onmousedown = function(ev) {
				ev.preventDefault();
				if (!toggleDiffs.parentElement) return;
				toggleDiffs.parentElement.classList.toggle('expanded-diffs');
			};
			div.append(hashSpan, dateSpan, authorSpan, messageSpan);
			return div;
		};

		el.appendChild(commitsEl);
		setTimeout(() => {
			if (el && el.parentElement && el.parentElement.onscroll) {
				el.parentElement.onscroll(new MouseEvent('scroll'));
			}
		}, 10);
	}

	updateActiveCommitSetAuthors(
		authors: string[],
		authorCommitCounts: { [propType: string]: number },
		activeCommits: Commit[],
		authorSort = this.state.authorSort
	) {
		var self = this;
		var el = document.getElementById('authorList')!;
		while (el.firstChild) el.removeChild(el.firstChild);
		if (!authors) return;
		el.dataset.count = authors.length.toString();
		switch (authorSort) {
			case 'name':
				authors.sort((a, b) => a.localeCompare(b));
				break;
			case 'email':
				authors.sort((a, b) => a.localeCompare(b));
				break;
			case 'commits':
				authors.sort((a, b) => authorCommitCounts[b] - authorCommitCounts[a]);
				break;
			case 'date':
				authors.sort((a, b) => a.localeCompare(b));
				break;
			default:
				authors.sort((a, b) => a.localeCompare(b));
		}
		var runningCommitCount = 0;
		var added50 = false,
			added80 = false,
			added95 = false;
		authors.forEach((author) => {
			var div = document.createElement('div');
			div.dataset.commitCount = authorCommitCounts[author].toString();
			var nameSpan = span('author-name', author);
			div.append(nameSpan);
			div.onmousedown = function(ev) {
				ev.preventDefault();
				if (self.props.commitFilter.author === author)
					self.props.setCommitFilter({ ...self.props.commitFilter, author: null });
				else self.props.setCommitFilter({ ...self.props.commitFilter, author });
			};
			el.appendChild(div);
			runningCommitCount += authorCommitCounts[author];
			if (authorSort === 'commits') {
				if (runningCommitCount >= activeCommits.length * 0.95 && !added95) {
					added50 = added80 = added95 = true;
					el.appendChild(span(styles.commits95Pct));
				} else if (runningCommitCount >= activeCommits.length * 0.8 && !added80) {
					added50 = added80 = true;
					el.appendChild(span(styles.commits80Pct));
				} else if (runningCommitCount >= activeCommits.length * 0.5 && !added50) {
					added50 = true;
					el.appendChild(span(styles.commits50Pct));
				}
			}
		});
	}

	toggleVisible = (ev: MouseEvent) => {
		this.setState({ visible: !this.state.visible });
	};

	shouldComponentUpdate(nextProps: CommitInfoProps, nextState: CommitInfoState) {
		if (nextProps.activeCommitData !== this.props.activeCommitData) {
			const { authors, commits, authorCommitCounts } = nextProps.activeCommitData;
			if (!nextState.visible && commits && commits !== nextProps.commitData.commits)
				this.setState({ visible: true });
			const diffView = document.getElementById('diffView')!;
			while (diffView.firstChild) diffView.removeChild(diffView.firstChild);
			this.updateActiveCommitSetAuthors(authors, authorCommitCounts, commits);
			this.updateActiveCommitSetDiffs(commits);
		} else if (nextState.authorSort !== this.state.authorSort) {
			const { authors, commits, authorCommitCounts } = nextProps.activeCommitData;
			this.updateActiveCommitSetAuthors(
				authors,
				authorCommitCounts,
				commits,
				nextState.authorSort
			);
		}
		return true;
	}

	handleDiffEditorDidMount = (_: any, _editor: any, diffEditor: any) => {
		const original = window.monaco.editor.createModel(
			this.props.fileContents.original || '',
			undefined,
			window.monaco.Uri.file('a/' + this.props.fileContents.path)
		);
		const modified = window.monaco.editor.createModel(
			this.props.fileContents.content,
			undefined,
			window.monaco.Uri.file('b/' + this.props.fileContents.path)
		);
		diffEditor.setModel({ original, modified });
		diffEditor.onDidDispose(() => {
			original.dispose();
			modified.dispose();
		});
	};

	handleEditorDidMount = (_: any, editor: any) => {
		const model = window.monaco.editor.createModel(
			this.props.fileContents.content,
			undefined,
			window.monaco.Uri.file(this.props.fileContents.path)
		);
		editor.setModel(model);
		editor.onDidDispose(() => model.dispose());
	};

	authorSearchOnChange = (event: React.FormEvent<any>): void => {
		const authorSearch = (event.target! as HTMLInputElement).value;
		clearTimeout(this.searchTimeout);

		this.searchTimeout = setTimeout(
			(() =>
				this.props.setCommitFilter({
					...this.state.commitFilter,
					authorSearch,
				})) as TimerHandler,
			200
		);
	};

	commitSearchOnChange = (event: React.FormEvent<any>): void => {
		const search = (event.target! as HTMLInputElement).value;
		clearTimeout(this.searchTimeout);
		this.searchTimeout = setTimeout(
			(() =>
				this.props.setCommitFilter({ ...this.state.commitFilter, search })) as TimerHandler,
			200
		);
	};

	sortByName = () => this.setState({ authorSort: 'name' });
	sortByEmail = () => this.setState({ authorSort: 'email' });
	sortByCommits = () => this.setState({ authorSort: 'commits' });
	sortByDate = () => this.setState({ authorSort: 'date' });
	hideCommitsPane = () => this.setState({ visible: false });

	onShowFileCommits = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
		this.setState({ visible: true });
		this.props.showFileCommitsClick(event);
	};

	getFileCommits(path: string, hash: string): { path: string; commit: Commit }[] {
		const arr = [];
		const commits = this.props.commitData.commits;
		let currentPath = path;
		for (let i = 0; i < commits.length; i++) {
			const c = commits[i];
			if (c.sha === hash) {
				for (let j = i; j >= 0; j--) {
					const cc = commits[j];
					for (let k = 0; k < cc.files.length; k++) {
						const f = cc.files[k];
						if (f.renamed && f.path === currentPath) {
							currentPath = f.renamed;
						}
					}
				}
				break;
			}
		}
		for (let i = 0; i < commits.length; i++) {
			const c = commits[i];
			for (let j = 0; j < c.files.length; j++) {
				const f = c.files[j];
				if (f.renamed !== undefined && f.renamed === currentPath) {
					currentPath = f.path;
				}
				if (f.path === currentPath) {
					arr.push({ path: currentPath, commit: c });
					break;
				}
			}
		}
		return arr;
	}

	previousFileVersion = (): void => {
		const fileCommits = this.getFileCommits(
			this.props.fileContents.path,
			this.props.fileContents.hash
		);
		const idx = fileCommits.findIndex(
			({ commit }) => commit.sha === this.props.fileContents.hash
		);
		if (idx < fileCommits.length - 1) {
			const { path, commit } = fileCommits[idx + 1];
			const previous = idx + 2 <= fileCommits.length ? fileCommits[idx + 2] : undefined;
			this.props.loadFileDiff(commit.sha, previous ? previous.commit.sha : '00000000', path);
		}
	};

	nextFileVersion = (): void => {
		const fileCommits = this.getFileCommits(
			this.props.fileContents.path,
			this.props.fileContents.hash
		);
		const idx = fileCommits.findIndex(
			({ commit }) => commit.sha === this.props.fileContents.hash
		);
		if (idx > 0) {
			const { path, commit } = fileCommits[idx];
			const previous = fileCommits[idx - 1];
			this.props.loadFileDiff(previous ? previous.commit.sha : '00000000', commit.sha, path);
		}
	};

	render() {
		const { authorSort } = this.state;
		return (
			<>
				<Button id="showFileCommits" onClick={this.onShowFileCommits}>
					Show commits
				</Button>
				<div id="commitInfo" className={this.state.visible ? 'visible' : 'hidden'}>
					<div className="close" onClick={this.hideCommitsPane}>
						<FontAwesomeIcon icon={faTimes} />
					</div>
					<div id="authors">
						<h3>Authors</h3>
						<Form.Group id="authorSearch">
							<Form.Control onChange={this.authorSearchOnChange} />
						</Form.Group>
						<div id="authorSort">
							Sort by
							<span
								onClick={this.sortByName}
								className={authorSort === 'name' ? 'selected' : undefined}
							>
								Name
							</span>
							<span
								onClick={this.sortByEmail}
								className={authorSort === 'email' ? 'selected' : undefined}
							>
								Email
							</span>
							<span
								onClick={this.sortByCommits}
								className={authorSort === 'commits' ? 'selected' : undefined}
							>
								Commits
							</span>
							<span
								onClick={this.sortByDate}
								className={authorSort === 'date' ? 'selected' : undefined}
							>
								Date
							</span>
						</div>
						<div id="authorList" />
					</div>
					<div id="activeCommits">
						<h3>Commits</h3>
						<Form.Group id="commitSearch">
							<Form.Control onChange={this.commitSearchOnChange} />
						</Form.Group>
						<div id="commitList" />
					</div>
					<div id="diffView" />
				</div>
				{this.props.fileContents && (
					<div id="fileView">
						<h4>
							<span className="hash">{this.props.fileContents.hash}</span>
							&mdash;
							<span className="message">
								{
									this.props.commitData.commitIndex[
										this.props.fileContents.hash
									].message.split('\n')[0]
								}
							</span>
						</h4>
						<h3>{this.props.fileContents.path}</h3>
						<div className="file-version-nav">
							<button onClick={this.previousFileVersion}>
								<FontAwesomeIcon icon={faArrowDown} />
							</button>
							<button onClick={this.nextFileVersion}>
								<FontAwesomeIcon icon={faArrowUp} />
							</button>
						</div>
						<div className="close" onClick={this.props.closeFile}>
							<FontAwesomeIcon icon={faTimes} />
						</div>
						{this.props.fileContents.original ? (
							<DiffEditor
								editorDidMount={this.handleDiffEditorDidMount}
								options={{
									model: null,
								}}
							/>
						) : (
							<Editor
								editorDidMount={this.handleEditorDidMount}
								options={{
									model: null,
								}}
							/>
						)}
					</div>
				)}
			</>
		);
	}
}

export default CommitInfo;
