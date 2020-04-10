# ModelBuilder

The ModelBuilder creates a 3D model based on the loaded filesystem tree and the view camera.

The ModelBuilder is used by MainView/main.tsx.

The primary reviewer for ModelBuilder is Ilmari Heikkinen <hei@heichen.hk>.

## Outputs

The ModelBuilder returns geometries, a list of directories that should be loaded from
the server, and a list of files that are large enough to be loaded in detailed view.
