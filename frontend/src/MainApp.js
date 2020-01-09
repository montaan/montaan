import React from 'react';
import MainView from './components/MainView';
import CommitControls from './components/CommitControls';
import CommitInfo from './components/CommitInfo';
import Search from './components/Search';
import Breadcrumb from './components/Breadcrumb';

const apiPrefix = 'http://localhost:8008/_';
const repoPrefix = 'kig/tabletree';

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
            files: ''
        };
        fetch(apiPrefix+'/repo/fs/'+repoPrefix+'/log.txt').then(res => res.text()).then(this.setCommitLog);
        fetch(apiPrefix+'/repo/fs/'+repoPrefix+'/changes.txt').then(res => res.text()).then(this.setCommitChanges);
        fetch(apiPrefix+'/repo/fs/'+repoPrefix+'/files.txt').then(res => res.text()).then(this.setFiles);
    }

    setCommitFilter = commitFilter => this.setState({commitFilter});
    setSearchQuery = searchQuery => this.setState({searchQuery});
    setActiveCommits = activeCommits => this.setState({activeCommits});
    setCommits = commits => this.setState({commits, activeCommits: commits});
    setFileTree = fileTree => this.setState({fileTree});
    setCommitLog = commitLog => this.setState({commitLog});
    setCommitChanges = commitChanges => this.setState({commitChanges});
    setFiles = files => this.setState({files});

    render() {
        return (
            <div>
                <div id="debug"></div>
                <div id="fullscreen"></div>
                <div id="loader"></div>

                <Search setSearchQuery={this.setSearchQuery} searchQuery={this.state.searchQuery} commitFilter={this.state.commitFilter} setCommitFilter={this.setCommitFilter}/>
                <Breadcrumb commitFilter={this.state.commitFilter} setCommitFilter={this.setCommitFilter} />
                <CommitControls searchQuery={this.state.searchQuery} commitFilter={this.state.commitFilter} setCommitFilter={this.setCommitFilter} />
                <CommitInfo searchQuery={this.state.searchQuery} commitFilter={this.state.commitFilter} setCommitFilter={this.setCommitFilter} />

                <MainView commitLog={this.state.commitLog} commitChanges={this.state.commitChanges} files={this.state.files} searchQuery={this.state.searchQuery} commitFilter={this.state.commitFilter} />
            </div>
        );
    }
}

export default MainApp;
