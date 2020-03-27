import {
	getPathEntry,
	getFullPath,
	getFSEntryForURL,
	getNearestFSEntryForURL,
	FSEntry,
	ExtendedFSEntry,
} from '../lib/filesystem';
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
import { FileTree, SearchResult } from '../MainApp';
import QFrameAPI from '../../lib/api';
import HighlightedLines from './HighlightedLines';
import SearchLandmarks from './SearchLandmarks';
import LinksModel from './LinksModel';
import { RouteComponentProps } from 'react-router-dom';

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

export type ParseTargetSignature = (
	dst: string | FSEntry,
	dstPoint?: number[]
) => ExtendedFSEntry | null;

class Tabletree {
	initDone: boolean = false;
	frameFibers: Fiber[] = [];
	frameStart: number = -1;
	treeUpdateQueue: WorkQueue<FileTree> = new WorkQueue();
	animating: boolean = false;
	commitsPlaying: boolean = false;
	currentFrame: number = 0;
	pageZoom: number = 1;
	resAdjust: number = 1;
	textMinScale: number = 1;
	textMaxScale: number = 1000;
	fsIndex: FSEntry[] = [];
	meshIndex: Map<FSEntry, number> = new Map();
	visibleEntries: Map<FSEntry, number> = new Map();
	history?: RouteComponentProps['history'];
	model: THREE.Mesh = new THREE.Mesh();
	searchResults: SearchResult[] = [];

	requestDirs: (paths: string[], discard: string[]) => Promise<void> = async () => {};
	setNavigationTarget: (target: string) => void = () => {};

	api: QFrameAPI = QFrameAPI.mock;
	_fileTree?: FileTree;
	lastFrameTime: number = 0;
	previousFrameTime: number = 0;
	renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer();
	scene: THREE.Scene = new THREE.Scene();
	camera: NavCamera = new NavCamera();
	visibleFiles: VisibleFiles = new VisibleFiles();
	screenPlane: THREE.Mesh = new THREE.Mesh();
	fileTree?: FSEntry;
	viewRoot?: FSEntry;
	navUrl?: string;
	treeBuildInProgress: boolean = false;
	tree?: FileTree;
	fileCount: number = 0;
	fileIndex: number = 0;

	textGeometry: ISDFTextGeometry | undefined;
	viewRootUpdated: boolean | undefined;
	zoomedInPath: string | undefined;
	breadcrumbPath: string | undefined;

	smallestCovering?: FSEntry;

