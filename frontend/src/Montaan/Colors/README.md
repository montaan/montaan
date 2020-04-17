# Colors

The Colors library defines the colors for the different files and directories.

The Colors library is used by MainView, ModelBuilder and Text.

The primary reviewer for Colors is Ilmari Heikkinen <hei@heichen.hk>.

## API

### Interfaces

```tsx
interface THREEColors {
	[propType: string]: THREE.Color;
}
interface FileColors {
	musicFile: ColorArray;
	configFile: ColorArray;
	imageFile: ColorArray;
	documentFile: ColorArray;
	archiveFile: ColorArray;
	objectFile: ColorArray;
	headerFile: ColorArray;
	exeFile: ColorArray;
	legalFile: ColorArray;
	videoFile: ColorArray;
	hiddenFile: ColorArray;
	unknownFile: ColorArray;
	actionAFile: ColorArray;
	actionMFile: ColorArray;
	actionRFile: ColorArray;
	actionCFile: ColorArray;
	actionDFile: ColorArray;

	musicDir: ColorArray;
	configDir: ColorArray;
	imageDir: ColorArray;
	documentDir: ColorArray;
	archiveDir: ColorArray;
	objectDir: ColorArray;
	headerDir: ColorArray;
	exeDir: ColorArray;
	legalDir: ColorArray;
	videoDir: ColorArray;
	hiddenDir: ColorArray;
	unknownDir: ColorArray;
	actionADir: ColorArray;
	actionMDir: ColorArray;
	actionRDir: ColorArray;
	actionCDir: ColorArray;
	actionDDir: ColorArray;
}
```
