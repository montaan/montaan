// src/components/RepoSelector/index.test.js

import React from 'react';
import ReactDOM from 'react-dom';
import RepoSelector from './';
import { BrowserRouter as Router } from 'react-router-dom';

it('renders without crashing', () => {
	const div = document.createElement('div');
	ReactDOM.render(
		<Router>
			<RepoSelector
				createRepo={() => {}}
				repos={[
					{ name: 'test', commit_count: 2, owner: 'foo', processing: false, url: '' },
				]}
			/>
		</Router>,
		div
	);
});
