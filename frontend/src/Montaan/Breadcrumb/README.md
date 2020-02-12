# Montaan/Breadcrumb

The Breadcrumb component is a clickable list of path components for navigating the file tree.

The Breadcrumb component is used by the MainApp screen.

The primary reviewer for Breadcrumb is Ilmari Heikkinen <hei@heichen.hk>.

## Usage

```tsx
<Breadcrumb
	navigationTarget={'/foo/bar'}
	fileTree={{
		tree: {
			title: '',
			entries: {
				foo: { title: 'foo', entries: { bar: { title: '', entries: null } } },
			},
		},
	}}
/>
```

## Props

This is the description of the Breadcrumb component's BreadcrumbProps interface.

```ts
interface BreadcrumbProps extends RouteComponentProps {
	navigationTarget: string;
	fileTree: any;
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

## API

### Props

```tsx
export interface BreadcrumbProps extends RouteComponentProps {
	navigationTarget: string;
	fileTree: any;
}
```

### Interfaces

```tsx
export interface BreadcrumbProps extends RouteComponentProps {
	navigationTarget: string;
	fileTree: any;
}
```
