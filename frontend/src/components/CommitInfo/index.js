import React from 'react';
import './style.css';

export default class CommitInfo extends React.Component {
    constructor() {
        super();
        this.state = {visible: false};
    }

    toggleVisible = (ev) => {
        this.setState({visible: !this.state.visible})
    }

    render() {
        return (
            <div id="commitInfo" className={this.state.visible ? 'visible' : 'hidden'}>
                <button onClick={this.toggleVisible}>{this.state.visible ? ">" : "<"}</button>
                <div id="authors"/>
                <div id="activeCommits"/>
            </div>
        );
    }
}