	navTarget: NavTarget | undefined;
	highlighted?: FSEntry;
	onElectron: boolean = false;
	frameLoopPaused: boolean = false;
	frameRequested: boolean = true;
	_changed: boolean = true;
	started: boolean = false;
	highlightedLines: HighlightedLines;
	searchLandmarks: SearchLandmarks;
	linksModel: LinksModel;

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
		this.searchLandmarks = new SearchLandmarks(this.screenPointToWorldPoint);
		this.scene.add(this.searchLandmarks.model);
		this.highlightedLines = new HighlightedLines();
		this.scene.add(this.highlightedLines.model);
		this.linksModel = new LinksModel(this.screenPointToWorldPoint, this.parseTarget);
		this.scene.add(this.linksModel.model);
		this.setupEventListeners(); // UI event listeners
		this.changed = true;
	}

	init(api: QFrameAPI, history: RouteComponentProps['history']) {
		if (this.api !== QFrameAPI.mock) {
			console.error('ALREADY INITIALIZED');
			return;
		}
		this.api = api;
		this.history = history;
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

		var screenPlane = new THREE.Mesh(
			new THREE.PlaneBufferGeometry(2000, 2000),
			new THREE.MeshBasicMaterial({ color: 0xff00ff })
		);
		screenPlane.visible = false;
		screenPlane.position.z = 0.75;
		this.camera.add(screenPlane);

		this.screenPlane = screenPlane;

		window.onresize = this.onResize.bind(this);
		this.onResize();
	}

	// Set search results ////////////////////////////////////////////////////////////////////////////////

	setSearchResults(searchResults: SearchResult[]) {
		if (!this.fileTree) return;
		this.searchResults = searchResults;
		this.highlightedLines.highlightResults(
			this.fileTree,
			this.searchResults,
			(this.model.geometry as THREE.BufferGeometry).getAttribute(
				'color'
			) as THREE.BufferAttribute
		);
		this.searchLandmarks.searchResults = this.searchResults;
		this.searchLandmarks.updateSearchLines();
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
		if (this.treeBuildInProgress || !this.viewRoot) return;
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
			if (!this.fileTree) return;
			const stack = [this.fileTree];
			const visibleEntries = new Map();
			const entriesToFetch = [];
			let needModelUpdate = false;
			while (stack.length > 0) {
				const tree = stack.pop();
				if (!tree) break;
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
			if (needModelUpdate && this.tree) this.setFileTree(this.tree);
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
			if (fsEntry.navigationCoords) {
				const { coords, search } = fsEntry.navigationCoords;
				if (coords !== undefined) this.goToFSEntryCoords(fsEntry, coords);
				else if (search !== undefined) this.goToFSEntryAtSearch(fsEntry, search);
				delete fsEntry.navigationCoords;
			}
		});
		fsEntry.contentObject.load(this.api.server + '/repo/file' + fullPath);

		visibleFiles.visibleSet[fullPath] = fsEntry.contentObject;
		visibleFiles.add(fsEntry.contentObject);
	}

	_tmpMatrix4 = new THREE.Matrix4();
	screenPointToWorldPoint = (x: number, y: number): THREE.Vector3 => {
		this.screenPlane.visible = true;
		this.screenPlane.position.z = -this.camera.near;
		this.screenPlane.updateMatrixWorld();
		var intersections = utils.findIntersectionsUnderEvent(
			{ clientX: x, clientY: y, target: this.renderer.domElement },
			this.camera,
			[this.screenPlane]
		);
		this.screenPlane.visible = false;
		if (!intersections[0]) return new THREE.Vector3();
		intersections[0].point.applyMatrix4(
			this.screenPlane.matrixWorld.getInverse(this._tmpMatrix4)
		);
		return intersections[0].point;
	};

	// FSEntry Navigation ////////////////////////////////////////////////////////////////////////////////

	parseTarget = (dst: string | FSEntry, dstPoint: any): ExtendedFSEntry | null => {
		if (!this.fileTree) return null;
		if (typeof dst === 'string') {
			return getNearestFSEntryForURL(this.fileTree, dst);
		} else {
			return { fsEntry: dst, point: dstPoint };
		}
	};

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
		this.changed = true;
	};

	async goToFSEntryCoords(fsEntry: FSEntry, coords: number[], model = this.model) {
		const { scene, camera } = this;
		scene.updateMatrixWorld();
		const res = fsEntry.contentObject && (await fsEntry.contentObject.goToCoords(coords));
		if (!res) {
			fsEntry.navigationCoords = { coords };
			return this.goToFSEntry(fsEntry, model);
		}
		const targetPoint = res;
		camera.targetPosition.copy(targetPoint);
		this.changed = true;
	}

	async goToFSEntryAtSearch(fsEntry: FSEntry, search: string, model = this.model) {
		const { scene, camera } = this;
		scene.updateMatrixWorld();
		const res = fsEntry.contentObject && (await fsEntry.contentObject.goToSearch(search));
		if (!res) {
			fsEntry.navigationCoords = { search };
			return this.goToFSEntry(fsEntry, model);
		}
		const targetPoint = res;
		camera.targetPosition.copy(targetPoint);
		this.changed = true;
	}

	// URL Handling ////////////////////////////////////////////////////////////////////////////////

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
							if (!self.fileTree) return;
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
							if (!self.fileTree) return;
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
						if (!self.fileTree) return;
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

		this.highlighted = undefined;
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
			if (this.history) this.history.push(this.getURLForFSEntry(fsEntry, coords));
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

		const d = this.getCameraDistanceToModel();
		camera.near = 0.1 * d;
		camera.far = 100 * d;

		if (
			camera.targetPosition.x !== camera.position.x ||
			camera.targetPosition.y !== camera.position.y ||
			camera.targetPosition.z !== camera.position.z ||
			camera.fov !== camera.targetFOV
		) {
			const pxSize = (0.05 * d) / Math.max(window.innerHeight, window.innerWidth);
			camera.position.x +=
				(camera.targetPosition.x - camera.position.x) * (1 - Math.pow(0.85, dt / 16));
			camera.position.y +=
				(camera.targetPosition.y - camera.position.y) * (1 - Math.pow(0.85, dt / 16));
			camera.position.z +=
				(camera.targetPosition.z - camera.position.z) * (1 - Math.pow(0.85, dt / 16));
			if (Math.abs(camera.position.x - camera.targetPosition.x) < pxSize) {
				camera.position.x = camera.targetPosition.x;
			}
			if (Math.abs(camera.position.y - camera.targetPosition.y) < pxSize) {
				camera.position.y = camera.targetPosition.y;
			}
			if (Math.abs(camera.position.z - camera.targetPosition.z) < pxSize) {
				camera.position.z = camera.targetPosition.z;
			}
			camera.fov += (camera.targetFOV - camera.fov) * (1 - Math.pow(0.85, dt / 16));
			if (Math.abs(camera.fov - camera.targetFOV) < camera.targetFOV / 1000) {
				camera.fov = camera.targetFOV;
			}
			this.changed = true;
			this.animating = true;
		} else {
			this.animating = false;
		}
		this.linksModel.updateLinks(this.currentFrame);
		camera.updateProjectionMatrix();
		var wasChanged = this.changed || this.frameFibers.length > 0;
		this.changed = false;
		if (wasChanged || this.animating) this.render();
		this.frameRequested = false;
		//if (this.frameFibers.length > 0 || this.changed || this.animating)
		this.requestFrame();
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
