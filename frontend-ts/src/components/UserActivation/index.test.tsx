// src/components/UserActivation/index.test.js

import React from 'react';
import { render } from '@testing-library/react';
import UserActivation from './';

import styles from './css/style.module.scss';

test('renders without crashing', () => {
	const { baseElement } = render(<UserActivation />);
	expect(baseElement).toBeInTheDocument();
});
