// src/components/RecoverForm/index.test.js

import React from 'react';
import { render } from '@testing-library/react';
import RecoverForm from './';

import styles from './css/style.module.scss';

test('renders without crashing', () => {
	const { baseElement } = render(<RecoverForm />);
	expect(baseElement).toBeInTheDocument();
});
