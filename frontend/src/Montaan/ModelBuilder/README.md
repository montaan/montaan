# ModelBuilder

The ModelBuilder creates a 3D model based on the loaded filesystem tree and the view camera.

The ModelBuilder is used by MainView/main.tsx.

The primary reviewer for ModelBuilder is Ilmari Heikkinen <hei@heichen.hk>.

## Outputs

The ModelBuilder returns geometries, a list of directories that should be loaded from
the server, and a list of files that are large enough to be loaded in detailed view.

## API

### Exports

```tsx
export interface ModelBuilderResult
export default class ModelBuilder
```

### Interfaces

```tsx
interface ExtendedSDFText extends SDFText {
	xScale: number;
	fsEntry: FSEntry;
}
export interface ModelBuilderResult {
	verts: Float32Array;
	colorVerts: Float32Array;
	labelVerts: Float32Array;
	labelUVs: Float32Array;

	vertexCount: number;
	textVertexCount: number;

	boundingBox: THREE.Box3;
	boundingSphere: THREE.Sphere;

	fileIndex: number;
	fsEntryIndex: FSEntry[];

	centerEntry: FSEntry;
	smallestCovering: FSEntry;

	entriesToFetch: FSEntry[];
	visibleFiles: FSEntry[];
	thumbnailsToFetch: { fsEntry: FSEntry; z: number }[];
}
```
