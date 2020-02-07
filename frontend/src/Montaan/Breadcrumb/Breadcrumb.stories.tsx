import * as React from 'react';
import { storiesOf } from '@storybook/react';
import Breadcrumb from './';

storiesOf('Breadcrumb', module).add('Breadcrumb', () => (
	<div>
		<Breadcrumb navigationTarget="/foo/bar" fileTree={{}} />
	</div>
));
