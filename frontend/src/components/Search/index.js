import React from 'react';
import './style.css';

export default class CommitControls extends React.Component {
    render() {
        return (
            <>
                <input id="searchInput" autoCorrect="off" autoCapitalize="off" placeholder="Search files"/>
                <button id="searchButton">Search</button>
                <ul id="searchResults"></ul>
            </>
        );
    }
}
