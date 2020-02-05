# TARGET/NAME

AUTHOR is a lame-o who hasn't documented their yucky component NAME. Neener neener!

The NAME component is an X for Y.

The NAME component is used by Z.

The primary reviewer for NAME is AUTHOR.

## Usage

```tsx
<NAME
    propA={}
/>
```

## Props

This is the description of the NAME component's NAMEProps interface.

```ts
interface NAMEProps {
    propA: PropTypes.string, // propA is used to pass A to NAME
}
```

## Styling

The NAME component uses [CSS Modules](https://github.com/css-modules/css-modules) for styling. The component stylesheet is at [css/NAME.module.css].

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
render() {
    return (
        <div className={this.styles.NAME}>
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

AUTHOR

