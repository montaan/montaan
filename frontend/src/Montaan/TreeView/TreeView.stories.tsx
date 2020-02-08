import * as React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { storiesOf } from '@storybook/react';
import 'bootstrap/dist/css/bootstrap.css';

import TreeView from './';

storiesOf('Montaan/TreeView', module).add('TreeView', () => (
	<div>
		<div style={{ width: '50%' }}>
			<h3>TreeView</h3>

			<p>
				The TreeView component is a zoomable dynamic view to the Montaan filesystem tree for
				navigating and manipulating the contents of the tree.
			</p>
			<p>The TreeView component is used by the MainApp component.</p>
			<p>The primary contact for TreeView is {'Ilmari Heikkinen <hei@heichen.hk>'}.</p>

			<h4>API</h4>
		</div>
		<hr />
		<Router>
			{/* <TreeView
				goToTarget={undefined}
				navUrl={'/foo/bar'}
				activeCommitData={null}
				diffsLoaded={0}
				fileTree={{ tree: { title: '', entries: null }, count: 1 }}
				commitData={null}
				frameRequestTime={0}
				api={{}}
				repoPrefix={'foo/bar'}
				navigationTarget={'/foo/bar'}
				searchLinesRequest={0}
				searchResults={[]}
				searchQuery={''}
				commitFilter={{}}
				addLinks={() => {}}
				setLinks={() => {}}
				links={[]}
				setNavigationTarget={() => {}}
			/> */}
		</Router>
	</div>
));
