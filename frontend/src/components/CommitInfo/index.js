import React from 'react';
import './style.css';
import { span, formatDiff, authorCmp, createCalendar } from '../../lib/parse_diff';
// import prettyPrintWorker from '../../lib/pretty_print';
import Editor, { monaco } from '@monaco-editor/react';

monaco.config({
    urls: {
        monacoLoader: "/vs/loader.js",
        monacoBase: "/vs"
    }
});

export default class CommitInfo extends React.Component {
    constructor(props) {
        super(props);
        this.state = {visible: false};
    }

    showFile = (sha, path, el) => this.props.loadFile(sha, path, el);

    updateActiveCommitSetDiffs(activeCommits) {
        const el = document.getElementById('commitList');
        while (el.firstChild) el.removeChild(el.firstChild);
        el.dataset.count = activeCommits.length;

        const calendar = createCalendar(activeCommits.map(c => c.date));
        el.appendChild(calendar);

        const commitHeight = 60;

        const commitsEl = document.createElement('div');
        commitsEl.className = 'commits';
        commitsEl.style.position = 'relative';
        commitsEl.style.height = commitHeight * activeCommits.length + 'px';


        var visible = {};

        el.parentNode.onscroll = function(ev) {
            var bbox = el.parentNode.getBoundingClientRect();
            var startIndex = Math.max(0, bbox.top - commitsEl.getBoundingClientRect().top) / commitHeight;
            var startIndexInt = Math.floor(startIndex);
            var endIndexInt = Math.min(activeCommits.length-1, Math.ceil(startIndex + (bbox.height / commitHeight)));
            for (var i = startIndexInt; i <= endIndexInt; i++) {
                if (!visible[i]) {
                    visible[i] = makeCommit(activeCommits[i], i * commitHeight);
                    commitsEl.appendChild(visible[i]);
                }
            }
            for (var i in visible) {
                if (i < startIndexInt || i > endIndexInt) {
                    visible[i].remove();
                    delete visible[i];
                }
            }
        };

        const trackedPaths = [this.props.navigationTarget.substring(this.props.repoPrefix.length+1)];
        const trackedIndex = {};
        trackedIndex[this.props.navigationTarget] = true;

        const makeCommit = (c, top) => {
            var div = document.createElement('div');
            div.style.position = 'absolute';
            div.style.top = top + 'px';
            var hashSpan = span('commit-hash', c.sha);
            var dateSpan = span('commit-date', c.date.toString());
            var authorSpan = span('commit-author', c.author);
            var messageSpan = span('commit-message', c.message);
            var diffSpan = span('commit-diff', '');
            if (c.diff) c.diffEl = formatDiff(c.sha, c.diff, trackedPaths, trackedIndex, this.showFile);
            if (c.diffEl) diffSpan.appendChild(c.diffEl);
            var toggle = span('commit-toggle', 'Full info');
            var toggleDiffs = span('commit-toggle-diffs', 'All changes');
            toggle.onmousedown = async (ev) => {
                ev.preventDefault();
                div.classList.toggle('expanded');
                if (div.classList.contains('expanded') && !c.diffEl) {
                    if (c.diff == null) await this.props.loadDiff(c);
                    while (diffSpan.firstChild) diffSpan.removeChild(diffSpan.firstChild);
                    diffSpan.appendChild(formatDiff(c.sha, c.diff, trackedPaths, trackedIndex, this.showFile));
                }
            };
            toggleDiffs.onmousedown = function(ev) { ev.preventDefault(); div.classList.toggle('expanded-diffs'); };
            div.append(toggle, hashSpan, dateSpan, authorSpan, messageSpan, toggleDiffs, diffSpan);
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

    updateActiveCommitSetAuthors(authors, authorCommitCounts, activeCommits) {
        var self = this;
        var el = document.getElementById('authorList');
        while (el.firstChild) el.removeChild(el.firstChild);
        el.dataset.count = authors.length;
        authors.forEach((author) => {
            var div = document.createElement('div');
            div.dataset.commitCount = authorCommitCounts[author];
            var nameSpan = span('author-name', author);
            div.append(nameSpan);
            div.onmousedown = function(ev) {
                ev.preventDefault();
                if (self.props.commitFilter.author === author) self.props.setCommitFilter({...self.props.commitFilter, author: null});
                else self.props.setCommitFilter({...self.props.commitFilter, author});
            };
            el.appendChild(div);
        });
    }

    toggleVisible = (ev) => {
        this.setState({visible: !this.state.visible})
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps.activeCommitData !== this.props.activeCommitData) {
            // window.fileView.innerHTML = '';
            if (!nextState.visible) this.setState({visible: true});
            const { authors, commits, authorCommitCounts, files } = nextProps.activeCommitData;
            this.updateActiveCommitSetAuthors(authors, authorCommitCounts, commits);
            this.updateActiveCommitSetDiffs(commits);
        // } else if (nextProps.diffsLoaded !== this.props.diffsLoaded) {
        //     console.log(nextProps.diffsLoaded);
        //     this.updateActiveCommitSetDiffs(nextProps.activeCommitData.commits);
        } else if (nextProps.fileContents !== this.props.fileContents) {
            // window.fileView.innerHTML = '';
            // if (nextProps.fileContents) {
            //     prettyPrintWorker.prettyPrint(nextProps.fileContents.content, nextProps.fileContents.path, function(result) {
            //         window.fileView.innerHTML = '';

            //         var title = document.createElement('h3');
            //         title.textContent = nextProps.fileContents.path;
            //         var hash = document.createElement('h4');
            //         hash.textContent = nextProps.fileContents.hash;

            //         var doc = document.createElement('pre');
            //         doc.className = 'hljs ' + result.language;
            //         doc.innerHTML = result.value;

            //         window.fileView.append(hash, title, doc);
            //     });
            // }
        }
        return true;
    }

    handleEditorDidMount = (_, editor) => {
        editor.setModel(
            window.monaco.editor.createModel(
                this.props.fileContents.content,
                null,
                window.monaco.Uri.file(this.props.fileContents.path)
            )
        );
    }

    render() {
        return (
            <div id="commitInfo" className={this.state.visible ? 'visible' : 'hidden'}>
                <button onClick={this.toggleVisible}>{this.state.visible ? ">" : "<"}</button>
                <div id="authors">
                    <h3>Authors</h3>
                    <div id="authorList"/>
                </div>
                <div id="activeCommits">
                    <h3>Commits</h3>
                    <div id="commitList"/>
                </div>
                {this.props.fileContents && 
                    <div id="fileView">
                        <h4>{this.props.fileContents.hash}</h4>
                        <h3>{this.props.fileContents.path}</h3>
                        <Editor
                            editorDidMount={this.handleEditorDidMount}
                            options={{
                                model: null 
                            }}
                        />
                    </div>
                }
            </div>
        );
    }
}
