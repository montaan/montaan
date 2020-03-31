/**
 * The ModelBuilder converts a FileTree into a renderer model.
 *
 * On every frame, the ModelBuilder rebuilds the tree model to
 * have only the visible portion of the FS tree.
 *
 * If the FS tree has dirs that are visible but haven't been
 * fetched, the ModelBuilder requests those dirs to be fetched.
 *
 * The created tree model includes a list of files that
 * should have a FileView created for them.
 *
 * The ModelBuilder should be run inside a Worker.
 * If the ModelBuilder hasn't returned before the frame draw
 * time, the previous frame's model is used.
 */

import Text from '../lib/Text';
import { FileTree } from '../MainApp';
import { FSEntry } from '../lib/filesystem';
import * as THREE from 'three';
import Geometry from '../lib/Geometry';
import { NavCamera } from '../MainView/main';
import Colors from '../lib/Colors';
import { SDFText } from '../lib/third_party/three-bmfont-text-modified';

export default class ModelBuilder {
	smallestCovering?: FSEntry;
	_modelVerts = new Float32Array(36 * 1000);
	_modelColorVerts = new Float32Array(36 * 1000);
	_labelVerts = new Float32Array(4 * 10000);
	_labelUVs = new Float32Array(4 * 10000);

	buildModel(
		tree: FileTree,
		camera: NavCamera,
		mesh: THREE.Mesh
	): {
		verts: Float32Array;
		colorVerts: Float32Array;
		labelVerts: Float32Array;
		labelUVs: Float32Array;
		fileIndex: number;
		fsEntryIndex: FSEntry[];
		meshIndex: Map<FSEntry, number>;
		zoomedInPath: string;
		navigationTarget: string;
		smallestCovering: FSEntry;
		entriesToFetch: FSEntry[];
		visibleFiles: FSEntry[];
		vertexCount: number;
		textVertexCount: number;
	} {
		const fileTree = tree.tree;

		let viewRoot = this.smallestCovering;
		while (
			viewRoot &&
			!Geometry.bboxCoversFrustum(
				Geometry.getFSEntryBBox(viewRoot, mesh, camera),
				mesh,
				camera
			)
		) {
			viewRoot = viewRoot.parent;
		}
		if (!viewRoot) viewRoot = fileTree;

		let { x, y, z, scale } = viewRoot;
		let fx = fileTree.x,
			fy = fileTree.y,
			fz = fileTree.z,
			fs = fileTree.scale;
		x = (x - fileTree.x) / fileTree.scale;
		y = (y - fileTree.y) / fileTree.scale;
		z = (z - fileTree.z) / fileTree.scale;
		scale /= fileTree.scale;

		fileTree.x = -x / scale;
		fileTree.y = -y / scale;
		fileTree.z = -z / scale;
		fileTree.scale = 1 / scale;

		fileTree.index = undefined;
		fileTree.vertexIndex = 0;
		fileTree.textVertexIndex = 0;

		const {
			verts,
			colorVerts,
			fileIndex,
			labelGeometries,
			fsEntryIndex,
			meshIndex,
			zoomedInPath,
			navigationTarget,
			smallestCovering,
			entriesToFetch,
			visibleFiles,
		} = this.createFileTreeQuads(fileTree, 0, camera, mesh);

		let textVertCount = 0;
		for (let i = 0; i < labelGeometries.length; i++) {
			const c = labelGeometries[i];
			textVertCount += c.position.length;
		}
		if (this._labelVerts.length < textVertCount) {
			this._labelVerts = new Float32Array(textVertCount * 2);
			this._labelUVs = new Float32Array(textVertCount);
		}
		const labelVerts = this._labelVerts;
		const labelUVs = this._labelUVs;
		let j = 0;
		for (let i = 0; i < labelGeometries.length; i++) {
			const c = labelGeometries[i];
			const fsEntry = c.fsEntry;
			const xScale = c.xScale;
			const positionX = fsEntry.x + fsEntry.scale * (fsEntry.entries ? 0 : 0.02);
			const positionY = fsEntry.y + fsEntry.scale * (fsEntry.entries ? 1.02 : 0.02);
			const positionZ = fsEntry.z;
			const scale = xScale * fsEntry.scale * 0.00436;
			const arr = c.position;
			for (let k = 0; k < arr.length; k += 4) {
				labelVerts[j + k] = arr[k] * scale + positionX;
				labelVerts[j + k + 1] = arr[k + 1] * scale + positionY;
				labelVerts[j + k + 2] = arr[k + 2] * scale + positionZ;
				labelVerts[j + k + 3] = arr[k + 3];
			}
			labelUVs.set(c.uv, j / 2);
			j += c.position.length;
		}

		camera.position.x = ((camera.position.x - fx) / fs) * fileTree.scale + fileTree.x;
		camera.position.y = ((camera.position.y - fy) / fs) * fileTree.scale + fileTree.y;
		camera.position.z = ((camera.position.z - fz) / fs) * fileTree.scale + fileTree.z;
		camera.targetPosition.x =
			((camera.targetPosition.x - fx) / fs) * fileTree.scale + fileTree.x;
		camera.targetPosition.y =
			((camera.targetPosition.y - fy) / fs) * fileTree.scale + fileTree.y;
		camera.targetPosition.z =
			((camera.targetPosition.z - fz) / fs) * fileTree.scale + fileTree.z;
		camera.near = (camera.near / fs) * fileTree.scale;
		camera.far = (camera.far / fs) * fileTree.scale;

		this.smallestCovering = smallestCovering;

		const vertexCount = fileIndex * 12;
		const textVertexCount = textVertCount / 4;

		return {
			verts,
			colorVerts,
			labelVerts,
			labelUVs,
			fileIndex,
			fsEntryIndex,
			meshIndex,
			zoomedInPath,
			navigationTarget,
			smallestCovering,
			entriesToFetch,
			visibleFiles,
			vertexCount,
			textVertexCount,
		};
	}

