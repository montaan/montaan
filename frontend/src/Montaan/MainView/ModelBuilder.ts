/**
 * The ModelBuilder converts a FileTree into a renderer model.
 * The portion of the tree to be generated and the view root of
 * the tree are controlled by the renderer.
 */

import Layout, { ISDFTextGeometry } from '../lib/Layout';
import { FileTree } from '../MainApp';
import { FSEntry } from '../lib/filesystem';
import * as THREE from 'three';
import Geometry, { IBufferGeometryWithFileCount } from '../lib/Geometry';

export default class ModelBuilder {
	async buildModel(
		tree: FileTree,
		viewRoot: FSEntry,
		camera: any,
		visibleEntries: Map<FSEntry, number>,
		yieldFn: () => Promise<void>
	) {
		const geo = Geometry.makeGeometry(2 * (tree.count + 1));

		const fileTree = tree.tree;

		const fsIndex: FSEntry[] = [fileTree];
		fileTree.vertexIndex = 0;
		fileTree.textVertexIndex = 0;
		const vertexIndices = {
			textVertexIndex: 0,
			vertexIndex: 0,
		};

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

		const textGeometry = await Layout.createText({ text: '', noBounds: true }, yieldFn);

		const meshIndex = new Map<FSEntry, number>();

		const fileIndex = await this.updateFileTreeGeometry(
			fileTree,
			fsIndex,
			geo,
			textGeometry,
			vertexIndices,
			meshIndex,
			visibleEntries,
			yieldFn
		);

		const textMesh = new THREE.Mesh(textGeometry, Layout.textMaterial);
		textMesh.frustumCulled = false;

		const mesh = new THREE.Mesh(
			geo,
			new THREE.MeshBasicMaterial({
				color: 0xffffff,
				vertexColors: THREE.VertexColors,
				side: THREE.DoubleSide,
			})
		);

		mesh.add(textMesh);

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
			mesh,
			textGeometry,
			fileIndex,
			fsIndex,
			meshIndex,
		};
	}

	async updateFileTreeGeometry(
		fileTree: FSEntry,
		fsIndex: FSEntry[],
		geo: IBufferGeometryWithFileCount,
		textGeometry: ISDFTextGeometry,
		vertexIndices: { textVertexIndex: any; vertexIndex: any },
		meshIndex: Map<FSEntry, number>,
		visibleEntries: Map<FSEntry, number>,
		yieldFn: () => Promise<void>
	) {
		fileTree.index = undefined;
		fileTree.vertexIndex = 0;
		fileTree.textVertexIndex = 0;
		vertexIndices.textVertexIndex = 0;
		vertexIndices.vertexIndex = 0;

		let fileIndex = 0;

		const labels = new THREE.Object3D();
		const thumbnails = new THREE.Object3D();
		fileIndex = await Layout.createFileTreeQuads(
			yieldFn,
			fileTree,
			fileIndex,
			geo.getAttribute('position').array as Float32Array,
			geo.getAttribute('color').array as Float32Array,
			labels,
			thumbnails,
			fsIndex,
			meshIndex,
			vertexIndices,
			visibleEntries
		);
		geo.computeBoundingSphere();

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

		return fileIndex;
	}
}
