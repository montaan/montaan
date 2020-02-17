// src/Montaan/Tour/Tour.test.js

import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { render } from '@testing-library/react';
import Tour from './';

import styles from './Tour.module.scss';

test('renders without crashing', () => {
	const { baseElement } = render(
		<Router>
			<Tour tourMarkdown="### Foo\n\nStep 1nn### Bar\n\nStep 2\n" repoPrefix="foo/bar" />
		</Router>
	);
	expect(baseElement).toBeInTheDocument();
});