	cmpFSEntryDistanceFromCenter(
		a: { scale: number; distanceFromCenter: number },
		b: { scale: number; distanceFromCenter: number }
	) {
		return (
			(b.scale - a.scale) / (b.scale + a.scale) +
			0.1 * (a.distanceFromCenter - b.distanceFromCenter)
		);
	}

	createFileTreeQuads(
		fileTree: FSEntry,
		fileIndex: number,
		camera: NavCamera,
		mesh: THREE.Mesh
	): {
		verts: Float32Array;
		colorVerts: Float32Array;
		fileIndex: number;
		labelGeometries: ExtendedSDFText[];
		fsEntryIndex: FSEntry[];
		meshIndex: Map<FSEntry, number>;
		zoomedInPath: string;
		navigationTarget: string;
		smallestCovering: FSEntry;
		entriesToFetch: FSEntry[];
		visibleFiles: FSEntry[];
	} {
		const geo = {
			verts: this._modelVerts,
			colorVerts: this._modelColorVerts,
		};
		const labelGeometries: ExtendedSDFText[] = [];
		const fsEntryIndex: FSEntry[] = [];
		const meshIndex: Map<FSEntry, number> = new Map();
		const vertexIndices = { vertexIndex: 0, textVertexIndex: 0 };

		let zoomedInPath = '';
		let navigationTarget = '';
		let smallestCovering = fileTree;

		// Breadth-first traversal of mesh.fileTree
		// - determines fsEntry visibility
		// - finds the covering fsEntry
		// - finds the currently zoomed-in path and breadcrumb path

		const stack = [fileTree];
		const entriesToFetch = [];
		const visibleFiles = [];
		let skipped = 0;
		while (stack.length > 0) {
			const tree = stack.pop();
			if (!tree) break;
			fileIndex = this.layoutDir(
				tree,
				fileIndex,
				geo,
				labelGeometries,
				fsEntryIndex,
				meshIndex,
				vertexIndices
			);
			if (fileIndex > 10000) break;
			for (let name in tree.entries) {
				const fsEntry = tree.entries[name];

				const bbox = Geometry.getFSEntryBBox(fsEntry, mesh, camera);
				const pxWidth = bbox.width * window.innerWidth * 0.5;
				const isSmall = pxWidth < (fsEntry.entries ? 15 : 150);

				if (!bbox.onScreen) skipped++;

				// Skip entries that are outside frustum or too small.
				if (!bbox.onScreen || isSmall) continue;

				// Directory
				if (fsEntry.entries) {
					stack.push(fsEntry); // Descend into directories.
					// Fetch directories that haven't been fetched yet.
					if (pxWidth > 30 && !fsEntry.fetched) {
						fsEntry.distanceFromCenter = Geometry.bboxDistanceToFrustumCenter(
							bbox,
							mesh,
							camera
						);
						entriesToFetch.push(fsEntry);
					}
				} else {
					// File that's large on screen, let's add a file view if needed.
					visibleFiles.push(fsEntry);
				}

				// Large items
				// Update navigation target and smallest covering fsEntry (and its path).
				if (bbox.width > 1) {
					if (Geometry.bboxCoversFrustum(bbox, mesh, camera)) {
						zoomedInPath += '/' + fsEntry.name;
						navigationTarget += '/' + fsEntry.name;
						smallestCovering = fsEntry;
					} else if (Geometry.bboxAtFrustumCenter(bbox, mesh, camera)) {
						navigationTarget += '/' + fsEntry.name;
					}
				}
			}
		}
		// console.log(skipped, fileIndex);
		entriesToFetch.sort(this.cmpFSEntryDistanceFromCenter);
		return {
			verts: geo.verts,
			colorVerts: geo.colorVerts,
			fileIndex,
			labelGeometries,
			fsEntryIndex,
			meshIndex,
			zoomedInPath,
			navigationTarget,
			smallestCovering,
			entriesToFetch,
			visibleFiles,
		};
	}

