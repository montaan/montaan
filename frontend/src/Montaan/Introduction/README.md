# Montaan/Introduction

The Introduction component is an onboarding screen for making new developers succeed on the Montaan.

The Introduction component is used by MainApp.

The primary reviewer for Introduction is Ilmari Heikkinen <hei@heichen.hk>.

## Usage

```tsx
<Introduction userInfo={{}} />
```

## Styling

The Introduction component uses [CSS Modules](https://github.com/css-modules/css-modules) for styling. The component stylesheet is at [Introduction.module.css].

Example of using the stylesheet:

```css
.Introduction {
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
<div className={this.styles.Introduction}>
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
