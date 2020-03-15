import { getPathEntry, getFullPath, getFSEntryForURL, FSEntry } from '../lib/filesystem';
import Colors from '../lib/Colors';
import Layout, { ISDFTextGeometry } from '../lib/Layout';
import utils from '../lib/utils';
import Geometry from '../lib/Geometry';

import TextFileView from './TextFileView';
import ImageFileView from './ImageFileView';

import fontDescription from './assets/fnt/Inconsolata-Regular.fnt';
import fontSDF from './assets/fnt/Inconsolata-Regular.png';

import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import * as THREE from 'three';
import loadFont from 'load-bmfont';
import WorkQueue from '../lib/WorkQueue';
import ModelBuilder from './ModelBuilder';
import NavTarget from './NavTarget';
import { FileTree, SearchResult, TreeLink } from '../MainApp';
import QFrameAPI from '../../lib/api';

function save(blob: Blob, filename: string) {
	const link = document.createElement('a');
	link.href = URL.createObjectURL(blob);
	link.download = filename;
	link.click();

	// URL.revokeObjectURL( url ); breaks Firefox...
}

function saveString(text: string, filename: string) {
	save(new Blob([text], { type: 'text/plain' }), filename);
}

function saveArrayBuffer(buffer: ArrayBuffer, filename: string) {
	save(new Blob([buffer], { type: 'application/octet-stream' }), filename);
}

function exportGLTF(input: THREE.Object3D) {
	var gltfExporter = new GLTFExporter();

	var options = {
		onlyVisible: false,
		truncateDrawRange: false,
		binary: true,
	};
	gltfExporter.parse(
		input,
		function(result) {
			if (result instanceof ArrayBuffer) {
				saveArrayBuffer(result, 'scene.glb');
			} else {
				var output = JSON.stringify(result, null, 2);
				saveString(output, 'scene.gltf');
			}
		},
		options
	);
}

(THREE.Object3D as any).prototype.tick = function(t: any, dt: any) {
	if (this.ontick) this.ontick(t, dt);
	for (var i = 0; i < this.children.length; i++) {
		this.children[i].tick(t, dt);
	}
};

class NavCamera extends THREE.PerspectiveCamera {
	targetPosition: THREE.Vector3 = new THREE.Vector3();
	targetFOV: number = 60;
}

class VisibleFiles extends THREE.Object3D {
	visibleSet: { [index: string]: THREE.Object3D } = {};
}

type Fiber = () => void;

class Tabletree {
	treeUpdateQueue: WorkQueue<FileTree> = new WorkQueue();
	animating: boolean = false;
	commitsPlaying: boolean = false;
	currentFrame: number = 0;
	pageZoom: number = 1;
	resAdjust: number = 1;
	textMinScale: number = 1;
	textMaxScale: number = 1000;
	deletionsCount: number = 0;
	meshIndex: Map<FSEntry, number> = new Map();
	visibleEntries: Map<FSEntry, number> = new Map();
	history: any;
	model: THREE.Mesh = new THREE.Mesh();
	lineModel: THREE.LineSegments = new THREE.LineSegments();
	lineGeo: THREE.BufferGeometry = new THREE.BufferGeometry();
	links: TreeLink[] = [];
	fsIndex: FSEntry[] = [];
	searchResults: SearchResult[] = [];
	previousSearchResults: SearchResult[] = [];
	frameFibers: Fiber[] = [];
	frameStart: number = -1;
	initDone: boolean = false;
	requestDirs: any;
	setNavigationTarget: any;
	api: QFrameAPI = QFrameAPI.mock;
	_fileTree?: FileTree;
	lastFrameTime: number = 0;
	previousFrameTime: number = 0;
	renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer();
	scene: THREE.Scene = new THREE.Scene();
	camera: NavCamera = new NavCamera();
	visibleFiles: VisibleFiles = new VisibleFiles();
	highlightedResults: SearchResult[] = [];
	highlightLater: [FSEntry, number][] = [];
	searchHighlights: THREE.Mesh = new THREE.Mesh();
	screenPlane: THREE.Mesh = new THREE.Mesh();
	searchLine: THREE.LineSegments = new THREE.LineSegments();
	searchLis: HTMLElement[] = [];
	fileTree: any;
	viewRoot: any;
	navUrl: any;
	treeBuildInProgress: any;
	tree: any;
	fileCount: any;
	fileIndex: number | undefined;
	textGeometry: ISDFTextGeometry | undefined;
	viewRootUpdated: boolean | undefined;
	zoomedInPath: string | undefined;
	breadcrumbPath: string | undefined;
	smallestCovering: any;
	linksUpdatedOn: any;
	urlIndex: any;
	navTarget: NavTarget | undefined;
	highlighted: any;
	onElectron: any;
	frameLoopPaused: boolean | undefined;
	frameRequested: boolean | undefined;
	_changed: any;
	searchHighlightsIndex: number = 1;
	started: boolean = false;

	constructor() {
		this.treeUpdateQueue = new WorkQueue();
		this.animating = false;
		this.currentFrame = 0;
		this.pageZoom = 1;
		this.resAdjust = 1;
		if (/Mac OS X/.test(navigator.userAgent)) {
			if (window.screen.width !== 1280 && window.devicePixelRatio >= 2) {
				this.resAdjust = 1280 / window.screen.width;
			}
		}
		this.setupScene(); // Renderer, scene and camera setup.
		this.setupSearchLines(); // Search landmark and connection lines
		this.setupSearchHighlighting(); // Search highlighting lines
		this.setupEventListeners(); // UI event listeners
		this.changed = true;
	}

	init(api: QFrameAPI) {
		if (this.api !== QFrameAPI.mock) {
			console.error('ALREADY INITIALIZED');
			return;
		}
		this.api = api;
		var fontTex: THREE.Texture, fontDesc: any;
		new THREE.TextureLoader().load(fontSDF, (tex) => {
			fontTex = tex;
			if (fontDesc && fontTex) this.start(fontDesc, fontTex);
		});
		loadFont(fontDescription, (err: any, font: any) => {
			if (err) throw err;
			fontDesc = font;
			if (fontDesc && fontTex) this.start(fontDesc, fontTex);
		});
	}

	async start(font: any, fontTexture: THREE.Texture | null) {
		Layout.font = font;
		Layout.fontTexture = fontTexture;
		Layout.textMaterial = Layout.makeTextMaterial();

		this.started = true;

		if (this._fileTree) await this.setFileTree(this._fileTree); // Show possibly pre-loaded file tree.

		this.lastFrameTime = performance.now();
		this.previousFrameTime = performance.now();

		this.tick(); // Main render loop
	}

	// Setup scene ////////////////////////////////////////////////////////////////////////////////

	setupScene() {
		var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
		renderer.domElement.dataset.filename = 'frontend/' + __filename.replace(/\\/g, '/');
		renderer.domElement.id = 'renderCanvas';
		renderer.setPixelRatio(window.devicePixelRatio || 1);
		renderer.setClearColor(Colors.backgroundColor, 1);
		document.body.appendChild(renderer.domElement);

		var scene = new THREE.Scene();
		(window as any).scene3 = scene;
		(window as any).GLTFExporter = GLTFExporter;
		(window as any).exportGLTF = exportGLTF;

		const camera = new NavCamera(15, window.innerWidth / window.innerHeight, 0.5, 15);

		camera.position.z = 6;
		camera.targetPosition = new THREE.Vector3().copy(camera.position);
		camera.targetFOV = camera.fov;

		scene.add(camera);

		this.renderer = renderer;
		this.scene = scene;
		this.camera = camera;

		this.visibleFiles = new VisibleFiles();

		window.onresize = this.onResize.bind(this);
		this.onResize();
	}

	// Set search results ////////////////////////////////////////////////////////////////////////////////

	setSearchResults(searchResults: SearchResult[]) {
		this.searchResults = searchResults || [];
		this.highlightResults(searchResults || []);
		this.updateSearchLines();
	}

	// Highlighting lines ////////////////////////////////////////////////////////////////////////////////

	setupSearchHighlighting() {
		this.highlightedResults = [];
		this.highlightLater = [];
		this.searchHighlights = new THREE.Mesh(
			new THREE.Geometry(),
			new THREE.MeshBasicMaterial({
				side: THREE.DoubleSide,
				color: 0xff0000,
				opacity: 0.33,
				transparent: true,
				depthTest: false,
				depthWrite: false,
			})
		);
		this.searchHighlights.frustumCulled = false;
		this.searchHighlightsIndex = 1;
		for (let i = 0; i < 40000; i++) {
			(this.searchHighlights.geometry as THREE.Geometry).vertices.push(new THREE.Vector3());
		}
		for (let i = 0; i < 10000; i++) {
			let off = i * 4;
			(this.searchHighlights.geometry as THREE.Geometry).faces.push(
				new THREE.Face3(off, off + 1, off + 2),
				new THREE.Face3(off, off + 2, off + 3)
			);
		}
		(this.searchHighlights as any).ontick = () => {
			this.searchHighlights.visible = this.searchHighlightsIndex > 0;
			if (this.highlightLater.length > 0) {
				const later = this.highlightLater.splice(0);
				for (let i = 0; i < later.length; i++)
					this.addHighlightedLine(later[i][0], later[i][1]);
			}
		};

		this.scene.add(this.searchHighlights);
	}

