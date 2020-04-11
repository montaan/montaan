// src/Montaan/Player/Player.test.js

import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { render } from '@testing-library/react';
import Player from './';

import styles from './Player.module.scss';
import QFrameAPI from '../../lib/api';
import { FSEntry } from '../lib/filesystem';

test('renders without crashing', () => {
	const { baseElement } = render(
		<Router>
			<Player
				fileTree={new FSEntry()}
				fileTreeUpdated={1}
				navigationTarget="foo/bar/baz"
				api={QFrameAPI.mock}
				repoPrefix="foo/bar"
			/>
		</Router>
	);
	expect(baseElement).toBeInTheDocument();
});
