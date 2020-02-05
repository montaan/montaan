import React from 'react';
import ReactDOM from 'react-dom';

import 'bootstrap/dist/css/bootstrap.css';
import './css/index.css';
import './css/main.scss';

import App from './App';
import * as serviceWorker from './serviceWorker';

document.body.classList.add(/mobile/i.test(window.navigator.userAgent) ? 'mobile' : 'desktop');

var firstPoint;

window.addEventListener('mousemove', function(event) {
	if (!firstPoint) {
		firstPoint = createPoint(event);
	} else if (getDistance(event, firstPoint, 'client') >= 100) {
		var clientDistance = getDistance(event, firstPoint, 'client');
		var screenDistance = getDistance(event, firstPoint, 'screen');
		var zoomPct = Math.round((100 * screenDistance) / clientDistance);
		var zooms = [25, 33, 50, 67, 75, 80, 90, 100, 110, 125, 150, 175, 200, 250, 300, 400, 500];
		zooms.sort((a, b) => Math.abs(a - zoomPct) - Math.abs(b - zoomPct));
		window.pageZoom = zooms[0];
		firstPoint = null;
	}
});

function createPoint(event) {
	return {
		clientX: event.clientX,
		clientY: event.clientY,
		screenX: event.screenX,
		screenY: event.screenY,
	};
}

function getDistance(pointA, pointB, property) {
	var x = pointA[property + 'X'] - pointB[property + 'X'];
	var y = pointA[property + 'Y'] - pointB[property + 'Y'];
	return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register({ onUpdate: () => window.location.reload() });
