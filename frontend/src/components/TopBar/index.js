import React from 'react';
import { Link } from 'react-router-dom';
import { withRouter } from 'react-router-dom';
import Button from "react-bootstrap/Button";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faKey, faSignOutAlt, faAddressBook, faQrcode, faBars } from '@fortawesome/free-solid-svg-icons'

import './style.css';

class TopBar extends React.Component {

    login = (ev) => { 
        ev.preventDefault(); 
        this.props.history.push('/login');
    };

    logout = async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        await this.props.api('/user/logout', {method: 'POST'});
        window.location = '/';
    };

    toggleMenu = (ev) => {
        ev.currentTarget.parentNode.classList.toggle('open');
        ev.preventDefault();
        ev.stopPropagation();
    };

    render() {
        const { loggedIn } = this.props;
        return (
            <div className={`top-bar${loggedIn ? ' logged-in' : ''}`}>
                <Button type="button" variant="primary" className="menu" onClick={this.toggleMenu} aria-label="Toggle menu"><FontAwesomeIcon icon={faBars} /></Button>
                { loggedIn && <Button type="button" variant="danger" className='logout' onClick={this.logout} aria-label="Log out"><FontAwesomeIcon icon={faSignOutAlt} /></Button> }
                { !loggedIn && <Button type="button" variant="success" className='login' onClick={this.login} aria-label="Log in"><FontAwesomeIcon icon={faKey} /></Button> }
            </div>
        );
    }
}

export default withRouter(TopBar);