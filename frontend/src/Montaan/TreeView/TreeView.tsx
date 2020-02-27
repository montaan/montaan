// src/Montaan/TreeView/TreeView.tsx

import { withRouter, RouteComponentProps } from 'react-router-dom';
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, extend, useFrame, useThree } from 'react-three-fiber';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

import styles from './TreeView.module.scss';

import QFrameAPI from '../../lib/api';
import { FileTree, SearchResult, ActiveCommitData, TreeLink } from '../MainApp';
import { CommitData } from '../lib/parse_commits';
import utils from '../lib/utils';
import Geometry from '../lib/Geometry';
import { getFullPath, FSEntry } from '../lib/filesystem';
import Colors from '../lib/Colors';

export interface TreeViewProps extends RouteComponentProps {
	api: QFrameAPI;
	repoPrefix: string;
	fileTree: FileTree;
	commitData: null | CommitData;
	activeCommitData: null | ActiveCommitData;
	commitFilter: any;
	navigationTarget: string;
	searchResults: SearchResult[];
	searchLinesRequest: number;
	diffsLoaded: number;
	addLinks(links: TreeLink[]): void;
	setLinks(links: TreeLink[]): void;
	links: TreeLink[];
	navUrl?: string;
	frameRequestTime: number;
	setNavigationTarget(target: string): void;
	searchQuery: string;
	requestDirs(paths: string[], dropEntries: FSEntry[]): Promise<void>;
}

// Makes these prototypes available as "native" jsx-string elements
extend({
	EffectComposer,
	ShaderPass,
	RenderPass,
	UnrealBloomPass,
});

declare global {
	// eslint-disable-next-line
	namespace JSX {
		interface IntrinsicElements {
			renderPass: any;
			unrealBloomPass: any;
			instancedBufferAttribute: any;
			instancedMesh: any; //ReactThreeFiber.Object3DNode<THREE.InstancedMesh, typeof THREE.InstancedMesh>;
			effectComposer: any; //ReactThreeFiber.Node<EffectComposer, typeof EffectComposer>;
		}
	}
}

function Effect({ down }: { down: any }) {
	const composer = useRef<any>();
	const { scene, gl, size, camera } = useThree();
	const aspect = useMemo(() => new THREE.Vector2(size.width, size.height), [size]);
	useEffect(() => void composer.current?.setSize(size.width, size.height), [size]);
	useFrame(() => composer.current?.render(), 1);
	return (
		<effectComposer ref={composer} args={[gl]}>
			<renderPass attachArray="passes" scene={scene} camera={camera} />
			<unrealBloomPass attachArray="passes" args={[aspect, 2, 1, 0.9]} />
		</effectComposer>
	);
}

function buildDirGeo(attrib: any, colorArray: any) {
	const boxGeo = new THREE.BoxBufferGeometry(1, 1, 0.1);
	const array = (boxGeo.getAttribute('position').array as Float32Array).map(
		(v, i) => v + (i % 3 === 2 ? 0.05 : 0.5)
	);
	const geo = new THREE.BufferGeometry();
	geo.setIndex(boxGeo.getIndex());
	geo.setAttribute('position', new THREE.BufferAttribute(array, 3));
	geo.setAttribute('normal', boxGeo.getAttribute('normal'));
	return (
		<bufferGeometry attach="geometry" attributes={geo.attributes} index={geo.index}>
			<instancedBufferAttribute
				ref={attrib}
				attachObject={['attributes', 'color']}
				args={[colorArray, 3]}
			/>
		</bufferGeometry>
	);
}

function buildFileGeo(attrib: any, colorArray: any) {
	const boxGeo = new THREE.BoxBufferGeometry(1, 1, 0.1);
	const array = (boxGeo.getAttribute('position').array as Float32Array).map(
		(v, i) => v + (i % 3 === 2 ? 0.05 : 0.5)
	);
	const geo = new THREE.BufferGeometry();
	geo.setIndex(boxGeo.getIndex());
	geo.setAttribute('position', new THREE.BufferAttribute(array, 3));
	geo.setAttribute('normal', boxGeo.getAttribute('normal'));
	return (
		<bufferGeometry attach="geometry" attributes={geo.attributes} index={geo.index}>
			<instancedBufferAttribute
				ref={attrib}
				attachObject={['attributes', 'color']}
				args={[colorArray, 3]}
			/>
		</bufferGeometry>
	);
}

const _color = new THREE.Color();

