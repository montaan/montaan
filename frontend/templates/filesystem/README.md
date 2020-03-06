# TARGET/NAME

The NAME component is WHAT_IS_IT for WHY_IS_IT.

The NAME component is used by USED_BY.

The primary reviewer for NAME is AUTHOR.

## Usage

```tsx
<NAME PROPS_USE />
```

## Styling

The NAME component uses [CSS Modules](https://github.com/css-modules/css-modules) for styling. The component stylesheet is at [NAME.module.css].

Example of using the stylesheet:

```css
.NAME {
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
<div className={this.styles.NAME}>
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
