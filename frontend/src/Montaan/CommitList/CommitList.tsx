// src/Montaan/CommitList/CommitList.tsx

import React, { useState } from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import styles from './CommitList.module.scss';
import { CommitData } from '../CommitParser/parse_commits';
import { ActiveCommitData, CommitFilter } from '../MainApp';

export interface CommitListProps extends RouteComponentProps {
	commitData: CommitData;
	activeCommitData: ActiveCommitData;
	setCommitFilter: (commitFilter: CommitFilter) => void;
	commitFilter: CommitFilter;
}

const CommitList = (props: CommitListProps) => {
	return (
		<div
			className={styles.CommitList}
			data-filename={'frontend/' + __filename.replace(/\\/g, '/')}
		></div>
	);
};

export default withRouter(CommitList);