const moveTowards = function(
	v: THREE.Vector3,
	x: number,
	y: number,
	z: number,
	scale: number
): void {
	const dx = x - v.x;
	const dy = y - v.y;
	const dz = z - v.z;
	const lenSq = dx * dx + dy * dy + dz * dz;
	if (lenSq < 0.0000001 * scale) {
		v.set(x, y, z);
	} else {
		v.set(v.x + dx * 0.1, v.y + dy * 0.1, v.z + dz * 0.1);
	}
};

const dummy = new THREE.Object3D();

function updateTree(
	fMesh: any,
	dMesh: any,
	tree: any,
	idx: any,
	ps: number,
	px: number,
	py: number,
	pz: number
) {
	dummy.position.set(px, py, pz);
	dummy.scale.set(ps, ps, ps);
	dummy.updateMatrix();
	if (tree.entries) {
		// And apply the matrix to the instanced item
		dMesh.setMatrixAt(idx.dir, dummy.matrix);
		dMesh.fsEntries[idx.dir] = tree;
		tree.instanceId = idx.dir;
		idx.dir++;
		const keys = Object.keys(tree.entries);
		const side = Math.ceil(Math.pow(keys.length, 1 / 2));
		const invSide = 1 / side;
		const s = ps * (0.8 / side);
		keys.forEach((n, i) => {
			const zr = 0; //(index * invSide * invSide) | 0;
			const yr = ((i - zr * side * side) * invSide) | 0;
			const xr = i - (zr * side * side + yr * side);
			const x = px + ps * (xr + 0.1) * invSide;
			const y = py + ps * (yr + 0.1) * invSide;
			const z = pz;
			updateTree(fMesh, dMesh, tree.entries[n], idx, s, x, y, z + ps * 0.1);
		});
	} else {
		fMesh.setMatrixAt(idx.file, dummy.matrix);
		fMesh.fsEntries[idx.file] = tree;
		tree.instanceId = idx.file;
		idx.file++;
	}
}

function reLayout(fileTree: FileTree, relativeMatrix: THREE.Matrix4, fMesh: any, dMesh: any) {
	dMesh.fsEntries = {};
	fMesh.fsEntries = {};

	const idx = { file: 0, dir: 0 };
	const sc = 1 / relativeMatrix.elements[0];
	updateTree(
		fMesh,
		dMesh,
		fileTree.tree,
		idx,
		sc,
		-sc * relativeMatrix.elements[12],
		-sc * relativeMatrix.elements[13],
		-sc * relativeMatrix.elements[14]
	);
	fMesh.count = idx.file;
	fMesh.instanceMatrix.needsUpdate = true;
	dMesh.count = idx.dir;
	dMesh.instanceMatrix.needsUpdate = true;
}

