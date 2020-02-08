# Montaan/TreeView

The TreeView component is a zoomable dynamic view to the Montaan filesystem tree for navigating and manipulating the contents of the tree.

The TreeView component is used by the MainApp component.

The primary reviewer for TreeView is Ilmari Heikkinen <hei@heichen.hk>.

## Usage

```tsx
<TreeView ... />
```

## Props

This is the description of the TreeView component's TreeViewProps interface.

```ts
interface TreeViewProps extends RouteComponentProps {
	api: QFrameAPI;
	repoPrefix: string;
	fileTree: FileTree;
	commitData: CommitData;
	activeCommitData: CommitData;
	commitFilter: any;
	navigationTarget: string;
	searchResults: SearchResult[];
	searchLinesRequest: number;
	diffsLoaded: number;
	addLinks(links: Link[]): void;
	setLinks(links: Link[]): void;
	links: Link[];
	navUrl?: string;
	frameRequestTime: number;
	setNavigationTarget(target: string): void;
}
```

## Styling

The TreeView component uses [CSS Modules](https://github.com/css-modules/css-modules) for styling. The component stylesheet is at [TreeView.module.css].

Example of using the stylesheet:

```css
.TreeView {
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
<div className={this.styles.TreeView}>
	<h1 className={this.styles.title}>Hello from {this.styles.title}!</h1>
	<p className="hidden">
		This P is using the global class <code>.hidden</code>
	</p>
</div>
```

## Assets

Any assets (images, fonts, 3D models, static files, etc.) used by the component are in [assets/]. Import the asset into your script file to get the post-build URL.

```jsx
import myImage from './assets/myImage.svg';
// ...
<img src={myImage}>
```

## API
