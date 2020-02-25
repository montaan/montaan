import * as React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { storiesOf } from '@storybook/react';
import 'bootstrap/dist/css/bootstrap.css';
import { RepoInfo } from '../RepoSelector';

import Repo from './';

storiesOf('Montaan/Repo', module).add('Repo', () => (
	<div>
		<div style={{ width: '50%' }}>
			<h3>Repo</h3>

			<p>
				The Repo component is a list item with an editable view of a repo for the repo
				listing to do in-line repo management.
			</p>
			<p>The Repo component is used by RepoSelector.</p>
			<p>The primary contact for Repo is {'Ilmari Heikkinen <hei@heichen.hk>'}.</p>

			<h4>API</h4>
			<h5>Props</h5>
			<pre>
				<code>{`export interface RepoProps extends RouteComponentProps {
	repo: RepoInfo;
	renameRepo(repo: RepoInfo, newName: string): Promise<void>;
}`}</code>
			</pre>
			<h5>Interfaces</h5>
			<pre>
				<code>{`export interface RepoProps extends RouteComponentProps {
	repo: RepoInfo;
	renameRepo(repo: RepoInfo, newName: string): Promise<void>;
}`}</code>
			</pre>
		</div>
		<hr />
		<Router>
			<Repo repo={RepoInfo.mock} renameRepo={async (a, b) => {}} />
		</Router>
	</div>
));
