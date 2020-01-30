// src/components/CommitControls/index.test.js

import React from 'react';
import { render } from '@testing-library/react';
import CommitControls from './';

import styles from './css/style.module.scss';

test('renders without crashing', () => {
	const { baseElement } = render(<CommitControls />);
	expect(baseElement).toBeInTheDocument();
});
