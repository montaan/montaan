import * as React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { storiesOf } from '@storybook/react';
import 'bootstrap/dist/css/bootstrap.css';

import TreeView from './';

storiesOf('Montaan/TreeView', module).add('TreeView', () => (
	<div>
		<div style={{ width: '50%' }}>
			<h3>TreeView</h3>

			<p>
				The TreeView component is a zoomable dynamic view to the Montaan filesystem tree for
				navigating and manipulating the contents of the tree.
			</p>
			<p>The TreeView component is used by the MainApp component.</p>
			<p>The primary contact for TreeView is {'Ilmari Heikkinen <hei@heichen.hk>'}.</p>

			<h4>API</h4>
			<h5>Props</h5>
			<pre>
				<code>{`export interface TreeViewProps extends RouteComponentProps {
	api: QFrameAPI;
	repoPrefix: string;
	fileTree: FileTree;
	commitData: null | CommitData;
	activeCommitData: null | ActiveCommitData;
	commitFilter: any;
	navigationTarget: string;
	searchResults: SearchResult[];
	searchLinesRequest: number;
	diffsLoaded: number;
	addLinks(links: TreeLink[]): void;
	setLinks(links: TreeLink[]): void;
	links: TreeLink[];
	navUrl?: string;
	frameRequestTime: number;
	setNavigationTarget(target: string): void;
	searchQuery: string;
	requestDirs(paths: string[]): void;
	requestDitchDirs(fsEntries: any[]): void;
}`}</code>
			</pre>
			<h5>Interfaces</h5>
			<pre>
				<code>{`export interface TreeViewProps extends RouteComponentProps {
	api: QFrameAPI;
	repoPrefix: string;
	fileTree: FileTree;
	commitData: null | CommitData;
	activeCommitData: null | ActiveCommitData;
	commitFilter: any;
	navigationTarget: string;
	searchResults: SearchResult[];
	searchLinesRequest: number;
	diffsLoaded: number;
	addLinks(links: TreeLink[]): void;
	setLinks(links: TreeLink[]): void;
	links: TreeLink[];
	navUrl?: string;
	frameRequestTime: number;
	setNavigationTarget(target: string): void;
	searchQuery: string;
	requestDirs(paths: string[]): void;
	requestDitchDirs(fsEntries: any[]): void;
}`}</code>
			</pre>

			<h5>Declares</h5>
			<pre>
				<code>{`declare global {
	// eslint-disable-next-line
	namespace JSX {
		interface IntrinsicElements {
			renderPass: any;
			unrealBloomPass: any;
			instancedBufferAttribute: any;
			instancedMesh: any; //ReactThreeFiber.Object3DNode<THREE.InstancedMesh, typeof THREE.InstancedMesh>;
			effectComposer: any; //ReactThreeFiber.Node<EffectComposer, typeof EffectComposer>;
		}
	}
}`}</code>
			</pre>
		</div>
		<hr />
		<Router>
			{/* <TreeView
				goToTarget={undefined}
				navUrl={'/foo/bar'}
				activeCommitData={null}
				diffsLoaded={0}
				fileTree={{ tree: { title: '', entries: null }, count: 1 }}
				commitData={null}
				frameRequestTime={0}
				api={{}}
				repoPrefix={'foo/bar'}
				navigationTarget={'/foo/bar'}
				searchLinesRequest={0}
				searchResults={[]}
				searchQuery={''}
				commitFilter={{}}
				addLinks={() => {}}
				setLinks={() => {}}
				links={[]}
				setNavigationTarget={() => {}}
			/> */}
		</Router>
	</div>
));
