// src/Montaan/Introduction/Introduction.tsx

import React from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import styles from './Introduction.module.scss';

export interface IntroductionProps extends RouteComponentProps {
	userInfo: any;
}

const Introduction = ({ userInfo }: IntroductionProps) => {
	return (
		<div className={styles.Introduction}>
			<h1>Climb the Montaan</h1>
			<p>Welcome to the most beautiful way to read your code</p>
			<h2>Get started</h2>
			<p>Import your first repo</p>
			<p>Create an empty repo and push to it</p>
			<p>Make your Montaan higher &mdash; First Commit</p>
		</div>
	);
};

export default withRouter(Introduction);
