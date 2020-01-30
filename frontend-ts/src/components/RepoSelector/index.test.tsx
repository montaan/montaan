// src/components/RepoSelector/index.test.js

import React from 'react';
import { render } from '@testing-library/react';
import RepoSelector from './';

import styles from './css/style.module.scss';

test('renders without crashing', () => {
	const { baseElement } = render(<RepoSelector />);
	expect(baseElement).toBeInTheDocument();
});
