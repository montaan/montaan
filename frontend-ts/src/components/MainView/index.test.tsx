// src/components/MainView/index.test.js

import React from 'react';
import { render } from '@testing-library/react';
import MainView from './';

import styles from './css/style.module.scss';

test('renders without crashing', () => {
	const { baseElement } = render(<MainView />);
	expect(baseElement).toBeInTheDocument();
});
