# Geometry

The Geometry library contains utility functions for dealing with bounding-box to frustum calculations and for generating file & directory mesh geometry.

The Geometry library is used by ModelBuilder and others.

The primary reviewer for Geometry is Ilmari Heikkinen <hei@heichen.hk>.

## API

### Exports

```tsx
export interface IBufferGeometryWithFileCount
export class BBox
```

### Interfaces

```tsx
export interface IBufferGeometryWithFileCount extends THREE.BufferGeometry {
	maxFileCount: number;
}
```
