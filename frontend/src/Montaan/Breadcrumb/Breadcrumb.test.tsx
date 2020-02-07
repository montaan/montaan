// src/Montaan/Breadcrumb/Breadcrumb.test.js

import React from 'react';
import { render } from '@testing-library/react';
import Breadcrumb from './';

import styles from './Breadcrumb.module.scss';

test('renders without crashing', () => {
	const { baseElement } = render(<Breadcrumb navigationTarget="/foo/bar/baz" fileTree={{}} />);
	expect(baseElement).toBeInTheDocument();
});
