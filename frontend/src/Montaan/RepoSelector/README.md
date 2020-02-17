# Montaan/RepoSelector

The RepoSelector component is a dropdown to show list of repos and create new ones for easy navigation between user's repos.

The RepoSelector component is used by the MainApp screen.

The primary reviewer for RepoSelector is Ilmari Heikkinen <hei@heichen.hk>.

## Usage

```tsx
<RepoSelector
	repos={[{ name: 'foo', owner: 'bar', url: '', branches: [['master', 20]], processing: false }]}
	createRepo={async (name: string, url?: string) =>
		new Promise((resolve) =>
			resolve({
				name: 'baz',
				owner: 'qux',
				url: '',
				branches: [['dev', 20]],
				processing: false,
			})
		)
	}
/>
```

## Props

This is the description of the RepoSelector component's RepoSelectorProps interface.

```ts
interface RepoSelectorProps {
	repos: Repo[];
	createRepo(name: string, url?: string): Promise<Repo>;
}
```

## Styling

The RepoSelector component uses [CSS Modules](https://github.com/css-modules/css-modules) for styling. The component stylesheet is at [RepoSelector.module.css].

Example of using the stylesheet:

```css
.RepoSelector {
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
<div className={this.styles.RepoSelector}>
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
interface RepoSelectorProps extends RouteComponentProps {
	repos: Repo[];
	createRepo(name: string, url?: string): Promise<Repo>;
}
```

### Interfaces

```tsx
export interface Repo {
	name: string;
	branches: any[];
	url: string;
	owner: string;
	processing: boolean;
}
interface RepoSelectorProps extends RouteComponentProps {
	repos: Repo[];
	createRepo(name: string, url?: string): Promise<Repo>;
}
interface RepoSelectorState {
	showCreate: boolean;
	name: string;
	url: string;
	search: string;
	repoSort: 'name' | 'commits';
}
```
