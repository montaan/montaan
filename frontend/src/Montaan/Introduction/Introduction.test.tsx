// src/Montaan/Introduction/Introduction.test.js

import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { render } from '@testing-library/react';
import Introduction from './';

import styles from './Introduction.module.scss';

test('renders without crashing', () => {
	const { baseElement } = render(
		<Router>
			<Introduction userInfo={{ name: 'Jaakko' }} />
		</Router>
	);
	expect(baseElement).toBeInTheDocument();
});
