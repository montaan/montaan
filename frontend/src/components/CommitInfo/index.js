import React from 'react';
import './style.css';
import { span, formatDiff, authorCmp, createCalendar } from '../../lib/parse_diff';

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

        el.appendChild(createCalendar(activeCommits.map(c => c.date)));

        const trackedPaths = [this.props.navigationTarget.substring(this.props.repoPrefix.length+1)];
        const trackedIndex = {};
        trackedIndex[this.props.navigationTarget] = true;

        activeCommits.forEach(c => {
            var div = document.createElement('div');
            var hashSpan = span('commit-hash', c.sha);
            var dateSpan = span('commit-date', c.date.toString());
            var authorSpan = span('commit-author', `${c.author.name} <${c.author.email}>`);
            var messageSpan = span('commit-message', c.message);
            var diffSpan = span('commit-diff', '');
            if (c.diff) c.diffEl = formatDiff(c.sha, c.diff, trackedPaths, trackedIndex, this.showFile);
            if (c.diffEl) diffSpan.appendChild(c.diffEl);
            var toggle = span('commit-toggle', 'Full info');
            var toggleDiffs = span('commit-toggle-diffs', 'All changes');
            toggle.onmousedown = function(ev) { ev.preventDefault(); div.classList.toggle('expanded'); };
            toggleDiffs.onmousedown = function(ev) { ev.preventDefault(); div.classList.toggle('expanded-diffs'); };
            div.append(toggle, hashSpan, dateSpan, authorSpan, messageSpan, toggleDiffs, diffSpan);
            el.appendChild(div);
        });
    }

    updateActiveCommitSetAuthors(authors, authorCommitCounts, activeCommits) {
        var self = this;
        var el = document.getElementById('authorList');
        while (el.firstChild) el.removeChild(el.firstChild);
        el.dataset.count = authors.length;
        authors.forEach((author) => {
            const {name, email} = author;
            var div = document.createElement('div');
            var key = name + ' <' + email + '>';
            div.dataset.commitCount = authorCommitCounts[key];
            var nameSpan = span('author-name', name);
            var emailSpan = span('author-email', email);
            div.append(nameSpan, emailSpan);
            div.onmousedown = function(ev) {
                ev.preventDefault();
                if (self.state.commitFilter.author === author) this.setCommitFilter({...self.state.commitFilter, author: null});
                else this.setCommitFilter({...self.state.commitFilter, author});
            };
            el.appendChild(div);
        });
    }

    toggleVisible = (ev) => {
        this.setState({visible: !this.state.visible})
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps.activeCommitData !== this.props.activeCommitData) {
            if (!nextState.visible) this.setState({visible: true});
            const { authors, commits, authorCommitCounts, files } = nextProps.activeCommitData;
            this.updateActiveCommitSetAuthors(authors, authorCommitCounts, commits);
            this.updateActiveCommitSetDiffs(commits);
        } else if (nextProps.diffsLoaded !== this.props.diffsLoaded) {
            console.log(nextProps.diffsLoaded);
            this.updateActiveCommitSetDiffs(nextProps.activeCommitData.commits);
        } else if (nextProps.fileContents !== this.props.fileContents) {
            window.fileView.textContent = nextProps.fileContents;
        }
        return true;
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
                <div id="fileView" className="prettyPrint"></div>
            </div>
        );
    }
}
