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

import * as Comlink from 'comlink';
import BinaryHeap from '../../lib/BinaryHeap';

interface ExtendedSDFText extends SDFText {
	xScale: number;
	fsEntry: FSEntry;
}

export default class ModelBuilder {
	smallestCovering?: FSEntry;
	_modelVerts = new Float32Array(36 * 1000);
	_modelColorVerts = new Float32Array(36 * 1000);
	_labelVerts = new Float32Array(4 * 10000);
	_labelUVs = new Float32Array(4 * 10000);

	buildModel(
		tree: FileTree,
		camera: NavCamera,
		mesh: THREE.Mesh,
		forceLoads: Set<FSEntry>
	): {
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

		camera.updateProjectionMatrix();
		camera.updateWorldMatrix(true, true);
		mesh.updateMatrixWorld(true);

		fileTree.index = undefined;
		fileTree.vertexIndex = 0;
		fileTree.textVertexIndex = 0;

		const {
			verts,
			colorVerts,
			fileIndex,
			labelGeometries,
			fsEntryIndex,
			centerEntry,
			smallestCovering,
			entriesToFetch,
			visibleFiles,
		} = this.createFileTreeQuads(fileTree, 0, camera, mesh, forceLoads);

		const textVertCount = this.ensureLabelGeometryAllocation(labelGeometries);
		this.fillLabelGeometry(labelGeometries);

		this.smallestCovering = smallestCovering;

		const vertexCount = fileIndex * 12;
		const textVertexCount = textVertCount / 4;

		const boundingSphere = new THREE.Sphere();
		const boundingBox = new THREE.Box3();

		this.computeBounds(boundingBox, boundingSphere, verts, vertexCount, 3);

		return {
			verts,
			colorVerts,
			labelVerts: this._labelVerts,
			labelUVs: this._labelUVs,

			vertexCount,
			textVertexCount,

			boundingBox,
			boundingSphere,

			fileIndex,
			fsEntryIndex,

			centerEntry,
			smallestCovering,

			entriesToFetch,
			visibleFiles,
		};
	}

	ensureLabelGeometryAllocation(labelGeometries: ExtendedSDFText[]): number {
		let textVertCount = 0;
		for (let i = 0; i < labelGeometries.length; i++) {
			const c = labelGeometries[i];
			textVertCount += c.position.length;
		}
		if (this._labelVerts.length < textVertCount) {
			this._labelVerts = new Float32Array(textVertCount * 2);
			this._labelUVs = new Float32Array(textVertCount);
		}
		return textVertCount;
	}

	fillLabelGeometry(labelGeometries: ExtendedSDFText[]): void {
		const labelVerts = this._labelVerts;
		const labelUVs = this._labelUVs;
		for (let i = 0, vertCount = 0, uvCount = 0; i < labelGeometries.length; i++) {
			const c = labelGeometries[i];
			labelUVs.set(c.uv, uvCount);
			uvCount += c.uv.length;
			const fsEntry = c.fsEntry;
			const positionX = fsEntry.x + fsEntry.scale * (fsEntry.isDirectory ? 0 : 0.02);
			const positionY = fsEntry.y + fsEntry.scale * (fsEntry.isDirectory ? 1.02 : 0.02);
			const positionZ = fsEntry.z;
			const scale = c.xScale * fsEntry.scale * 0.00436;
			const arr = c.position;
			for (let k = 0; k + 3 < arr.length && vertCount + 3 < labelVerts.length; k += 4) {
				labelVerts[vertCount++] = arr[k + 0] * scale + positionX;
				labelVerts[vertCount++] = arr[k + 1] * scale + positionY;
				labelVerts[vertCount++] = arr[k + 2] * scale + positionZ;
				labelVerts[vertCount++] = arr[k + 3] * 1 + 0;
			}
		}
	}

