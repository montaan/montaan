// src/components/CommitInfo/index.test.js

import React from 'react';
import { render } from '@testing-library/react';
import CommitInfo from './';

import styles from './CommitInfo.module.scss';

test('renders without crashing', () => {
	const { baseElement } = render(
		<CommitInfo
			searchQuery={''}
			diffsLoaded={0}
			addLinks={(() => {}) as any}
			setLinks={(() => {}) as any}
			links={[]}
			commitsVisible={true}
			setCommitsVisible={(() => {}) as any}
			path={'/'}
			loadFileDiff={(() => {}) as any}
			loadFile={(() => {}) as any}
			commitFilter={{}}
			setCommitFilter={(() => {}) as any}
			navigationTarget={''}
			repoPrefix={'bar/baz'}
			branch="foo"
			closeFile={() => {}}
			loadDiff={(() => {}) as any}
			activeCommitData={{ files: [], authors: [], authorCommitCounts: {}, commits: [] }}
			commitData={{ authors: {}, commitCount: 0, commits: [], commitIndex: {} }}
			fileContents={undefined}
		/>
	);
	expect(baseElement).toBeInTheDocument();
});