function TreeContainerInstanceArrays({
	fileTree,
	mouse,
	down,
}: {
	fileTree: FileTree;
	mouse: any;
	down: boolean;
}) {
	const { scene, gl, size, camera } = useThree();
	// const tree = useMemo(() => <Tree tree={fileTree.tree} index={0} count={1} />, [fileTree]);
	const dirMesh = useRef<any>();
	const fileMesh = useRef<any>();
	const dirColors = useRef<any>();
	const fileColors = useRef<any>();
	const [sel, setSel] = useState(-1);
	const [init, setInit] = useState<FileTree | undefined>(undefined);
	const count = 1000000;
	const targetMatrix = useMemo(() => new THREE.Matrix4(), []);
	const currentTargetMatrix = useMemo(() => new THREE.Matrix4(), []);
	const lookV = useMemo(() => new THREE.Vector3(0.2, 0.2, 0.2), []);
	const clickTargetMatrix = useMemo(() => new THREE.Matrix4(), []);
	const dColors = useMemo(
		() => new Array(count).fill([]).map(() => new THREE.Color(1, 1, 1)),
		[]
	);
	const fColors = useMemo(
		() => new Array(count).fill([]).map(() => new THREE.Color(0.3, 0.3, 0.3)),
		[]
	);
	const dirColorArray = useMemo(() => {
		const color = new Float32Array(count * 3);
		for (let i = 0; i < count; i++) {
			_color.set(dColors[i]);
			_color.toArray(color, i * 3);
		}
		return color;
	}, [dColors]);
	const fileColorArray = useMemo(() => {
		const color = new Float32Array(count * 3);
		for (let i = 0; i < count; i++) {
			_color.set(fColors[i]);
			_color.toArray(color, i * 3);
		}
		return color;
	}, [fColors]);
	const dirGeo = useMemo(() => buildDirGeo(dirColors, dirColorArray), [dirColors, dirColorArray]);
	const fileGeo = useMemo(() => buildFileGeo(fileColors, fileColorArray), [
		fileColors,
		fileColorArray,
	]);
	useFrame(() => {
		if (init !== fileTree) {
			targetMatrix.identity();
			currentTargetMatrix.identity();
			reLayout(fileTree, targetMatrix, fileMesh.current, dirMesh.current);
			dirMesh.current.getMatrixAt(0, targetMatrix);
			dirMesh.current.getMatrixAt(0, currentTargetMatrix);
			setInit(fileTree);
			gl.setClearColor(0, 1);
		}
		camera.near = camera.near + (targetMatrix.elements[0] - camera.near) * 0.1;
		camera.far = camera.far + (targetMatrix.elements[0] * 16 - camera.far) * 0.1;
		moveTowards(
			camera.position,
			targetMatrix.elements[12] + targetMatrix.elements[0] * 0.5,
			targetMatrix.elements[13] + targetMatrix.elements[0] * 0.5,
			targetMatrix.elements[14] + targetMatrix.elements[0] * 4,
			targetMatrix.elements[0]
		);
		moveTowards(
			lookV,
			targetMatrix.elements[12] + targetMatrix.elements[0] * 0.5,
			targetMatrix.elements[13] + targetMatrix.elements[0] * 0.5,
			targetMatrix.elements[14],
			targetMatrix.elements[0]
		);
		camera.lookAt(lookV);
		camera.updateProjectionMatrix();
		return;

		const fMesh = fileMesh.current;
		const dMesh = dirMesh.current;
		const m = new THREE.Matrix4();
		var zoomedInPath = '';
		var navigationTarget = '';
		var smallestCovering = fileTree.tree;
		var visibleFiles: any = new THREE.Group();

		// Breadth-first traversal of this.fileTree
		// - determines fsEntry visibility
		// - finds the covering fsEntry
		// - finds the currently zoomed-in path and breadcrumb path
		var stack = [fileTree.tree];
		while (stack.length > 0) {
			var obj = stack.pop() as any;
			for (var name in obj.entries) {
				var o = obj.entries[name];
				const mesh = o.entries ? dMesh : fMesh;
				mesh.getMatrixAt(o.instanceId, m);
				if (!Geometry.matrixInsideFrustum(m, mesh.modelViewMatrix, camera)) {
					continue;
				}
				if (Geometry.matrixIsBigOnScreen(m, camera)) {
					if (Geometry.matrixCoversFrustum(m, camera)) {
						zoomedInPath += '/' + o.name;
						navigationTarget += '/' + o.name;
						smallestCovering = o;
					} else if (Geometry.matrixAtFrustumCenter(m, camera)) {
						navigationTarget += '/' + o.name;
					}
					if (o.entries) {
						stack.push(o);
					} else {
						let fullPath = getFullPath(o);
						if (
							visibleFiles.children.length < 30 &&
							!visibleFiles.visibleSet[fullPath]
						) {
							// if (Colors.imageRE.test(fullPath))
							// 	loadImage(visibleFiles, fullPath, o, m);
							// else loadTextFile(visibleFiles, fullPath, o, m);
						}
					}
				}
			}
		}
	});

	const onClick = (ev: any) => {
		if (sel !== -1) {
			_color.set(dColors[sel]);
			_color.toArray(dirColorArray, sel * 3);
		}
		_color.set('red');
		_color.toArray(dirColorArray, ev.instanceId * 3);
		dirMesh.current.getMatrixAt(ev.instanceId, clickTargetMatrix);
		const fsEntry = dirMesh.current.fsEntries[ev.instanceId];
		// Keep up the matrix precision
		if (clickTargetMatrix.elements[0] < 0.01 || clickTargetMatrix.elements[0] > 100) {
			const prevScale = currentTargetMatrix.elements[0];
			const prevOrigin = new THREE.Vector3(
				currentTargetMatrix.elements[12],
				currentTargetMatrix.elements[13],
				currentTargetMatrix.elements[14]
			);
			currentTargetMatrix.multiplyMatrices(currentTargetMatrix, clickTargetMatrix);
			const newScale = currentTargetMatrix.elements[0];
			const newOrigin = new THREE.Vector3(
				currentTargetMatrix.elements[12],
				currentTargetMatrix.elements[13],
				currentTargetMatrix.elements[14]
			);
			camera.position
				.multiplyScalar(prevScale)
				.add(prevOrigin)
				.sub(newOrigin)
				.divideScalar(newScale);
			lookV
				.multiplyScalar(prevScale)
				.add(prevOrigin)
				.sub(newOrigin)
				.divideScalar(newScale);
			camera.near *= prevScale / newScale;
			camera.far *= prevScale / newScale;

			// TODO re-root the tree to fsEntry.parent.parent whatever is the smallest visible
			reLayout(fileTree, currentTargetMatrix, fileMesh.current, dirMesh.current);
			dirMesh.current.getMatrixAt(fsEntry.instanceId, clickTargetMatrix);
		}
		targetMatrix.copy(clickTargetMatrix);
		setSel(fsEntry.instanceId);
		dirColors.current.needsUpdate = true;
	};

	return (
		<>
			<instancedMesh
				ref={dirMesh}
				args={[null, null, count]}
				onClick={onClick}
				frustumCulled={false}
			>
				{dirGeo}
				<meshBasicMaterial attach="material" vertexColors={THREE.VertexColors} />
			</instancedMesh>
			<instancedMesh ref={fileMesh} args={[null, null, count]} frustumCulled={false}>
				{fileGeo}
				<meshBasicMaterial attach="material" vertexColors={THREE.VertexColors} />
			</instancedMesh>
		</>
	);
}