	bounds3(
		positions: Float32Array,
		itemCount: number,
		itemSize: number,
		box: { min: number[]; max: number[] }
	) {
		let minX = positions[0];
		let minY = positions[1];
		let minZ = positions[2];
		let maxX = positions[0];
		let maxY = positions[1];
		let maxZ = positions[2];

		for (
			let i = 0, l = Math.min(itemCount * itemSize, positions.length);
			i < l;
			i += itemSize
		) {
			var x = positions[i + 0];
			var y = positions[i + 1];
			var z = positions[i + 2];
			if (x < minX) minX = x;
			else if (x > maxX) maxX = x;
			if (y < minY) minY = y;
			else if (y > maxY) maxY = y;
			if (z < minZ) minZ = z;
			else if (z > maxZ) maxZ = z;
		}

		box.min[0] = minX;
		box.min[1] = minY;
		box.min[2] = minZ;
		box.max[0] = maxX;
		box.max[1] = maxY;
		box.max[2] = maxZ;
	}

	computeBounds(
		boundingBox: THREE.Box3,
		boundingSphere: THREE.Sphere,
		positions: Float32Array,
		itemCount: number,
		itemSize: number
	) {
		const box = { min: [0, 0, 0], max: [0, 0, 0] };
		this.bounds3(positions, itemCount, itemSize, box);

		const width = box.max[0] - box.min[0];
		const height = box.max[1] - box.min[1];
		const depth = box.max[2] - box.min[2];
		const length = Math.sqrt(width * width + height * height + depth * depth);
		boundingSphere.center.set(
			box.min[0] + width / 2,
			box.min[1] + height / 2,
			box.min[2] + depth / 2
		);
		boundingSphere.radius = length / 2;

		boundingBox.min.set(box.min[0], box.min[1], box.min[2]);
		boundingBox.max.set(box.max[0], box.max[1], box.max[2]);
	}

	cmpFSEntryDistanceFromCenter(
		a: { scale: number; distanceFromCenter: number },
		b: { scale: number; distanceFromCenter: number }
	) {
		if (b.scale + a.scale === 0) return 0;
		let distanceMetric = a.distanceFromCenter - b.distanceFromCenter;
		if (distanceMetric !== 0) {
			distanceMetric /= (distanceMetric < 0 ? -1 : 1) * distanceMetric;
		}
		return (b.scale - a.scale) / (b.scale + a.scale) + 0.1 * distanceMetric;
	}

	createFileTreeQuads(
		fileTree: FSEntry,
		fileIndex: number,
		camera: NavCamera,
		mesh: THREE.Mesh,
		forceLoads: Set<FSEntry>
	): {
		verts: Float32Array;
		colorVerts: Float32Array;
		fileIndex: number;
		labelGeometries: ExtendedSDFText[];
		fsEntryIndex: FSEntry[];
		centerEntry: FSEntry;
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
		const vertexIndices = { vertexIndex: 0, textVertexIndex: 0 };

		let smallestCovering = fileTree;

		// Breadth-first traversal of mesh.fileTree
		// - determines fsEntry visibility
		// - finds the covering fsEntry
		// - finds the currently zoomed-in path and breadcrumb path

		const buildQueue = new BinaryHeap<FSEntry>(this.cmpFSEntryDistanceFromCenter);
		buildQueue.add(fileTree);
		const entriesToFetchQueue = new BinaryHeap<FSEntry>(this.cmpFSEntryDistanceFromCenter);
		const visibleFiles = [];
		const viewWidth = window.innerWidth;
		let centerEntry = fileTree;
		while (buildQueue.size > 0) {
			const tree = buildQueue.take();
			if (!tree || !tree.isDirectory) continue;
			const forceLoadTree = forceLoads.has(tree);
			if (fileIndex > 2500 && !forceLoadTree && tree !== centerEntry) continue;
			fileIndex = this.layoutDir(
				forceLoads,
				camera,
				mesh,
				4 / viewWidth,
				tree,
				fileIndex,
				geo,
				labelGeometries,
				fsEntryIndex,
				vertexIndices
			);

			for (let fsEntry of tree.entries.values()) {
				const forceLoadFSEntry = forceLoads.has(fsEntry);

				const bbox = fsEntry.bbox;
				const pxWidth = bbox.width * viewWidth * 0.5;
				const isSmall = pxWidth < (fsEntry.isDirectory ? 15 : 150);
				fsEntry.distanceFromCenter = Geometry.bboxDistanceToFrustumCenter(
					bbox,
					mesh,
					camera
				);

				// Skip entries that are outside frustum or too small, and aren't on the nav target path.
				if (!forceLoadFSEntry && (!bbox.onScreen || isSmall)) continue;

				// Directory
				if (fsEntry.isDirectory) {
					// Descend into directories.
					buildQueue.add(fsEntry);
					// Fetch directories that haven't been fetched yet.
					if ((forceLoadFSEntry || pxWidth > 15) && !fsEntry.fetched) {
						entriesToFetchQueue.add(fsEntry);
					}
				} else if (!isSmall) {
					// File that's large on screen, let's add a file view if needed.
					visibleFiles.push(fsEntry);
				}

				// Large items
				// Update navigation target and smallest covering fsEntry (and its path).
				if (bbox.width > 1) {
					if (Geometry.bboxCoversFrustum(bbox, mesh, camera)) {
						centerEntry = fsEntry;
						smallestCovering = fsEntry;
					} else if (Geometry.bboxAtFrustumCenter(bbox, mesh, camera)) {
						centerEntry = fsEntry;
					}
				}
			}
			// Sort the subdirectories to prioritize model creation at center of screen.
		}
		const entriesToFetch = entriesToFetchQueue.heapValues;
		return {
			verts: geo.verts,
			colorVerts: geo.colorVerts,
			fileIndex,
			labelGeometries,
			fsEntryIndex,
			centerEntry,
			smallestCovering,
			entriesToFetch,
			visibleFiles,
		};
	}

