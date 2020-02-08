import * as React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { storiesOf } from '@storybook/react';
import Breadcrumb from './';

storiesOf('Breadcrumb', module).add('Breadcrumb', () => (
	<div>
		<Router>
			<Breadcrumb navigationTarget="/foo/bar" fileTree={{}} />
		</Router>
	</div>
));
