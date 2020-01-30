// src/components/Search/index.test.js

import React from 'react';
import { render } from '@testing-library/react';
import Search from './';

import styles from './css/style.module.scss';

test('renders without crashing', () => {
	const { baseElement } = render(<Search />);
	expect(baseElement).toBeInTheDocument();
});
