// src/components/SignupForm/index.test.js

import React from 'react';
import { render } from '@testing-library/react';
import SignupForm from './';

import styles from './css/style.module.scss';

test('renders without crashing', () => {
	const { baseElement } = render(<SignupForm />);
	expect(baseElement).toBeInTheDocument();
});
