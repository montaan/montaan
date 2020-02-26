// src/components/MainApp/MainApp.test.js

import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { render } from '@testing-library/react';
import MainApp from './';

import styles from './MainApp.module.scss';

test('renders without crashing', () => {
	const { baseElement } = render(
		<Router>
			<MainApp userInfo={{}} api={{}} apiPrefix="" />
		</Router>
	);
	expect(baseElement).toBeInTheDocument();
	expect(baseElement.querySelector('.' + styles.MainApp)).toBeDefined();
});
