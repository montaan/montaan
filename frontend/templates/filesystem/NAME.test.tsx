// src/TARGET/NAME/NAME.test.js

import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { render } from '@testing-library/react';
import NAME from './';

import styles from './NAME.module.scss';

test('renders without crashing', () => {
	const { baseElement } = render(
		<Router>
			<NAME PROPS_USE />
		</Router>
	);
	expect(baseElement).toBeInTheDocument();
	expect(baseElement.querySelector(`.${styles.NAME}`)).toBeDefined();
});
