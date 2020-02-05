// src/components/CommitInfo/index.test.js

import React from 'react';
import { render } from '@testing-library/react';
import CommitInfo from './';

import styles from './css/style.module.scss';

test('renders without crashing', () => {
	const { baseElement } = render(<CommitInfo 
		loadFileDiff={(() => {}) as any}
		loadFile={(() => {}) as any}
		commitFilter={{}}
		setCommitFilter={(() => {}) as any}
		navigationTarget={''}
		repoPrefix={''}
		closeFile={() => {}}
		loadDiff={(() => {}) as any}
		activeCommitData={{authors: [], authorCommitCounts: {}, commits: []}}
		commitData={{commits: [], commitIndex: {}}}
		fileContents={null}
		showFileCommitsClick={(() => {}) as any}
	/>);
	expect(baseElement).toBeInTheDocument();
});
