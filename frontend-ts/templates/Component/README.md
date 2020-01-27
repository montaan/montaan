# %%TARGET%%/%%NAME%%

The %%NAME%% component is an X for Y.

The %%NAME%% component is used by Z.

The primary reviewer for %%NAME%% is %%AUTHOR%%.

## Usage

```jsx
<%%NAME%%
    propA={}
/>
```

## Props

```js
propA: PropTypes.string, // propA
```

## Styling

The %%NAME%% component uses [CSS Modules](https://github.com/css-modules/css-modules) for styling. The component stylesheet is at [css/style.module.css]. The stylesheet is wrapped inside a strict access proxy that throws if you try to access undefined styles, this helps to fix typos.

Example of using the stylesheet:

```css
.%%NAME%% {
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

```jsx
render() {
    return (
        <div className={this.styles.%%NAME%%}>
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

%%AUTHOR%%

