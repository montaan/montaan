// src/Montaan/Repo/Repo.tsx

import React, { useCallback } from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import styles from './Repo.module.scss';
import Form from 'react-bootstrap/Form';
import { RepoInfo } from '../lib/filesystem/MontaanUserReposFilesystem';

export interface RepoProps extends RouteComponentProps {
	repo: RepoInfo;
	renameRepo(repo: RepoInfo, newName: string): Promise<void>;
}

function stop(ev: React.MouseEvent) {
	ev.preventDefault();
	ev.stopPropagation();
}

const Repo = ({ repo, renameRepo }: RepoProps) => {
	const rename = useCallback(
		(ev) => {
			ev.preventDefault();
			const newName = ev.target.querySelector('input').value;
			if (newName && newName !== repo.name) {
				renameRepo(repo, newName);
			}
		},
		[repo, renameRepo]
	);
	return (
		<div className={styles.Repo} data-filename={'frontend/' + __filename.replace(/\\/g, '/')}>
			<span className={styles.repoOwner}>{repo.owner}</span>
			<span className={styles.repoName}>{repo.name}</span>
			<span className={styles.repoCommits}>
				{repo.branches.map((b) => b.join(' ')).join(', ')}
			</span>
			{repo.processing && <span className={styles.repoProcessing}>[processing]</span>}
			<span className={styles.repoUrl}>{repo.url}</span>
			<Form onSubmit={rename}>
				<Form.Group>
					<Form.Control onClick={stop} placeholder={'Rename'} />
				</Form.Group>
			</Form>
		</div>
	);
};

export default withRouter(Repo);