	layoutDir(
		forceLoads: Set<FSEntry>,
		camera: NavCamera,
		mesh: THREE.Mesh,
		minWidth: number,
		fileTree: FSEntry,
		fileIndex: number,
		geo: { verts: Float32Array; colorVerts: Float32Array },
		labelGeometries: ExtendedSDFText[],
		index: FSEntry[],
		vertexIndices: { vertexIndex: number; textVertexIndex: number }
	) {
		const dirs = [];
		const files = [];
		// var dotDirs = [];
		// var dotFiles = [];
		if (fileTree.isDirectory) {
			for (let fsEntry of fileTree.entries.values()) {
				if (fsEntry.isDirectory) {
					// if (fsEntry.name.startsWith('.') && false) dotDirs.push(fsEntry);
					dirs.push(fsEntry);
				} else {
					// if (fsEntry.name.startsWith('.') && false) dotFiles.push(fsEntry);
					files.push(fsEntry);
				}
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

		const yDirOff = (1 - dirScale) * fileTree.scale;
		const dirScale2 = dirScale * fileTree.scale;

		let dirsLength = 0;
		dirs.forEach((d) => (dirsLength += d.relativeScale < 0 ? 1 : 0));

		const dirSquareSide = Math.ceil(
			Math.sqrt(Math.ceil(dirScale * (dirsLength + (files.length > 0 ? 1 : 0))))
		);
		let fileSquareSide = Math.ceil(Math.sqrt(Math.ceil(files.length / filesPerRow)));

		let maxX = 0,
			maxY = 0;
		let filesBox = { x: fileTree.x, y: fileTree.y, z: fileTree.z, scale: fileTree.scale };
		for (let off = 0, len = dirs.length + (files.length > 0 ? 1 : 0); off < len; off++) {
			const h = Math.ceil(dirSquareSide / dirScale);
			let x = Math.floor(off / h);
			let y = off - x * h;
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
							x: fileTree.x + subX * dirScale2,
							y: fileTree.y + subY * dirScale2 + yDirOff,
							scale: 2 * (0.8 / dirSquareSide) * dirScale2,
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
							x: fileTree.x + subX * dirScale2,
							y: fileTree.y + subY * dirScale2 + yDirOff,
							scale: 2 * (0.9 / dirSquareSide) * dirScale2,
							z: fileTree.z,
						};
					} else {
						const yOff = 1 - (0.5 * y + 1) * (1 / dirSquareSide);
						const xOff = 0.9 * x * (1 / dirSquareSide);
						const subX = xOff + 0.1 / dirSquareSide;
						const subY = yOff + 0.125 / dirSquareSide;
						fileTree.filesBox = filesBox = {
							x: fileTree.x + subX * dirScale2,
							y: fileTree.y + subY * dirScale2 + yDirOff,
							scale: (0.8 / dirSquareSide) * dirScale2,
							z: fileTree.z,
						};
					}
				}
				break;
			}
			maxX = Math.max(x, maxX);
			maxY = Math.max(y, maxY);
			const dir = dirs[off];
			const yOff = 1 - (0.5 * y + 1) * (1 / dirSquareSide);
			const xOff = 0.9 * x * (1 / dirSquareSide);
			const subX = xOff + 0.1 / dirSquareSide;
			const subY = yOff + 0.125 / dirSquareSide;
			if (dir.relativeScale > 0) {
				dir.x = fileTree.x + dir.rx * fileTree.scale;
				dir.y = fileTree.y + dir.ry * fileTree.scale;
				dir.scale = fileTree.scale * dir.relativeScale;
				dir.z = fileTree.z + dir.rz * fileTree.scale + dir.scale * 0.2;
			} else {
				dir.x = fileTree.x + subX * dirScale2;
				dir.y = fileTree.y + yDirOff + subY * dirScale2;
				dir.scale = (0.8 / dirSquareSide) * dirScale2;
				dir.z = fileTree.z + dir.scale * 0.2;
			}
			const bbox = Geometry.getFSEntryBBox(dir, mesh, camera);
			if (!forceLoads.has(dir) && (!bbox.onScreen || bbox.width < minWidth)) continue;
			dir.index = fileIndex;
			fileIndex++;
			dir.vertexIndex = vertexIndices.vertexIndex;
			dir.parent = fileTree;
			index[dir.index] = dir;
			const dirColor = dir.color || Colors.getDirectoryColor(dir);
			dir.color = dirColor;
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
			if (bbox.width > minWidth * dir.title.length * 0.25) {
				vertexIndices.textVertexIndex = this.createTextForEntry(
					dir,
					labelGeometries,
					vertexIndices.textVertexIndex,
					0.65
				);
			}
		}

		const filesScale2 = filesBox.scale * filesScale;
		const filesYOff = filesBox.scale * (1 - filesScale);

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
				const file = files[off];
				const yOff = 1 - (y + 1) * (1 / fileSquareSide);
				const xOff = fileXOff + x * (1 / fileSquareSide);
				const subX = xOff + 0.05 / fileSquareSide;
				const subY = yOff + 0.05 / fileSquareSide;

				const fileColor = file.color || Colors.getFileColor(file);
				file.color = fileColor;
				file.x = filesBox.x + subX * filesScale2;
				file.y = filesBox.y + filesYOff + subY * filesScale2;
				file.scale = (0.9 / fileSquareSide) * filesScale2;
				file.z = filesBox.z + file.scale * 0.2;
				const bbox = Geometry.getFSEntryBBox(file, mesh, camera);
				if (!forceLoads.has(file) && (!bbox.onScreen || bbox.width < minWidth)) continue;
				file.index = fileIndex;
				file.vertexIndex = vertexIndices.vertexIndex;
				file.lastIndex = fileIndex;
				file.parent = fileTree;
				index[file.index] = file;
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
				if (bbox.width > minWidth * file.title.length * 0.25) {
					vertexIndices.textVertexIndex = this.createTextForEntry(
						file,
						labelGeometries,
						vertexIndices.textVertexIndex,
						1
					);
				}
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
		if (fsEntry.labelGeometry === SDFText.mock) {
			const textGeometry = Text.createTextArrays({
				text: fsEntry.title,
				font: Text.font,
				noBounds: true,
			}) as ExtendedSDFText;
			textGeometry.xScale = xScale;
			textGeometry.fsEntry = fsEntry;

			const textScaleW =
				220 / (textGeometry.layout.width > 220 ? textGeometry.layout.width : 220);
			const textScaleH = (fsEntry.isDirectory ? 30 : 50) / textGeometry.layout.height;

			const textScale = textScaleW > textScaleH ? textScaleH : textScaleW;
			const arr = textGeometry.position;
			for (let j = 0; j < arr.length; j += 4) {
				arr[j] = arr[j] * textScale;
				arr[j + 1] = arr[j + 1] * -textScale;
				arr[j + 2] = arr[j + 2] * textScale;
			}

			fsEntry.labelGeometry = textGeometry;
		}

		const textGeometry = fsEntry.labelGeometry;
		labelGeometries.push(textGeometry);

		return textVertexIndex + textGeometry.position.length / 4;
	}
}

Comlink.expose(ModelBuilder);
