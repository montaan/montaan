# Montaan/Breadcrumb

Ilmari Heikkinen <hei@heichen.hk> is a lame-o who hasn't documented their yucky component Breadcrumb. Neener neener!

The Breadcrumb component is an X for Y.

The Breadcrumb component is used by Z.

The primary reviewer for Breadcrumb is Ilmari Heikkinen <hei@heichen.hk>.

## Usage

```tsx
<Breadcrumb propA={} />
```

## Props

This is the description of the Breadcrumb component's BreadcrumbProps interface.

```ts
interface BreadcrumbProps {
	propA: PropTypes.string; // propA is used to pass A to Breadcrumb
}
```

## Styling

The Breadcrumb component uses [CSS Modules](https://github.com/css-modules/css-modules) for styling. The component stylesheet is at [css/Breadcrumb.module.css].

Example of using the stylesheet:

```css
.Breadcrumb {
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
        <div className={this.styles.Breadcrumb}>
            <h1 className={this.styles.title}>Hello from {this.styles.title}!</h1>
            <p className="hidden">This P is using the global class <code>.hidden</code></p>
        </div>
    );
}
```

## Assets

Any assets (images, fonts, 3D models, static files, etc.) used by the component are in [assets/]. Import the asset into your script file to get the post-build URL.

```jsx
import myImage from './assets/myImage.svg';
// ...
render() {
    return (<img src={myImage}>);
}
```

## Authors

Ilmari Heikkinen <hei@heichen.hk>
