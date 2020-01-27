// src/%%TARGET%%/%%NAME%%/index.test.js

import React from 'react';
import { render } from '@testing-library/react';
import %%NAME%% from './';

import styles from './css/style.module.scss';

test('renders without crashing', () => {
	const { baseElement } = render(<%%NAME%% />);
	expect(baseElement).toBeInTheDocument();
});
