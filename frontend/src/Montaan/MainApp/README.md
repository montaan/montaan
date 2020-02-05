# components/MainApp

Ilmari Heikkinen <hei@heichen.hk> is a lame-o who hasn't documented their yucky component MainApp. Neener neener!

The MainApp component is an X for Y.

The MainApp component is used by Z.

The primary reviewer for MainApp is Ilmari Heikkinen <hei@heichen.hk>.

## Usage

```tsx
<MainApp
    propA={}
/>
```

## Props

This is the description of the MainApp component's MainAppProps interface.

```ts
interface MainAppProps {
    propA: PropTypes.string, // propA is used to pass A to MainApp
}
```

## Styling

The MainApp component uses [CSS Modules](https://github.com/css-modules/css-modules) for styling. The component stylesheet is at [css/MainApp.module.css].

Example of using the stylesheet:

```css
.MainApp {
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
        <div className={this.styles.MainApp}>
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

