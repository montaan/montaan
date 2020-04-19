# Montaan/Filesystems/GithubFilesystem

The GithubFilesystem filesystem is a filesystem to display Github repositories for public and private repos (given API authorization).

The GithubFilesystem filesystem is used by MainApp.

The primary reviewer for GithubFilesystem is Ilmari Heikkinen <hei@heichen.hk>.

## Usage

```tsx
registerFilesystem(urlSchema, GithubFilesystem);
```

## Styling

The GithubFilesystem component uses [CSS Modules](https://github.com/css-modules/css-modules) for styling. The component stylesheet is at [GithubFilesystem.module.css].

Example of using the stylesheet:

```css
.GithubFilesystem {
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
<div className={this.styles.GithubFilesystem}>
	<h1 className={this.styles.title}>Hello from {this.styles.title}!</h1>
	<p className="hidden">
		This P is using the global class <code>.hidden</code>
	</p>
</div>
```

## API

### Exports

```tsx
export default class GithubFilesystem
```
