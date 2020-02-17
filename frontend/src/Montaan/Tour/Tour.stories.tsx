import * as React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { storiesOf } from '@storybook/react';
import 'bootstrap/dist/css/bootstrap.css';

import Tour from './';

storiesOf('Montaan/Tour', module).add('Tour', () => (
	<div>
		<div style={{ width: '50%' }}>
			<h3>Tour</h3>

			<p>The Tour component is a tour through a directory tree for quick on-boarding..</p>
			<p>The Tour component is used by MainApp.</p>
			<p>The primary contact for Tour is {'Ilmari Heikkinen <hei@heichen.hk>'}.</p>

			<h4>API</h4>
			<h5>Props</h5>
			<pre>
				<code>{`export interface TourProps extends RouteComponentProps {
	tourMarkdown: string;
}`}</code>
			</pre>
			<h5>Interfaces</h5>
			<pre>
				<code>{`export interface TourProps extends RouteComponentProps {
	tourMarkdown: string;
}`}</code>
			</pre>
		</div>
		<hr />
		<Router>
			<Tour tourMarkdown="### FoonnStep 1nn### BarnnStep 2n" />
		</Router>
	</div>
));
