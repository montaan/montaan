# Montaan/FileViews/VideoFileView

The VideoFileView file view is displays videos in the filesystem tree for inline video viewing.

The VideoFileView file view is used by MainApp.

The primary reviewer for VideoFileView is Ilmari Heikkinen <hei@heichen.hk>.

## Usage

```tsx
const fileView = new VideoFileView();
scene.add(fileView);
fileView.load(arrayBuffer);
```

## API

### Exports

```tsx
export default class VideoFileView
```