	setGoToHighlight(fsEntry: any, line: any) {
		this.addHighlightedLine(fsEntry, line, 0);
	}

	addHighlightedLine(fsEntry: FSEntry, line: number, indexOverride = -1) {
		if (fsEntry.contentObject && fsEntry.contentObject.canHighlight) {
			var geo = this.searchHighlights.geometry as THREE.Geometry;
			var index = indexOverride;
			if (indexOverride < 0) {
				index = this.searchHighlightsIndex;
				this.searchHighlightsIndex++;
			}

			const { c0, c1, c2, c3 } = fsEntry.contentObject.getHighlightRegion([line]);
			var off = index * 4;

			geo.vertices[off++].copy(c0);
			geo.vertices[off++].copy(c1);
			geo.vertices[off++].copy(c2);
			geo.vertices[off++].copy(c3);

			geo.verticesNeedUpdate = true;
		} else {
			this.highlightLater.push([fsEntry, line]);
		}
		this.changed = true;
	}

	clearSearchHighlights() {
		var geo = this.searchHighlights.geometry as THREE.Geometry;
		var verts = geo.vertices;
		for (var i = 0; i < verts.length; i++) {
			var v = verts[i];
			v.x = v.y = v.z = 0;
		}
		geo.verticesNeedUpdate = true;
		this.searchHighlightsIndex = 1;
		this.highlightLater = [];
		this.changed = true;
	}

	highlightResults(results: SearchResult[]) {
		var ca = (this.model.geometry as THREE.BufferGeometry).attributes
			.color as THREE.BufferAttribute;
		this.highlightedResults.forEach(function(highlighted) {
			if (highlighted.fsEntry.index === undefined) return;
			Geometry.setColor(
				ca.array as Float32Array,
				highlighted.fsEntry.index,
				Colors[highlighted.fsEntry.entries === null ? 'getFileColor' : 'getDirectoryColor'](
					highlighted.fsEntry
				)
			);
		});
		this.clearSearchHighlights();
		for (var i = 0; i < results.length; i++) {
			var fsEntry = results[i].fsEntry;
			if (fsEntry.index === undefined) continue;
			if (fsEntry.entries !== null && results[i].line === 0) {
				Geometry.setColor(
					ca.array as Float32Array,
					fsEntry.index,
					fsEntry.entries === null ? [1, 0, 0] : [0.6, 0, 0]
				);
			} else if (fsEntry.entries === null && results[i].line > 0) {
				this.addHighlightedLine(fsEntry, results[i].line);
			}
		}
		this.highlightedResults = results;
		ca.needsUpdate = true;
		this.changed = true;
	}

	// Search result connection lines ////////////////////////////////////////////////////////////////////////////////

	setupSearchLines() {
		var screenPlane = new THREE.Mesh(
			new THREE.PlaneBufferGeometry(2000, 2000),
			new THREE.MeshBasicMaterial({ color: 0xff00ff })
		);
		screenPlane.visible = false;
		screenPlane.position.z = 0.75;
		this.scene.add(screenPlane);

		this.screenPlane = screenPlane;

		var searchLine = new THREE.LineSegments(
			new THREE.BufferGeometry(),
			new THREE.LineBasicMaterial({
				color: 0xff0000,
				opacity: 1,
				transparent: true,
				depthTest: false,
				depthWrite: false,
				// linewidth: 2 * (window.devicePixelRatio || 1)
			})
		);
		this.searchLine = searchLine;
		searchLine.frustumCulled = false;
		(searchLine.geometry as THREE.BufferGeometry).setAttribute(
			'position',
			new THREE.BufferAttribute(new Float32Array(40000 * 3), 3)
		);

		(searchLine as any).ontick = () => {
			searchLine.visible = this.searchResults && this.searchResults.length > 0;
		};

		this.scene.add(this.searchLine);

		this.lineGeo = new THREE.BufferGeometry();
		this.lineGeo.setAttribute(
			'position',
			new THREE.BufferAttribute(new Float32Array(40000 * 3), 3)
		);
		this.lineGeo.setAttribute(
			'color',
			new THREE.BufferAttribute(new Float32Array(40000 * 3), 3)
		);
		this.lineModel = new THREE.LineSegments(
			this.lineGeo,
			new THREE.LineBasicMaterial({
				color: new THREE.Color(1.0, 1.0, 1.0),
				opacity: 1,
				transparent: true,
				depthWrite: false,
				vertexColors: THREE.VertexColors,
			})
		);
		this.lineModel.frustumCulled = false;
		(this.lineModel as any).ontick = () => {
			this.lineModel.visible = this.links.length > 0;
		};
		this.scene.add(this.lineModel);
	}

