import * as React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { storiesOf } from '@storybook/react';
import 'bootstrap/dist/css/bootstrap.css';

import NAME from './';

storiesOf('TARGET/NAME', module).add('NAME', () => (
	<div>
		<div style={{ width: '50%' }}>
			<h3>NAME</h3>

			<p>The NAME component is WHAT_IS_IT for WHY_IS_IT.</p>
			<p>The NAME component is used by USED_BY.</p>
			<p>The primary contact for NAME is {'AUTHOR'}.</p>

			<h4>API</h4>
		</div>
		<hr />
		<Router>
			<NAME PROPS_USE />
		</Router>
	</div>
));
