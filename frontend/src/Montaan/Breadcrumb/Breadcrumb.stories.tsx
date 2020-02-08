import * as React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { storiesOf } from '@storybook/react';
import 'bootstrap/dist/css/bootstrap.css';

import Breadcrumb from './';

storiesOf('Montaan/Breadcrumb', module).add('Breadcrumb', () => (
	<div>
		<div style={{ width: '50%', marginTop: '120px' }}>
			<h3>Breadcrumb</h3>

			<p>
				The Breadcrumb component is a clickable list of path components for navigating the
				file tree.
			</p>
			<p>The Breadcrumb component is used by the MainApp screen.</p>
			<p>The primary reviewer for Breadcrumb is {`Ilmari Heikkinen <hei@heichen.hk>`}.</p>
			<h4>API</h4>
			<h5>Props</h5>
			<pre>
				<code>{`export interface BreadcrumbProps extends RouteComponentProps {
	navigationTarget: string;
	fileTree: any;
}`}</code>
			</pre>
			<h5>Interfaces</h5>
			<pre>
				<code>{`export interface BreadcrumbProps extends RouteComponentProps {
	navigationTarget: string;
	fileTree: any;
}`}</code>
			</pre>
		</div>
		<Router>
			<Breadcrumb
				navigationTarget="/foo/bar"
				fileTree={{
					tree: {
						title: '',
						entries: {
							foo: { title: 'foo', entries: { bar: { title: '', entries: null } } },
						},
					},
				}}
			/>
		</Router>
	</div>
));
