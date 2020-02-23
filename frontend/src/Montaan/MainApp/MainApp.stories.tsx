import * as React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { storiesOf } from '@storybook/react';
import 'bootstrap/dist/css/bootstrap.css';

import MainApp from './';
import { UserInfo } from './MainApp';
import QFrameAPI from '../../lib/api';

storiesOf('Montaan/MainApp', module).add('MainApp', () => (
	<div>
		<div style={{ width: '50%', marginTop: '120px' }}>
			<h3>MainApp</h3>
			<p>The MainApp component is the main screen for the Montaan repo browser.</p>
			<p>The MainApp component is used by the App and is referred from Montaan/index.tsx.</p>
			<p>The primary reviewer for MainApp is {`Ilmari Heikkinen <hei@heichen.hk>`}.</p>
			<h4>API</h4>
			<h5>Props</h5>
			<pre>
				<code>{`export interface MainAppProps extends RouteComponentProps {
	match: any;
	userInfo: UserInfo;
	api: QFrameAPI;
	apiPrefix: string;
}`}</code>
			</pre>
			<h5>Interfaces</h5>
			<pre>
				<code>{`export interface MainAppProps extends RouteComponentProps {
	match: any;
	userInfo: UserInfo;
	api: QFrameAPI;
	apiPrefix: string;
}
export interface TreeLink {
	src: Element | FSEntry | string;
	dst: Element | FSEntry | string;
	color: { r: number; g: number; b: number };
}
export interface SearchResult {
	fsEntry: FSEntry;
	filename: string;
	line: number;
	snippet?: string;
	hitType: number;
}
export interface FileTree {
	count: number;
	tree: FSEntry;
}
export interface GoToTarget {
	fsEntry: FSEntry;
	line?: number;
	col?: number;
}
export interface FileContents {
	content: string;
	path: string;
	hash: string;
	original?: string;
}
export interface CommitFilter {
	path?: string;
	author?: string;
	authorSearch?: string;
	search?: string;
	date?: string;
}
export interface ActiveCommitData {
	commits: Commit[];
	authors: string[];
	authorCommitCounts: { [author: string]: number };
	files: any[];
}
interface MainAppState {
	repoPrefix: string;
	commitFilter: CommitFilter;
	searchQuery: string;
	commits: Commit[];
	activeCommitData: null | ActiveCommitData;
	fileTree: FileTree;
	commitLog: string;
	commitChanges: string;
	files: string;
	searchResults: SearchResult[];
	navigationTarget: string;
	goToTarget: null | GoToTarget;
	frameRequestTime: number;
	searchLinesRequest: number;
	diffsLoaded: number;
	fileContents: null | FileContents;
	links: TreeLink[];
	repos: Repo[];
	repoError: any;
	processing: boolean;
	processingCommits: boolean;
	commitData: null | CommitData;
	navUrl: string;
	ref: string;
	searchHover?: any;
}`}</code>
			</pre>

			<h5>Declares</h5>
			<pre>
				<code>{`declare global {
	interface Navigator {
		standalone?: boolean;
	}
}`}</code>
			</pre>
		</div>
		<Router>
			<MainApp userInfo={UserInfo.mock} api={QFrameAPI.mock} apiPrefix="" />
		</Router>
	</div>
));
