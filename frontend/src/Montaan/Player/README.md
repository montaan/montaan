# Montaan/Player

The Player component is a little music player for playing .playlist files.

The Player component is used by MainApp.

The primary reviewer for Player is Ilmari Heikkinen <hei@heichen.hk>.

## Usage

```tsx
<Player fileTree={{} as any} navigationTarget="foo/bar/baz" api={{} as any} repoPrefix="foo/bar" />
```

## Styling

The Player component uses [CSS Modules](https://github.com/css-modules/css-modules) for styling. The component stylesheet is at [Player.module.css].

Example of using the stylesheet:

```css
.Player {
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
<div className={this.styles.Player}>
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
export interface PlayerProps extends RouteComponentProps {
	fileTree: FileTree;
	navigationTarget: string;
	api: QFrameAPI;
	repoPrefix: string;
}
```

### Interfaces

```tsx
export interface PlayerProps extends RouteComponentProps {
	fileTree: FileTree;
	navigationTarget: string;
	api: QFrameAPI;
	repoPrefix: string;
}
```
