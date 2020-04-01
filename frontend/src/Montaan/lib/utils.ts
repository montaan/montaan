import * as THREE from 'three';
import { FSEntry, createFSTree } from './filesystem';
import { FileTree } from '../MainApp';
var slash = '/'.charCodeAt(0);

var utils = {
	uniq: function(array: any[], cmp: (a: any, b: any) => number) {
		return array.sort(cmp).reduce(function(s, a) {
			if (s.length === 0 || cmp(s[s.length - 1], a) !== 0) s.push(a);
			return s;
		}, []);
	},

	findIntersectionsUnderEvent: function(
		ev: { clientX: number; clientY: number; target: HTMLElement },
		camera: THREE.Camera,
		objects: THREE.Object3D[]
	) {
		var style = getComputedStyle(ev.target);
		var elementTransform = style.getPropertyValue('transform');
		var elementTransformOrigin = style.getPropertyValue('transform-origin');

		var xyz = elementTransformOrigin
			.replace(/px/g, '')
			.split(' ')
			.map(parseFloat);
		xyz[2] = xyz[2] || 0;

		var mat = new THREE.Matrix4();
		mat.identity();
		if (/^matrix\(/.test(elementTransform)) {
			const elements = elementTransform.replace(/^matrix\(|\)$/g, '').split(' ');
			mat.elements[0] = parseFloat(elements[0]);
			mat.elements[1] = parseFloat(elements[1]);
			mat.elements[4] = parseFloat(elements[2]);
			mat.elements[5] = parseFloat(elements[3]);
			mat.elements[12] = parseFloat(elements[4]);
			mat.elements[13] = parseFloat(elements[5]);
		} else if (/^matrix3d\(/i.test(elementTransform)) {
			const elements = elementTransform.replace(/^matrix3d\(|\)$/gi, '').split(' ');
			for (var i = 0; i < 16; i++) {
				mat.elements[i] = parseFloat(elements[i]);
			}
		}

		var mat2 = new THREE.Matrix4();
		mat2.makeTranslation(xyz[0], xyz[1], xyz[2]);
		mat2.multiply(mat);
		mat.makeTranslation(-xyz[0], -xyz[1], -xyz[2]);
		mat2.multiply(mat);

		var bbox = ev.target.getBoundingClientRect();
		var vec = new THREE.Vector3(ev.clientX - bbox.left, ev.clientY - bbox.top, 0);
		vec.applyMatrix4(mat2);

		var width = parseFloat(style.getPropertyValue('width'));
		var height = parseFloat(style.getPropertyValue('height'));

		var mouse3D = new THREE.Vector3((vec.x / width) * 2 - 1, -(vec.y / height) * 2 + 1, 0.5);
		mouse3D.unproject(camera);
		mouse3D.sub(camera.position);
		mouse3D.normalize();
		var raycaster = new THREE.Raycaster(camera.position, mouse3D);
		var intersects = raycaster.intersectObjects(objects);
		return intersects;
	},

	findObjectUnderEvent: function(
		ev: { clientX: number; clientY: number; target: HTMLElement },
		camera: THREE.Camera,
		objects: THREE.Object3D[]
	) {
		var intersects = this.findIntersectionsUnderEvent(ev, camera, objects);
		if (intersects.length > 0) {
			var obj = intersects[0].object;
			return obj;
		}
	},

	addFileTreeEntry: function(
		path: string,
		tree: FSEntry,
		mode: any,
		type: any,
		hash: any,
		size: string
	) {
		var dir = false;
		if (path.charCodeAt(path.length - 1) === slash) {
			dir = true;
		}
		var segments = path.split('/');
		if (dir) {
			segments.pop();
		}
		var branch: FSEntry = tree;
		var addCount = 0;
		for (var i = 0; i < segments.length - 1; i++) {
			var segment = segments[i];
			if (branch.entries === undefined) {
				branch.entries = new Map<string, FSEntry>();
			}
			if (!branch.entries.has(segment)) {
				branch.entries.set(segment, {
					...createFSTree(segment, ''),
					name: segment,
					title: segment,
					entries: new Map<string, FSEntry>(),
					index: undefined,
					size: 0,
				});
				addCount++;
			}
			branch = branch.entries.get(segment)!; // We set entries#segment to a value above.
		}
		if (branch.entries === undefined) {
			branch.entries = new Map<string, FSEntry>();
		}
		if (!branch.entries.has(segments[i])) {
			branch.size++;
			branch.entries.set(segments[i], {
				...createFSTree(segments[i], ''),
				name: segments[i],
				title: segments[i],
				entries: dir ? new Map<string, FSEntry>() : undefined,
				index: undefined,
				parent: branch,
			});
			addCount++;
		}
		branch = branch.entries.get(segments[i])!; // We set entries#segment to a value above.
		branch.mode = mode;
		branch.type = type;
		branch.hash = hash;
		branch.size = parseInt(size);
		if (isNaN(branch.size)) branch.size = 0;
		return addCount;
	},

	traverseTree: function(tree: FileTree, callback: (fsEntry: FSEntry, path: string) => void) {
		var entry = tree.tree;
		this.traverseFSEntry(entry, callback, '');
	},

	traverseFSEntry: function(
		fsEntry: FSEntry,
		callback: (fsEntry: FSEntry, path: string) => void,
		fullPath: string
	) {
		var path = fullPath;
		callback(fsEntry, path);
		if (fsEntry.entries) {
			var dirName = path + '/';
			for (let name of fsEntry.entries.keys()) {
				this.traverseFSEntry(fsEntry.entries.get(name)!, callback, dirName + name);
			}
		}
	},

	parseFileList: function(
		fileString: string,
		xhr: any,
		includePrefix: any,
		prefix: string | undefined
	) {
		return this.parseFileList_(fileString, includePrefix, prefix);
	},

	parseFileList_: function(
		fileString: string | ArrayBuffer,
		includePrefix: boolean,
		prefix = '',
		targetTree?: FileTree
	) {
		if (fileString instanceof ArrayBuffer) {
			return this.parseFileListAB_(
				fileString as ArrayBuffer,
				includePrefix,
				prefix,
				targetTree
			);
		}
		// console.log("Parsing file string", fileString.length);
		var sep = fileString.substring(0, 4096).includes('\0') ? 0 : 10;
		// eslint-disable-next-line
		var gitStyle = /^\d{6} (blob|tree) [a-f0-9]{40}\t[^\u0000]+\u0000/.test(fileString);
		var fileTree, fileCount;
		if (!targetTree) {
			fileTree = createFSTree('', '');
			fileCount = 0;
		} else {
			fileTree = targetTree.tree;
			fileCount = targetTree.count;
		}
		var name = '';
		var startIndex = 0;
		var first = includePrefix ? false : true;
		var skip = gitStyle ? 53 : 0;
		// console.log('prefix:', prefix);
		for (var i = 0; i < fileString.length; i++) {
			if (fileString.charCodeAt(i) === sep) {
				if (first) {
					var segs = fileString.substring(startIndex + 1 + skip, i).split('/');
					name = segs[segs.length - 2] + '/';
					skip = i - name.length + 1;
					name = prefix;
					first = false;
				} else {
					name = prefix + fileString.substring(startIndex + skip, i);
					if (gitStyle && fileString.charCodeAt(startIndex + 7) === 116 /* t */)
						name += '/';
					// console.log(name);
				}
				startIndex = i + 1;
				fileCount += utils.addFileTreeEntry(name, fileTree, '', '', '', '0');
			}
		}
		// console.log("Parsed files", fileCount);
		return { tree: fileTree, count: fileCount };
	},

	parseFileListAB_: function(
		buffer: ArrayBuffer,
		includePrefix: boolean,
		prefix = '',
		targetTree?: FileTree
	) {
		const sep = 0;
		// eslint-disable-next-line
		var fileTree, fileCount;
		if (!targetTree) {
			fileTree = createFSTree('', '');
			fileCount = 0;
		} else {
			fileTree = targetTree.tree;
			fileCount = targetTree.count;
		}
		var name = '';
		var startIndex = 0;
		var skip = 0;
		var first = includePrefix ? false : true;
		const u8 = new Uint8Array(buffer);
		// console.log('prefix:', prefix);
		let mode, type, hash, length;
		const td = new TextDecoder();
		for (let i = 0; i < u8.length; i++) {
			if (u8[i] === sep) {
				if (first) {
					const tabIndex = u8.indexOf(9, startIndex + 48);
					const segs = td.decode(u8.slice(tabIndex + 1, i)).split('/');
					[mode, type, hash, length] = td
						.decode(u8.slice(startIndex, tabIndex))
						.split(/\s+/);
					name = segs[segs.length - 2] + '/';
					skip = i - name.length + 1;
					name = prefix;
					first = false;
				} else {
					const tabIndex = u8.indexOf(9, startIndex + 48);
					// console.log(td.decode(u8.slice(startIndex, i)));
					const fn = td.decode(u8.slice(tabIndex + 1 + skip, i));
					[mode, type, hash, length] = td
						.decode(u8.slice(startIndex, tabIndex))
						.split(/\s+/);
					name = prefix + fn;
					if (u8[startIndex + 7] === 116 /* t */ || u8[startIndex + 7] === 99 /* c */)
						name += '/';
				}
				startIndex = i + 1;
				fileCount += utils.addFileTreeEntry(name, fileTree, mode, type, hash, length);
			}
		}
		// console.log("Parsed files", fileCount);
		return { tree: fileTree, count: fileCount };
	},

	parseGitHubTree: function(githubResult: { url: string; tree: any[] }) {
		var repoMatch = githubResult.url.match(
			/^https:\/\/api\.github\.com\/repos\/([^/]+)\/([^/]+)/
		);
		var userName = '';
		var repoName = '';
		if (repoMatch) {
			userName = repoMatch[1];
			repoName = repoMatch[1] + '/' + repoMatch[2];
		} else {
			return createFSTree('', '');
		}
		var paths = githubResult.tree.map(function(file: { path: string; type: string }) {
			return '/' + repoName + '/' + file.path + (file.type === 'tree' ? '/' : '');
		});
		return this.parseFileList_(
			'/' + userName + '/\n/' + repoName + '/\n' + paths.join('\n') + '\n',
			false
		);
	},
};

export default utils;
