import React from 'react';
import init from './main.js';
import CommitControls from './components/CommitControls';
import CommitInfo from './components/CommitInfo';
import Search from './components/Search';
import Breadcrumb from './components/Breadcrumb';

class MainApp extends React.Component {
    constructor() {
        super()
        const tick = () => {
            if (document.getElementById('breadcrumb')) {
                console.log("MainApp tick");
                init();
            } else setTimeout(tick, 10);
        };
        setTimeout(tick, 10);
    }

    render() {
        console.log("MainApp render");
        return (
            <div>
                <div id="debug"></div>
                <div id="fullscreen"></div>
                <div id="loader"></div>

                <Search />
                <Breadcrumb />
                <CommitControls />
                <CommitInfo />
            </div>
        );
    }
}

export default MainApp;
