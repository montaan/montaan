# Montaan/Search

The Search component is a tour through a directory tree for quick on-boarding..

The Search component is used by MainApp.

The primary reviewer for Search is Ilmari Heikkinen <hei@heichen.hk>.

## Usage

```tsx
<Search
	setSearchQuery={(s: string) => {}}
	setSearchHover={(li: any, url: string) => {}}
	clearSearchHover={(li: any) => {}}
	navigationTarget={'string'}
	searchQuery={'string'}
	searchResults={[]}
	updateSearchLines={() => {}}
/>
```

## Styling

The Search component uses [CSS Modules](https://github.com/css-modules/css-modules) for styling. The component stylesheet is at [Search.module.css].

Example of using the stylesheet:

```css
.Search {
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
<div className={this.styles.Search}>
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
export interface SearchProps extends RouteComponentProps {
	setSearchQuery: (query: string) => void;
	setSearchHover: (li: any, url: string) => void;
	clearSearchHover: (li: any) => void;
	navigationTarget: string;
	searchQuery: string;
	searchResults: SearchResult[];
	updateSearchLines: () => void;
}
```

### Interfaces

```tsx
export interface SearchProps extends RouteComponentProps {
	setSearchQuery: (query: string) => void;
	setSearchHover: (li: any, url: string) => void;
	clearSearchHover: (li: any) => void;
	navigationTarget: string;
	searchQuery: string;
	searchResults: SearchResult[];
	updateSearchLines: () => void;
}
```
