import React from 'react';
import './style.css';

export default class CommitControls extends React.Component {
    render() {
        return (
            <div id="commitControls" style={{display: this.props.display ? 'block' : 'none'}}>
                <div>
                    <input id="commitSlider" type="range" min="0" max="999" step="1" defaultValue="0"></input>
                    <button id="previousCommit">&lt;</button><button id="nextCommit">&gt;</button>
                </div>
                <div id="commitDetails"></div>
            </div>
        );
    }
}
