import React from 'react';
import MainView from './components/MainView';
import CommitControls from './components/CommitControls';
import CommitInfo from './components/CommitInfo';
import Search from './components/Search';
import Breadcrumb from './components/Breadcrumb';

class MainApp extends React.Component {
    constructor() {
        super()
        this.state = {
            commitFilter: {}
        };
    }

    setCommitFilter = commitFilter => this.setState({commitFilter});

    render() {
        console.log("MainApp render");
        return (
            <div>
                <div id="debug"></div>
                <div id="fullscreen"></div>
                <div id="loader"></div>

                <Search commitFilter={this.state.commitFilter} setCommitFilter={this.setCommitFilter}/>
                <Breadcrumb commitFilter={this.state.commitFilter} setCommitFilter={this.setCommitFilter} />
                <CommitControls commitFilter={this.state.commitFilter} setCommitFilter={this.setCommitFilter} />
                <CommitInfo commitFilter={this.state.commitFilter} setCommitFilter={this.setCommitFilter} />

                <MainView commitFilter={this.state.commitFilter} />
            </div>
        );
    }
}

export default MainApp;
