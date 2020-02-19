import * as React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { storiesOf } from '@storybook/react';
import 'bootstrap/dist/css/bootstrap.css';

import Player from './';

storiesOf('Montaan/Player', module).add('Player', () => (
	<div>
		<div style={{ width: '50%' }}>
			<h3>Player</h3>

			<p>The Player component is a little music player for playing .playlist files.</p>
			<p>The Player component is used by MainApp.</p>
			<p>The primary contact for Player is {'Ilmari Heikkinen <hei@heichen.hk>'}.</p>

			<h4>API</h4>
			<h5>Props</h5>
			<pre>
				<code>{`export interface PlayerProps extends RouteComponentProps {
	fileTree: FileTree;
	navigationTarget: string;
	api: QFrameAPI;
	repoPrefix: string;
}`}</code>
			</pre>
			<h5>Interfaces</h5>
			<pre>
				<code>{`export interface PlayerProps extends RouteComponentProps {
	fileTree: FileTree;
	navigationTarget: string;
	api: QFrameAPI;
	repoPrefix: string;
}`}</code>
			</pre>
		</div>
		<hr />
		<Router>
			<Player
				fileTree={{} as any}
				navigationTarget="foo/bar/baz"
				api={{} as any}
				repoPrefix="foo/bar"
			/>
		</Router>
	</div>
));
