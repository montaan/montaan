import * as React from 'react';
import { storiesOf } from '@storybook/react';
import NAME from './';

storiesOf('NAME', module).add('NAME', () => (
	<div>
		<h1>TARGET/NAME</h1>

		<p>The NAME component is WHAT_IS_IT for WHY_IS_IT.</p>
		<p>The NAME component is used by USED_BY.</p>
		<p>The primary contact for NAME is {'AUTHOR'}.</p>

		<hr />

		<NAME PROPS_USE />
	</div>
));
