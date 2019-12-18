import React from 'react';
import init from './main.js';

class MainApp extends React.Component {
    constructor() {
        super()
        const tick = () => {
            if (document.getElementById('breadcrumb')) init();
            else setTimeout(tick, 10);
        };
        setTimeout(tick, 10);
    }

    render() {
        return (
            <div>
                <div id="debug"></div>
                <div id="fullscreen"></div>
                <div id="loader"></div>

                <input id="searchInput" autocorrect="off" autocapitalize="off" placeholder="Search files"/>
                <button id="searchButton">Search</button>
                <ul id="searchResults"></ul>

                <div id="breadcrumb"></div>
            </div>
        );
    }
}

export default MainApp;
