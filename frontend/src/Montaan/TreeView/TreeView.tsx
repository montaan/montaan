// src/Montaan/TreeView/TreeView.tsx

import { withRouter, RouteComponentProps } from 'react-router-dom';
import React, { useState, useCallback, useEffect, useRef, useMemo, MutableRefObject } from 'react';
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
			instancedMesh: any; //ReactThreeFiber.Object3DNode<THREE.InstancedMesh, typeof THREE.InstancedMesh>;
			effectComposer: any; //ReactThreeFiber.Node<EffectComposer, typeof EffectComposer>;
		}
	}
}

function Swarm({ count, mouse }: { count: number; mouse: MutableRefObject<number[]> }) {
	const mesh = useRef() as MutableRefObject<any>;
	const [done, setDone] = useState(false);

	const dummy = useMemo(() => new THREE.Object3D(), []);
	// Generate some random positions, speed factors and timings
	useFrame(() => {
		if (!!mesh && done) return;
		setDone(true);
		for (let i = 0; i < count; i++) {
			const t = Math.random() * 100;
			const factor = 20 + Math.random() * 100;
			const xFactor = -50 + Math.random() * 100;
			const yFactor = -50 + Math.random() * 100;
			const zFactor = -50 + Math.random() * 100;
			dummy.position.set(
				xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
				yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
				zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
			);
			dummy.updateMatrix();
			// And apply the matrix to the instanced item
			mesh.current.setMatrixAt(i, dummy.matrix);
		}
		mesh.current.instanceMatrix.needsUpdate = true;
	}, 1);
	// The innards of this hook will run every frame
	return (
		<>
			<instancedMesh ref={mesh} args={[null, null, count]}>
				<boxBufferGeometry attach="geometry" args={[1, 0]} />
				<meshStandardMaterial attach="material" color="#020000" />
			</instancedMesh>
		</>
	);
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
			<unrealBloomPass attachArray="passes" args={[aspect, 2, 1, 0]} />
		</effectComposer>
	);
}

function Tree({ tree, index, count }: any) {
	const entries = useMemo(
		() =>
			tree.entries &&
			Object.keys(tree.entries).map((n, i, a) => (
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
					opacity={entries ? 0.07 : 1}
				/>
			</mesh>
			{entries}
		</group>
	);
}

function TreeContainer({ fileTree }: { fileTree: FileTree }) {
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
				camera={{ fov: 60, position: [0, 1, 1] }}
				onMouseMove={onMouseMove}
				onMouseUp={() => setDown(false)}
				onMouseDown={() => setDown(true)}
				pixelRatio={2}
			>
				<pointLight color="white" intensity={3} distance={60} position={[5, 20, 10]} />
				<pointLight color="lightblue" intensity={1} distance={60} position={[-10, -2, 5]} />
				<TreeContainer fileTree={fileTree} />
				{/* <Swarm mouse={mouse} count={20000} /> */}
				{/* <Effect down={down} /> */}
			</Canvas>
		</div>
	);
}

export default withRouter(TreeView);
