// src/components/RepoSelector/index.test.js

import React from 'react';
import ReactDOM from 'react-dom';
import RepoSelector from './';

it('renders without crashing', () => {
	const div = document.createElement('div');
	ReactDOM.render(<RepoSelector />, div);
});
