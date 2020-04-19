# Montaan/Filesystems/LocalFilesystem

The LocalFilesystem filesystem is a filesystem that mounts your local filesystem for managing your files from Montaan.

The LocalFilesystem filesystem is used by MainApp.

The primary reviewer for LocalFilesystem is Ilmari Heikkinen <hei@heichen.hk>.

## Usage

```tsx
registerFilesystem(urlSchema, LocalFilesystem);
```

## Styling

The LocalFilesystem component uses [CSS Modules](https://github.com/css-modules/css-modules) for styling. The component stylesheet is at [LocalFilesystem.module.css].

Example of using the stylesheet:

```css
.LocalFilesystem {
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
<div className={this.styles.LocalFilesystem}>
	<h1 className={this.styles.title}>Hello from {this.styles.title}!</h1>
	<p className="hidden">
		This P is using the global class <code>.hidden</code>
	</p>
</div>
```

## API

### Exports

```tsx
export default class LocalFilesystem
```
