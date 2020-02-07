import * as React from 'react';
import { storiesOf } from '@storybook/react';
import RepoSelector from './';

storiesOf('RepoSelector', module).add('RepoSelector', () => (
	<div>
		<h1>
			The RepoSelector component is a dropdown to show list of repos and create new ones for
			easy navigation between user's repos.
		</h1>
		<p>The RepoSelector component is used by the MainApp screen.</p>
		<p>The primary reviewer for RepoSelector is Ilmari Heikkinen {'<hei@heichen.hk>'}.</p>
		<RepoSelector
			repos={[{ name: 'foo', owner: 'bar', url: '', commit_count: 20, processing: false }]}
			createRepo={async (name: string, url?: string) =>
				new Promise((r) =>
					r({ name: 'foo', owner: 'bar', url: '', commit_count: 20, processing: false })
				)
			}
		/>
	</div>
));
