# Montaan/TourSelector

The TourSelector component is a component to start tours inside a file tree for finding and surfacing tours relevant to the current location.

The TourSelector component is used by MainApp.

The primary reviewer for TourSelector is Ilmari Heikkinen <hei@heichen.hk>.

## Usage

```tsx
<TourSelector
	fileTree={{
		tree: {
			title: 'foo',
			entries: {
				'.tour.md': { title: '.tour.md', entries: null },
				bar: {
					title: 'bar',
					entries: {
						'.tour.md': { title: '.tour.md', entries: null },
					},
				},
			},
		},
		count: 4,
	}}
	navigationTarget="/foo/bar"
	api={api}
	repoPrefix="foo/bar"
/>
```

## Styling

The TourSelector component uses [CSS Modules](https://github.com/css-modules/css-modules) for styling. The component stylesheet is at [TourSelector.module.css].

Example of using the stylesheet:

```css
.TourSelector {
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
<div className={this.styles.TourSelector}>
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

### Props

```tsx
export interface TourSelectorProps extends RouteComponentProps {
	fileTree: FileTree;
	navigationTarget: string;
	api: QFrameAPI;
	repoPrefix: string;
}
```

### Interfaces

```tsx
export interface TourSelectorProps extends RouteComponentProps {
	fileTree: FileTree;
	navigationTarget: string;
	api: QFrameAPI;
	repoPrefix: string;
}
```
