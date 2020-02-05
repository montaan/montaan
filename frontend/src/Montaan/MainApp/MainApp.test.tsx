// src/components/MainApp/MainApp.test.js

import React from 'react';
import { render } from '@testing-library/react';
import MainApp from './';

import styles from './MainApp.module.scss';

test('renders without crashing', () => {
	const { baseElement } = render(<MainApp />);
	expect(baseElement).toBeInTheDocument();
});
