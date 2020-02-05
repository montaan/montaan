// src/components/MainApp/MainApp.tsx

import React from 'react';
import { withRouter } from 'react-router-dom';

import styles from './MainApp.module.scss';

export interface MainAppProps {
};

const MainApp = (props: MainAppProps) => {
	return (
		<div className={styles.MainApp}>
		</div>
	);
};

export default withRouter(MainApp);
