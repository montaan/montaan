// src/%%TARGET%%/%%NAME%%/index.test.js

import React from 'react';
import ReactDOM from 'react-dom';
import %%NAME%% from './';

it('renders without crashing', () => {
	const div = document.createElement('div');
	ReactDOM.render(<%%NAME%% />, div);
});
