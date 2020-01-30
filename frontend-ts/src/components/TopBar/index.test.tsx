// src/components/TopBar/index.test.js

import React from 'react';
import { render } from '@testing-library/react';
import TopBar from './';

import styles from './css/style.module.scss';

test('renders without crashing', () => {
	const { baseElement } = render(<TopBar />);
	expect(baseElement).toBeInTheDocument();
});
