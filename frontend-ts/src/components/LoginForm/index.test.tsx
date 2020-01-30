// src/components/LoginForm/index.test.js

import React from 'react';
import { render } from '@testing-library/react';
import LoginForm from './';

import styles from './css/style.module.scss';

test('renders without crashing', () => {
	const { baseElement } = render(<LoginForm />);
	expect(baseElement).toBeInTheDocument();
});
