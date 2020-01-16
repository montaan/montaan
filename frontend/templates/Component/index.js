// src/%%TARGET%%/%%NAME%%/index.js

import React, { Component } from 'react';

import strict from '../../lib/strictProxy.js'
import styles_ from './css/style.module.scss';
const styles = strict(styles_, '%%TARGET%%/%%NAME%%/css/style.module.scss');

export default class %%NAME%% extends Component {

	render() {
		return (
			<div className={styles.%%NAME%%}>
			</div>
		);
	}

}
