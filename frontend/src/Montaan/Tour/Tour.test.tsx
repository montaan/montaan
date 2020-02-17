// src/Montaan/Tour/Tour.test.js

import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { render } from '@testing-library/react';
import Tour from './';

import styles from './Tour.module.scss';

test('renders without crashing', () => {
	const { baseElement } = render(
		<Router>
			<Tour tourMarkdown="### FoonnStep 1nn### BarnnStep 2n" />
		</Router>
	);
	expect(baseElement).toBeInTheDocument();
});
