import * as React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { storiesOf } from '@storybook/react';
import 'bootstrap/dist/css/bootstrap.css';

import TourSelector from './';

storiesOf('Montaan/TourSelector', module).add('TourSelector', () => (
	<div>
		<div style={{ width: '50%' }}>
			<h3>TourSelector</h3>

			<p>
				The TourSelector component is a component to start tours inside a file tree for
				finding and surfacing tours relevant to the current location.
			</p>
			<p>The TourSelector component is used by MainApp.</p>
			<p>The primary contact for TourSelector is {'Ilmari Heikkinen <hei@heichen.hk>'}.</p>

			<h4>API</h4>
			<h5>Props</h5>
			<pre>
				<code>{`export interface TourSelectorProps extends RouteComponentProps {
	fileTree: FileTree;
	navigationTarget: string;
	api: QFrameAPI;
	repoPrefix: string;
}`}</code>
			</pre>
			<h5>Interfaces</h5>
			<pre>
				<code>{`export interface TourSelectorProps extends RouteComponentProps {
	fileTree: FileTree;
	navigationTarget: string;
	api: QFrameAPI;
	repoPrefix: string;
}`}</code>
			</pre>
		</div>
		<hr />
		<Router>
			{/* <TourSelector
				fileTree={{
					tree: {
						title: 'foo',
						entries: {
							'.tour.md': { title: '.tour.md', entries: null },
							bar: {
								title: 'bar',
								entries: {
									'.tour.md': { title: '.tour.md', entries: null },
								},
							},
						},
					},
					count: 4,
				}}
				navigationTarget="/foo/bar",
				api={api}
				repoPrefix="foo/bar"
			/> */}
		</Router>
	</div>
));
