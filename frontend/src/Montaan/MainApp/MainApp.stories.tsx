import * as React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { storiesOf } from '@storybook/react';
import 'bootstrap/dist/css/bootstrap.css';

import MainApp from './';

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
	userInfo: any;
	api: any;
	apiPrefix: string;
}`}</code>
			</pre>
			<h5>Interfaces</h5>
			<pre>
				<code>{`export interface MainAppProps extends RouteComponentProps {
	match: any;
	userInfo: any;
	api: any;
	apiPrefix: string;
}
export interface FSEntry {
	title: string;
	entries: { [propType: string]: FSEntry };
}
export interface FSLink {
	src: Element | FSEntry;
	dst: Element | FSEntry;
	color: THREE.Color;
}
export interface UserInfo {
	name: string;
}
interface MainAppState {
	repoPrefix: string;
	commitFilter: any;
	searchQuery: string;
	commits: any[];
	activeCommitData: any;
	fileTree: { count: number; tree: FSEntry };
	commitLog: string;
	commitChanges: string;
	files: string;
	searchResults: any[];
	navigationTarget: string;
	goToTarget: null | { fsEntry: FSEntry; line?: number; col?: number };
	frameRequestTime: number;
	searchLinesRequest: number;
	diffsLoaded: number;
	fileContents: null | any;
	links: any[];
	repos: any[];
	repoError: any;
	processing: boolean;
	processingCommits: boolean;
	commitData: any;
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
			<MainApp userInfo={{}} api={{}} apiPrefix="" />
		</Router>
	</div>
));
