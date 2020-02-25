# Montaan/Repo

The Repo component is a list item with an editable view of a repo for the repo listing to do in-line repo management.

The Repo component is used by RepoSelector.

The primary reviewer for Repo is Ilmari Heikkinen <hei@heichen.hk>.

## Usage

```tsx
<Repo repo={Repo.mock} />
```

## Styling

The Repo component uses [CSS Modules](https://github.com/css-modules/css-modules) for styling. The component stylesheet is at [Repo.module.css].

Example of using the stylesheet:

```css
.Repo {
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
<div className={this.styles.Repo}>
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

Anything here will be replaced by definitions pulled from the code.
