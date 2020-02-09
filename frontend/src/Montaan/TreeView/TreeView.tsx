// src/Montaan/TreeView/TreeView.tsx

import { withRouter, RouteComponentProps } from 'react-router-dom';
import React, { useState, useCallback, useEffect, useRef, useMemo, MutableRefObject } from 'react';
import * as THREE from 'three';
import { Canvas, extend, useFrame, useThree, ReactThreeFiber } from 'react-three-fiber';
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
	const light = useRef() as MutableRefObject<any>;
	const { size, viewport } = useThree();
	const aspect = size.width / viewport.width;

	const dummy = useMemo(() => new THREE.Object3D(), []);
	// Generate some random positions, speed factors and timings
	const particles = useMemo(() => {
		const temp = [];
		for (let i = 0; i < count; i++) {
			const t = Math.random() * 100;
			const factor = 20 + Math.random() * 100;
			const speed = 0.01 + Math.random() / 200;
			const xFactor = -50 + Math.random() * 100;
			const yFactor = -50 + Math.random() * 100;
			const zFactor = -50 + Math.random() * 100;
			temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
		}
		return temp;
	}, [count]);
	// The innards of this hook will run every frame
	useFrame((state) => {
		if (!light || !mouse || !mesh) return;
		// Makes the light follow the mouse
		light.current.position.set(mouse.current[0] / aspect, -mouse.current[1] / aspect, 0);
		// Run through the randomized data to calculate some movement
		particles.forEach((particle, i) => {
			let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
			// There is no sense or reason to any of this, just messing around with trigonometric functions
			t = particle.t += speed / 2;
			const a = Math.cos(t) + Math.sin(t * 1) / 10;
			const b = Math.sin(t) + Math.cos(t * 2) / 10;
			const s = Math.cos(t);
			particle.mx += (mouse.current[0] - particle.mx) * 0.01;
			particle.my += (mouse.current[1] * -1 - particle.my) * 0.01;
			// Update the dummy object
			dummy.position.set(
				(particle.mx / 10) * a +
					xFactor +
					Math.cos((t / 10) * factor) +
					(Math.sin(t * 1) * factor) / 10,
				(particle.my / 10) * b +
					yFactor +
					Math.sin((t / 10) * factor) +
					(Math.cos(t * 2) * factor) / 10,
				(particle.my / 10) * b +
					zFactor +
					Math.cos((t / 10) * factor) +
					(Math.sin(t * 3) * factor) / 10
			);
			dummy.scale.set(s, s, s);
			dummy.rotation.set(s * 5, s * 5, s * 5);
			dummy.updateMatrix();
			// And apply the matrix to the instanced item
			mesh.current.setMatrixAt(i, dummy.matrix);
		});
		mesh.current.instanceMatrix.needsUpdate = true;
	});
	return (
		<>
			<pointLight ref={light} distance={40} intensity={8} color="lightblue">
				<mesh scale={[1, 1, 6]}>
					<dodecahedronBufferGeometry attach="geometry" args={[4, 0]} />
					<meshBasicMaterial attach="material" color="lightblue" transparent />
				</mesh>
			</pointLight>
			<instancedMesh ref={mesh} args={[null, null, count]}>
				<dodecahedronBufferGeometry attach="geometry" args={[1, 0]} />
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
			<waterPass attachArray="passes" factor={2} />
			<unrealBloomPass attachArray="passes" args={[aspect, 2, 1, 0]} />
			<filmPass attachArray="passes" args={[0.25, 0.4, 1500, false]} />
			<glitchPass attachArray="passes" factor={down ? 1 : 0} />
		</effectComposer>
	);
}

const TreeView = (props: TreeViewProps) => {
	const [down, setDown] = useState(false);
	const mouse = useRef([300, -200]);
	const onMouseMove = useCallback(
		({ clientX: x, clientY: y }) =>
			(mouse.current = [x - window.innerWidth / 2, y - window.innerHeight / 2]),
		[]
	);
	return (
		<div className={styles.TreeView}>
			<Canvas
				camera={{ fov: 100, position: [0, 0, 30] }}
				onMouseMove={onMouseMove}
				onMouseUp={() => setDown(false)}
				onMouseDown={() => setDown(true)}
			>
				<pointLight distance={60} intensity={2} color="red" />
				<spotLight intensity={2} position={[0, 0, 70]} penumbra={1} color="red" />
				<mesh>
					<planeBufferGeometry attach="geometry" args={[10000, 10000]} />
					<meshStandardMaterial attach="material" color="#00ffff" depthTest={false} />
				</mesh>
				<Swarm mouse={mouse} count={20000} />
				<Effect down={down} />
			</Canvas>
		</div>
	);
};

export default withRouter(TreeView);
