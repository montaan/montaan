import * as React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { storiesOf } from '@storybook/react';
import 'bootstrap/dist/css/bootstrap.css';

import Introduction from './';
import { UserInfo } from '../MainApp';

storiesOf('Montaan/Introduction', module).add('Introduction', () => (
	<div>
		<div style={{ width: '50%' }}>
			<h3>Introduction</h3>

			<p>
				The Introduction component is an onboarding screen for making new developers succeed
				on the Montaan.
			</p>
			<p>The Introduction component is used by MainApp.</p>
			<p>The primary contact for Introduction is {'Ilmari Heikkinen <hei@heichen.hk>'}.</p>

			<h4>API</h4>
			<h5>Props</h5>
			<pre>
				<code>{`export interface IntroductionProps extends RouteComponentProps {
	userInfo: UserInfo;
}`}</code>
			</pre>
			<h5>Interfaces</h5>
			<pre>
				<code>{`export interface IntroductionProps extends RouteComponentProps {
	userInfo: UserInfo;
}`}</code>
			</pre>
		</div>
		<hr />
		<Router>
			<Introduction userInfo={UserInfo.mock} />
		</Router>
	</div>
));
