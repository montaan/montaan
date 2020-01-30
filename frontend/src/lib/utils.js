import * as THREE from 'three';
var slash = '/'.charCodeAt(0);

// // Your Client ID can be retrieved from your project in the Google
// // Developer Console, https://console.developers.google.com
// var CLIENT_ID = '671524571878.apps.googleusercontent.com';
// var SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

// /**
// * Check if current user has authorized this application.
// */
// function checkAuth() {
// 	console.log('checkAuth');
// 	gapi.auth.authorize({
// 		'client_id': CLIENT_ID,
// 		'scope': SCOPES.join(' '),
// 		'immediate': true
// 	}, handleAuthResult);
// }

// window.checkAuth = checkAuth;

// /**
// * Handle response from authorization server.
// *
// * @param {Object} authResult Authorization result.
// */
// function handleAuthResult(authResult) {
// 	// console.log(handleAuthResult, authResult);
// 	var authorizeDiv = document.getElementById('authorize-div');
// 	if (authResult && !authResult.error) {
// 		// Hide auth UI, then load client library.
// 		authorizeDiv.style.display = 'none';
// 		loadDriveApi();
// 	} else {
// 		// Show auth UI, allowing the user to initiate authorization by
// 		// clicking authorize button.
// 		authorizeDiv.style.display = 'inline';
// 	}
// }

// /**
// * Initiate auth flow in response to user clicking authorize button.
// *
// * @param {Event} event Button click event.
// */
// function handleAuthClick(event) {
// 	gapi.auth.authorize({client_id: CLIENT_ID, scope: SCOPES, immediate: false}, handleAuthResult);
// 	return false;
// }

// window.handleAuthClick = handleAuthClick;

// /**
// * Load Drive API client library.
// */
// function loadDriveApi() {
// 	window.GDriveCallback = window.GDriveCallback || function(files){
// 		console.log(files);
// 	};
// 	var listFiles = function() {
// 		var request = gapi.client.drive.files.list({
// 			'pageSize': 1000,
// 			'trashed': false,
// 			'spaces': 'drive',
// 			'orderBy': 'name',
// 			'fields': "nextPageToken, files(id, name, parents, mimeType, thumbnailLink, iconLink)"
// 		});

// 		var files = [];
// 		var filesLoaded = function(files) {
// 			if (files && files.length > 0) {
// 				var fileIndex = {};
// 				var fileTree = {name: "/", title: "Drive", entries: {}, index: 0};
// 				var top = {name: "Drive", title: "Drive", entries: {}, index: 0};
// 				fileTree.entries["Drive"] = top;

// 				for (var i = 0; i < files.length; i++) {
// 					var f = files[i];
// 					f.entries = null;
// 					f.title = f.name;
// 					f.name = f.id;
// 					fileIndex[f.id] = f;
// 				}

// 				for (var i = 0; i < files.length; i++) {
// 					var f = files[i];
// 					if (f.parents) {
// 						for (var j=0; j<f.parents.length; j++) {
// 							var p = fileIndex[f.parents[j]];
// 							if (!p) {
// 								p = top;
// 							}
// 							if (!p.entries) {
// 								p.entries = {};
// 							}
// 							p.entries[f.name] = f;
// 						}
// 					} else {
// 						top.entries[f.name] = f;
// 					}
// 				}
// 			}
// 			window.GDriveCallback({tree: fileTree, count: files.length});
// 		};
// 		var tick = function(resp) {
// 			files = files.concat(resp.files || []);
// 			var nextPageToken = resp.nextPageToken;
// 			if (nextPageToken && files.length < 10000) {
// 				var request = gapi.client.drive.files.list({
// 					'pageSize': 1000,
// 					'trashed': false,
// 					'pageToken': nextPageToken,
// 					'orderBy': 'name',
// 					'fields': "nextPageToken, files(id, name, parents, mimeType, thumbnailLink, iconLink)"
// 				});
// 				request.execute(tick);
// 				console.log(files.length);
// 			} else {
// 				filesLoaded(files);
// 			}
// 		}
// 		request.execute(tick);
// 	}

// 	gapi.client.load('drive', 'v3', listFiles);

// }

