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

import Text, { ISDFTextGeometry, SDFTextMesh } from '../lib/Text';
import { FileTree } from '../MainApp';
import { FSEntry } from '../lib/filesystem';
import * as THREE from 'three';
import Geometry from '../lib/Geometry';
import { NavCamera } from '../MainView/main';
import Colors from '../lib/Colors';

export default class ModelBuilder {
	buildModel(
		tree: FileTree,
		viewRoot: FSEntry,
		camera: NavCamera,
		mesh: THREE.Mesh
	): {
		mesh: THREE.Mesh;
		textGeometry: THREE.BufferGeometry;
		fileIndex: number;
		fsEntryIndex: FSEntry[];
		meshIndex: Map<FSEntry, number>;
		zoomedInPath: string;
		navigationTarget: string;
		smallestCovering: FSEntry;
		entriesToFetch: FSEntry[];
		visibleFiles: FSEntry[];
	} {
		const fileTree = tree.tree;

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

		const textGeometry = Text.createText({ text: '', noBounds: true });

		const {
			geo,
			fileIndex,
			fsEntryIndex,
			meshIndex,
			zoomedInPath,
			navigationTarget,
			smallestCovering,
			entriesToFetch,
			visibleFiles,
		} = this.updateFileTreeGeometry(fileTree, textGeometry, camera, mesh);

		const textMesh = new THREE.Mesh(textGeometry, Text.textMaterial);
		textMesh.frustumCulled = false;

		const treeMesh = new THREE.Mesh(
			geo,
			new THREE.MeshBasicMaterial({
				color: 0xffffff,
				vertexColors: THREE.VertexColors,
				side: THREE.DoubleSide,
			})
		);

		treeMesh.add(textMesh);

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

		return {
			mesh: treeMesh,
			textGeometry,
			fileIndex,
			fsEntryIndex,
			meshIndex,
			zoomedInPath,
			navigationTarget,
			smallestCovering,
			entriesToFetch,
			visibleFiles,
		};
	}

	updateFileTreeGeometry(
		fileTree: FSEntry,
		textGeometry: ISDFTextGeometry,
		camera: NavCamera,
		mesh: THREE.Mesh
	): {
		geo: THREE.BufferGeometry;
		fileIndex: number;
		fsEntryIndex: FSEntry[];
		meshIndex: Map<FSEntry, number>;
		zoomedInPath: string;
		navigationTarget: string;
		smallestCovering: FSEntry;
		entriesToFetch: FSEntry[];
		visibleFiles: FSEntry[];
	} {
		fileTree.index = undefined;
		fileTree.vertexIndex = 0;
		fileTree.textVertexIndex = 0;

		const {
			geo,
			fileIndex,
			labels,
			thumbnails,
			fsEntryIndex,
			meshIndex,
			zoomedInPath,
			navigationTarget,
			smallestCovering,
			entriesToFetch,
			visibleFiles,
		} = this.createFileTreeQuads(fileTree, 0, camera, mesh);
		const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.BufferAttribute(geo.verts, 3));
		geometry.setAttribute('color', new THREE.BufferAttribute(geo.colorVerts, 3));

		geometry.computeBoundingSphere();

