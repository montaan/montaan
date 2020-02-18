// src/Montaan/TourSelector/TourSelector.test.js

import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { render } from '@testing-library/react';
import TourSelector from './';

import styles from './TourSelector.module.scss';

test('renders without crashing', () => {
	const { baseElement } = render(
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
				navigationTarget="/foo/bar"
				api={api}
				repoPrefix="foo/bar"
			/> */}
		</Router>
	);
	expect(baseElement).toBeInTheDocument();
});