var utils = {
	uniq: function(array, cmp) {
		return array.sort(cmp).reduce(function(s, a) {
			if (s.length === 0 || cmp(s[s.length - 1], a) !== 0) s.push(a);
			return s;
		}, []);
	},

	findIntersectionsUnderEvent: function(ev, camera, objects) {
		var style = getComputedStyle(ev.target);
		var elementTransform = style.getPropertyValue('transform');
		var elementTransformOrigin = style.getPropertyValue('transform-origin');

		var xyz = elementTransformOrigin.replace(/px/g, '').split(' ');
		xyz[0] = parseFloat(xyz[0]);
		xyz[1] = parseFloat(xyz[1]);
		xyz[2] = parseFloat(xyz[2] || 0);

		var mat = new THREE.Matrix4();
		mat.identity();
		if (/^matrix\(/.test(elementTransform)) {
			var elems = elementTransform.replace(/^matrix\(|\)$/g, '').split(' ');
			mat.elements[0] = parseFloat(elems[0]);
			mat.elements[1] = parseFloat(elems[1]);
			mat.elements[4] = parseFloat(elems[2]);
			mat.elements[5] = parseFloat(elems[3]);
			mat.elements[12] = parseFloat(elems[4]);
			mat.elements[13] = parseFloat(elems[5]);
		} else if (/^matrix3d\(/i.test(elementTransform)) {
			elems = elementTransform.replace(/^matrix3d\(|\)$/gi, '').split(' ');
			for (var i = 0; i < 16; i++) {
				mat.elements[i] = parseFloat(elems[i]);
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

	findObjectUnderEvent: function(ev, camera, objects) {
		var intersects = this.findIntersectionsUnderEvent(ev, camera, objects);
		if (intersects.length > 0) {
			var obj = intersects[0].object;
			return obj;
		}
	},

	addFileTreeEntry: function(path, tree) {
		var dir = false;
		if (path.charCodeAt(path.length - 1) === slash) {
			dir = true;
		}
		var segments = path.split('/');
		if (dir) {
			segments.pop();
		}
		var branch = tree;
		var addCount = 0;
		for (var i = 0; i < segments.length - 1; i++) {
			var segment = segments[i];
			if (branch.entries === null) {
				branch.entries = {};
			}
			if (typeof branch.entries[segment] !== 'object') {
				branch.entries[segment] = { name: segment, title: segment, entries: {}, index: 0 };
				addCount++;
			}
			branch = branch.entries[segment];
		}
		if (branch.entries === null) {
			branch.entries = {};
		}
		if (typeof branch.entries[segments[i]] !== 'object') {
			branch.entries[segments[i]] = {
				name: segments[i],
				title: segments[i],
				entries: dir ? {} : null,
				index: 0,
			};
			addCount++;
		}
		return addCount;
	},

	traverseTree: function(tree, callback) {
		var entry = tree.tree;
		this.traverseFSEntry(entry, callback, '');
	},

	traverseFSEntry: function(fsEntry, callback, fullPath) {
		var path = fullPath + fsEntry.name;
		callback(fsEntry, path);
		if (fsEntry.entries) {
			var dirName = path + '/';
			for (var i in fsEntry.entries) {
				this.traverseFSEntry(fsEntry.entries[i], callback, dirName);
			}
		}
	},

	convertXMLToTree: function(node, uid) {
		var obj = { name: uid.value++, title: node.tagName || 'document', index: 0, entries: {} };
		var files = [];
		if (node.attributes) {
			for (let i = 0; i < node.attributes.length; i++) {
				var attr = node.attributes[i];
				files.push({
					name: uid.value++,
					title: attr.name + '=' + attr.value,
					index: 0,
					entries: null,
				});
			}
		}
		var file;
		for (let i = 0, l = node.childNodes.length; i < l; i++) {
			var c = node.childNodes[i];
			if (c.tagName) {
				file = this.convertXMLToTree(c, uid);
				obj.entries[file.name] = file;
			} else {
				if (c.textContent && /\S/.test(c.textContent)) {
					files.push({
						name: uid.value++,
						title: c.textContent,
						index: 0,
						entries: null,
					});
				}
			}
		}
		for (let i = 0; i < files.length; i++) {
			file = files[i];
			obj.entries[file.name] = file;
		}
		return obj;
	},

	convertBookmarksToTree: function(node, uid) {
		if (node.tagName === 'A') {
			// Bookmark
			return {
				name: uid.value++,
				title: node.textContent,
				index: 0,
				entries: null,
				href: node.href,
			};
		} else if (node.tagName === 'DL') {
			// List of bookmarks
			var titleEl = node.parentNode.querySelector('H1,H2,H3,H4,H5,H6');
			var title = '';
			if (titleEl) {
				title = titleEl.textContent;
			}
			var obj = { name: uid.value++, title: title, index: 0, entries: {} };
			var file;
			var files = [];
			for (let i = 0, l = node.childNodes.length; i < l; i++) {
				var c = node.childNodes[i];
				file = this.convertBookmarksToTree(c, uid);
				if (file) {
					if (file.entries) {
						obj.entries[file.name] = file;
					} else {
						files.push(file);
					}
				}
			}
			for (let i = 0; i < files.length; i++) {
				file = files[i];
				obj.entries[file.name] = file;
			}
			return obj;
		} else {
			for (let i = 0, l = node.childNodes.length; i < l; i++) {
				file = this.convertBookmarksToTree(node.childNodes[i], uid);
				if (file) {
					return file;
				}
			}
		}
	},

	parseFileList: function(fileString, xhr, includePrefix, prefix) {
		var xml = xhr && xhr.responseXML;
		if (!xml) {
			var parser = new DOMParser();
			var type = undefined;
			if (/^\s*<!DOCTYPE /i.test(fileString)) {
				type = 'text/html';
			} else if (/^\s*<\?xml /.test(fileString)) {
				type = 'application/xml';
			} else if (/^\s*<html/i.test(fileString)) {
				type = 'text/html';
			}
			if (type) {
				xml = parser.parseFromString(fileString, type);
				if (xml.querySelector('parsererror')) {
					xml = undefined;
				}
			}
		}

		if (xml) {
			// This is some XML here.
			if (/^\s*<!DOCTYPE NETSCAPE-Bookmark-file-1>/.test(fileString)) {
				// Bookmarks! Let's parse them!
				let uid = { value: 0 };
				let tree = this.convertBookmarksToTree(xml, uid);
				return {
					tree: { name: -1, title: '', index: 0, entries: { Bookmarks: tree } },
					count: uid.value + 1,
				};
			} else {
				// XML visualization is go.
				let uid = { value: 0 };
				window.xml = xml;
				let tree = this.convertXMLToTree(xml, uid);
				return {
					tree: { name: -1, title: '', index: 0, entries: { XML: tree } },
					count: uid.value + 1,
				};
			}
		} else {
			try {
				var list = JSON.parse(fileString);
				// Hey it's JSON, let's check for GitHub API & Google Drive API & Dropbox API formats.
				if (list && list.sha && list.url && /\/git\//.test(list.url) && list.tree) {
					return this.parseGitHubTree(list);
				} else if (list && list instanceof Array) {
					if (
						list.every(function(it) {
							return typeof it === 'string';
						})
					) {
						fileString = list.join('\n') + '\n';
					}
				}
			} catch (e) {
				// Not JSON.
			}
		}
		return this.parseFileList_(fileString, includePrefix, prefix);
	},

	parseFileList_: function(fileString, includePrefix, prefix = '') {
		// console.log("Parsing file string", fileString.length);
		var sep = fileString.substring(0, 4096).includes('\0') ? 0 : 10;
		// eslint-disable-next-line
		var gitStyle = /^\d{6} (blob|tree) [a-f0-9]{40}\t[^\u0000]+\u0000/.test(fileString);
		var fileTree = { name: '', title: '', entries: {}, index: 0 };
		var name = '';
		var startIndex = 0;
		var fileCount = 0;
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
					if (gitStyle && fileString.charCodeAt(startIndex+7) === 116 /* t */) name += '/';
					// console.log(name);
				}
				startIndex = i + 1;
				fileCount += utils.addFileTreeEntry(name, fileTree);
			}
		}
		// console.log("Parsed files", fileCount);
		return { tree: fileTree, count: fileCount };
	},

	parseGitHubTree: function(githubResult) {
		var repoName = githubResult.url.match(
			/^https:\/\/api\.github\.com\/repos\/([^/]+)\/([^/]+)/
		);
		var userName = '';
		if (repoName) {
			userName = repoName[1];
			repoName = repoName[1] + '/' + repoName[2];
		} else {
			return this.parseFileList_('');
		}
		var paths = githubResult.tree.map(function(file) {
			return '/' + repoName + '/' + file.path + (file.type === 'tree' ? '/' : '');
		});
		return this.parseFileList_(
			'/' + userName + '/\n/' + repoName + '/\n' + paths.join('\n') + '\n'
		);
	},

	loadFromText: function(text, onSuccess, onError, prefix) {
		try {
			onSuccess(this.parseFileList(text, {}, undefined, prefix), text);
		} catch (e) {
			if (onError) onError(e);
		}
	},

	loadFiles: function(url, onSuccess, onError, prefix) {
		var utils = this;
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url);
		xhr.onload = function(ev) {
			onSuccess(
				utils.parseFileList(ev.target.responseText, ev.target, undefined, prefix),
				ev.target.responseText
			);
		};
		xhr.onerror = onError;
		xhr.send();
	},
};

export default utils;