	layoutDir(
		fileTree: FSEntry,
		fileIndex: number,
		geo: { verts: Float32Array; colorVerts: Float32Array },
		labelGeometries: ExtendedSDFText[],
		index: FSEntry[],
		meshIndex: Map<FSEntry, number>,
		vertexIndices: { vertexIndex: number; textVertexIndex: number }
	) {
		var dirs = [];
		var files = [];
		var dotDirs = [];
		var dotFiles = [];
		for (let i in fileTree.entries) {
			const obj = fileTree.entries[i];
			if (obj.entries === null) {
				if (obj.name.startsWith('.') && false) dotFiles.push(obj);
				else files.push(obj);
			} else {
				if (obj.name.startsWith('.') && false) dotDirs.push(obj);
				else dirs.push(obj);
			}
		}

		if (fileTree.index === undefined) {
			fileTree.index = fileIndex;
			fileIndex++;
		}

		const dirScale = files.length === 0 ? 1 : 1;
		const filesScale = dirs.length === 0 ? 0.5 : 0.5;
		const fileXOff = dirs.length === 0 ? 0 : 0;
		let filesPerRow = dirs.length === 0 ? 2 : 2;

		const dirSquareSide = Math.ceil(
			Math.sqrt(Math.ceil(dirScale * (dirs.length + (files.length > 0 ? 1 : 0))))
		);
		let fileSquareSide = Math.ceil(Math.sqrt(Math.ceil(files.length / filesPerRow)));

		var maxX = 0,
			maxY = 0;
		var filesBox = { x: fileTree.x, y: fileTree.y, z: fileTree.z, scale: fileTree.scale };
		outer: for (let x = 0; x < dirSquareSide; x++) {
			for (let y = 0; y < dirSquareSide / dirScale; y++) {
				const off = x * Math.ceil(dirSquareSide / dirScale) + y;
				if (off >= dirs.length) {
					if (dirs.length > 0) {
						if (dirs.length <= 2) {
							x = 1;
							y = 1;
							filesPerRow = 1;
							fileSquareSide = Math.ceil(
								Math.sqrt(Math.ceil(files.length / filesPerRow))
							);
							const yOff = 1 - (0.675 * y + 1) * (1 / dirSquareSide);
							const xOff = 1.0 * x * (1 / dirSquareSide);
							const subX = xOff + 0.0 / dirSquareSide;
							const subY = yOff + 0.0 / dirSquareSide;
							fileTree.filesBox = filesBox = {
								x: fileTree.x + fileTree.scale * subX * dirScale,
								y:
									fileTree.y +
									fileTree.scale * subY * dirScale +
									(1 - dirScale) * fileTree.scale,
								scale: 2 * fileTree.scale * (0.8 / dirSquareSide) * dirScale,
								z: fileTree.z,
							};
						} else if (dirs.length !== dirSquareSide * dirSquareSide - 1) {
							y = x === dirSquareSide - 1 ? y + 2 : 2;
							x = dirSquareSide - 1;
							filesPerRow = 1;
							fileSquareSide = Math.ceil(
								Math.sqrt(Math.ceil(files.length / filesPerRow))
							);
							const yOff = 1 - (0.5 * y + 1) * (1 / dirSquareSide);
							const xOff = 0.9 * x * (1 / dirSquareSide);
							const subX = xOff + 0.1 / dirSquareSide;
							const subY = yOff + 0.125 / dirSquareSide;
							fileTree.filesBox = filesBox = {
								x: fileTree.x + fileTree.scale * subX * dirScale,
								y:
									fileTree.y +
									fileTree.scale * subY * dirScale +
									(1 - dirScale) * fileTree.scale,
								scale: 2 * fileTree.scale * (0.9 / dirSquareSide) * dirScale,
								z: fileTree.z,
							};
						} else {
							const yOff = 1 - (0.5 * y + 1) * (1 / dirSquareSide);
							const xOff = 0.9 * x * (1 / dirSquareSide);
							const subX = xOff + 0.1 / dirSquareSide;
							const subY = yOff + 0.125 / dirSquareSide;
							fileTree.filesBox = filesBox = {
								x: fileTree.x + fileTree.scale * subX * dirScale,
								y:
									fileTree.y +
									fileTree.scale * subY * dirScale +
									(1 - dirScale) * fileTree.scale,
								scale: fileTree.scale * (0.8 / dirSquareSide) * dirScale,
								z: fileTree.z,
							};
						}
					}
					break outer;
				}
				maxX = Math.max(x, maxX);
				maxY = Math.max(y, maxY);
				const yOff = 1 - (0.5 * y + 1) * (1 / dirSquareSide);
				const xOff = 0.9 * x * (1 / dirSquareSide);
				const dir = dirs[off];
				if (meshIndex.has(dir) && meshIndex.get(dir) !== -1) continue;
				const subX = xOff + 0.1 / dirSquareSide;
				const subY = yOff + 0.125 / dirSquareSide;
				dir.building = true;
				dir.x = fileTree.x + fileTree.scale * subX * dirScale;
				dir.y =
					fileTree.y + fileTree.scale * subY * dirScale + (1 - dirScale) * fileTree.scale;
				dir.scale = fileTree.scale * (0.8 / dirSquareSide) * dirScale;
				dir.z = fileTree.z + dir.scale * 0.2;
				dir.index = fileIndex;
				fileIndex++;
				dir.vertexIndex = vertexIndices.vertexIndex;
				dir.textVertexIndex = vertexIndices.textVertexIndex;
				dir.parent = fileTree;
				index[dir.index] = dir;
				meshIndex.set(dir, dir.index);
				var dirColor = dir.color || Colors.getDirectoryColor(dir);
				this.ensureSpaceForEntry(geo, vertexIndices);
				Geometry.setColor(geo.colorVerts, dir.index, dirColor);
				vertexIndices.vertexIndex = Geometry.makeQuad(
					geo.verts,
					dir.index,
					dir.x,
					dir.y + 0.5 * dir.scale,
					dir.scale,
					dir.scale * 0.5,
					dir.z
				);
				vertexIndices.textVertexIndex = this.createTextForEntry(
					dir,
					labelGeometries,
					vertexIndices.textVertexIndex,
					0.65
				);
			}
		}

		maxX = 0;
		maxY = 0;
		outer: for (let x = 0; x < fileSquareSide * filesPerRow; x++) {
			for (let y = 0; y < fileSquareSide; y++) {
				const off = x * fileSquareSide + y;
				if (off >= files.length) {
					break outer;
				}
				maxX = Math.max(x, maxX);
				maxY = Math.max(y, maxY);
				const yOff = 1 - (y + 1) * (1 / fileSquareSide);
				const xOff = fileXOff + x * (1 / fileSquareSide);
				const subX = xOff + 0.05 / fileSquareSide;
				const subY = yOff + 0.05 / fileSquareSide;

				const file = files[off];
				if (meshIndex.has(file) && meshIndex.get(file) !== -1) continue;
				const fileColor = file.color || Colors.getFileColor(file);
				file.x = filesBox.x + filesBox.scale * subX * filesScale;
				file.y =
					filesBox.y +
					filesBox.scale * subY * filesScale +
					filesBox.scale * (1 - filesScale);
				file.scale = filesBox.scale * (0.9 / fileSquareSide) * filesScale;
				file.z = filesBox.z + file.scale * 0.2;
				file.index = fileIndex;
				file.vertexIndex = vertexIndices.vertexIndex;
				file.lastIndex = fileIndex;
				file.parent = fileTree;
				index[file.index] = file;
				meshIndex.set(file, file.index);
				this.ensureSpaceForEntry(geo, vertexIndices);
				Geometry.setColor(geo.colorVerts, file.index, fileColor);
				vertexIndices.vertexIndex = Geometry.makeQuad(
					geo.verts,
					file.index,
					file.x,
					file.y,
					file.scale,
					file.scale,
					file.z
				);
				vertexIndices.textVertexIndex = this.createTextForEntry(
					file,
					labelGeometries,
					vertexIndices.textVertexIndex,
					1
				);
				file.lastVertexIndex = vertexIndices.vertexIndex;
				fileIndex++;
			}
		}
		return fileIndex;
	}

