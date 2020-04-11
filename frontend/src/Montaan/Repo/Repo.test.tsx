// src/Montaan/Repo/Repo.test.js

import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { render } from '@testing-library/react';
import { RepoInfo } from '../Filesystems/MontaanUserReposFilesystem';
import Repo from './';

import styles from './Repo.module.scss';

test('renders without crashing', () => {
	const { baseElement } = render(
		<Router>
			<Repo repo={RepoInfo.mock} renameRepo={async (a, b) => {}} />
		</Router>
	);
	expect(baseElement).toBeInTheDocument();
});
