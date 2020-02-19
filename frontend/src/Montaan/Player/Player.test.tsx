// src/Montaan/Player/Player.test.js

import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { render } from '@testing-library/react';
import Player from './';

import styles from './Player.module.scss';

test('renders without crashing', () => {
	const { baseElement } = render(
		<Router>
			<Player
				fileTree={{} as any}
				navigationTarget="foo/bar/baz"
				api={{} as any}
				repoPrefix="foo/bar"
			/>
		</Router>
	);
	expect(baseElement).toBeInTheDocument();
});
