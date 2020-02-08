import React from 'react';
import {
	Redirect,
	BrowserRouter as Router,
	Route,
	Switch,
	withRouter,
	Link,
	RouteComponentProps,
} from 'react-router-dom';
import { QFrameAPI } from './lib/api';

// import TopBar from './qframe/TopBar';
import LoginForm from './qframe/LoginForm';
import SignUpForm from './qframe/SignUpForm';
import { RecoverForm, PasswordResetForm } from './qframe/RecoverForm';
import UserActivation from './qframe/UserActivation';
// import HelpOverlay from './qframe/HelpOverlay';
import Montaan from './Montaan';

import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const APIServer = document.location.origin.replace(/(:\d+)$/, ':8008') + '/_';

class Logout extends React.Component<{ api: any }> {
	async componentDidMount() {
		await this.props.api.post('/user/logout');
		window.location.href = '/';
	}
	render() {
		return <></>;
	}
}

interface GoBackProps extends RouteComponentProps {
	loggedIn: boolean;
}

class _GoBack extends React.Component<GoBackProps> {
	goBack = (ev: any) => {
		ev.preventDefault();
		if (this.props.location.pathname === '/recoverAccount') {
			this.props.history.push('/login');
		} else {
			this.props.history.push('/');
		}
	};

	render() {
		return (
			<button className="go-back" onClick={this.goBack} aria-label="Go back">
				<FontAwesomeIcon icon={faArrowLeft} />
			</button>
		);
	}
}
const GoBack = withRouter(_GoBack);

class App extends React.Component<any, any> {
	api: QFrameAPI;
	history: any;

	constructor(props: any) {
		super(props);
		this.state = {
			authHeaders: {},
			userInfo: {},
		};
		this.authHeaders = this.state.authHeaders;
		this.api = new QFrameAPI(APIServer);
	}

	setAuthHeaders = (authHeaders: any, fetchUserInfo = true) => {
		const { csrf } = authHeaders;
		this.api.authHeaders = { csrf };
		authHeaders = csrf ? { csrf } : {};
		this.setState({ authHeaders });
		if (fetchUserInfo) this.fetchUserInfo();
	};

	authHeaders = {};

	async componentDidMount() {
		return this.fetchUserInfo();
	}

	async fetchUserInfo() {
		try {
			const userInfo = await this.fetchUserDetails();
			if (!userInfo) {
				throw new Error('Not authenticated');
			}
			this.setState({ firstFetchDone: true });
		} catch (err) {
			this.setState({ authHeaders: {}, userInfo: {}, firstFetchDone: true });
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
		this.history.push('/');
	}

	showHelp = (ev: MouseEvent) => {
		ev.preventDefault();
		this.setState({ showHelp: !this.state.showHelp });
	};

	render() {
		console.log('App render');
		const loggedIn = !!this.state.authHeaders.csrf;
		const { firstFetchDone } = this.state;
		if (!firstFetchDone) {
			return <main />;
		}
		return (
			<Router>
				<div className="App">
					<Switch>
						<Route
							exact
							path={[
								'/',
								'/recoverAccount',
								'/login',
								'/logout',
								'/recover/:token',
								'/activate/:activationToken',
							]}
							component={() => <GoBack loggedIn={loggedIn} />}
						/>
						<Route>
							<GoBack loggedIn={loggedIn} />
						</Route>
					</Switch>
					{!loggedIn && (
						<Link className="login" to="/login">
							Log in
						</Link>
					)}
					{loggedIn && (
						<Link className="logout" to="/logout">
							Log out
						</Link>
					)}
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
							<Route
								exact
								path="/login"
								component={() =>
									loggedIn ? (
										<Redirect to="/" />
									) : (
										<LoginForm
											api={this.api}
											onSuccess={this.setAuthHeaders}
											onCancel={this.goHome}
										/>
									)
								}
							/>
							<Route
								exact
								path="/signup"
								component={() =>
									loggedIn ? (
										<Redirect to="/" />
									) : (
										<SignUpForm
											api={this.api}
											onSuccess={this.setAuthHeaders}
											onCancel={this.goHome}
										/>
									)
								}
							/>
							<Route
								exact
								path="/recoverAccount"
								component={() =>
									loggedIn ? <Redirect to="/" /> : <RecoverForm api={this.api} />
								}
							/>
							<Route
								exact
								path="/recover/:token"
								component={() => {
									return loggedIn ? (
										<Redirect to="/" />
									) : (
										<PasswordResetForm
											api={this.api}
											setAuthHeaders={this.setAuthHeaders}
										/>
									);
								}}
							/>
							<Route
								exact
								path="/logout"
								component={() =>
									!loggedIn ? <Redirect to="/" /> : <Logout api={this.api} />
								}
							/>
							<Route
								path="/activate/:activationToken"
								component={() => <UserActivation api={this.api} />}
							/>
							<Route
								path="/:user/:name"
								component={() => (
									<Montaan
										api={this.api}
										apiPrefix={this.api.server}
										userInfo={this.state.userInfo}
									/>
								)}
							/>
							<Route
								exact
								path="/"
								component={() =>
									loggedIn ? (
										<Montaan
											api={this.api}
											apiPrefix={this.api.server}
											userInfo={this.state.userInfo}
										/>
									) : (
										<LoginForm
											api={this.api}
											onSuccess={this.setAuthHeaders}
											onCancel={this.goHome}
										/>
									)
								}
							/>
						</Switch>
					</main>
				</div>
			</Router>
		);
	}
}

export default App;
