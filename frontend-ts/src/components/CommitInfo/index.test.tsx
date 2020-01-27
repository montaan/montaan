// src/components/CommitInfo/index.test.js

import React from 'react';
import { render } from '@testing-library/react';
import CommitInfo from './';

import styles from './css/style.module.scss';

test('renders without crashing', () => {
	const { baseElement } = render(<CommitInfo />);
	expect(baseElement).toBeInTheDocument();
});
