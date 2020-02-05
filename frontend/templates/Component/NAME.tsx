// src/TARGET/NAME/NAME.tsx

import React from 'react';
import { withRouter } from 'react-router-dom';

import styles from './NAME.module.scss';

export interface NAMEProps {
};

const NAME = (props: NAMEProps) => {
	return (
		<div className={styles.NAME}>
		</div>
	);
};

export default withRouter(NAME);
