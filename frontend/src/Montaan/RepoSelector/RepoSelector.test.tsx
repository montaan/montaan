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
				repos={[
					{
						name: 'foo',
						owner: 'bar',
						url: '',
						branches: [['master', 20]],
						processing: false,
					},
				]}
				createRepo={async (name: string, url?: string) =>
					new Promise((r) =>
						r({
							name: 'foo',
							owner: 'bar',
							url: '',
							branches: [['master', 20]],
							processing: false,
						})
					)
				}
			/>
		</Router>,
		div
	);
});
