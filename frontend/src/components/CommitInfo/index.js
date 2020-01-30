import React from 'react';
import './style.css';
import { span, formatDiff, createCalendar } from '../../lib/parse_diff';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
// import prettyPrintWorker from '../../lib/pretty_print';
import Editor, { DiffEditor, monaco } from '@monaco-editor/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';

import strict from '../../lib/strictProxy.js';
import styles_ from './css/style.module.scss';
const styles = strict(styles_, 'components/CommitInfo/css/style.module.scss');

monaco.config({
	urls: {
		monacoLoader: '/vs/loader.js',
		monacoBase: '/vs',
	},
});

export default class CommitInfo extends React.Component {
	constructor(props) {
		super(props);
		this.state = { visible: false, authorSort: 'commits' };
	}

	showFile = (sha, previousSha, path, el) => {
		if (previousSha) this.props.loadFileDiff(sha, previousSha, path, el);
		else this.props.loadFile(sha, path, el);
	};

	pad2(v) {
		if (v.length === 1) return '0' + v;
		return v;
	}

	setDateFilter(date) {
		if (this.props.commitFilter.date === date)
			this.props.setCommitFilter({ ...this.props.commitFilter, date: undefined });
		else this.props.setCommitFilter({ ...this.props.commitFilter, date });
	}

	onYearClick = (ev) =>
		ev.target.classList.contains('calendar-year') && this.setDateFilter(ev.target.dataset.year);
	onMonthClick = (ev) =>
		ev.target.classList.contains('calendar-month') &&
		this.setDateFilter(
			ev.target.parentNode.dataset.year + '-' + this.pad2(ev.target.dataset.month)
		);
	onDayClick = (ev) => this.setDateFilter(ev.target.dataset.fullDate);

	updateActiveCommitSetDiffs(activeCommits) {
		const el = document.getElementById('commitList');
		while (el.firstChild) el.removeChild(el.firstChild);
		if (!activeCommits) return;
		el.dataset.count = activeCommits.length;

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

		var visible = {};

		// If div height > 1Mpx, switch over to 1Mpx high scroll div for jumping big chunks + onwheel to fine-tune.
		// The scroll is pretty useless at that point anyhow, so it doesn't need "scroll this for long enough and you'll see all the commits"
		// Deal with showing diff details, show them in a different element.

		el.parentNode.onscroll = function(ev) {
			var bbox = el.parentNode.getBoundingClientRect();
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
				if (n < startIndexInt || n > endIndexInt) {
					visible[n].remove();
					delete visible[n];
				}
			}
		};

		const trackedPaths = [
			this.props.navigationTarget.substring(this.props.repoPrefix.length + 1),
		];
		const trackedIndex = {};
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

		const makeCommit = (c, top, previousCommit) => {
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
				this.props.closeFile();
				if (
					window.diffView.firstChild &&
					window.diffView.firstChild.textContent === hashSpan.textContent
				) {
					while (window.diffView.firstChild)
						window.diffView.removeChild(window.diffView.firstChild);
					return;
				}
				while (window.diffView.firstChild)
					window.diffView.removeChild(window.diffView.firstChild);
				if (c.diff == null) await this.props.loadDiff(c);
				window.diffView.classList.remove('expanded-diffs');
				window.diffView.classList.add('expanded');
				const diffSpan = span('commit-diff');
				diffSpan.appendChild(
					formatDiff(
						c.sha,
						c.diff,
						trackedPaths,
						previousCommit && previousCommit.sha,
						this.showFile
					)
				);
				window.diffView.append(
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
				this.parentNode.classList.toggle('expanded-diffs');
			};
			div.append(hashSpan, dateSpan, authorSpan, messageSpan);
			return div;
		};

		// const trackedPaths = [this.props.navigationTarget.substring(this.props.repoPrefix.length+1)];
		// const trackedIndex = {};
		// trackedIndex[this.props.navigationTarget] = true;

