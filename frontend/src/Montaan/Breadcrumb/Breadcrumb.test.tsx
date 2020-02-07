// src/Montaan/Breadcrumb/Breadcrumb.test.js

import { render } from '@testing-library/react';
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Breadcrumb from './';

test('renders without crashing', () => {
	const { baseElement } = render(
		<Router>
			<Breadcrumb navigationTarget="/foo/bar/baz" fileTree={{}} />
		</Router>
	);
	expect(baseElement).toBeInTheDocument();
});
