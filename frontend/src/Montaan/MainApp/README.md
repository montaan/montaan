# Montaan/MainApp

The MainApp component is the main screen for the Montaan repo browser.
The MainApp component is used by the App and is referred from Montaan/index.tsx.

The primary reviewer for MainApp is Ilmari Heikkinen <hei@heichen.hk>.

## Usage

```tsx
<MainApp propA={} />
```

## Props

This is the description of the MainApp component's MainAppProps interface.

```tsx
export interface MainAppProps extends RouteComponentProps {
	match: any;
	userInfo: any;
	api: any;
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

### Props

```tsx
export interface MainAppProps extends RouteComponentProps {
	match: any;
	userInfo: any;
	api: any;
	apiPrefix: string;
}
```

### Interfaces

```tsx
export interface MainAppProps extends RouteComponentProps {
	match: any;
	userInfo: any;
	api: any;
	apiPrefix: string;
}
export interface FSEntry {
	title: string;
	entries: null | { [filename: string]: FSEntry };
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
export interface UserInfo {
	name: string;
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

### Props

```tsx
export interface MainAppProps extends RouteComponentProps {
	match: any;
	userInfo: any;
	api: any;
	apiPrefix: string;
}
```

### Interfaces

```tsx
export interface MainAppProps extends RouteComponentProps {
	match: any;
	userInfo: any;
	api: any;
	apiPrefix: string;
}
export interface FSEntry {
	title: string;
	entries: null | { [filename: string]: FSEntry };
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
export interface UserInfo {
	name: string;
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

### Props

```tsx
export interface MainAppProps extends RouteComponentProps {
	match: any;
	userInfo: any;
	api: any;
	apiPrefix: string;
}
```

### Interfaces

```tsx
export interface MainAppProps extends RouteComponentProps {
	match: any;
	userInfo: any;
	api: any;
	apiPrefix: string;
}
export interface FSEntry {
	title: string;
	entries: null | { [filename: string]: FSEntry };
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
export interface UserInfo {
	name: string;
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

### Props

```tsx
export interface MainAppProps extends RouteComponentProps {
	match: any;
	userInfo: any;
	api: any;
	apiPrefix: string;
}
```

### Interfaces

```tsx
export interface MainAppProps extends RouteComponentProps {
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
