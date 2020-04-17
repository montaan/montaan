# src/Montaan/Filesystems

Filesystems are used to dynamically generate trees and read file contents.

## API

### Exports

```tsx
export const EmptyLabelGeometry = SDFText;
export class FSEntry
export class FSDirEntry
export class NotImplementedError
export interface IFilesystem
export class Namespace
export class Filesystem
export function registerFileSystem(fsType:
export function unregisterFileSystem(fsType:
export function getFSType(url:
export function mountURL(fileTree:
export function mount(fileTree:
export function getPathEntry(fileTree:
export function getOrCreateDir(tree:
export function createDir(tree:
export function createFile(tree:
export function getNearestPathEntry(fileTree:
export function getFullPath(fsEntry:
export function getSiblings(fileTree:
export function getFilesystemForPath(namespace:
export function getAllFilesystemsForPath(namespace:
export type ExtendedFSEntry = { fsEntry: FSEntry; point?: number[]; search?: string };
export function getFSEntryForURL(namespace:
export function getNearestFSEntryForURL(
```

### Interfaces

```tsx
export interface IFilesystem {
	mountPoint?: FSEntry;
	readDir(path: string): Promise<FSEntry | null>;
	readDirs(paths: string[]): Promise<(FSEntry | null)[]>;
	readFile(path: string): Promise<ArrayBuffer>;
	readThumbnails(thumbnails: { path: string; z: number }[]): Promise<(ArrayBuffer | undefined)[]>;
	writeFile(path: string, contents: ArrayBuffer): Promise<boolean>;
	mkdir(path: string): Promise<boolean>;
	rm(path: string): Promise<boolean>;
	rmdir(path: string): Promise<boolean>;
	getUIComponents(state: any): React.ReactElement;
}
```
