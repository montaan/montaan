import React from 'react';
import './style.css';
import { span, formatDiff, authorCmp, createCalendar } from '../../lib/parse_diff';
// import prettyPrintWorker from '../../lib/pretty_print';
import Editor, { DiffEditor, monaco } from '@monaco-editor/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'

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

    showFile = (sha, previousSha, path, el) => {
        if (previousSha) this.props.loadFileDiff(sha, previousSha, path, el);
        else this.props.loadFile(sha, path, el);
    }

    updateActiveCommitSetDiffs(activeCommits) {
        const el = document.getElementById('commitList');
        while (el.firstChild) el.removeChild(el.firstChild);
        el.dataset.count = activeCommits.length;

        const calendar = createCalendar(activeCommits);
        el.appendChild(calendar);

        const commitHeight = 60;

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
            var startIndex = Math.max(0, bbox.top - commitsEl.getBoundingClientRect().top) / commitHeight;
            var startIndexInt = Math.floor(startIndex);
            var endIndexInt = Math.min(activeCommits.length-1, Math.ceil(startIndex + (bbox.height / commitHeight)));
            for (var i = startIndexInt; i <= endIndexInt; i++) {
                if (!visible[i]) {
                    visible[i] = makeCommit(activeCommits[i], i * commitHeight, activeCommits[i+1]);
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

        const makeCommit = (c, top, previousCommit) => {
            var div = document.createElement('div');
            div.style.position = 'absolute';
            div.style.top = top + 'px';
            var hashSpan = span('commit-hash', c.sha);
            var dateSpan = span('commit-date', c.date.toString());
            var authorSpan = span('commit-author', c.author);
            var messageSpan = span('commit-message', c.message);
            var toggle = span('commit-toggle', 'Full info');
            var toggleDiffs = span('commit-toggle-diffs', 'All changes');
            toggle.onmousedown = async (ev) => {
                ev.preventDefault();
                if (window.diffView.firstChild && window.diffView.firstChild.textContent === hashSpan.textContent) {
                    while (window.diffView.firstChild) window.diffView.removeChild(window.diffView.firstChild);
                    return;
                }
                while (window.diffView.firstChild) window.diffView.removeChild(window.diffView.firstChild);
                if (c.diff == null) await this.props.loadDiff(c);
                window.diffView.classList.remove('expanded-diffs');
                window.diffView.classList.add('expanded');
                const diffSpan = span('commit-diff');
                diffSpan.appendChild(formatDiff(c.sha, c.diff, trackedPaths, trackedIndex, previousCommit && previousCommit.sha, this.showFile));
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
            div.append(toggle, hashSpan, dateSpan, authorSpan, messageSpan);
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
            while (window.diffView.firstChild) window.diffView.removeChild(window.diffView.firstChild);
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

    handleEditorDidMount = (_, editor, diffEditor) => {
        if (this.props.fileContents.original) {
            const original = window.monaco.editor.createModel(
                this.props.fileContents.original,
                null,
                window.monaco.Uri.file('a/'+this.props.fileContents.path)
            );
            const modified = window.monaco.editor.createModel(
                this.props.fileContents.content,
                null,
                window.monaco.Uri.file('b/'+this.props.fileContents.path)
            );
            diffEditor.setModel({original, modified});
            diffEditor.onDidDispose(() => {
                original.dispose();
                modified.dispose();
            });
        } else {
            const model = window.monaco.editor.createModel(
                this.props.fileContents.content,
                null,
                window.monaco.Uri.file(this.props.fileContents.path)
            );
            editor.setModel(model);
            editor.onDidDispose(() => model.dispose());
        }
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
                <div id="diffView"/>
                {this.props.fileContents && 
                    <div id="fileView">
                        <h4>
                            <span className="hash">{this.props.fileContents.hash}</span> 
                            &mdash; 
                            <span className="message">{this.props.commitData.commitIndex[this.props.fileContents.hash].message.split("\n")[0]}</span>
                        </h4>
                        <h3>{this.props.fileContents.path}</h3>
                        <div className="close" onClick={this.props.closeFile}><FontAwesomeIcon icon={faTimes} /></div>
                        {this.props.fileContents.original
                        ?
                            <DiffEditor
                                editorDidMount={this.handleEditorDidMount}
                                options={{
                                    model: null 
                                }}
                            />
                        :
                            <Editor
                                editorDidMount={this.handleEditorDidMount}
                                options={{
                                    model: null 
                                }}
                            />
                        }
                    </div>
                }
            </div>
        );
    }
}
