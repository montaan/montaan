// src/Montaan/Breadcrumb/Breadcrumb.test.js

import { render } from '@testing-library/react';
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Breadcrumb from './';
import { FSDirEntry } from '../Filesystems';

test('renders without crashing', () => {
	const { baseElement } = render(
		<Router>
			<Breadcrumb
				navigationTarget="/foo/bar/baz"
				fileTree={{ count: 0, tree: new FSDirEntry() }}
				fileTreeUpdated={1}
			/>
		</Router>
	);
	expect(baseElement).toBeInTheDocument();
});
