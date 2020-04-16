# Montaan/CommitInfo

The CommitInfo component is a panel with a list of commits and authors for git repositories.

The CommitInfo component is used by MontaanGitFilesystem.

The primary reviewer for CommitInfo is Ilmari Heikkinen <hei@heichen.hk>.

## Usage

```tsx
<CommitInfo propA={} />
```

## Props

```ts
propA: PropTypes.string, // propA
```

## Styling

The CommitInfo component uses [CSS Modules](https://github.com/css-modules/css-modules) for styling. The component stylesheet is at [css/style.module.css]. The stylesheet is wrapped inside a strict access proxy that throws if you try to access undefined styles, this helps to fix typos.

Example of using the stylesheet:

```css
.CommitInfo {
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
render() {
    return (
        <div className={this.styles.CommitInfo}>
            <h1 className={this.styles.title}>Hello from {this.styles.title}!</h1>
            <p className="hidden">This P is using the global class <code>.hidden</code></p>
        </div>
    );
}
```

## API

### Exports

```tsx
export interface CommitInfoProps
export class CommitInfo
```

### Props

```tsx
export interface CommitInfoProps {
	loadFileDiff(
		repo: string,
		sha: string,
		previousSha: string,
		path: string,
		el?: HTMLElement
	): void;
	loadFile(repo: string, sha: string, path: string, el: HTMLElement): void;

	searchQuery: string;

	diffsLoaded: number;

	addLinks(links: TreeLink[]): void;
	setLinks(links: TreeLink[]): void;
	links: TreeLink[];

	commitFilter: CommitFilter;
	setCommitFilter(repo: string, commitFilter: CommitFilter): void;

	navigationTarget: string;
	repoPrefix: string;
	branch: string;

	closeFile(): void;
	loadDiff(repo: string, commit: Commit): Promise<void>;

	activeCommitData?: ActiveCommitData;

	commitData?: CommitData;

	fileContents?: FileContents;

	commitsVisible: boolean;
	setCommitsVisible: (visible: boolean) => void;

	path: string;
}
```

### Interfaces

```tsx
export interface CommitInfoProps {
	loadFileDiff(
		repo: string,
		sha: string,
		previousSha: string,
		path: string,
		el?: HTMLElement
	): void;
	loadFile(repo: string, sha: string, path: string, el: HTMLElement): void;

	searchQuery: string;

	diffsLoaded: number;

	addLinks(links: TreeLink[]): void;
	setLinks(links: TreeLink[]): void;
	links: TreeLink[];

	commitFilter: CommitFilter;
	setCommitFilter(repo: string, commitFilter: CommitFilter): void;

	navigationTarget: string;
	repoPrefix: string;
	branch: string;

	closeFile(): void;
	loadDiff(repo: string, commit: Commit): Promise<void>;

	activeCommitData?: ActiveCommitData;

	commitData?: CommitData;

	fileContents?: FileContents;

	commitsVisible: boolean;
	setCommitsVisible: (visible: boolean) => void;

	path: string;
}
interface CommitInfoState {
	authorSort: string;
	commitFilter?: CommitFilter;
	diffEditor: any;
	editor: any;
}
```

### Declares

```tsx
declare global {
	interface Window {
		monaco: Monaco;
	}
}
```
