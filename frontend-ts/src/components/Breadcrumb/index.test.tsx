// src/components/Breadcrumb/index.test.js

import React from 'react';
import { render } from '@testing-library/react';
import Breadcrumb from './';

import styles from './css/style.module.scss';

test('renders without crashing', () => {
	const { baseElement } = render(<Breadcrumb />);
	expect(baseElement).toBeInTheDocument();
});
