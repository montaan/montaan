import { getPathEntry, getFullPath, getFSEntryForURL } from '../lib/filesystem';
import Colors from '../lib/Colors';
import Layout from '../lib/Layout';
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

function save(blob, filename) {
	const link = document.createElement('a');
	link.href = URL.createObjectURL(blob);
	link.download = filename;
	link.click();

	// URL.revokeObjectURL( url ); breaks Firefox...
}

function saveString(text, filename) {
	save(new Blob([text], { type: 'text/plain' }), filename);
}

function saveArrayBuffer(buffer, filename) {
	save(new Blob([buffer], { type: 'application/octet-stream' }), filename);
}

function exportGLTF(input) {
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
global.exportGLTF = exportGLTF;

global.THREE = THREE;

THREE.Object3D.prototype.tick = function(t, dt) {
	if (this.ontick) this.ontick(t, dt);
	for (var i = 0; i < this.children.length; i++) {
		this.children[i].tick(t, dt);
	}
};

class Tabletree {
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

		this.textMinScale = 1000;
		this.textMaxScale = 0;

		this.deletionsCount = 0;
		this.deletionsIndex = new Map();
		this.meshIndex = new Map();

		this.history = undefined;

		this.changed = true;
		this.model = null;
		this.authorModel = null;
		this.processModel = null;
		this.lineModel = null;
		this.lineGeo = null;
		this.links = [];

		this.commitsPlaying = false;
		this.searchResults = [];
		this.previousSearchResults = [];

		this.frameFibers = [];
		this.frameStart = -1;

		this.initDone = false;
		this.requestDirs = undefined;
		this.setNavigationTarget = undefined;
	}

	init(api) {
		if (this.api) {
			console.error('ALREADY INITIALIZED');
			return;
		}
		this.api = api;
		var fontTex, fontDesc;
		new THREE.TextureLoader().load(fontSDF, (tex) => {
			fontTex = tex;
			if (fontDesc && fontTex) this.start(fontDesc, fontTex);
		});
		loadFont(fontDescription, (err, font) => {
			if (err) throw err;
			fontDesc = font;
			if (fontDesc && fontTex) this.start(fontDesc, fontTex);
		});
	}

	async start(font, fontTexture) {
		this.setupScene(); // Renderer, scene and camera setup.
		Layout.font = font;
		Layout.fontTexture = fontTexture;
		Layout.textMaterial = Layout.makeTextMaterial();

		this.setupSearchLines(); // Search landmark and connection lines
		this.setupSearchHighlighting(); // Search highlighting lines
		this.setupEventListeners(); // UI event listeners
		if (this._fileTree) await this.setFileTree(this._fileTree); // Show possibly pre-loaded file tree.
		if (this.commitData) this.setCommitData(this.commitData); // Set pre-loaded commit data.

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
		window.scene3 = scene;
		window.GLTFExporter = GLTFExporter;

		var camera = new THREE.PerspectiveCamera(
			45,
			window.innerWidth / window.innerHeight,
			0.5,
			5
		);

		camera.position.z = 2;
		camera.targetPosition = new THREE.Vector3().copy(camera.position);
		camera.targetFOV = camera.fov;

		scene.add(camera);

		this.renderer = renderer;
		this.scene = scene;
		this.camera = camera;

		window.onresize = this.onResize.bind(this);
		this.onResize();
	}

	// Set search results ////////////////////////////////////////////////////////////////////////////////

	setSearchResults(searchResults) {
		console.log(searchResults);
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
		this.searchHighlights.index = 1;
		for (let i = 0; i < 40000; i++) {
			this.searchHighlights.geometry.vertices.push(new THREE.Vector3());
		}
		for (let i = 0; i < 10000; i++) {
			let off = i * 4;
			this.searchHighlights.geometry.faces.push(
				new THREE.Face3(off, off + 1, off + 2),
				new THREE.Face3(off, off + 2, off + 3)
			);
		}
		this.searchHighlights.ontick = () => {
			this.searchHighlights.visible = this.searchHighlights.index > 0;
			if (this.highlightLater.length > 0) {
				const later = this.highlightLater.splice(0);
				for (let i = 0; i < later.length; i++)
					this.addHighlightedLine(later[i][0], later[i][1]);
			}
		};

		this.scene.add(this.searchHighlights);
	}

	setGoToHighlight(fsEntry, line) {
		this.addHighlightedLine(fsEntry, line, 0);
	}

	addHighlightedLine(fsEntry, line, indexOverride = -1) {
		if (fsEntry.textHeight) {
			const lineCount = fsEntry.lineCount;
			var geo = this.searchHighlights.geometry;
			var index = indexOverride;
			if (indexOverride < 0) {
				index = this.searchHighlights.index;
				this.searchHighlights.index++;
			}

			const lineBottom = fsEntry.textYZero - ((line + 1) / lineCount) * fsEntry.textHeight;
			const lineTop = fsEntry.textYZero - (line / lineCount) * fsEntry.textHeight;
			var c0 = new THREE.Vector3(fsEntry.x, lineBottom, fsEntry.z);
			var c1 = new THREE.Vector3(fsEntry.x + fsEntry.scale * 0.5, lineBottom, fsEntry.z);
			var c2 = new THREE.Vector3(fsEntry.x + fsEntry.scale * 0.5, lineTop, fsEntry.z);
			var c3 = new THREE.Vector3(fsEntry.x, lineTop, fsEntry.z);

			c0.applyMatrix4(this.model.matrixWorld);
			c1.applyMatrix4(this.model.matrixWorld);
			c2.applyMatrix4(this.model.matrixWorld);
			c3.applyMatrix4(this.model.matrixWorld);

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
		var geo = this.searchHighlights.geometry;
		var verts = geo.vertices;
		for (var i = 0; i < verts.length; i++) {
			var v = verts[i];
			v.x = v.y = v.z = 0;
		}
		geo.verticesNeedUpdate = true;
		this.searchHighlights.index = 1;
		this.highlightLater = [];
		this.changed = true;
	}

	highlightResults(results) {
		var ca = this.model.geometry.attributes.color;
		this.highlightedResults.forEach(function(highlighted) {
			Geometry.setColor(
				ca.array,
				highlighted.fsEntry.index,
				Colors[highlighted.fsEntry.entries === null ? 'getFileColor' : 'getDirectoryColor'](
					highlighted.fsEntry
				),
				0
			);
		});
		this.clearSearchHighlights();
		for (var i = 0; i < results.length; i++) {
			var fsEntry = results[i].fsEntry;
			if (fsEntry.entries !== null && results[i].line === 0) {
				Geometry.setColor(
					ca.array,
					fsEntry.index,
					fsEntry.entries === null ? [1, 0, 0] : [0.6, 0, 0],
					0
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
		searchLine.geometry.setAttribute(
			'position',
			new THREE.BufferAttribute(new Float32Array(40000 * 3), 3)
		);

		searchLine.ontick = () => {
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
				vertexColors: true,
			})
		);
		this.lineModel.frustumCulled = false;
		this.lineModel.ontick = () => {
			this.lineModel.visible = this.links.length > 0;
		};
		this.scene.add(this.lineModel);
	}

	addScreenLine(geo, fsEntry, bbox, index, line, lineCount) {
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

		const verts = geo.getAttribute('position').array;
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
		geo.getAttribute('position').needsUpdate = true;
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
		var verts = this.searchLine.geometry.getAttribute('position').array;
		if (needsUpdate && lis.length <= verts.length / 3 / 4) {
			for (var i = 0, l = lis.length; i < l; i++) {
				var li = lis[i];
				this.addScreenLine(
					this.searchLine.geometry,
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
		var verts = this.searchLine.geometry.getAttribute('position').array;
		for (
			var i = this.searchResults.length * 4 * 3;
			i < this.previousSearchResults.length * 4 * 3;
			i++
		) {
			verts[i] = 0;
		}
		this.searchLine.geometry.getAttribute('position').needsUpdate = true;
		this.changed = true;
	}

	// File tree updates ////////////////////////////////////////////////////////////////////////////////

	setFileTree(fileTree) {
		if (this.renderer) {
			return this.showFileTree(fileTree);
		} else {
			return new Promise((resolve, reject) => {
				const tick = () => {
					if (this.renderer) this.showFileTree(fileTree).then(resolve);
					else setTimeout(tick, 10);
				};
				tick();
			});
		}
	}

	async showFileTree(fileTree) {
		if (fileTree.tree === this.fileTree) {
			this.treeUpdateQueue.push(this.updateTree, fileTree.tree);
			return;
		} else {
			this.treeUpdateQueue.clear();
		}
		if (this.model) {
			this.model.parent.remove(this.model);
			this.model.traverse(function(m) {
				if (m.geometry) {
					m.geometry.dispose();
				}
			});
			this.model = null;
		}
		this.fileTree = fileTree.tree;
		this.fileCount = fileTree.count;
		this.model = await this.createFileTreeModel(fileTree.count, fileTree.tree);
		this.model.position.set(0, 0, 0);
		this.camera.position.set(0.5, 0.75, 0.8);
		this.camera.targetPosition.set(0.5, 0.75, 0.8);
		this.scene.add(this.model);
		if (this.navUrl) this.goToURL(this.navUrl);
		this.changed = true;
	}

	updateTree = async (fileTree) => {
		/*
			Traverse tree to find subtrees that are not in a model.
			Append the subtree to this.model geometry.
		*/
		const promises = [];
		utils.traverseFSEntry(
			fileTree,
			(tree, path) => {
				if (tree.index === undefined && tree.parent && !tree.parent.building) {
					// console.log(
					// 	'building tree',
					// 	getFullPath(tree.parent),
					// 	'due to',
					// 	getFullPath(tree),
					// 	tree.parent.scale,
					// 	tree.scale
					// );
					tree.parent.building = true;
					promises.push(tree.parent);
				}
			},
			''
		);
		for (let i = 0; i < promises.length; i++) {
			await this.addFile(promises[i]);
		}
		this.changed = true;
	};

	addFile = async (tree) => {
		if (this.addingFile) {
			console.log('This is bad.');
			debugger;
			return;
		}
		this.addingFile = true;
		await this.yield();
		utils.traverseFSEntry(tree, () => this.model.fileCount++, '');
		const vertexIndices = {
			vertexIndex: this.fileTree.lastVertexIndex,
			textVertexIndex: this.fileTree.lastTextVertexIndex,
		};

		await this.updateFileTreeGeometry(
			this.model.fileCount,
			tree,
			this.fileTree.fsIndex,
			this.model.geometry,
			this.model.textGeometry,
			vertexIndices
		);
		this.model.fileCount = this.meshIndex.size;
		while (tree) {
			tree.lastVertexIndex = vertexIndices.vertexIndex;
			tree.lastTextVertexIndex = vertexIndices.textVertexIndex;
			tree = tree.parent;
		}
		this.changed = true;
		this.addingFile = false;
	};

	reparentTree = async (fileTree, newRoot) => {
		let { x, y, z, scale } = newRoot;
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

		const vertexIndices = {
			vertexIndex: this.fileTree.lastVertexIndex,
			textVertexIndex: this.fileTree.lastTextVertexIndex,
		};
		const size = this.meshIndex.size;
		this.meshIndex.clear();
		this.deletionsIndex.clear();
		await this.updateFileTreeGeometry(
			size,
			fileTree,
			fileTree.fsIndex,
			this.model.geometry,
			this.model.textGeometry,
			vertexIndices,
			true
		);
		this.model.visibleFiles.children.forEach((f) => {
			f.position.copy(f.fsEntry);
			f.scale.set(f.fsEntry.scale, f.fsEntry.scale, f.fsEntry.scale);
		});

		x -= newRoot.x;
		y -= newRoot.y;
		z -= newRoot.z;
		scale /= newRoot.scale;
		this.camera.position.x = ((this.camera.position.x - fx) / fs) * fileTree.scale + fileTree.x;
		this.camera.position.y = ((this.camera.position.y - fy) / fs) * fileTree.scale + fileTree.y;
		this.camera.position.z = ((this.camera.position.z - fz) / fs) * fileTree.scale + fileTree.z;
		this.camera.targetPosition.x =
			((this.camera.targetPosition.x - fx) / fs) * fileTree.scale + fileTree.x;
		this.camera.targetPosition.y =
			((this.camera.targetPosition.y - fy) / fs) * fileTree.scale + fileTree.y;
		this.camera.targetPosition.z =
			((this.camera.targetPosition.z - fz) / fs) * fileTree.scale + fileTree.z;
		this.camera.near = (this.camera.near / fs) * fileTree.scale;
		this.camera.far = (this.camera.far / fs) * fileTree.scale;
		this.camera.updateProjectionMatrix();
		this.camera.updateWorldMatrix(true, true);
		this.changed = true;
	};

	async updateFileTreeGeometry(
		fileCount,
		fileTree,
		fsIndex,
		geo,
		textGeometry,
		vertexIndices,
		rebuild = false
	) {
		let deletionsIndex = new Map();
		if (geo.maxFileCount < fileCount + 1) Geometry.resizeGeometry(geo, 2 * (fileCount + 1));
		if (rebuild || this.deletionsIndex.size > 100) {
			this.rebuildingTree = true;

			deletionsIndex = this.deletionsIndex;
			this.deletionsIndex = new Map();
			geo.fileIndex = 0;

			fileTree = this.fileTree;
			this.meshIndex.clear();

			fsIndex = fileTree.fsIndex = [fileTree];
			fileTree.index = undefined;
			fileTree.vertexIndex = 0;
			fileTree.textVertexIndex = 0;
			vertexIndices.textVertexIndex = 0;
			vertexIndices.vertexIndex = 0;

			textGeometry.vertCount = 0;
		}

		const fileIndex = geo.fileIndex;

		const labels = new THREE.Object3D();
		const thumbnails = new THREE.Object3D();
		geo.fileIndex = await Layout.createFileTreeQuads(
			this.yield,
			fileTree,
			fileIndex,
			geo.getAttribute('position').array,
			geo.getAttribute('color').array,
			labels,
			thumbnails,
			fsIndex,
			this.meshIndex,
			vertexIndices,
			deletionsIndex
		);
		geo.getAttribute('position').needsUpdate = true;
		geo.getAttribute('color').needsUpdate = true;

		let textVertCount = textGeometry.vertCount;
		labels.traverse(function(c) {
			if (c.geometry) {
				textVertCount += c.geometry.attributes.position.array.length;
			}
		});
		if (textVertCount > textGeometry.getAttribute('position').array.length) {
			const positionArray = new Float32Array(textVertCount * 2);
			const uvArray = new Float32Array(textVertCount);
			positionArray.set(textGeometry.getAttribute('position').array);
			uvArray.set(textGeometry.getAttribute('uv').array);
			textGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 4));
			textGeometry.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
		}
		const positionArray = textGeometry.getAttribute('position').array;
		const uvArray = textGeometry.getAttribute('uv').array;
		let j = textGeometry.vertCount;
		labels.traverse(function(c) {
			if (c.geometry) {
				const attributes = c.geometry.attributes;
				const labelPositionArray = attributes.position.array;
				positionArray.set(labelPositionArray, j);
				uvArray.set(attributes.uv.array, j / 2);
				j += labelPositionArray.length;
			}
		});
		textGeometry.vertCount = textVertCount;
		textGeometry.getAttribute('position').needsUpdate = true;
		textGeometry.getAttribute('uv').needsUpdate = true;
		this.rebuildingTree = false;
	}

	async createFileTreeModel(fileCount, fileTree) {
		const geo = Geometry.makeGeometry(2 * (fileCount + 1));
		geo.fileIndex = 0;

		fileTree.fsIndex = [fileTree];
		fileTree.vertexIndex = 0;
		fileTree.textVertexIndex = 0;
		const vertexIndices = {
			textVertexIndex: 0,
			vertexIndex: 0,
		};
		fileTree.x = 0;
		fileTree.y = 0;
		fileTree.z = 0;
		fileTree.scale = 1;

		const textGeometry = await Layout.createText({ text: '', noBounds: true }, this.yield);
		textGeometry.vertCount = 0;

		await this.updateFileTreeGeometry(
			fileCount,
			fileTree,
			fileTree.fsIndex,
			geo,
			textGeometry,
			vertexIndices
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
		mesh.fileTree = fileTree;

		const visibleFiles = new THREE.Object3D();
		visibleFiles.visibleSet = {};

		mesh.add(visibleFiles);
		mesh.add(textMesh);
		mesh.visibleFiles = visibleFiles;
		mesh.textGeometry = textGeometry;
		mesh.fileCount = fileCount + 1;

		mesh.ontick = this.determineVisibility(mesh);

		return mesh;
	}

	determineVisibility(mesh) {
		const { visibleFiles, textGeometry } = mesh;
		const camera = this.camera;
		return (t, dt) => {
			window.debug.textContent =
				this.meshIndex.size +
				' / ' +
				mesh.geometry.maxFileCount +
				' - ' +
				this.deletionsIndex.size;
			// Dispose loaded files that are outside the current view
			for (let i = 0; i < visibleFiles.children.length; i++) {
				const c = visibleFiles.children[i];
				const fsEntry = c.fsEntry;
				const bbox = Geometry.getFSEntryBBox(fsEntry, mesh, camera);
				if (!bbox.onScreen || bbox.width * window.innerWidth < 100) {
					if (fsEntry.contentObject) {
						fsEntry.contentObject.dispose();
						fsEntry.contentObject = undefined;
					}
					const fullPath = getFullPath(fsEntry);
					visibleFiles.visibleSet[fullPath] = false;
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
			const entriesToKeep = [];
			const entriesToFetch = [];
			const entriesToDispose = [];
			while (stack.length > 0) {
				const tree = stack.pop();
				for (let name in tree.entries) {
					const fsEntry = tree.entries[name];
					const bbox = Geometry.getFSEntryBBox(fsEntry, mesh, camera);
					const pxWidth = bbox.width * window.innerWidth * 0.5;
					const isSmallDirectory = fsEntry.entries && pxWidth < 5;
					const isSmallFile = !fsEntry.entries && pxWidth < 150;

					// Skip entries that are outside frustum or too small.
					if (!bbox.onScreen || isSmallDirectory || isSmallFile) {
						if (
							fsEntry.entries &&
							this.meshIndex.has(fsEntry) &&
							!this.deletionsIndex.has(fsEntry)
						) {
							entriesToDispose.push(fsEntry); // Dispose directories that are outside frustum or too small.
						}
						continue;
					}

					// Directory
					if (fsEntry.entries) {
						entriesToKeep.push(fsEntry); // It's visible, so let's keep it in the mesh
						// Descend into directories larger than this.
						if (pxWidth > 15) {
							// Fetch directories that haven't been fetched yet.
							if (!fsEntry.fetched) {
								fsEntry.distanceFromCenter = Geometry.bboxDistanceToFrustumCenter(
									bbox,
									mesh,
									camera
								);
								entriesToFetch.push(fsEntry);
							} else stack.push(fsEntry); // Descend into already-fetched directories.
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
							// console.log(smallestCovering.name);
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
			entriesToDispose.forEach((e) => this.deletionsIndex.set(e, 1));
			entriesToKeep.forEach((e) => {
				if (!this.meshIndex.has(e)) {
					this.meshIndex.set(e, -1);
					this.treeUpdateQueue.push(async (e) => {
						if (!this.meshIndex.has(e) || this.meshIndex.get(e) === -1) {
							this.rebuildingTree = true;
							await this.addFile(e.parent);
						}
					}, e);
				} else {
					this.deletionsIndex.delete(e);
				}
			});
			this.entriesToKeep = entriesToKeep;
			if (entriesToFetch.length > 0) {
				this.treeUpdateQueue.push(async (dirs) => {
					await this.yield();
					await this.requestDirs(
						dirs
							.filter((e) => !e.fetched)
							.sort(this.cmpFSEntryDistanceFromCenter)
							.map(getFullPath),
						[]
					);
				}, entriesToFetch);
			}
			if (
				!this.reparenting &&
				smallestCovering &&
				(smallestCovering.scale < 0.1 || smallestCovering.scale > 10)
			) {
				// if (smallestCovering.name === '') debugger;
				this.reparenting = true;
				// console.log('pre', camera.matrixWorld.elements);
				this.treeUpdateQueue.push(async (e) => {
					console.log('reparenting to', e, getFullPath(e));
					// if (e.name === '') debugger;
					await this.reparentTree(this.fileTree, e);
					// console.log('post', camera.matrixWorld.elements);
					this.reparenting = false;
					this.reparented = true;
				}, smallestCovering);
			}
			if (this.reparented) {
				// console.log('post-reparent', camera.matrixWorld.elements);
			}
			this.reparented = false;
			mesh.geometry.setDrawRange(0, this.fileTree.lastVertexIndex);
			textGeometry.setDrawRange(0, this.fileTree.lastTextVertexIndex);
		};
	}

	cmpFSEntryDistanceFromCenter(a, b) {
		return (
			(b.scale - a.scale) / (b.scale + a.scale) +
			0.1 * (a.distanceFromCenter - b.distanceFromCenter)
		);
	}

	addFileView(visibleFiles, fullPath, fsEntry) {
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

		visibleFiles.visibleSet[fullPath] = true;
		visibleFiles.add(fsEntry.contentObject);
	}

	// Linkage lines ////////////////////////////////////////////////////////////////////////////////

	updateLineBetweenElements(geo, index, color, bboxA, bboxB) {
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

		var verts = geo.getAttribute('position').array;
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
			verts = geo.getAttribute('color').array;
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

	updateLineBetweenEntryAndElement(geo, index, color, model, fsEntry, line, lineCount, bbox) {
		var a = new THREE.Vector3(fsEntry.x, fsEntry.y, fsEntry.z);
		a.applyMatrix4(model.matrixWorld);
		var b = a;

		line = line ? line[0] : 0;

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

		var verts = geo.getAttribute('position').array;
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
			verts = geo.getAttribute('color').array;
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
		geo,
		index,
		color,
		modelA,
		entryA,
		lineA,
		lineCountA,
		modelB,
		entryB,
		lineB,
		lineCountB
	) {
		var a = entryA;
		var b = entryB;

		lineA = lineA ? lineA[0] : 0;
		lineB = lineB ? lineB[0] : 0;

		var av = new THREE.Vector3(a.x, a.y, a.z);
		av.applyMatrix4(modelA.matrixWorld);

		var bv = new THREE.Vector3(b.x, b.y + b.scale, b.z);
		bv.applyMatrix4(modelB.matrixWorld);

		if (lineA > 0 && entryA.textHeight) {
			const textYOff = ((lineA + 0.5) / lineCountA) * entryA.textHeight;
			const textLinePos = new THREE.Vector3(
				entryA.textXZero,
				entryA.textYZero - textYOff,
				entryA.z
			);
			textLinePos.applyMatrix4(modelA.matrixWorld);
			av = textLinePos;
		}
		if (lineB > 0 && entryB.textHeight) {
			const textYOff = ((lineB + 0.5) / lineCountB) * entryB.textHeight;
			const textLinePos = new THREE.Vector3(
				entryB.textXZero,
				entryB.textYZero - textYOff,
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

		var verts = geo.getAttribute('position').array;
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
			verts = geo.getAttribute('color').array;
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

	parseTarget(dst, dstPoint) {
		if (typeof dst === 'string') {
			const { fsEntry, point } = getFSEntryForURL(this.fileTree, dst);
			return { fsEntry, point };
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

	setLinks(links, updateOnlyElements = false) {
		if (this.lineGeo) {
			const geo = this.lineGeo;
			const verts = geo.getAttribute('position').array;

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
					const bboxA = l.src.getBoundingClientRect();
					const bboxB = l.dst.getBoundingClientRect();
					this.updateLineBetweenElements(geo, i * 6, l.color, bboxA, bboxB);
				} else if (srcIsElem) {
					const bbox = l.src.getBoundingClientRect();
					const dst = this.parseTarget(l.dst, l.dstPoint);
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
					const bbox = l.dst.getBoundingClientRect();
					const dst = this.parseTarget(l.src, l.srcPoint);
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
					const src = this.parseTarget(l.src, l.srcPoint);
					const dst = this.parseTarget(l.dst, l.dstPoint);
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
			geo.getAttribute('position').needsUpdate = true;
			geo.getAttribute('color').needsUpdate = true;
			this.changed = true;
		}
	}

	// FSEntry Navigation ////////////////////////////////////////////////////////////////////////////////

	goToFSEntry = (fsEntry, model = this.model) => {
		if (!fsEntry) return;
		const { scene, camera } = this;
		scene.updateMatrixWorld();
		var fsPoint = new THREE.Vector3(
			fsEntry.x + fsEntry.scale * (fsEntry.entries ? 0.5 : 0.25),
			fsEntry.y + fsEntry.scale * (fsEntry.entries ? 0.815 : 0.5),
			fsEntry.z + fsEntry.scale
		);
		fsPoint.applyMatrix4(model.matrixWorld);
		camera.targetPosition.copy(fsPoint);
		camera.near = fsEntry.scale * 0.2;
		camera.far = fsEntry.scale * 100;
		this.changed = true;
	};

	async goToFSEntryCoords(fsEntry, coords, model = this.model) {
		const { scene, camera } = this;
		scene.updateMatrixWorld();
		const res =
			fsEntry.contentObject && (await fsEntry.contentObject.goToCoords(coords, model));
		if (!res) {
			fsEntry.targetLine = { line: coords };
			return this.goToFSEntry(fsEntry, model);
		}
		const { targetPoint, near, far } = res;
		camera.targetPosition.copy(targetPoint);
		camera.near = near;
		camera.far = far;
		this.changed = true;
	}

	async goToFSEntryAtSearch(fsEntry, search, model = this.model) {
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

	registerElementForURL(el, url) {
		this.urlIndex[url] = this.urlIndex[url] || [];
		this.urlIndex[url].push(el);
	}

	async gcURLElements() {
		const deletions = [];
		let i = 0;
		const elFilter = (el) => {
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

	goToURL(url) {
		this.navUrl = url;
		if (!this.fileTree) return;
		const result = getFSEntryForURL(this.fileTree, url);
		if (!result) return;
		const { fsEntry, point, search } = result;
		if (point) this.goToFSEntryCoords(fsEntry, point);
		else if (search) this.goToFSEntryAtSearch(fsEntry, search);
		else this.goToFSEntry(fsEntry);
	}

	getURLForFSEntry(fsEntry, location = []) {
		const locationStr = location.length > 0 ? '#' + location.join(',') : '';
		return getFullPath(fsEntry) + locationStr;
	}

	// UI Methods ////////////////////////////////////////////////////////////////////////////////

	setupEventListeners() {
		const { renderer, camera } = this;

		const self = this;

		var down = false;
		var previousX, previousY, startX, startY;
		var clickDisabled = false;

		var pinchStart, pinchMid;

		var inGesture = false;

		renderer.domElement.addEventListener(
			'touchstart',
			function(ev) {
				document.activeElement.blur();
				ev.preventDefault();
				if (ev.touches.length === 1) {
					renderer.domElement.onmousedown(ev.touches[0]);
				} else if (ev.touches.length === 2) {
					inGesture = true;
					var dx = ev.touches[0].clientX - ev.touches[1].clientX;
					var dy = ev.touches[0].clientY - ev.touches[1].clientY;
					pinchStart = Math.sqrt(dx * dx + dy * dy);
					pinchMid = {
						clientX: ev.touches[1].clientX + dx / 2,
						clientY: ev.touches[1].clientY + dy / 2,
					};
					renderer.domElement.onmousedown(pinchMid);
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
						window.onmousemove(ev.touches[0]);
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
					window.onmousemove(pinchMid);
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
						window.onmouseup(ev.changedTouches[0]);
					} else {
						inGesture = false;
						window.onmouseup(pinchMid);
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
						window.onmouseup(ev.changedTouches[0]);
					} else {
						inGesture = false;
						window.onmouseup(pinchMid);
					}
				} else if (ev.touches.length === 1) {
				}
			},
			false
		);

		window.onkeydown = function(ev) {
			if (!ev.target || ev.target.tagName !== 'INPUT') {
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
							const fsEntry = getPathEntry(self.fileTree, self.breadcrumbPath);
							if (fsEntry) {
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
							const fsEntry = getPathEntry(self.fileTree, self.breadcrumbPath);
							if (fsEntry) {
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
							self.breadcrumbPath.replace(/\/[^/]+$/, '')
						);
						if (fsEntry && fsEntry.title) self.goToFSEntry(fsEntry, self.model);
						break;

					default: // do nothing
				}
				const d = self.getCameraDistanceToModel();
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
			document.activeElement.blur();
			if (ev.preventDefault) ev.preventDefault();
			down = true;
			clickDisabled = false;
			startX = previousX = ev.clientX;
			startY = previousY = ev.clientY;
		};

		window.onmousemove = function(ev) {
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
				const d = self.getCameraDistanceToModel();
				const factor = d / window.innerWidth;
				camera.position.x -= factor * dx;
				camera.position.y += factor * dy;
				camera.targetPosition.copy(camera.position);
			}
		};

		var lastScroll = Date.now();

		var prevD = 0;
		var wheelSnapTimer;
		var wheelFreePan = false;
		renderer.domElement.onwheel = function(ev) {
			ev.preventDefault();

			if (ev.ctrlKey) {
				// zoom on wheel
				var cx = (ev.clientX - window.innerWidth / 2) / window.innerWidth;
				var cy = (ev.clientY - window.innerHeight / 2) / window.innerHeight;
				var d = ev.deltaY !== undefined ? ev.deltaY * 3 : ev.wheelDelta;
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
				self.zoomCamera(Math.pow(1.003, d), cx, cy);
				lastScroll = Date.now();
			} else {
				clearTimeout(wheelSnapTimer);
				wheelSnapTimer = setTimeout(function() {
					wheelFreePan = false;
				}, 1000);

				// pan on wheel
				const d = self.getCameraDistanceToModel();
				const factor = d / window.innerWidth;
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
			var cx = (ev.clientX - window.innerWidth / 2) / window.innerWidth;
			var cy = (ev.clientY - window.innerHeight / 2) / window.innerHeight;
			var d = ev.scale / gestureStartScale;
			gestureStartScale = ev.scale;
			self.zoomCamera(1 / d, cx, cy);
		});
		window.addEventListener('gestureend', function(e) {
			e.preventDefault();
		});

		this.highlighted = null;
		window.onmouseup = function(ev) {
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
	fsEntryCmp(a, b) {
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

	zoomCamera(zf, cx, cy) {
		const camera = this.camera;
		const d = this.getCameraDistanceToModel();
		camera.position.x += cx * d - cx * d * zf;
		camera.position.y -= cy * d - cy * d * zf;
		camera.position.z += -d + d * zf;
		camera.near *= zf;
		camera.far *= zf;
		camera.targetPosition.copy(camera.position);
		camera.updateProjectionMatrix();
		camera.updateWorldMatrix(true, true);
		this.changed = true;
	}

	zoomToEntry(ev) {
		const intersection = this.getEntryAtMouse(ev);
		if (!intersection) debugger;
		if (intersection) {
			var fsEntry = intersection.fsEntry;
			// var ca = intersection.object.geometry.attributes.color;
			// var vs = intersection.object.geometry.attributes.position;
			// var tvs = intersection.object.children[1].geometry.attributes.position;
			if (this.highlighted && this.highlighted.highlight) {
				var obj = this.highlighted.highlight;
				obj.parent.remove(obj);
			}
			if (this.highlighted !== fsEntry) {
				this.highlighted = fsEntry;
				const url = this.getURLForFSEntry(fsEntry);
				this.history.push(url);
			} else {
				if (this.highlighted.entries === null) {
					var fovDiff = (this.highlighted.scale * 50) / this.camera.fov;
					if (fovDiff > 1 || !fsEntry.lineCount) {
						if (
							!fsEntry.lineCount ||
							!this.handleTextClick(ev, this.highlighted, intersection)
						) {
							const url = this.getURLForFSEntry(this.highlighted);
							this.history.push(url);
						}
					} else {
						const url = this.getURLForFSEntry(this.highlighted, [0]);
						this.history.push(url);
					}
				} else {
					const url = this.getURLForFSEntry(this.highlighted);
					this.history.push(url);
				}
			}
			this.changed = true;
		}
	}

	getEntryAtMouse(ev) {
		var models = [this.model];
		if (this.processModel) models.push(this.processModel);
		if (this.authorModel) models.push(this.authorModel);
		return Geometry.findFSEntry(
			{ clientX: ev.clientX, clientY: ev.clientY, target: this.renderer.domElement },
			this.camera,
			models,
			this.highlighted
		);
	}

	getTextPosition(fsEntry, intersection) {
		const fv = new THREE.Vector3(fsEntry.textXZero, fsEntry.textYZero, fsEntry.z);
		const pv = new THREE.Vector3().copy(intersection.point);
		const inv = new THREE.Matrix4().getInverse(intersection.object.matrixWorld);
		pv.applyMatrix4(inv);
		const uv = new THREE.Vector3().subVectors(pv, fv);
		uv.divideScalar(fsEntry.scale * fsEntry.textScale);
		uv.y /= 38;
		uv.x /= 19;

		const line = Math.floor(-uv.y);
		const col = Math.floor(uv.x + 1);
		return { line, col };
	}

	handleTextClick(ev, fsEntry, intersection) {
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
		scene.tick(t, t - this.lastFrameTime);
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
		if (dt < 16 || this.frameLoopPaused) {
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

	yield = () => {
		if (this.frameStart > 0 && performance.now() - this.frameStart > 5) {
			return new Promise((resolve, reject) => {
				const resolver = () => {
					this.changed = true;
					if (performance.now() - this.frameStart > 5) this.frameFibers.push(resolver);
					else resolve();
				};
				this.frameFibers.push(resolver);
			});
		}
		this.changed = true;
	};
}

export default new Tabletree();