		// activeCommits.forEach(c => {
		//     var div = document.createElement('div');
		//     var hashSpan = span('commit-hash', c.sha);
		//     var dateSpan = span('commit-date', c.date.toString());
		//     var authorSpan = span('commit-author', `${c.author.name} <${c.author.email}>`);
		//     var messageSpan = span('commit-message', c.message);
		//     var diffSpan = span('commit-diff', '');
		//     if (c.diff) c.diffEl = formatDiff(c.sha, c.diff, trackedPaths, trackedIndex, this.showFile);
		//     if (c.diffEl) diffSpan.appendChild(c.diffEl);
		//     var toggle = span('commit-toggle', 'Full info');
		//     var toggleDiffs = span('commit-toggle-diffs', 'All changes');
		//     toggle.onmousedown = async (ev) => {
		//         ev.preventDefault();
		//         div.classList.toggle('expanded');
		//         if (div.classList.contains('expanded') && !c.diffEl) {
		//             if (c.diff == null) await this.props.loadDiff(c);
		//             while (diffSpan.firstChild) diffSpan.removeChild(diffSpan.firstChild);
		//             diffSpan.appendChild(formatDiff(c.sha, c.diff, trackedPaths, trackedIndex, this.showFile));
		//         }
		//     };
		//     toggleDiffs.onmousedown = function(ev) { ev.preventDefault(); div.classList.toggle('expanded-diffs'); };
		//     div.append(toggle, hashSpan, dateSpan, authorSpan, messageSpan, toggleDiffs, diffSpan);
		//     commitsEl.appendChild(div);
		// });
		el.appendChild(commitsEl);
		setTimeout(() => el.parentNode.onscroll(), 10);
	}

	updateActiveCommitSetAuthors(
		authors,
		authorCommitCounts,
		activeCommits,
		authorSort = this.state.authorSort
	) {
		var self = this;
		var el = document.getElementById('authorList');
		while (el.firstChild) el.removeChild(el.firstChild);
		if (!authors) return;
		el.dataset.count = authors.length;
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
			div.dataset.commitCount = authorCommitCounts[author];
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

	toggleVisible = (ev) => {
		this.setState({ visible: !this.state.visible });
	};

	shouldComponentUpdate(nextProps, nextState) {
		if (nextProps.activeCommitData !== this.props.activeCommitData) {
			const { authors, commits, authorCommitCounts } = nextProps.activeCommitData;
			if (!nextState.visible && commits && commits !== nextProps.commitData.commits)
				this.setState({ visible: true });
			while (window.diffView.firstChild)
				window.diffView.removeChild(window.diffView.firstChild);
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
		if (nextProps.fileContents !== this.props.fileContents && nextProps.fileContents) {
			if (nextState.diffEditor && nextProps.fileContents.original) {
				const model = nextState.diffEditor.getModel();
				model.original.setValue(nextProps.fileContents.original);
				model.modified.setValue(nextProps.fileContents.content);
			} else if (nextState.editor && nextProps.fileContents.content) {
				nextState.editor.getModel().setValue(nextProps.fileContents.content);
			}
		}
		return true;
	}

	handleEditorDidMount = (_, editor, diffEditor) => {
		if (this.props.fileContents.original) {
			const original = window.monaco.editor.createModel(
				this.props.fileContents.original,
				null,
				window.monaco.Uri.file('a/' + this.props.fileContents.path)
			);
			const modified = window.monaco.editor.createModel(
				this.props.fileContents.content,
				null,
				window.monaco.Uri.file('b/' + this.props.fileContents.path)
			);
			diffEditor.setModel({ original, modified });
			diffEditor.onDidDispose(() => {
				original.dispose();
				modified.dispose();
			});
			this.setState({ diffEditor, editor: null });
		} else {
			const model = window.monaco.editor.createModel(
				this.props.fileContents.content,
				null,
				window.monaco.Uri.file(this.props.fileContents.path)
			);
			editor.setModel(model);
			editor.onDidDispose(() => model.dispose());
			this.setState({ diffEditor: null, editor });
		}
	};

	authorSearchOnChange = (ev) => {
		const authorSearch = ev.target.value;
		clearTimeout(this.searchTimeout);
		this.searchTimeout = setTimeout(
			() => this.props.setCommitFilter({ ...this.state.commitFilter, authorSearch }),
			200
		);
	};

	commitSearchOnChange = (ev) => {
		const search = ev.target.value;
		clearTimeout(this.searchTimeout);
		this.searchTimeout = setTimeout(
			() => this.props.setCommitFilter({ ...this.state.commitFilter, search }),
			200
		);
	};

	sortByName = () => this.setState({ authorSort: 'name' });
	sortByEmail = () => this.setState({ authorSort: 'email' });
	sortByCommits = () => this.setState({ authorSort: 'commits' });
	sortByDate = () => this.setState({ authorSort: 'date' });
	hideCommitsPane = () => this.setState({ visible: false });

	onShowFileCommits = (ev) => {
		this.setState({ visible: true });
		this.props.showFileCommitsClick(ev);
	};

	getFileCommits(path, hash) {
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

	previousFileVersion = () => {
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

	nextFileVersion = () => {
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
								editorDidMount={this.handleEditorDidMount}
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
