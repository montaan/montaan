// src/Montaan/TreeView/TreeView.tsx

import { withRouter, RouteComponentProps } from 'react-router-dom';
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, extend, useFrame, useThree } from 'react-three-fiber';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass';
import { GlitchPass } from './Glitchpass';
import { WaterPass } from './Waterpass';

import styles from './TreeView.module.scss';

import QFrameAPI from '../../lib/api';
import { FileTree, SearchResult, ActiveCommitData, TreeLink } from '../MainApp';
import { CommitData } from '../lib/parse_commits';

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
	requestDirs(paths: string[]): void;
	requestDitchDirs(fsEntries: any[]): void;
}

// Makes these prototypes available as "native" jsx-string elements
extend({
	EffectComposer,
	ShaderPass,
	RenderPass,
	WaterPass,
	UnrealBloomPass,
	FilmPass,
	GlitchPass,
});

declare global {
	// eslint-disable-next-line
	namespace JSX {
		interface IntrinsicElements {
			renderPass: any;
			waterPass: any;
			unrealBloomPass: any;
			filmPass: any;
			glitchPass: any;
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
	// const tree = useMemo(() => <Tree tree={fileTree.tree} index={0} count={1} />, [fileTree]);
	const dirMesh = useRef<any>();
	const fileMesh = useRef<any>();
	const dirColors = useRef<any>();
	const fileColors = useRef<any>();
	const [sel, setSel] = useState(-1);
	const count = 100000;
	const targetMatrix = useMemo(() => new THREE.Matrix4(), []);
	const currentTargetMatrix = useMemo(() => new THREE.Matrix4(), []);
	const dummy = useMemo(() => new THREE.Object3D(), []);
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
	useEffect(() => reLayout(targetMatrix), [dummy, fileTree.tree, fileMesh, dirMesh, reLayout, targetMatrix]);
	useFrame(() => {
		gl.setClearColor(0, 1);
		camera.near = targetMatrix.elements[0];
		camera.far = targetMatrix.elements[0] * 16;
		camera.updateProjectionMatrix();
		camera.position.set(
			targetMatrix.elements[12] + targetMatrix.elements[0] * 0.5,
			targetMatrix.elements[13] + targetMatrix.elements[0] * 0.5,
			targetMatrix.elements[14] + targetMatrix.elements[0] * 4
		);
		lookV.set(
			targetMatrix.elements[12] + targetMatrix.elements[0] * 0.5,
			targetMatrix.elements[13] + targetMatrix.elements[0] * 0.5,
			targetMatrix.elements[14]
		);
		camera.lookAt(lookV);
	});
	function reLayout(relativeMatrix: THREE.Matrix4) {
		const fMesh = fileMesh.current;
		const dMesh = dirMesh.current;

		dMesh.fsEntries = {};
		fMesh.fsEntries = {};

		function updateTree(tree: any, idx: any, ps: number, px: number, py: number, pz: number) {
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
					updateTree(tree.entries[n], idx, s, x, y, z + ps * 0.1);
				});
			} else {
				fMesh.setMatrixAt(idx.file, dummy.matrix);
				fMesh.fsEntries[idx.file] = tree;
				tree.instanceId = idx.file;
				idx.file++;
			}
		}
		const idx = { file: 0, dir: 0 };
		const sc = 1 / relativeMatrix.elements[0];
		updateTree(
			fileTree.tree,
			idx,
			sc,
			-sc * relativeMatrix.elements[12],
			-sc * relativeMatrix.elements[13],
			-sc * relativeMatrix.elements[14]
		);
		dMesh.getMatrixAt(0, targetMatrix);
		fMesh.count = idx.file;
		fMesh.instanceMatrix.needsUpdate = true;
		dMesh.count = idx.dir;
		dMesh.instanceMatrix.needsUpdate = true;
	}
	const onClick = (ev: any) => {
		if (sel !== -1) {
			_color.set(dColors[sel]);
			_color.toArray(dirColorArray, sel * 3);
		}
		_color.set('red');
		_color.toArray(dirColorArray, ev.instanceId * 3);
		dirMesh.current.getMatrixAt(ev.instanceId, clickTargetMatrix);
		const fsEntry = dirMesh.current.fsEntries[ev.instanceId];
		if (clickTargetMatrix.elements[0] < 0.01 || clickTargetMatrix.elements[0] > 100) {
			clickTargetMatrix.multiplyMatrices(currentTargetMatrix, clickTargetMatrix);
			currentTargetMatrix.copy(clickTargetMatrix);
			reLayout(clickTargetMatrix);
			dirMesh.current.getMatrixAt(fsEntry.instanceId, clickTargetMatrix);
		}
		targetMatrix.copy(clickTargetMatrix);
		setSel(fsEntry.instanceId);
		dirColors.current.needsUpdate = true;
	};
	return (
		<>
			<instancedMesh ref={dirMesh} args={[null, null, count]} onClick={onClick}>
				{dirGeo}
				<meshStandardMaterial attach="material" vertexColors={THREE.VertexColors} />
			</instancedMesh>
			<instancedMesh ref={fileMesh} args={[null, null, count]}>
				{fileGeo}
				<meshStandardMaterial attach="material" vertexColors={THREE.VertexColors} />
			</instancedMesh>
		</>
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
				invalidateFrameloop={true}
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
