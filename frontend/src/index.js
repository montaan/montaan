import React from 'react';
import ReactDOM from 'react-dom';

import 'bootstrap/dist/css/bootstrap.css';
import './css/index.css';
import './css/main.scss';

import App from './App';
import * as serviceWorker from './serviceWorker';

document.body.classList.add(/mobile/i.test(window.navigator.userAgent) ? 'mobile' : 'desktop');

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register({ onUpdate: () => window.location.reload() });
