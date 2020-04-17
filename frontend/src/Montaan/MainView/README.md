# MainView

The MainView component wraps the Tabletree class in main.tsx and manages the zoomable tree UI.

The MainView component is used by MainApp.

The primary reviewer for MainView is Ilmari Heikkinen <hei@heichen.hk>.

## API

### Props

```tsx
interface MainViewProps extends RouteComponentProps {
	requestDirs(paths: string[], dropEntries: any[]): Promise<void>;
	requestThumbnails: (thumbnails: { path: string; z: number }[]) => Promise<void>;
	api: QFrameAPI;
	diffsLoaded: number;
	fileTree: FileTree;
	commitData?: CommitData;
	activeCommitData?: ActiveCommitData;
	commitFilter: CommitFilter;
	navigationTarget: string;
	searchResults: SearchResult[];
	searchQuery: string;
	searchLinesRequest: number;
	addLinks(links: TreeLink[]): void;
	setLinks(links: TreeLink[]): void;
	links: TreeLink[];
	navUrl?: string;
	frameRequestTime: number;
	setNavigationTarget(target: string): void;
	treeLoaded(): void;
	fileTreeUpdated: number;
}
```

### Interfaces

```tsx
interface MainViewProps extends RouteComponentProps {
	requestDirs(paths: string[], dropEntries: any[]): Promise<void>;
	requestThumbnails: (thumbnails: { path: string; z: number }[]) => Promise<void>;
	api: QFrameAPI;
	diffsLoaded: number;
	fileTree: FileTree;
	commitData?: CommitData;
	activeCommitData?: ActiveCommitData;
	commitFilter: CommitFilter;
	navigationTarget: string;
	searchResults: SearchResult[];
	searchQuery: string;
	searchLinesRequest: number;
	addLinks(links: TreeLink[]): void;
	setLinks(links: TreeLink[]): void;
	links: TreeLink[];
	navUrl?: string;
	frameRequestTime: number;
	setNavigationTarget(target: string): void;
	treeLoaded(): void;
	fileTreeUpdated: number;
}
```