	addScreenLine(
		geo: THREE.BufferGeometry,
		fsEntry: {
			x: number | undefined;
			y: number | undefined;
			z: number | undefined;
			scale: number;
			textHeight: number;
			textXZero: number | undefined;
			textYZero: number;
		},
		bbox: { bottom: number; top: number; left: any } | null,
		index: number,
		line: number,
		lineCount: number
	) {
		var a = new THREE.Vector3(fsEntry.x, fsEntry.y, fsEntry.z);
		a.applyMatrix4(this.model.matrixWorld);
		var b = a,
			bv,
			aUp;

		var av = new THREE.Vector3(a.x + 0.05 * fsEntry.scale, a.y + 0.05 * fsEntry.scale, a.z);

		var off = index * 4;
		if (!bbox || bbox.bottom < 0 || bbox.top > window.innerHeight) {
			bv = new THREE.Vector3(
				b.x - fsEntry.scale * 0.5 - 0.02,
				av.y + 0.05 * fsEntry.scale + 0.01 * 3.15,
				av.z - fsEntry.scale * 0.5
			);
			aUp = new THREE.Vector3(
				av.x - fsEntry.scale * 0.075,
				av.y + 0.05 * fsEntry.scale,
				av.z
			);
		} else {
			this.screenPlane.visible = true;
			var intersections = utils.findIntersectionsUnderEvent(
				{ clientX: bbox.left, clientY: bbox.top + 24, target: this.renderer.domElement },
				this.camera,
				[this.screenPlane]
			);
			this.screenPlane.visible = false;
			b = intersections[0].point;
			bv = new THREE.Vector3(b.x, b.y, b.z);
			aUp = new THREE.Vector3(av.x, av.y, av.z);
			if (line > 0 && fsEntry.textHeight) {
				const textYOff = ((line + 0.5) / lineCount) * fsEntry.textHeight;
				const textLinePos = new THREE.Vector3(
					fsEntry.textXZero,
					fsEntry.textYZero - textYOff,
					fsEntry.z
				);
				textLinePos.applyMatrix4(this.model.matrixWorld);
				aUp = av = textLinePos;
			}
		}

		const verts = geo.getAttribute('position').array as Float32Array;
		off *= 3;
		var v;
		v = av;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		v = aUp;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		v = aUp;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		v = bv;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		(geo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
	}

	updateSearchLines() {
		var needsUpdate = false;
		if (this.searchResults !== this.previousSearchResults) {
			this.clearSearchLine();
			this.previousSearchResults = this.searchResults;
			needsUpdate = true;
			this.changed = true;
			this.searchLis = [].slice.call(document.body.querySelectorAll('#searchResults > li'));
		}
		const lis = this.searchLis;
		var verts = (this.searchLine.geometry as THREE.BufferGeometry).getAttribute('position')
			.array;
		if (needsUpdate && lis.length <= verts.length / 3 / 4) {
			for (var i = 0, l = lis.length; i < l; i++) {
				var li = lis[i] as any;
				this.addScreenLine(
					this.searchLine.geometry as THREE.BufferGeometry,
					li.result.fsEntry,
					null,
					i,
					li.result.line,
					li.result.fsEntry.lineCount
				);
			}
		}
	}

	clearSearchLine() {
		var verts = (this.searchLine.geometry as THREE.BufferGeometry).getAttribute('position')
			.array as Float32Array;
		for (
			var i = this.searchResults.length * 4 * 3;
			i < this.previousSearchResults.length * 4 * 3;
			i++
		) {
			verts[i] = 0;
		}
		((this.searchLine.geometry as THREE.BufferGeometry).getAttribute(
			'position'
		) as THREE.BufferAttribute).needsUpdate = true;
		this.changed = true;
	}

	// File tree updates ////////////////////////////////////////////////////////////////////////////////

	treeUpdater = async (fileTree: FileTree) => {
		const newTree = fileTree.tree !== this.fileTree;
		if (newTree) {
			this.viewRoot = fileTree.tree;
			this.viewRoot.scale = 1;
		}
		await this.showFileTree(fileTree);
		if (newTree) {
			this.camera.position.set(0.5, 0.75, 3);
			this.camera.targetPosition.copy(this.camera.position);
			this.camera.near = 0.5;
			this.camera.far = 50;
			this.camera.updateProjectionMatrix();
			this.scene.updateWorldMatrix(true, true);
			if (this.navUrl) this.goToURL(this.navUrl);
		}
	};

	async setFileTree(fileTree: FileTree) {
		if (this.started) {
			this.treeUpdateQueue.pushMergeEnd(this.treeUpdater, fileTree);
		} else {
			return new Promise((resolve, reject) => {
				const tick = () => {
					if (this.started) this.setFileTree(fileTree).then(resolve);
					else setTimeout(tick, 10);
				};
				tick();
			});
		}
	}

	async showFileTree(tree: FileTree) {
		if (this.treeBuildInProgress) return;
		this.treeBuildInProgress = true;
		const builder = new ModelBuilder();
		utils.traverseFSEntry(tree.tree, (e: FSEntry) => (e.building = false), '');
		const model = await builder.buildModel(
			tree,
			this.viewRoot,
			this.camera,
			this.visibleEntries,
			this.yield
		);
		const { mesh, textGeometry, fileIndex, fsIndex, meshIndex } = model;
		if (this.model) {
			this.model.remove(this.visibleFiles);
			if (this.model.parent) this.model.parent.remove(this.model);
			this.model.traverse(function(m: THREE.Object3D) {
				if ((m as THREE.Mesh).geometry) {
					(m as THREE.Mesh).geometry.dispose();
				}
			});
		}
		this.tree = tree;
		this.fileTree = tree.tree;
		this.fileCount = tree.count;
		this.model = mesh;
		mesh.add(this.visibleFiles);
		(this.model as any).ontick = this.determineVisibility(
			mesh,
			textGeometry,
			this.visibleFiles,
			this.camera
		);
		this.meshIndex = meshIndex;
		this.fileIndex = fileIndex;
		this.fsIndex = fsIndex;
		this.textGeometry = textGeometry;
		this.model.position.set(0, 0, 0);

		this.visibleFiles.children.forEach((f: any) => {
			const fsEntry: FSEntry = f.fsEntry;
			f.position.copy(fsEntry);
			f.scale.set(fsEntry.scale, fsEntry.scale, fsEntry.scale);
		});

		this.scene.add(this.model);
		this.scene.updateWorldMatrix(true, true);
		this.changed = true;
		this.treeBuildInProgress = false;
		this.viewRootUpdated = false;
	}

	// updateTree = async (fileTree) => {
	// 	const oldTreeUpdateInProgress = this.treeUpdateInProgress;
	// 	this.treeUpdateInProgress = true;
	// 	/*
	// 		Traverse tree to find subtrees that are not in a model.
	// 		Append the subtree to this.model geometry.
	// 	*/
	// 	const promises = [];
	// 	utils.traverseFSEntry(
	// 		fileTree,
	// 		(tree, path) => {
	// 			if (tree.index === undefined && tree.parent && !tree.parent.building) {
	// 				// console.log(
	// 				// 	'building tree',
	// 				// 	getFullPath(tree.parent),
	// 				// 	'due to',
	// 				// 	getFullPath(tree),
	// 				// 	tree.parent.scale,
	// 				// 	tree.scale
	// 				// );
	// 				tree.parent.building = true;
	// 				promises.push(tree.parent);
	// 			}
	// 		},
	// 		''
	// 	);
	// 	for (let i = 0; i < promises.length; i++) {
	// 		await this.addFile(promises[i]);
	// 		promises[i].building = false;
	// 	}
	// 	this.changed = true;
	// 	this.treeUpdateInProgress = oldTreeUpdateInProgress;
	// };

	// addFile = async (tree) => {
	// 	// console.log(tree);
	// 	if (this.addingFile) {
	// 		console.log('This is bad.');
	// 		debugger;
	// 		return;
	// 	}
	// 	this.addingFile = true;
	// 	await this.yield();
	// 	utils.traverseFSEntry(tree, () => this.model.fileCount++, '');
	// 	const vertexIndices = {
	// 		vertexIndex: this.fileTree.lastVertexIndex,
	// 		textVertexIndex: this.fileTree.lastTextVertexIndex,
	// 	};

	// 	await this.updateFileTreeGeometry(
	// 		this.model.fileCount,
	// 		tree,
	// 		this.fsIndex,
	// 		this.model.geometry,
	// 		this.model.textGeometry,
	// 		vertexIndices
	// 	);
	// 	this.model.fileCount = this.meshIndex.size;
	// 	while (tree) {
	// 		tree.lastVertexIndex = vertexIndices.vertexIndex;
	// 		tree.lastTextVertexIndex = vertexIndices.textVertexIndex;
	// 		tree = tree.parent;
	// 	}
	// 	this.changed = true;
	// 	this.addingFile = false;
	// };

	// reparentTree = async (fileTree, newRoot) => {
	// 	let { x, y, z, scale } = newRoot;
	// 	let fx = fileTree.x,
	// 		fy = fileTree.y,
	// 		fz = fileTree.z,
	// 		fs = fileTree.scale;
	// 	x = (x - fileTree.x) / fileTree.scale;
	// 	y = (y - fileTree.y) / fileTree.scale;
	// 	z = (z - fileTree.z) / fileTree.scale;
	// 	scale /= fileTree.scale;

	// 	fileTree.x = -x / scale;
	// 	fileTree.y = -y / scale;
	// 	fileTree.z = -z / scale;
	// 	fileTree.scale = 1 / scale;

	// 	const vertexIndices = {
	// 		vertexIndex: this.fileTree.lastVertexIndex,
	// 		textVertexIndex: this.fileTree.lastTextVertexIndex,
	// 	};
	// 	const size = this.meshIndex.size;
	// 	this.meshIndex.clear();
	// 	this.deletionsIndex.clear();
	// 	await this.updateFileTreeGeometry(
	// 		size,
	// 		fileTree,
	// 		this.fsIndex,
	// 		this.model.geometry,
	// 		this.model.textGeometry,
	// 		vertexIndices,
	// 		true
	// 	);
	// 	this.model.visibleFiles.children.forEach((f) => {
	// 		f.position.copy(f.fsEntry);
	// 		f.scale.set(f.fsEntry.scale, f.fsEntry.scale, f.fsEntry.scale);
	// 	});

	// 	x -= newRoot.x;
	// 	y -= newRoot.y;
	// 	z -= newRoot.z;
	// 	scale /= newRoot.scale;
	// 	this.camera.position.x = ((this.camera.position.x - fx) / fs) * fileTree.scale + fileTree.x;
	// 	this.camera.position.y = ((this.camera.position.y - fy) / fs) * fileTree.scale + fileTree.y;
	// 	this.camera.position.z = ((this.camera.position.z - fz) / fs) * fileTree.scale + fileTree.z;
	// 	this.camera.targetPosition.x =
	// 		((this.camera.targetPosition.x - fx) / fs) * fileTree.scale + fileTree.x;
	// 	this.camera.targetPosition.y =
	// 		((this.camera.targetPosition.y - fy) / fs) * fileTree.scale + fileTree.y;
	// 	this.camera.targetPosition.z =
	// 		((this.camera.targetPosition.z - fz) / fs) * fileTree.scale + fileTree.z;
	// 	this.camera.near = (this.camera.near / fs) * fileTree.scale;
	// 	this.camera.far = (this.camera.far / fs) * fileTree.scale;
	// 	this.camera.updateProjectionMatrix();
	// 	this.scene.updateWorldMatrix(true, true);
	// 	this.changed = true;
	// };

	// async updateFileTreeGeometry(
	// 	fileCount,
	// 	fileTree,
	// 	fsIndex,
	// 	geo,
	// 	textGeometry,
	// 	vertexIndices,
	// 	rebuild = false
	// ) {
	// 	let deletionsIndex = new Map();
	// 	if (geo.maxFileCount < fileCount + 1) Geometry.resizeGeometry(geo, 2 * (fileCount + 1));
	// 	if (rebuild || this.deletionsIndex.size > 100) {
	// 		this.rebuildingTree = true;

	// 		deletionsIndex = this.deletionsIndex;
	// 		this.deletionsIndex = new Map();
	// 		geo.fileIndex = 0;

	// 		fileTree = this.fileTree;
	// 		this.meshIndex.clear();

	// 		fsIndex = fileTree.fsIndex = [fileTree];
	// 		fileTree.index = undefined;
	// 		fileTree.vertexIndex = 0;
	// 		fileTree.textVertexIndex = 0;
	// 		vertexIndices.textVertexIndex = 0;
	// 		vertexIndices.vertexIndex = 0;

	// 		textGeometry.vertCount = 0;
	// 	}

	// 	const fileIndex = geo.fileIndex;

	// 	const labels = new THREE.Object3D();
	// 	const thumbnails = new THREE.Object3D();
	// 	geo.fileIndex = await Layout.createFileTreeQuads(
	// 		this.yield,
	// 		fileTree,
	// 		fileIndex,
	// 		geo.getAttribute('position').array,
	// 		geo.getAttribute('color').array,
	// 		labels,
	// 		thumbnails,
	// 		fsIndex,
	// 		this.meshIndex,
	// 		vertexIndices,
	// 		deletionsIndex
	// 	);
	// 	geo.getAttribute('position').needsUpdate = true;
	// 	geo.getAttribute('color').needsUpdate = true;
	// 	geo.computeBoundingSphere();

	// 	let textVertCount = textGeometry.vertCount;
	// 	labels.traverse(function(c) {
	// 		if (c.geometry) {
	// 			textVertCount += c.geometry.attributes.position.array.length;
	// 		}
	// 	});
	// 	if (textVertCount > textGeometry.getAttribute('position').array.length) {
	// 		const positionArray = new Float32Array(textVertCount * 2);
	// 		const uvArray = new Float32Array(textVertCount);
	// 		positionArray.set(textGeometry.getAttribute('position').array);
	// 		uvArray.set(textGeometry.getAttribute('uv').array);
	// 		textGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 4));
	// 		textGeometry.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
	// 	}
	// 	const positionArray = textGeometry.getAttribute('position').array;
	// 	const uvArray = textGeometry.getAttribute('uv').array;
	// 	let j = textGeometry.vertCount;
	// 	labels.traverse(function(c) {
	// 		if (c.geometry) {
	// 			const attributes = c.geometry.attributes;
	// 			const labelPositionArray = attributes.position.array;
	// 			positionArray.set(labelPositionArray, j);
	// 			uvArray.set(attributes.uv.array, j / 2);
	// 			j += labelPositionArray.length;
	// 		}
	// 	});
	// 	textGeometry.vertCount = textVertCount;
	// 	textGeometry.getAttribute('position').needsUpdate = true;
	// 	textGeometry.getAttribute('uv').needsUpdate = true;
	// 	this.rebuildingTree = false;
	// }

	// async createFileTreeModel(fileCount, fileTree) {
	// 	const geo = Geometry.makeGeometry(2 * (fileCount + 1));
	// 	geo.fileIndex = 0;

	// 	fileTree.fsIndex = [fileTree];
	// 	fileTree.vertexIndex = 0;
	// 	fileTree.textVertexIndex = 0;
	// 	const vertexIndices = {
	// 		textVertexIndex: 0,
	// 		vertexIndex: 0,
	// 	};
	// 	fileTree.x = 0;
	// 	fileTree.y = 0;
	// 	fileTree.z = 0;
	// 	fileTree.scale = 1;

	// 	const textGeometry = await Layout.createText({ text: '', noBounds: true }, this.yield);
	// 	textGeometry.vertCount = 0;

	// 	await this.updateFileTreeGeometry(
	// 		fileCount,
	// 		fileTree,
	// 		fileTree.fsIndex,
	// 		geo,
	// 		textGeometry,
	// 		vertexIndices
	// 	);

	// 	const textMesh = new THREE.Mesh(textGeometry, Layout.textMaterial);
	// 	textMesh.frustumCulled = false;

	// 	const mesh = new THREE.Mesh(
	// 		geo,
	// 		new THREE.MeshBasicMaterial({
	// 			color: 0xffffff,
	// 			vertexColors: THREE.VertexColors,
	// 			side: THREE.DoubleSide,
	// 		})
	// 	);
	// 	mesh.fileTree = fileTree;

	// 	const visibleFiles = new THREE.Object3D();
	// 	visibleFiles.visibleSet = {};

	// 	mesh.add(visibleFiles);
	// 	mesh.add(textMesh);
	// 	mesh.visibleFiles = visibleFiles;
	// 	mesh.textGeometry = textGeometry;
	// 	mesh.fileCount = fileCount + 1;

	// 	mesh.ontick = this.determineVisibility(mesh);

	// 	return mesh;
	// }

	updateViewRoot(newRoot: any) {
		if (this.viewRootUpdated || this.treeBuildInProgress) return;
		this.viewRoot = newRoot;
		this.viewRootUpdated = true;
	}

	determineVisibility(
		mesh: THREE.Mesh,
		textGeometry: ISDFTextGeometry,
		visibleFiles: VisibleFiles,
		camera: NavCamera
	) {
		return (t: any, dt: any) => {
			if (this.viewRootUpdated || this.treeBuildInProgress) return;
			document.getElementById('debug')!.textContent =
				this.meshIndex.size +
				' / ' +
				(mesh.geometry as any).maxFileCount +
				' | ' +
				this.visibleEntries.size;
			// Dispose loaded files that are outside the current view
			for (let i = 0; i < visibleFiles.children.length; i++) {
				const c = visibleFiles.children[i];
				const fsEntry = (c as any).fsEntry;
				const bbox = Geometry.getFSEntryBBox(fsEntry, mesh, camera);
				if (!bbox.onScreen || bbox.width * window.innerWidth < 100) {
					if (fsEntry.contentObject) {
						fsEntry.contentObject.dispose();
						fsEntry.contentObject = undefined;
					}
					const fullPath = getFullPath(fsEntry);
					delete visibleFiles.visibleSet[fullPath];
					visibleFiles.remove(c);
					i--;
				} else {
					c.position.copy(fsEntry);
					c.scale.set(fsEntry.scale, fsEntry.scale, fsEntry.scale);
				}
			}
			var zoomedInPath = '';
			var navigationTarget = '';
			var smallestCovering = this.fileTree;

			// Breadth-first traversal of mesh.fileTree
			// - determines fsEntry visibility
			// - finds the covering fsEntry
			// - finds the currently zoomed-in path and breadcrumb path
			const stack = [this.fileTree];
			const visibleEntries = new Map();
			const entriesToFetch = [];
			let needModelUpdate = false;
			while (stack.length > 0) {
				const tree = stack.pop();
				visibleEntries.set(tree, 1); // It's visible, let's keep it in the mesh.
				for (let name in tree.entries) {
					const fsEntry = tree.entries[name];
					if (fsEntry.entries && !fsEntry.building) {
						visibleEntries.set(fsEntry, 1); // Build fresh dirs
						needModelUpdate = true;
						continue;
					}
					const bbox = Geometry.getFSEntryBBox(fsEntry, mesh, camera);
					const pxWidth = bbox.width * window.innerWidth * 0.5;
					const isSmall = pxWidth < (fsEntry.entries ? 15 : 150);

					// Skip entries that are outside frustum or too small.
					if (!bbox.onScreen || isSmall) continue;

					// Directory
					if (fsEntry.entries) {
						stack.push(fsEntry); // Descend into directories.
						if (!this.meshIndex.has(fsEntry)) needModelUpdate = true;
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
						let fullPath = getFullPath(fsEntry);
						if (
							visibleFiles.children.length < 30 &&
							!visibleFiles.visibleSet[fullPath]
						) {
							this.addFileView(visibleFiles, fullPath, fsEntry);
						}
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
			this.zoomedInPath = zoomedInPath;
			this.breadcrumbPath = navigationTarget;
			this.smallestCovering = smallestCovering;
			this.setNavigationTarget(navigationTarget);
			this.visibleEntries = visibleEntries;
			if (entriesToFetch.length > 0) {
				this.requestDirs(
					entriesToFetch
						.filter((e) => !e.fetched)
						.sort(this.cmpFSEntryDistanceFromCenter)
						.map(getFullPath),
					[]
				);
			}
			if (
				!this.viewRootUpdated &&
				!this.treeBuildInProgress &&
				smallestCovering &&
				(smallestCovering.scale < 0.1 || smallestCovering.scale > 10)
			) {
				this.updateViewRoot(smallestCovering);
				needModelUpdate = true;
			}
			if (needModelUpdate) this.setFileTree(this.tree);
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

	addFileView(visibleFiles: VisibleFiles, fullPath: string, fsEntry: FSEntry) {
		const view = Colors.imageRE.test(fullPath) ? ImageFileView : TextFileView;
		fsEntry.contentObject = new view(
			fsEntry,
			this.model,
			fullPath,
			this.api,
			this.yield,
			this.requestFrame
		);
		fsEntry.contentObject.loadListeners.push(() => {
			if (fsEntry.targetLine) {
				const { line, search } = fsEntry.targetLine;
				if (line !== undefined) this.goToFSEntryCoords(fsEntry, line);
				else if (search !== undefined) this.goToFSEntryAtSearch(fsEntry, search);
				delete fsEntry.targetLine;
			}
		});
		fsEntry.contentObject.load(this.api.server + '/repo/file' + fullPath);

		visibleFiles.visibleSet[fullPath] = fsEntry.contentObject;
		visibleFiles.add(fsEntry.contentObject);
	}

	// Linkage lines ////////////////////////////////////////////////////////////////////////////////

	updateLineBetweenElements(
		geo: THREE.BufferGeometry,
		index: number,
		color: { r: number; g: number; b: number } | undefined,
		bboxA: { left: any; top: any },
		bboxB: { left: any; top: any }
	) {
		this.screenPlane.visible = true;
		var intersectionsA = utils.findIntersectionsUnderEvent(
			{ clientX: bboxA.left, clientY: bboxA.top, target: this.renderer.domElement },
			this.camera,
			[this.screenPlane]
		);
		var intersectionsB = utils.findIntersectionsUnderEvent(
			{ clientX: bboxB.left, clientY: bboxB.top, target: this.renderer.domElement },
			this.camera,
			[this.screenPlane]
		);
		this.screenPlane.visible = false;
		var a = intersectionsA[0].point;
		var av = new THREE.Vector3(a.x, a.y, a.z);
		var b = intersectionsB[0].point;
		var bv = new THREE.Vector3(b.x, b.y, b.z);

		var verts = geo.getAttribute('position').array as Float32Array;
		var off = index * 3;
		var v;
		v = av;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		v = av;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		v = av;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		v = bv;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		v = bv;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		v = bv;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;

		if (color) {
			verts = geo.getAttribute('color').array as Float32Array;
			off = index * 3;
			v = color;
			verts[off++] = v.r;
			verts[off++] = v.g;
			verts[off++] = v.b;
			v = color;
			verts[off++] = v.r;
			verts[off++] = v.g;
			verts[off++] = v.b;
			v = color;
			verts[off++] = v.r;
			verts[off++] = v.g;
			verts[off++] = v.b;
			v = color;
			verts[off++] = v.r;
			verts[off++] = v.g;
			verts[off++] = v.b;
			v = color;
			verts[off++] = v.r;
			verts[off++] = v.g;
			verts[off++] = v.b;
			v = color;
			verts[off++] = v.r;
			verts[off++] = v.g;
			verts[off++] = v.b;
		}
	}

	updateLineBetweenEntryAndElement(
		geo: THREE.BufferGeometry,
		index: number,
		color: { r: number; g: number; b: number } | undefined,
		model: THREE.Object3D,
		fsEntry: FSEntry,
		coords: number[] | undefined,
		lineCount: number,
		bbox: { bottom: number; top: number; left: any }
	) {
		var a = new THREE.Vector3(fsEntry.x, fsEntry.y, fsEntry.z);
		a.applyMatrix4(model.matrixWorld);
		var b = a;

		const line = coords ? coords[0] : 0;

		var av = new THREE.Vector3(a.x + 0.05 * fsEntry.scale, a.y + 0.05 * fsEntry.scale, a.z);
		var bv, aUp;

		if (!bbox || bbox.bottom < 0 || bbox.top > window.innerHeight) {
			bv = new THREE.Vector3(
				b.x - fsEntry.scale * 0.5 - 0.02,
				av.y + 0.05 * fsEntry.scale, // + 0.01 * 3.15,
				av.z - fsEntry.scale * 0.5
			);
			aUp = new THREE.Vector3(
				av.x - fsEntry.scale * 0.075,
				av.y + 0.05 * fsEntry.scale,
				av.z
			);
		} else {
			this.screenPlane.visible = true;
			var intersections = utils.findIntersectionsUnderEvent(
				{ clientX: bbox.left, clientY: bbox.top, target: this.renderer.domElement },
				this.camera,
				[this.screenPlane]
			);
			this.screenPlane.visible = false;
			b = intersections[0].point;
			bv = new THREE.Vector3(b.x, b.y, b.z);
			aUp = new THREE.Vector3(av.x, av.y, av.z);
			if (line > 0 && fsEntry.contentObject && fsEntry.contentObject.textHeight) {
				const textYOff = ((line + 0.5) / lineCount) * fsEntry.contentObject.textHeight;
				const textLinePos = new THREE.Vector3(
					fsEntry.contentObject.textXZero,
					fsEntry.contentObject.textYZero - textYOff,
					fsEntry.z
				);
				textLinePos.applyMatrix4(this.model.matrixWorld);
				aUp = av = textLinePos;
			}
		}

		var verts = geo.getAttribute('position').array as Float32Array;
		var off = index * 3;
		var v;
		v = av;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		v = aUp;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		v = aUp;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		v = bv;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		v = bv;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		v = bv;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;

		if (color) {
			verts = geo.getAttribute('color').array as Float32Array;
			off = index * 3;
			v = color;
			verts[off++] = v.r;
			verts[off++] = v.g;
			verts[off++] = v.b;
			v = color;
			verts[off++] = v.r;
			verts[off++] = v.g;
			verts[off++] = v.b;
			v = color;
			verts[off++] = v.r;
			verts[off++] = v.g;
			verts[off++] = v.b;
			v = color;
			verts[off++] = v.r;
			verts[off++] = v.g;
			verts[off++] = v.b;
			v = color;
			verts[off++] = v.r;
			verts[off++] = v.g;
			verts[off++] = v.b;
			v = color;
			verts[off++] = v.r;
			verts[off++] = v.g;
			verts[off++] = v.b;
		}
	}

	updateLineBetweenEntries(
		geo: THREE.BufferGeometry,
		index: number,
		color: { r: number; g: number; b: number } | undefined,
		modelA: THREE.Object3D,
		entryA: FSEntry,
		coordsA: number[] | undefined,
		lineCountA: number,
		modelB: THREE.Object3D,
		entryB: FSEntry,
		coordsB: number[] | undefined,
		lineCountB: number
	) {
		var a = entryA;
		var b = entryB;

		const lineA = coordsA ? coordsA[0] : 0;
		const lineB = coordsB ? coordsB[0] : 0;

		var av = new THREE.Vector3(a.x, a.y, a.z);
		av.applyMatrix4(modelA.matrixWorld);

		var bv = new THREE.Vector3(b.x, b.y + b.scale, b.z);
		bv.applyMatrix4(modelB.matrixWorld);

		if (lineA > 0 && entryA.contentObject && entryA.contentObject.textHeight) {
			const textYOff = ((lineA + 0.5) / lineCountA) * entryA.contentObject.textHeight;
			const textLinePos = new THREE.Vector3(
				entryA.contentObject.textXZero,
				entryA.contentObject.textYZero - textYOff,
				entryA.z
			);
			textLinePos.applyMatrix4(modelA.matrixWorld);
			av = textLinePos;
		}
		if (lineB > 0 && entryB.contentObject && entryB.contentObject.textHeight) {
			const textYOff = ((lineB + 0.5) / lineCountB) * entryB.contentObject.textHeight;
			const textLinePos = new THREE.Vector3(
				entryB.contentObject.textXZero,
				entryB.contentObject.textYZero - textYOff,
				entryB.z
			);
			textLinePos.applyMatrix4(modelB.matrixWorld);
			av = textLinePos;
		}

		var aUp = new THREE.Vector3(
			a.x + (a.x < b.x ? 1 : -1) * 0.1 * entryA.scale,
			a.y + (0.1 + 0.01 * (entryB.size % 10)) * entryA.scale,
			Math.max(a.z, b.z) + 1 * entryA.scale
		);
		aUp.applyMatrix4(modelA.matrixWorld);
		var bUp = new THREE.Vector3(
			b.x + (a.x > b.x ? 1 : -1) * 0.1 * entryB.scale,
			b.y + b.scale + (0.1 + 0.01 * (entryB.size % 10)) * entryB.scale,
			Math.max(a.z, b.z) + 1 * entryB.scale
		);
		bUp.applyMatrix4(modelB.matrixWorld);

		var verts = geo.getAttribute('position').array as Float32Array;
		var off = index * 3;
		var v;
		v = av;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		v = aUp;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		v = aUp;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		v = bUp;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		v = bUp;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;
		v = bv;
		verts[off++] = v.x;
		verts[off++] = v.y;
		verts[off++] = v.z;

		if (color) {
			verts = geo.getAttribute('color').array as Float32Array;
			off = index * 3;
			v = color;
			verts[off++] = v.r;
			verts[off++] = v.g;
			verts[off++] = v.b;
			v = color;
			verts[off++] = v.r;
			verts[off++] = v.g;
			verts[off++] = v.b;
			v = color;
			verts[off++] = v.r;
			verts[off++] = v.g;
			verts[off++] = v.b;
			v = color;
			verts[off++] = v.r;
			verts[off++] = v.g;
			verts[off++] = v.b;
			v = color;
			verts[off++] = v.r;
			verts[off++] = v.g;
			verts[off++] = v.b;
			v = color;
			verts[off++] = v.r;
			verts[off++] = v.g;
			verts[off++] = v.b;
		}
	}

	parseTarget(dst: string | FSEntry, dstPoint: any) {
		if (typeof dst === 'string') {
			return getFSEntryForURL(this.fileTree, dst);
		} else {
			return { fsEntry: dst, point: dstPoint };
		}
	}

	updateLinks() {
		if (this.linksUpdatedOn !== this.currentFrame) {
			this.setLinks(this.links, true);
			this.linksUpdatedOn = this.currentFrame;
		}
	}

	setLinks(links: TreeLink[], updateOnlyElements = false) {
		if (this.lineGeo) {
			const geo = this.lineGeo;
			const verts = geo.getAttribute('position').array as Float32Array;

			for (let i = links.length; i < this.links.length; i++) {
				let j = i * 6 * 3;
				for (let k = 0; k < 18; k++) verts[j + k] = -100;
			}
			this.links = links;
			for (let i = 0; i < links.length; i++) {
				const l = links[i];
				const model = this.model;
				const srcIsElem = l.src instanceof Element;
				const dstIsElem = l.dst instanceof Element;

				if (srcIsElem && dstIsElem) {
					const bboxA = (l.src as Element).getBoundingClientRect();
					const bboxB = (l.dst as Element).getBoundingClientRect();
					this.updateLineBetweenElements(geo, i * 6, l.color, bboxA, bboxB);
				} else if (srcIsElem) {
					const bbox = (l.src as Element).getBoundingClientRect();
					const dst = this.parseTarget(l.dst as string | FSEntry, l.dstPoint);
					if (!dst) continue;
					this.updateLineBetweenEntryAndElement(
						geo,
						i * 6,
						l.color,
						model,
						dst.fsEntry,
						dst.point,
						dst.fsEntry.lineCount,
						bbox
					);
				} else if (dstIsElem) {
					const bbox = (l.dst as Element).getBoundingClientRect();
					const dst = this.parseTarget(l.src as string | FSEntry, l.srcPoint);
					if (!dst) continue;
					this.updateLineBetweenEntryAndElement(
						geo,
						i * 6,
						l.color,
						model,
						dst.fsEntry,
						dst.point,
						dst.fsEntry.lineCount,
						bbox
					);
				} else if (!updateOnlyElements) {
					const src = this.parseTarget(l.src as string | FSEntry, l.srcPoint);
					const dst = this.parseTarget(l.dst as string | FSEntry, l.dstPoint);
					if (!dst || !src) continue;
					this.updateLineBetweenEntries(
						geo,
						i * 6,
						l.color,
						model,
						src.fsEntry,
						src.point,
						src.fsEntry.lineCount,
						model,
						dst.fsEntry,
						dst.point,
						dst.fsEntry.lineCount
					);
				}
			}
			(geo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
			(geo.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
			this.changed = true;
		}
	}

	// FSEntry Navigation ////////////////////////////////////////////////////////////////////////////////

	goToFSEntry = (
		fsEntry: { x: number; scale: number; entries: any; y: number; z: number },
		model = this.model
	) => {
		if (!fsEntry) return;
		const { scene, camera } = this;
		scene.updateMatrixWorld();
		var fsPoint = new THREE.Vector3(
			fsEntry.x + fsEntry.scale * (fsEntry.entries ? 0.5 : 0.5),
			fsEntry.y + fsEntry.scale * (fsEntry.entries ? 0.75 : 0.5),
			fsEntry.z + fsEntry.scale * (fsEntry.entries ? 3 : 5)
		);
		fsPoint.applyMatrix4(model.matrixWorld);
		camera.targetPosition.copy(fsPoint);
		camera.near = fsEntry.scale * 0.2;
		camera.far = fsEntry.scale * 100;
		this.changed = true;
	};

	async goToFSEntryCoords(fsEntry: FSEntry, coords: number[], model = this.model) {
		const { scene, camera } = this;
		scene.updateMatrixWorld();
		const res =
			fsEntry.contentObject && (await fsEntry.contentObject.goToCoords(coords, model));
		if (!res) {
			fsEntry.targetLine = { line: coords };
			return this.goToFSEntry(fsEntry, model);
		}
		const { targetPoint } = res;
		console.log(camera.targetPosition, targetPoint);
		camera.targetPosition.copy(targetPoint);
		this.changed = true;
	}

	async goToFSEntryAtSearch(fsEntry: FSEntry, search: string, model = this.model) {
		const { scene, camera } = this;
		scene.updateMatrixWorld();
		const res =
			fsEntry.contentObject && (await fsEntry.contentObject.goToSearch(search, model));
		if (!res) {
			fsEntry.targetLine = { search };
			return this.goToFSEntry(fsEntry, model);
		}
		const { targetPoint, near, far } = res;
		camera.targetPosition.copy(targetPoint);
		camera.near = near;
		camera.far = far;
		this.changed = true;
	}

	// URL Handling ////////////////////////////////////////////////////////////////////////////////

	registerElementForURL(el: any, url: string) {
		this.urlIndex[url] = this.urlIndex[url] || [];
		this.urlIndex[url].push(el);
	}

	async gcURLElements() {
		const deletions = [];
		let i = 0;
		const elFilter = (el: { ownerDocument: { body: { contains: (arg0: any) => any } } }) => {
			i++;
			return el.ownerDocument.body.contains(el);
		};
		for (let n in this.urlIndex) {
			this.urlIndex[n] = this.urlIndex[n].filter(elFilter);
			if (this.urlIndex[n].length === 0) deletions.push(n);
			if (i > 100) {
				await this.yield();
				i = 0;
			}
		}
		deletions.forEach((n) => delete this.urlIndex[n]);
	}

	goToURL(url: string = '') {
		this.navUrl = url;
		if (!this.fileTree) return;
		const result = getFSEntryForURL(this.fileTree, url);
		if (!result || result.fsEntry.index === undefined) {
			setTimeout(() => this.goToURL(url), 100);
			return;
		}
		const { fsEntry, point, search } = result;
		this.navTarget = new NavTarget(fsEntry, point, search);
		if (point) this.goToFSEntryCoords(fsEntry, point);
		else if (search) this.goToFSEntryAtSearch(fsEntry, search);
		else this.goToFSEntry(fsEntry);
	}

	getURLForFSEntry(fsEntry: FSEntry, location = []) {
		const locationStr = location.length > 0 ? '#' + location.join(',') : '';
		return getFullPath(fsEntry) + locationStr;
	}

	// UI Methods ////////////////////////////////////////////////////////////////////////////////

	setupEventListeners() {
		const { renderer, camera } = this;

		const self = this;

		var down = false;
		var previousX: number, previousY: number, startX: number, startY: number;
		var clickDisabled = false;

		var pinchStart: number, pinchMid: { clientX: number; clientY: number };

		var inGesture = false;

		renderer.domElement.addEventListener(
			'touchstart',
			function(ev) {
				if (document.activeElement) (document.activeElement as any).blur();
				ev.preventDefault();
				if (ev.touches.length === 1) {
					renderer.domElement.onmousedown!(ev.touches[0] as any);
				} else if (ev.touches.length === 2) {
					inGesture = true;
					var dx = ev.touches[0].clientX - ev.touches[1].clientX;
					var dy = ev.touches[0].clientY - ev.touches[1].clientY;
					pinchStart = Math.sqrt(dx * dx + dy * dy);
					pinchMid = {
						clientX: ev.touches[1].clientX + dx / 2,
						clientY: ev.touches[1].clientY + dy / 2,
					};
					renderer.domElement.onmousedown!(pinchMid as any);
				}
			},
			false
		);

		renderer.domElement.addEventListener(
			'touchmove',
			function(ev) {
				ev.preventDefault();
				if (ev.touches.length === 1) {
					if (!inGesture) {
						window.onmousemove!(ev.touches[0] as any);
					}
				} else if (ev.touches.length === 2) {
					var dx = ev.touches[0].clientX - ev.touches[1].clientX;
					var dy = ev.touches[0].clientY - ev.touches[1].clientY;
					var zoom = pinchStart / Math.sqrt(dx * dx + dy * dy);
					pinchStart = Math.sqrt(dx * dx + dy * dy);
					pinchMid = {
						clientX: ev.touches[1].clientX + dx / 2,
						clientY: ev.touches[1].clientY + dy / 2,
					};
					var cx = (pinchMid.clientX - window.innerWidth / 2) / window.innerWidth;
					var cy = (pinchMid.clientY - window.innerHeight / 2) / window.innerHeight;
					self.zoomCamera(zoom, cx, cy);
					window.onmousemove!(pinchMid as any);
				}
			},
			false
		);

		renderer.domElement.addEventListener(
			'touchend',
			function(ev) {
				ev.preventDefault();
				if (ev.touches.length === 0) {
					if (!inGesture) {
						window.onmouseup!(ev.changedTouches[0] as any);
					} else {
						inGesture = false;
						window.onmouseup!(pinchMid as any);
					}
				} else if (ev.touches.length === 1) {
				}
			},
			false
		);

		renderer.domElement.addEventListener(
			'touchcancel',
			function(ev) {
				ev.preventDefault();
				if (ev.touches.length === 0) {
					if (!inGesture) {
						window.onmouseup!(ev.changedTouches[0] as any);
					} else {
						inGesture = false;
						window.onmouseup!(pinchMid as any);
					}
				} else if (ev.touches.length === 1) {
				}
			},
			false
		);

		window.onkeydown = function(ev: KeyboardEvent) {
			if (!ev.target || (ev.target as any).tagName !== 'INPUT') {
				var dx = 0,
					dy = 0,
					dz = 0;
				switch (ev.keyCode) {
					case 39:
						dx = -50;
						break;

					case 40:
						dy = -50;
						break;

					case 37:
						dx = 50;
						break;

					case 38:
						dy = 50;
						break;

					default: // do nothing
				}
				// Arrow keys pan normally, WASD is context-sensitive scroll (next file, etc.)
				switch (ev.key) {
					case 'w': // scroll up
						{
							const fsEntry = getPathEntry(self.fileTree, self.breadcrumbPath || '');
							if (fsEntry && fsEntry.parent && fsEntry.parent.entries) {
								const files = Object.values(fsEntry.parent.entries).sort(
									self.fsEntryCmp
								);
								const fn = files[files.indexOf(fsEntry) - 1];
								if (fn) self.goToFSEntry(fn);
							}
						}
						break;
					case 's': // scroll down
						{
							const fsEntry = getPathEntry(self.fileTree, self.breadcrumbPath || '');
							if (fsEntry && fsEntry.parent && fsEntry.parent.entries) {
								const files = Object.values(fsEntry.parent.entries).sort(
									self.fsEntryCmp
								);
								const fn = files[files.indexOf(fsEntry) + 1];
								if (fn) self.goToFSEntry(fn);
							}
						}
						break;
					case 'a': // scroll left
						break;
					case 'd': // scroll right
						break;
					case 'e': // zoom in
						dz = -50;
						break;
					case 'q': // zoom out
						dz = 50;
						break;
					case 'z': // zoom in to object
						const intersection = self.getEntryAtMouse({
							clientX: window.innerWidth / 2,
							clientY: window.innerHeight / 2,
						});
						if (intersection) {
							const fsEntry = intersection.fsEntry;
							// FIXME Use distance to model instead of fov
							const fovDiff = (fsEntry.scale * 50) / self.camera.fov;
							if (self.highlighted === fsEntry) {
								if (fsEntry.textScale) self.goToFSEntryCoords(fsEntry, [0]);
								else dz = -50;
							} else {
								if (fovDiff > 0.95) {
									if (fsEntry.textScale) self.goToFSEntryCoords(fsEntry, [0]);
									else dz = -50;
								} else self.goToFSEntry(fsEntry);
							}
							self.highlighted = fsEntry;
						} else {
							dz = -50;
						}
						// self.zoomToEntry({clientX: window.innerWidth/2, clientY: window.innerHeight/2});
						break;
					case 'x': // zoom out of object
						var fsEntry = getPathEntry(
							self.fileTree,
							(self.breadcrumbPath || '').replace(/\/[^/]+$/, '')
						);
						if (fsEntry && fsEntry.title) self.goToFSEntry(fsEntry, self.model);
						break;

					default: // do nothing
				}
				const d = self.getCameraDistanceToModel() * (camera.fov / 30);
				const factor = d / window.innerWidth;
				camera.targetPosition.x -= factor * dx;
				camera.targetPosition.y += factor * dy;
				const zf = Math.pow(2, dz / 50);
				camera.targetPosition.z += -d + d * zf;
				camera.near *= zf;
				camera.far *= zf;
				self.changed = true;
			}
		};

		renderer.domElement.onmousedown = function(ev) {
			if (document.activeElement) (document.activeElement as any).blur();
			if (ev.preventDefault) ev.preventDefault();
			down = true;
			clickDisabled = false;
			startX = previousX = ev.clientX;
			startY = previousY = ev.clientY;
		};

		window.onmousemove = function(ev: {
			preventDefault: () => void;
			clientX: number;
			clientY: number;
		}) {
			if (down) {
				self.changed = true;
				if (ev.preventDefault) ev.preventDefault();
				var dx = ev.clientX - previousX;
				var dy = ev.clientY - previousY;
				previousX = ev.clientX;
				previousY = ev.clientY;
				if (Math.abs(ev.clientX - startX) > 10 || Math.abs(ev.clientY - startY) > 10) {
					clickDisabled = true;
				}
				const d = self.getCameraDistanceToModel() * (camera.fov / 57);
				const factor = d / window.innerHeight;
				camera.position.x -= factor * dx;
				camera.position.y += factor * dy;
				camera.targetPosition.copy(camera.position);
			}
		};

		var lastScroll = Date.now();

		var prevD = 0;
		var wheelSnapTimer: NodeJS.Timeout;
		var wheelFreePan = false;
		renderer.domElement.onwheel = function(ev) {
			ev.preventDefault();

			if (ev.ctrlKey) {
				// zoom on wheel
				var cx = (ev.clientX - window.innerWidth / 2) / window.innerWidth;
				var cy = (ev.clientY - window.innerHeight / 2) / window.innerHeight;
				var d = ev.deltaY !== undefined ? ev.deltaY * 3 : (ev as any).wheelDelta;
				if (Date.now() - lastScroll > 500) {
					prevD = d;
				}
				if (d > 20 || d < -20) {
					d = (20 * d) / Math.abs(d);
				}
				if ((d < 0 && prevD > 0) || (d > 0 && prevD < 0)) {
					d = 0;
				}
				prevD = d;
				self.zoomCamera(Math.pow(1.006, d), cx, cy);
				lastScroll = Date.now();
			} else {
				clearTimeout(wheelSnapTimer);
				wheelSnapTimer = setTimeout(function() {
					wheelFreePan = false;
				}, 1000);

				// pan on wheel
				const d = self.getCameraDistanceToModel() * (camera.fov / 57);
				const factor = (1.5 * d) / window.innerHeight;
				const adx = Math.abs(ev.deltaX);
				const ady = Math.abs(ev.deltaY);
				var xMove = false,
					yMove = true;
				if (adx > ady) {
					xMove = true;
					yMove = false;
				}
				wheelFreePan = wheelFreePan || (adx > 5 && ady > 5);
				if (wheelFreePan || xMove) camera.position.x += factor * ev.deltaX;
				if (wheelFreePan || yMove) camera.position.y -= factor * ev.deltaY;
				camera.targetPosition.copy(camera.position);
				self.changed = true;
			}
		};

		var gestureStartScale = 0;
		window.addEventListener('gesturestart', function(e) {
			e.preventDefault();
			gestureStartScale = 1;
		});
		window.addEventListener('gesturechange', function(ev) {
			ev.preventDefault();
			const gev = (ev as unknown) as { clientX: number; clientY: number; scale: number };
			var cx = (gev.clientX - window.innerWidth / 2) / window.innerWidth;
			var cy = (gev.clientY - window.innerHeight / 2) / window.innerHeight;
			var d = gev.scale / gestureStartScale;
			gestureStartScale = gev.scale;
			self.zoomCamera(1 / d, cx, cy);
		});
		window.addEventListener('gestureend', function(e) {
			e.preventDefault();
		});

		this.highlighted = null;
		window.onmouseup = function(ev: { preventDefault: () => void }) {
			if (down && ev.preventDefault) ev.preventDefault();
			if (clickDisabled) {
				down = false;
				return;
			}
			if (down) {
				down = false;
				self.zoomToEntry(ev);
			}
		};
	}

	// Used to navigate between entries
	fsEntryCmp(a: FSEntry, b: FSEntry) {
		if (!!a.entries === !!b.entries) return a.title < b.title ? -1 : a.title > b.title ? 1 : 0;
		else if (a.entries) return -1;
		else return 1;
	}

	getCameraDistanceToModel() {
		const intersections = utils.findIntersectionsUnderEvent(
			{
				clientX: window.innerWidth / 2,
				clientY: window.innerHeight / 2,
				target: this.renderer.domElement,
			},
			this.camera,
			[this.model]
		);
		if (intersections[0]) return intersections[0].distance;
		else return this.camera.position.distanceTo(this.model.position);
	}

	zoomCamera(zf: number, cx: number, cy: number) {
		const camera = this.camera;
		cx = (cx * window.innerWidth) / window.innerHeight;
		const d = this.getCameraDistanceToModel();
		const dc = (d * camera.fov) / 57;
		camera.position.x += cx * dc - cx * dc * zf;
		camera.position.y -= cy * dc - cy * dc * zf;
		camera.position.z += -d + d * zf;
		camera.near *= zf;
		camera.far *= zf;
		camera.targetPosition.copy(camera.position);
		camera.updateProjectionMatrix();
		this.scene.updateWorldMatrix(true, true);
		this.changed = true;
	}

	zoomToEntry(ev: any) {
		const intersection = this.getEntryAtMouse(ev);
		if (!intersection) debugger;
		if (intersection) {
			const fsEntry = intersection.fsEntry;
			const coords =
				fsEntry.contentObject &&
				fsEntry.contentObject.onclick(
					ev,
					intersection,
					Geometry.getFSEntryBBox(fsEntry, this.model, this.camera),
					this.navTarget
				);
			this.history.push(this.getURLForFSEntry(fsEntry, coords));
			this.highlighted = fsEntry;
			this.changed = true;
		}
	}

	getEntryAtMouse(ev: { clientX: any; clientY: any }) {
		return Geometry.findFSEntry(
			{ clientX: ev.clientX, clientY: ev.clientY, target: this.renderer.domElement },
			this.camera,
			[this.model],
			this.fsIndex,
			this.highlighted
		);
	}

	getTextPosition(
		fsEntry: FSEntry,
		intersection: { point: THREE.Vector3; object: { matrixWorld: THREE.Matrix4 } }
	) {
		const fv = new THREE.Vector3(
			fsEntry.contentObject.textXZero,
			fsEntry.contentObject.textYZero,
			fsEntry.z
		);
		const pv = new THREE.Vector3().copy(intersection.point);
		const inv = new THREE.Matrix4().getInverse(intersection.object.matrixWorld);
		pv.applyMatrix4(inv);
		const uv = new THREE.Vector3().subVectors(pv, fv);
		uv.divideScalar(fsEntry.scale * fsEntry.contentObject.textScale);
		uv.y /= 38;
		uv.x /= 19;

		const line = Math.floor(-uv.y);
		const col = Math.floor(uv.x + 1);
		return { line, col };
	}

	handleTextClick(ev: any, fsEntry: FSEntry, intersection: any) {
		const { line, col } = this.getTextPosition(fsEntry, intersection);
		const text = fsEntry.contentObject.geometry.layout._opt.text;
		const lineStr = text.split('\n')[line - 1];
		const urlRE = /https?:\/\/[a-z0-9.%$#@&?/_-]+/gi;
		var hit = null;
		while ((hit = urlRE.exec(lineStr))) {
			const startIndex = hit.index;
			const endIndex = hit.index + hit[0].length - 1;
			if (col >= startIndex && col <= endIndex) {
				if (this.onElectron) {
					// Open link in a floating iframe added to the tree.
					// On render, update the matrix of the iframe's 3D transform.
					// This can only be done on Electron as X-Frame-Options: DENY
					// disables cross-origin iframes.
					var iframe = document.createElement('iframe');
					iframe.src = hit[0];
					iframe.style.border = '10px solid white';
					iframe.style.backgroundColor = 'white';
					iframe.style.position = 'absolute';
					iframe.style.right = '10px';
					iframe.style.top = 96 + 'px';
					iframe.style.zIndex = '2';
					iframe.style.width = '600px';
					iframe.style.height = 'calc(100vh - 106px)';
					if (this.renderer.domElement.parentNode)
						this.renderer.domElement.parentNode.appendChild(iframe);
					return true;
				} else {
					// Open link in a new window.
					window.open(hit[0]);
					return true;
				}
			}
		}
		return false;
	}

	// Rendering ////////////////////////////////////////////////////////////////////////////////

	render() {
		const { scene, camera, renderer } = this;
		scene.updateMatrixWorld(true);
		var t = performance.now();
		(scene as any).tick(t, t - this.lastFrameTime);
		this.lastFrameTime = t;
		renderer.render(scene, camera);
		this.currentFrame++;
	}

	tick = () => {
		if ((window.pageZoom || 100) / 100 !== this.pageZoom) {
			this.pageZoom = (window.pageZoom || 100) / 100;
			this.onResize();
		}
		this.frameStart = performance.now();
		this.frameFibers.splice(0).map((f) => f());
		const camera = this.camera;
		if (!camera) return this.requestFrame();
		const currentFrameTime = performance.now();
		var dt = currentFrameTime - this.previousFrameTime;
		this.previousFrameTime += dt;
		if (dt > 16 || this.frameLoopPaused) {
			dt = 16;
		}

		if (
			camera.targetPosition.x !== camera.position.x ||
			camera.targetPosition.y !== camera.position.y ||
			camera.targetPosition.z !== camera.position.z ||
			camera.fov !== camera.targetFOV
		) {
			camera.position.x +=
				(camera.targetPosition.x - camera.position.x) * (1 - Math.pow(0.85, dt / 16));
			camera.position.y +=
				(camera.targetPosition.y - camera.position.y) * (1 - Math.pow(0.85, dt / 16));
			camera.position.z +=
				(camera.targetPosition.z - camera.position.z) * (1 - Math.pow(0.85, dt / 16));
			if (Math.abs(camera.position.x - camera.targetPosition.x) < Number.EPSILON) {
				camera.position.x = camera.targetPosition.x;
			}
			if (Math.abs(camera.position.y - camera.targetPosition.y) < Number.EPSILON) {
				camera.position.y = camera.targetPosition.y;
			}
			if (Math.abs(camera.position.z - camera.targetPosition.z) < Number.EPSILON) {
				camera.position.z = camera.targetPosition.z;
			}
			camera.fov += (camera.targetFOV - camera.fov) * (1 - Math.pow(0.85, dt / 16));
			if (Math.abs(camera.fov - camera.targetFOV) < camera.targetFOV / 1000) {
				camera.fov = camera.targetFOV;
			}
			camera.updateProjectionMatrix();
			this.updateLinks();
			this.changed = true;
			this.animating = true;
		} else {
			this.animating = false;
		}
		var wasChanged = this.changed || this.frameFibers.length > 0;
		this.changed = false;
		if (wasChanged || this.animating) this.render();
		this.frameRequested = false;
		if (this.frameFibers.length > 0 || this.changed || this.animating) this.requestFrame();
		this.frameLoopPaused = !this.frameRequested;
	};

	onResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		if (/Mac OS X/.test(navigator.userAgent)) {
			if (window.screen.width !== 1280 && window.devicePixelRatio >= 2) {
				this.resAdjust = 1280 / window.screen.width;
			}
		}
		this.renderer.setPixelRatio(window.devicePixelRatio);
		if (!/Chrome/.test(navigator.userAgent)) {
			this.renderer.setSize(
				window.innerWidth * this.pageZoom * this.resAdjust,
				window.innerHeight * this.pageZoom * this.resAdjust
			);
		} else {
			this.renderer.setSize(
				window.innerWidth * this.resAdjust,
				window.innerHeight * this.resAdjust
			);
		}
		this.renderer.domElement.style.width = window.innerWidth + 'px';
		this.renderer.domElement.style.height = window.innerHeight + 'px';
		this.changed = true;
	}

	get changed() {
		return this._changed;
	}

	set changed(v) {
		this._changed = v;
		if (v) this.requestFrame();
	}

	requestFrame = () => {
		this._changed = true;
		if (!this.frameRequested) {
			this.frameRequested = true;
			window.requestAnimationFrame(this.tick);
		}
	};

	yield: () => Promise<void> = async () => {
		if (this.frameStart > 0 && performance.now() - this.frameStart > 10) {
			return new Promise((resolve, reject) => {
				const resolver = () => {
					this.changed = true;
					if (performance.now() - this.frameStart > 10) this.frameFibers.push(resolver);
					else resolve();
				};
				this.frameFibers.push(resolver);
			});
		}
		this.changed = true;
	};
}

export default new Tabletree();
