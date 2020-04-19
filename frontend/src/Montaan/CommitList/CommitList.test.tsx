// src/Montaan/CommitList/CommitList.test.tsx

import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { render } from '@testing-library/react';
import CommitList from './';
import { CommitData } from '../CommitParser/parse_commits';
import { ActiveCommitData } from '../MainApp';

import styles from './CommitList.module.scss';

test('renders without crashing', () => {
	const { baseElement } = render(
		<Router>
			<CommitList
				commitData={CommitData.mock}
				activeCommitData={ActiveCommitData.mock}
				setCommitFilter={() => {}}
				commitFilter={{}}
			/>
		</Router>
	);
	expect(baseElement).toBeInTheDocument();
	expect(baseElement.querySelector(`.${styles.CommitList}`)).toBeDefined();
});
