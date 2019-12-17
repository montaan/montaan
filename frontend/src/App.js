import React from 'react';
import { Redirect, BrowserRouter as Router, Route, Switch, withRouter, Link } from "react-router-dom";

// import TopBar from './TopBar';
import LoginForm from './LoginForm';
import {RecoverForm, PasswordResetForm} from './RecoverForm';
import UserActivation from './UserActivation';
// import HelpOverlay from './HelpOverlay';

import { Client } from './lib/quickgres-frontend';

import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const APIServer = document.location.origin.replace(/(:\d+)$/, ':8008') + "/_";

class Logout extends React.Component {
    async componentDidMount() {
        await this.props.api.post('/user/logout');
        window.location = '/';
    }
    render() {
        return <></>;
    }
}

class _GoBack extends React.Component {

    goBack = (ev) => {
        ev.preventDefault();
        if (this.props.location.pathname === '/recoverAccount') {
            this.props.history.push('/login');
        } else {
            this.props.history.push('/');
        }
    }

    render() {
        return (
            <button className="go-back" onClick={this.goBack} aria-label="Go back">
                <FontAwesomeIcon icon={faArrowLeft}/>
            </button>
        );
    }
}
const GoBack = withRouter(_GoBack);

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            authHeaders: {},
            userInfo: {}
        };
        this.authHeaders = this.state.authHeaders;
        this.api = (path, config) => {
            const configHeaders = config ? config.headers : {};
            config = { credentials: 'include', ...config, headers: {...configHeaders, ...this.state.authHeaders, ...this.authHeaders}};
            return fetch(this.api.server + path, config);
        };
        this.api.server = APIServer;
        this.api.parseResponse = async (res) => {
            if (res.status !== 200) throw Error("Response failed: " + res.status + " " +  res.statusText);
            const mime = res.headers.get('content-type');
            if (mime === 'application/json') return res.json();
            else if (mime === 'application/x-postgres') {
                const arrayBuffer = await res.arrayBuffer();
                const client = new Client(1);
                client.onData(arrayBuffer);
                return client.stream.rows.map(r => r.toObject());
            } else if (/^text/.test(mime)) return res.text();
            else return res.arrayBuffer();
        };
        this.api.post = async (path, body, config) => this.api.parseResponse(await this.api(path, {method: 'POST', body: JSON.stringify(body), ...config}));
        this.api.get = async (path, config) => this.api.parseResponse(await this.api(path, config));
    }

    setAuthHeaders = (authHeaders, fetchUserInfo=true) => {
        const { csrf } = authHeaders;
        this.authHeaders = { csrf };
        authHeaders = csrf ? { csrf } : {};
        this.setState({authHeaders});
        if (fetchUserInfo) this.fetchUserInfo();
    }

    authHeaders = {};

    async componentDidMount() {
        return this.fetchUserInfo();
    }

    async fetchUserInfo(mountTime) {
        try {
            const userInfo = await this.fetchUserDetails();
            if (!userInfo) {
                throw new Error("Not authenticated");
            }
            this.setState({firstFetchDone: true});
        } catch(err) {
            this.setState({authHeaders: {}, userInfo: {}, firstFetchDone: true});
            delete localStorage.authHeaders;
            delete sessionStorage.authHeaders;
        }
    }

    fetchUserDetails = async () => {
        // Used cached userInfo if we have such
        const res = await this.api.get('/user/view');
        if (res.status || res.length === 0) {
            this.setState({ authHeaders: {}, userInfo: {} });
            delete localStorage.authHeaders;
            delete sessionStorage.authHeaders;
            return null;
        } else {
            const userInfo = res[0];
            const csrf = userInfo.csrf;
            delete userInfo.csrf;
            this.setState({ userInfo });
            this.setAuthHeaders({ csrf }, false);
        }
        return res;
    };

    goHome() {
        // Not bound to App on purpose, to let subcomponents access Router.
        this.history.push( '/' );
    }

    showHelp = (ev) => {
        ev.preventDefault();
        this.setState({showHelp: !this.state.showHelp});
    };

    render() {
        const loggedIn = !!this.state.authHeaders.csrf;
        const { firstFetchDone } = this.state;
        if (!firstFetchDone) {
            return <main/>
        }
        return (
            <Router>
                <div className="App">
                    <Switch>
                        <Route exact path={["/","/recoverAccount","/login","/logout","/recover/:token","/activate/:activationToken"]} component={(match) => 
                            <GoBack loggedIn={loggedIn} />
                        }/>
                        <Route>
                            <GoBack loggedIn={loggedIn} />
                        </Route>
                    </Switch>
                    {!loggedIn && <Link className="login" to="/login">Log in</Link>}
                    {loggedIn && <Link className="logout" to="/logout">Log out</Link>}
                    {/* <button className="show-help" onClick={this.showHelp}>Help No Help</button> */}
                    {/* { showHelp && <HelpOverlay /> } */}
                    {/* <header className="App-header">
                        <TopBar 
                            api={this.api} 
                            userInfo={userInfo}
                            setAuthHeaders={this.setAuthHeaders} 
                            loggedIn={loggedIn} 
                        />

                    </header> */}
                    <main>
                        <Switch>
                            <Route exact path="/login" component={(_match) =>
                                loggedIn 
                                    ? <Redirect to="/"/>
                                    : <LoginForm api={this.api} onSuccess={this.setAuthHeaders} onCancel={this.goHome} />
                            }/>
                            <Route exact path="/recoverAccount" component={(_match) =>
                                loggedIn 
                                    ? <Redirect to="/"/>
                                    : <RecoverForm api={this.api}/>
                            }/>
                            <Route exact path="/recover/:token" component={(_match) => {
                                return loggedIn 
                                    ? <Redirect to="/"/>
                                    : <PasswordResetForm api={this.api} setAuthHeaders={this.setAuthHeaders}/>
                            }}/>
                            <Route exact path="/logout" component={(_match) =>
                                !loggedIn 
                                    ? <Redirect to="/"/>
                                    : <Logout api={this.api} />
                            }/>
                            <Route path="/activate/:activationToken" component={(match) => 
                                <UserActivation api={this.api} />
                            }/>
                        </Switch>
                    </main>
                </div>
            </Router>
        );
    }
}

export default App;
