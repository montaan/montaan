# ImageFileView

The ImageFileView component is a 3D model of an image file, shown when zoomed in close enough to an image file.

The ImageFileView component is used by MainView/main.tsx.

The primary reviewer for ImageFileView is Ilmari Heikkinen <hei@heichen.hk>.

## API

### Exports

```tsx
export default class ImageFileView
```

### Interfaces

```tsx
interface ImageMesh extends THREE.Mesh {
	material: THREE.MeshBasicMaterial;
}
```
