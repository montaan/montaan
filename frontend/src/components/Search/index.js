import React from 'react';
import './style.css';

export default class CommitControls extends React.Component {
    searchOnInput = (ev) => this.props.setSearchQuery(ev.target.value);

    render() {
        return (
            <>
                <input id="searchInput" autoCorrect="off" autoCapitalize="off" placeholder="Search files" value={this.props.searchQuery} onChange={this.searchOnInput}/>
                <button id="searchButton" onClick={this.searchOnInput}>Search</button>
                <ul id="searchResults"></ul>
            </>
        );
    }
}
