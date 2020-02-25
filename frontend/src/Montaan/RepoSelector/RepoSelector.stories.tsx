import * as React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { storiesOf } from '@storybook/react';
import 'bootstrap/dist/css/bootstrap.css';

import RepoSelector from './';

storiesOf('Montaan/RepoSelector', module).add('RepoSelector', () => (
	<div>
		<div style={{ width: '50%' }}>
			<h3>RepoSelector</h3>
			<p>
				The RepoSelector component is a dropdown to show list of repos and create new ones
				for easy navigation between user's repos.
			</p>
			<p>The RepoSelector component is used by the MainApp screen.</p>
			<p>The primary reviewer for RepoSelector is Ilmari Heikkinen {'<hei@heichen.hk>'}.</p>

			<h4>API</h4>
			<h5>Props</h5>
			<pre>
				<code>{`interface RepoSelectorProps extends RouteComponentProps {
	repos: RepoInfo[];
	createRepo(name: string, url?: string): Promise<RepoInfo>;
	renameRepo(repo: RepoInfo, newName: string): Promise<void>;
}`}</code>
			</pre>
			<h5>Interfaces</h5>
			<pre>
				<code>{`interface RepoSelectorProps extends RouteComponentProps {
	repos: RepoInfo[];
	createRepo(name: string, url?: string): Promise<RepoInfo>;
	renameRepo(repo: RepoInfo, newName: string): Promise<void>;
}
interface RepoSelectorState {
	showCreate: boolean;
	name: string;
	url: string;
	search: string;
	repoSort: 'name' | 'commits';
}`}</code>
			</pre>
		</div>

		<hr />

		<Router>
			<RepoSelector
				repos={[
					{
						name: 'foo',
						owner: 'bar',
						url: '',
						branches: [['master', 20]],
						processing: false,
					},
				]}
				createRepo={async (name: string, url?: string) =>
					new Promise((r) =>
						r({
							name: 'foo',
							owner: 'bar',
							url: '',
							branches: [['master', 20]],
							processing: false,
						})
					)
				}
				renameRepo={async (a, b) => {}}
			/>
		</Router>
	</div>
));
