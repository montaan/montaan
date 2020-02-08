// src/Montaan/TreeView/TreeView.test.js

import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { render } from '@testing-library/react';
import TreeView from './';

import styles from './TreeView.module.scss';

test('renders without crashing', () => {
	const { baseElement } = render(
		<Router>
			<TreeView />
		</Router>
	);
	expect(baseElement).toBeInTheDocument();
});
