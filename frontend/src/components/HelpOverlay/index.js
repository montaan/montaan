import React from 'react';

import './style.css';

class HelpOverlay extends React.Component {

    trackSelector(trackEl, selector) {
        const el = document.querySelector(selector);
        if (el) {
            const box = el.getBoundingClientRect();
            trackEl.style.left = box.left + 'px';
            trackEl.style.top = box.top + 'px';
            trackEl.classList.add('visible');
        } else {
            trackEl.classList.remove('visible')
        }
    }

    tick = () => {
        const nodes = window.document.querySelectorAll('.help-overlay > *');
        for (let i = 0; i < nodes.length; i++) {
            this.trackSelector(nodes[i], nodes[i].dataset.track);
        }
        if (this.frameLoop) {
            requestAnimationFrame(this.tick);
        }
    }

    shouldComponentUpdate(nextProps) {
        return true;
    }

    componentDidMount() {
        this.frameLoop = true;
        requestAnimationFrame(this.tick);
    }

    componentWillUnmount() {
        this.frameLoop = false;
    }

    render() {
        return (
            <div className="help-overlay">
                <div className="help-menu" data-track=".top-bar .menu">
                    Menu
                </div>
                <div className="help-login help-menu" data-track=".top-bar.open .login">
                    Log in
                </div>
                <div className="help-logout help-menu" data-track=".top-bar.open .logout">
                    Log out
                </div>
            </div>
        );
    }
}

export default HelpOverlay;