	ensureSpaceForEntry(
		geo: { verts: Float32Array; colorVerts: Float32Array },
		vertexIndices: { vertexIndex: number; textVertexIndex: number }
	) {
		if (geo.verts.length / 3 < vertexIndices.vertexIndex + 6 * Geometry.quadCount) {
			const newVerts = new Float32Array(
				Math.max(18 * Geometry.quadCount, geo.verts.length * 2)
			);
			const newColorVerts = new Float32Array(newVerts.length);
			newVerts.set(geo.verts);
			newColorVerts.set(geo.colorVerts);
			geo.verts = newVerts;
			geo.colorVerts = newColorVerts;
			this._modelVerts = newVerts;
			this._modelColorVerts = newColorVerts;
		}
	}

	createTextForEntry(
		fsEntry: FSEntry,
		labelGeometries: SDFText[],
		textVertexIndex: number,
		xScale: number = 1
	) {
		if (!fsEntry.labelGeometry) {
			const textGeometry = Text.createTextArrays({
				text: fsEntry.title,
				font: Text.font,
				noBounds: true,
			}) as ExtendedSDFText;
			textGeometry.xScale = xScale;
			textGeometry.fsEntry = fsEntry;

			const textScaleW =
				220 / (textGeometry.layout.width > 220 ? textGeometry.layout.width : 220);
			const textScaleH = (fsEntry.entries ? 30 : 50) / textGeometry.layout.height;

			const textScale = textScaleW > textScaleH ? textScaleH : textScaleW;
			const arr = textGeometry.position;
			for (let j = 0; j < arr.length; j += 4) {
				arr[j] = arr[j] * textScale;
				arr[j + 1] = arr[j + 1] * -textScale;
				arr[j + 2] = arr[j + 2] * textScale;
			}

			fsEntry.labelGeometry = textGeometry;
		}

		fsEntry.textVertexIndex = textVertexIndex;
		fsEntry.lastTextVertexIndex = textVertexIndex + fsEntry.labelGeometry.position.length / 4;
		labelGeometries.push(fsEntry.labelGeometry);

		return fsEntry.lastTextVertexIndex;
	}
}

interface ExtendedSDFText extends SDFText {
	xScale: number;
	fsEntry: FSEntry;
}