function Tree({ tree, index, count }: any) {
	const entries = useMemo(
		() =>
			tree.entries &&
			Object.keys(tree.entries)
				.sort((a, b) => {
					if (tree.entries[a].entries && !tree.entries[b].entries) return -1;
					if (tree.entries[b].entries && !tree.entries[a].entries) return 1;
					return a.localeCompare(b);
				})
				.map((n, i, a) => (
					<Tree key={n} tree={tree.entries[n]} index={i} count={a.length} />
				)),
		[tree]
	);
	const side = Math.ceil(Math.pow(count, 1 / 3));
	const z = (index / (side * side)) | 0;
	const y = ((index - z * side * side) / side) | 0;
	const x = index - (z * side * side + y * side);
	const s = 0.8 / side;
	return (
		<group
			position={[x / side + 0.1 / side, y / side + 0.1 / side, z / side + 0.1 / side]}
			scale={[s, s, s]}
		>
			<mesh position={[0.5, 0.5, 0.5]} scale={[1, 1, 1]}>
				{entries ? (
					<boxBufferGeometry attach="geometry" args={[1, 0]} />
				) : (
					<octahedronBufferGeometry attach="geometry" args={[0.5, 0]} />
				)}
				<meshStandardMaterial
					attach="material"
					blending={entries ? THREE.AdditiveBlending : THREE.NormalBlending}
					color={`hsl(${Math.random() * 360}, 70%, ${entries ? 30 : 60}%)`}
					depthWrite={!entries}
					opacity={entries ? 0.1 : 1}
				/>
			</mesh>
			{entries}
		</group>
	);
}

function TreeContainer({
	fileTree,
	mouse,
	down,
}: {
	fileTree: FileTree;
	mouse: any;
	down: boolean;
}) {
	const { scene, gl, size, camera } = useThree();
	gl.setClearColor(0, 1);
	const [rot, setRot] = useState([0, 0, 0]);
	const tree = useMemo(() => <Tree tree={fileTree.tree} index={0} count={1} />, [fileTree]);
	useFrame(() => {
		camera.position.set(0, 0.5, 1);
		camera.lookAt(new THREE.Vector3(0, 0, 0));
		setRot([0, rot[1] + 0.01, 0]);
	});
	return (
		<group position={[0, 0, 0]}>
			<group rotation={rot}>
				<group position={[-0.5, -0.5, -0.5]}>{tree}</group>
			</group>
		</group>
	);
}

function TreeView({ fileTree }: TreeViewProps) {
	const [down, setDown] = useState(false);
	const mouse = useRef([0, 0]);
	const onMouseMove = useCallback(
		({ clientX: x, clientY: y }) =>
			(mouse.current = [x - window.innerWidth / 2, y - window.innerHeight / 2]),
		[]
	);
	return (
		<div className={styles.TreeView}>
			<Canvas
				camera={{ fov: 30, position: [0, 0, 1], near: 0.0001, far: 2 }}
				onMouseMove={onMouseMove}
				onMouseUp={() => setDown(false)}
				onMouseDown={() => setDown(true)}
				pixelRatio={2}
				// invalidateFrameloop={true}
			>
				<directionalLight
					color={new THREE.Color('#cccccc')}
					intensity={1.25}
					position={[5, 20, 20]}
				/>
				<directionalLight
					color={new THREE.Color('#ccffcc')}
					intensity={0.5}
					position={[-5, -5, -3]}
				/>
				<directionalLight
					color={new THREE.Color('#ffcccc')}
					intensity={0.5}
					position={[10, 5, 3]}
				/>
				<TreeContainer mouse={mouse} down={down} fileTree={fileTree} />
				{/* <Swarm mouse={mouse} count={20000} /> */}
				{/* <Effect down={down} /> */}
			</Canvas>
		</div>
	);
}

export default withRouter(TreeView);
