// src/components/HelpOverlay/index.test.js

import React from 'react';
import { render } from '@testing-library/react';
import HelpOverlay from './';

import styles from './css/style.module.scss';

test('renders without crashing', () => {
	const { baseElement } = render(<HelpOverlay />);
	expect(baseElement).toBeInTheDocument();
});