		let textVertCount = 0;
		labels.traverse(function(o) {
			const c = o as THREE.Mesh;
			if (c.geometry) {
				textVertCount += (c.geometry as THREE.BufferGeometry).attributes.position.array
					.length;
			}
		});
		const positionArray = new Float32Array(textVertCount);
		const uvArray = new Float32Array(textVertCount / 2);
		let j = 0;
		labels.traverse(function(o) {
			const c = o as THREE.Mesh;
			if (c.geometry) {
				const attributes = (c.geometry as THREE.BufferGeometry).attributes;
				const labelPositionArray = attributes.position.array;
				positionArray.set(labelPositionArray, j);
				uvArray.set(attributes.uv.array, j / 2);
				j += labelPositionArray.length;
			}
		});
		textGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 4));
		textGeometry.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));

		return {
			geo: geometry,
			fileIndex,
			fsEntryIndex,
			meshIndex,
			zoomedInPath,
			navigationTarget,
			smallestCovering,
			entriesToFetch,
			visibleFiles,
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
		geo: { verts: Float32Array; colorVerts: Float32Array };
		fileIndex: number;
		labels: THREE.Object3D;
		thumbnails: THREE.Object3D;
		fsEntryIndex: FSEntry[];
		meshIndex: Map<FSEntry, number>;
		zoomedInPath: string;
		navigationTarget: string;
		smallestCovering: FSEntry;
		entriesToFetch: FSEntry[];
		visibleFiles: FSEntry[];
	} {
		const geo = { verts: new Float32Array(36 * 1000), colorVerts: new Float32Array(36 * 1000) };
		const labels = new THREE.Object3D();
		const thumbnails = new THREE.Object3D();
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
		while (stack.length > 0) {
			const tree = stack.pop();
			if (!tree) break;
			fileIndex = this.layoutDir(
				tree,
				fileIndex,
				geo,
				labels,
				thumbnails,
				fsEntryIndex,
				meshIndex,
				vertexIndices
			);
			for (let name in tree.entries) {
				const fsEntry = tree.entries[name];

				const bbox = Geometry.getFSEntryBBox(fsEntry, mesh, camera);
				const pxWidth = bbox.width * window.innerWidth * 0.5;
				const isSmall = pxWidth < (fsEntry.entries ? 15 : 150);

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
		entriesToFetch.sort(this.cmpFSEntryDistanceFromCenter);
		return {
			geo,
			fileIndex,
			labels,
			thumbnails,
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
		parentText: THREE.Object3D,
		thumbnails: THREE.Object3D,
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
					parentText,
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
					parentText,
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
		if (geo.verts.length < (vertexIndices.vertexIndex + 1) * 18 * Geometry.quadCount) {
			const newVerts = new Float32Array(
				Math.max(18 * Geometry.quadCount, geo.verts.length * 2)
			);
			const newColorVerts = new Float32Array(newVerts.length);
			newVerts.set(geo.verts);
			newColorVerts.set(geo.colorVerts);
			geo.verts = newVerts;
			geo.colorVerts = newColorVerts;
		}
	}

	createTextForEntry(
		obj: FSEntry,
		parentText: THREE.Object3D,
		textVertexIndex: number,
		xScale: number = 1
	) {
		var title = obj.title;
		if (obj.entries == null) {
			if (title.indexOf('\n') === -1 && title.length > 16) {
				var breakPoint = Math.max(16, Math.floor(title.length / 2));
				title = title.substring(0, breakPoint) + '\n' + title.substring(breakPoint);
			}
		}

		var textGeometry = (Text.createText({
			text: title,
			font: Text.font,
			noBounds: true,
		}) as unknown) as ISDFTextGeometry;
		var text = new SDFTextMesh();
		text.geometry = textGeometry;

		obj.textVertexIndex = textVertexIndex;
		obj.lastTextVertexIndex =
			textVertexIndex + text.geometry.attributes.position.array.length / 4;

		var textScaleW = 220 / Math.max(textGeometry.layout.width, 220);
		var textScaleH = (obj.entries ? 30 : 50) / textGeometry.layout.height;

		var scale = Math.min(textScaleW, textScaleH);

		text.position.x = obj.x + (obj.entries ? 0 : obj.scale * 0.02);
		text.position.y = obj.y + (obj.entries ? obj.scale * 1.02 : obj.scale * 0.02);
		text.position.z = obj.z;
		text.scale.multiplyScalar(xScale * obj.scale * 0.00436 * scale);
		text.scale.y *= -1;
		var arr = textGeometry.attributes.position.array as Float32Array;
		for (var j = 0; j < arr.length; j += 4) {
			arr[j] = arr[j] * text.scale.x + text.position.x;
			arr[j + 1] = arr[j + 1] * text.scale.y + text.position.y;
			arr[j + 2] = arr[j + 2] * text.scale.z + text.position.z;
		}
		text.position.set(0, 0, 0);
		text.scale.set(1, 1, 1);
		var o = new THREE.Object3D();
		o.add(text);
		parentText.add(o);

		return obj.lastTextVertexIndex;
	}
}
