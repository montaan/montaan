import React from 'react';
import './style.css';
import init from '../../main.js';

export default class MainView extends React.Component {
    constructor() {
        super();
        const tick = () => {
            if (document.getElementById('breadcrumb')) {
                console.log("MainView tick");
                init();
            } else setTimeout(tick, 10);
        };
        setTimeout(tick, 10);
    }

    render() {
        return <></>;
    }
}
