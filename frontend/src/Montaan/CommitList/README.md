# Montaan/CommitList

The CommitList component is virtualized list of commit messages for showing the commit history of a branch.

The CommitList component is used by CommitInfo.

The primary reviewer for CommitList is Ilmari Heikkinen <hei@heichen.hk>.

## Usage

```tsx
<CommitList commitData={} activeCommitData={} setCommitFilter={() => {}} commitFilter={} />
```

## Styling

The CommitList component uses [CSS Modules](https://github.com/css-modules/css-modules) for styling. The component stylesheet is at [CommitList.module.css].

Example of using the stylesheet:

```css
.CommitList {
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
<div className={this.styles.CommitList}>
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

### Exports

```tsx
export interface CommitListProps
```

### Props

```tsx
export interface CommitListProps extends RouteComponentProps {
	commitData: CommitData;
	activeCommitData: ActiveCommitData;
	setCommitFilter: (commitFilter: CommitFilter) => void;
	commitFilter: CommitFilter;
}
```

### Interfaces

```tsx
export interface CommitListProps extends RouteComponentProps {
	commitData: CommitData;
	activeCommitData: ActiveCommitData;
	setCommitFilter: (commitFilter: CommitFilter) => void;
	commitFilter: CommitFilter;
}
```
