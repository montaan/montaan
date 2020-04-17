# Montaan/MainApp

The MainApp component is the main screen for the Montaan repo browser.
The MainApp component is used by the App and is referred from Montaan/index.tsx.

The primary reviewer for MainApp is Ilmari Heikkinen <hei@heichen.hk>.

## Usage

```tsx
<MainApp userInfo={UserInfo.mock} api={QFrameAPI.mock} apiPrefix="" />
```

## Props

This is the description of the MainApp component's MainAppProps interface.

```tsx
export interface MainAppProps extends RouteComponentProps {
	match: any;
	userInfo: UserInfo;
	api: QFrameAPI;
	apiPrefix: string;
}
```

## Styling

The MainApp component uses [CSS Modules](https://github.com/css-modules/css-modules) for styling. The component stylesheet is at [css/MainApp.module.css].

Example of using the stylesheet:

```css
.MainApp {
	display: inline-block;

	:global(.hidden) {
		display: block;
		opacity: 0.1;
	}
}
.title {
	color: red;
}
```

```tsx
<div className={this.styles.MainApp}>
	<h1 className={this.styles.title}>Hello from {this.styles.title}!</h1>
	<p className="hidden">
		This P is using the global class <code>.hidden</code>
	</p>
</div>
```

## Assets

Any assets (images, fonts, 3D models, static files, etc.) used by the component are in [assets/]. Import the asset into your script file to get the post-build URL.

```tsx
import myImage from './assets/myImage.svg';
// ...
<img src={myImage}>
```

## API

### Exports

```tsx
export interface MainAppProps
export type TreeLinkKey = Element | FSEntry | string;
export interface TreeLink
export interface SearchResult
export class UserInfo
export interface FileTree
export interface GoToTarget
export interface FileContents
export interface CommitFilter
export class ActiveCommitData
export interface FSState
```

### Props

```tsx
export interface MainAppProps extends RouteComponentProps {
	match: any;
	userInfo: UserInfo;
	api: QFrameAPI;
	apiPrefix: string;
}
```

### Interfaces

```tsx
export interface MainAppProps extends RouteComponentProps {
	match: any;
	userInfo: UserInfo;
	api: QFrameAPI;
	apiPrefix: string;
}
export interface TreeLink {
	src: TreeLinkKey;
	dst: TreeLinkKey;
	srcPoint?: number[];
	dstPoint?: number[];
	color: { r: number; g: number; b: number };
}
export interface SearchResult {
	filename: string;
	line: number;
	snippet?: string;
	hitType: number;
}
export interface FileTree {
	count: number;
	tree: FSDirEntry;
}
export interface GoToTarget {
	fsEntry: FSEntry;
	line?: number;
	col?: number;
}
export interface FileContents {
	content: ArrayBuffer;
	path: string;
	hash: string;
	original?: ArrayBuffer;
}
export interface CommitFilter {
	path?: string;
	author?: string;
	authorSearch?: string;
	search?: string;
	date?: string;
}
interface MainAppState {
	commitFilter: CommitFilter;
	searchQuery: string;
	activeCommitData?: ActiveCommitData;
	fileTree: FileTree;
	commitLog: string;
	commitChanges: string;
	files: string;
	searchResults: SearchResult[];
	navigationTarget: string;
	goToTarget?: GoToTarget;
	frameRequestTime: number;
	searchLinesRequest: number;
	diffsLoaded: number;
	fileContents?: FileContents;
	links: TreeLink[];
	dependencies: TreeLink[];
	dependencySrcIndex: TreeLinkIndex;
	dependencyDstIndex: TreeLinkIndex;
	repoError: any;
	commitData?: CommitData;
	navUrl: string;
	searchHover?: any;
	treeLoaded: boolean;
	fileTreeUpdated: number;
	commitsVisible: boolean;
}
export interface FSState extends MainAppState {
	setCommitData: (commitData?: CommitData) => void;
	setDependencies: (dependencies: TreeLink[]) => void;
	setCommitFilter: (repo: string, commitFilter: CommitFilter) => void;
	loadDiff: (repo: string, commit: Commit) => Promise<void>;
	loadFile: (repo: string, hash: string, path: string) => Promise<void>;
	loadFileDiff: (repo: string, hash: string, previousHash: string, path: string) => Promise<void>;
	closeFile: () => void;
	setCommitsVisible: (commitsVisible: boolean) => void;
	setLinks: (links: TreeLink[]) => void;
	addLinks: (links: TreeLink[]) => void;
	setSearchQuery: (repo: string, branch: string, query: string) => void;
	updateSearchLines: () => void;
	setSearchHover: (el: HTMLElement, url: string) => void;
	clearSearchHover: (el: HTMLElement) => void;
	createRepo: (name: string, url?: string) => Promise<RepoInfo>;
	renameRepo: (repo: RepoInfo, newName: string) => Promise<void>;
	addTreeListener: (pattern: RegExp, callback: (fsEntry: FSEntry) => void) => void;
	removeTreeListener: (pattern: RegExp, callback: (fsEntry: FSEntry) => void) => void;
}
```

### Declares

```tsx
declare global {
	interface Navigator {
		standalone?: boolean;
	}
}
```
