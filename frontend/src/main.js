if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}

var repoPrefix = '/Microsoft/vscode';
var repo = repoPrefix.split("/").pop();
var MAX_COMMITS = 100;


global.THREE = require('three');
var utils = require('./utils.js');
var Geometry = require('./Geometry.js');
var Colors = require('./Colors.js');
var Layout = require('./Layout.js');
var createText = require('../three-bmfont-text-modified');
var SDFShader = require('../three-bmfont-text-modified/shaders/sdf');
var loadFont = require('load-bmfont');
var lunr = require('./lunr.js');

window.lunr = lunr;

var loadFontImage = function (opt, cb) {
  loadFont(opt.font, function (err, font) {
    if (err) throw err
    new THREE.TextureLoader().load(opt.image, function (tex) {
      cb(font, tex)
    })
  })
};

// load up a 'fnt' and texture
loadFontImage({
  font: 'fnt/DejaVu-sdf.fnt',
  image: 'fnt/DejaVu-sdf.png'
}, start)

function start(font, fontTexture) {

	Layout.font = font;

	var getPathEntry = function(fileTree, path) {
		path = path.replace(/\/+$/, '');
		var segments = path.split("/");
		while (segments[0] === "") {
			segments.shift();
		}
		var branch = fileTree;
		var parent;
		for (var i=0; i<segments.length; i++) {
			var segment = segments[i];
			branch = branch.entries[segment];
			if (!branch) {
				return null;
			}
		}
		return branch;
	};

	var getSiblings = function(fileTree, path) {
		path = path.replace(/\/[^\/]+\/*$/, '');
		var fsEntry = getPathEntry(fileTree, path);
		return Object.keys(fsEntry.entries).map(n => path +'/'+ n);
	};

	var makeTextMaterial = function(palette) {
		if (!palette || palette.length < 8) {
			palette = [].concat(palette || []);
			while (palette.length < 8) {
				palette.push(palette[palette.length-1] || new THREE.Vector3(1,1,1));
			}
		}
		return new THREE.RawShaderMaterial(SDFShader({
			map: fontTexture,
			side: THREE.DoubleSide,
			transparent: true,
			color: 0xffffff,
			palette: palette,
			polygonOffset: true,
			polygonOffsetFactor: -0.5,
			polygonOffsetUnits: 0.5,
			depthTest: false,
			depthWrite: false
		}));
	};

	var textMaterial = makeTextMaterial();

	var minScale = 1000, maxScale = 0;
	var textTick = function(t,dt) {
		var m = this.children[0];
		// console.log(m.scale.x);
		var visCount = 0;
		if (this.isFirst) {
			minScale = 1000, maxScale = 0;
		}
		if (minScale > m.scale.x) minScale = m.scale.x;
		if (maxScale < m.scale.x) maxScale = m.scale.x;
		if (camera.projectionMatrix.elements[0]*m.scale.x < 0.00025) {
			if (this.visible) {
				this.visible = false;
				// this.traverse(function(c) { c.visible = false; });
			}
		} else {
			// if (!this.visible && visCount === 0) {
			// 	// debugger;
			// }
			this.visible = true;
			// m.visible = true;
			visCount++;
			for (var i=0; i<this.children.length; i++) {
				visCount += (this.children[i].tick(t, dt) || 0);
			}
		}
		if (this.isFirst) {
			// window.debug.innerHTML = [camera.projectionMatrix.elements[0], m.scale.x*100, visCount, minScale, maxScale].join(" : ");
		}
		return visCount;
	};


	var countChars = function(s,charCode) { var j = 0;
		for (var i=0; i<s.length; i++) {
			if (s.charCodeAt(i) === charCode) j++;
		}
		return j;
	};

	var createFileTreeModel = function(fileCount, fileTree) {
		var geo = Geometry.makeGeometry(fileCount+1);

		var fileIndex = 0;

		fileTree.fsIndex = [fileTree];

		var labels = new THREE.Object3D();
		var thumbnails = new THREE.Object3D();
		Layout.createFileTreeQuads(fileTree, fileIndex, geo.attributes.position.array, geo.attributes.color.array, 0, 0, 0, 1, 0, labels, thumbnails, fileTree.fsIndex);

		var bigGeo = createText({text:'', font: font});
		var vertCount = 0;
		labels.traverse(function(c) {
			if (c.geometry) {
				vertCount += c.geometry.attributes.position.array.length;
			}
		});
		var parr = bigGeo.attributes.position.array = new Float32Array(vertCount);
		var uarr = bigGeo.attributes.uv.array = new Float32Array(vertCount/2);
		var j = 0;
		labels.traverse(function(c) {
			if (c.geometry) {
				parr.set(c.geometry.attributes.position.array, j);
				uarr.set(c.geometry.attributes.uv.array, j/2);
				j += c.geometry.attributes.position.array.length;
			}
		});

		var bigMesh = new THREE.Mesh(bigGeo, textMaterial);

		var mesh = new THREE.Mesh(
			geo,
			new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: THREE.VertexColors })
		);
		var visibleFiles = new THREE.Object3D();
		window.VF = visibleFiles;
		mesh.add(visibleFiles);
		visibleFiles.visibleSet = {};

		mesh.ontick = function(t,dt) {
			for (var i=0; i<visibleFiles.children.length; i++) {
				var c = visibleFiles.children[i];
				var fsEntry = c.fsEntry;
				if (!Geometry.quadInsideFrustum(fsEntry.index, this, camera) || fsEntry.scale * 50 / Math.max(camera.fov, camera.targetFOV) < 0.3) {
					if (!c.geometry.layout) {
						if (c.material && c.material.map) {
							c.material.map.dispose();
						}
					// } else if (c.material) {
					// 	c.material.dispose();
					}
					if (c.geometry) {
						c.geometry.dispose();
					}
					var fullPath = getFullPath(fsEntry);
					visibleFiles.visibleSet[fullPath] = false;
					visibleFiles.remove(c);
					i--;
				}
			}
			var stack = [this.fileTree];
			var zoomedInPath = "";
			var navigationTarget = "";
			var smallestCovering = this.fileTree;
			while (stack.length > 0) {
				var obj = stack.pop();
				for (var name in obj.entries) {
					var o = obj.entries[name];
					var idx = o.index;
					if (!Geometry.quadInsideFrustum(idx, this, camera)) {
					} else if (o.scale * 50 / Math.max(camera.fov, camera.targetFOV) > 0.3) {
						if (Geometry.quadCoversFrustum(idx, this, camera)) {
							zoomedInPath += '/' + o.name;
							navigationTarget += '/' + o.name;
							smallestCovering = o;
						} else if (o.scale * 50 / Math.max(camera.fov, camera.targetFOV) > 0.9 && Geometry.quadAtFrustumCenter(idx, this, camera)) {
							navigationTarget += '/' + o.name;
						}
						if (o.entries === null) {
							var fullPath = getFullPath(o);
							if (visibleFiles.children.length < 20 && !visibleFiles.visibleSet[fullPath]) {
								if (Colors.imageRE.test(fullPath)) {
									var obj3 = new THREE.Mesh();
									obj3.visible = false;
									obj3.fsEntry = o;
									visibleFiles.visibleSet[fullPath] = true;
									visibleFiles.add(obj3);
									obj3.geometry = new THREE.PlaneBufferGeometry(1,1);
									obj3.scale.multiplyScalar(o.scale);
									obj3.position.set(o.x+o.scale*0.5, o.y+o.scale*0.5, o.z);
									obj3.visible = false;
									window.imageObj = obj3;
									var img = new Image();
									img.src = fullPath;
									img.obj = obj3;
									img.onload = function() {
										if (this.obj.parent) {
											var canvas = document.createElement('canvas');
											var maxD = Math.max(this.width, this.height);
											this.obj.scale.x *= this.width/maxD;
											this.obj.scale.y *= this.height/maxD;
											this.obj.material = new THREE.MeshBasicMaterial({
												map: new THREE.Texture(this),
												depthTest: false,
												depthWrite: false
											});
											this.obj.material.map.needsUpdate = true;
											this.obj.visible = true;
										}
									};
								} else {
									var obj3 = new THREE.Mesh();
									obj3.visible = false;
									obj3.fsEntry = o;
									visibleFiles.visibleSet[fullPath] = true;
									visibleFiles.add(obj3);
									var xhr = new XMLHttpRequest();
									xhr.open('GET', fullPath, true);
									xhr.obj = obj3;
									xhr.fsEntry = o;
									xhr.onload = function() {
										if (this.responseText.length < 2e5 && this.obj.parent) {
											var contents = this.responseText;

											var self = this;
											prettyPrintWorker.prettyPrint(contents, this.fsEntry.name, function(result) {
												if (result.language) {
													console.time('prettyPrint collectNodeStyles ' + currentFrame);
													var doc = document.createElement('pre');
													doc.className = 'hljs ' + result.language;
													doc.style.display = 'none';
													doc.innerHTML = result.value;
													document.body.appendChild(doc);
													var paletteIndex = {};
													var palette = [];
													var txt = [];
													var collectNodeStyles = function(doc, txt, palette, paletteIndex) {
														var style = getComputedStyle(doc);
														var color = style.color;
														if (!paletteIndex[color]) {
															paletteIndex[color] = palette.length;
															var c = new THREE.Color(color);
															palette.push(new THREE.Vector3(c.r, c.g, c.b));
														}
														var color = paletteIndex[color];
														var bold = style.fontWeight !== 'normal';
														var italic = style.fontStyle === 'italic';
														var underline = style.textDecoration === 'underline';
														for (var i=0; i<doc.childNodes.length; i++) {
															var cc = doc.childNodes[i];
															if (cc.tagName) {
																collectNodeStyles(cc, txt, palette, paletteIndex);
															} else {
																txt.push({
																	color: color,
																	bold: bold,
																	italic: italic,
																	underline: underline,
																	text: cc.textContent
																});
															}
														}
													};
													collectNodeStyles(doc, txt, palette, paletteIndex);
													document.body.removeChild(doc);
													console.timeEnd('prettyPrint collectNodeStyles ' + currentFrame);
												}


												var text = self.obj;
												text.visible = true;
												console.time('createText ' + currentFrame);
												text.geometry = createText({font: Layout.font, text: contents, mode: 'pre'});
												console.timeEnd('createText ' + currentFrame);
												console.time('tweakText ' + currentFrame);
												if (result.language) {
													var verts = text.geometry.attributes.position.array;
													for (var i=0, off=3; i<txt.length; i++) {
														var t = txt[i];
														for (var j=0; j<t.text.length; j++) {
															var c = t.text.charCodeAt(j);
															if (c === 10 || c === 32 || c === 9 || c === 13) continue;
															for (var k=0; k<6; k++) {
																if (t.italic) {
																	verts[off-3] += ((k <= 3 && k !== 0) ? -1 : 1) * 2.5;
																}
																verts[off] = t.color + 256 * t.bold;
																off += 4;
															}
														}
													}
													text.material = makeTextMaterial(palette);
												} else {
													text.material = makeTextMaterial(palette);
												}
												text.material.uniforms.opacity.value = 0;
												text.ontick = function(t, dt) {
													if (this.material.uniforms.opacity.value === 1) return;
													this.material.uniforms.opacity.value += (dt/1000) / 0.5;
													if (this.material.uniforms.opacity.value > 1) {
														this.material.uniforms.opacity.value = 1;
													}
													changed = true;
												};

												var textScale = 1 / Math.max(text.geometry.layout.width+60, (text.geometry.layout.height+30)/0.75);
												var scale = self.fsEntry.scale * textScale;
												var vAspect = Math.min(1, ((text.geometry.layout.height+30)/0.75) / (text.geometry.layout.width+60));
												text.material.depthTest = false;
												text.scale.multiplyScalar(scale);
												text.scale.y *= -1;
												text.position.copy(self.fsEntry);
												text.fsEntry = self.fsEntry;
												text.position.x += self.fsEntry.scale * textScale * 30;
												text.position.y -= self.fsEntry.scale * textScale * 7.5;
												text.position.y += self.fsEntry.scale * 0.25;
												
												self.fsEntry.textScale = textScale;
												self.fsEntry.textXZero = text.position.x;
												self.fsEntry.textX = text.position.x + scale * Math.min(40 * 30 + 60, text.geometry.layout.width + 60) * 0.5;
												self.fsEntry.textYZero = text.position.y + self.fsEntry.scale * 0.75;
												self.fsEntry.textY = text.position.y + self.fsEntry.scale * 0.75 - scale * 900;
												self.fsEntry.textHeight = scale * text.geometry.layout.height;

												text.position.y += self.fsEntry.scale * 0.75 * (1-vAspect);

												if (self.fsEntry.targetLine) {
													const {line, lineCount} = self.fsEntry.targetLine;
													self.fsEntry.targetLine = null;
													goToFSEntryTextAtLine(self.fsEntry, model, line, lineCount);
												}

												console.timeEnd('tweakText ' + currentFrame);
											});
										}
									};
									xhr.send();
								}
							}
						} else {
							stack.push(o);
						}
					}
				}
			}
			updateBreadCrumb(navigationTarget);
			this.geometry.setDrawRange(smallestCovering.vertexIndex, smallestCovering.lastVertexIndex-smallestCovering.vertexIndex);
			bigGeo.setDrawRange(smallestCovering.textVertexIndex, smallestCovering.lastTextVertexIndex - smallestCovering.textVertexIndex);
		};
		mesh.fileTree = fileTree;
		mesh.material.side = THREE.DoubleSide;
		mesh.add(bigMesh);
		mesh.add(thumbnails);
		// mesh.castShadow = true;
		// mesh.receiveShadow = true;
		return mesh;
	};

	var updateBreadCrumb = function(path) {
		var el = document.getElementById('breadcrumb');
		while (el.firstChild) el.removeChild(el.firstChild);
		var segs = path.split("/");
		for (var i = 1; i < segs.length; i++) {
			var prefix = segs.slice(0,i+1).join("/");
			var name = segs[i];
			var sep = document.createElement('span');
			sep.className = 'separator';
			sep.textContent = '/';
			el.appendChild(sep);
			var link = document.createElement('span');
			link.path = prefix;
			link.textContent = name;
			link.onclick = function(ev) {
				ev.preventDefault();
				var fsEntry = getPathEntry(window.FileTree, this.path);
				if (fsEntry) goToFSEntry(fsEntry, model);
			};
			link.onmouseover = function(ev) {
				if (this.querySelector('ul')) return;
				var siblings = getSiblings(window.FileTree, this.path);
				var ul = document.createElement('ul');
				siblings.splice(siblings.indexOf(this.path), 1);
				siblings.forEach(path => {
					var link = document.createElement('li');
					link.path = path;
					link.textContent = path.split("/").pop();
					link.onclick = function(ev) {
						ev.preventDefault();
						ev.stopPropagation();
						var fsEntry = getPathEntry(window.FileTree, this.path);
						if (fsEntry) goToFSEntry(fsEntry, model);
					};
					ul.append(link);
				});
				ul.onmouseout = function(ev) {
					if (ev.target === this && !this.parentNode.contains(ev.relatedTarget)) {
						this.parentNode.removeChild(this);
					}
				};
				[].slice.call(this.parentNode.querySelectorAll('ul')).forEach(u => u.remove());
				this.appendChild(ul);
			};
			link.onmouseout = function(ev) {
				var ul = this.querySelector('ul');
				if (ev.target === this && ev.relatedTarget !== this.parentNode &&
				    ul && !ul.contains(ev.relatedTarget)
				) {
					this.removeChild(ul);
				}
			};
			el.appendChild(link);
		}
	};

	var prettyPrintWorker = new Worker('js/prettyPrintWorker.js');
	prettyPrintWorker.callbacks = {};
	prettyPrintWorker.callbackUID = 0;
	prettyPrintWorker.onmessage = function(event) {
		this.callbacks[event.data.id](event.data.result);
		delete this.callbacks[event.data.id];
	};
	prettyPrintWorker.prettyPrint = function(string, filename, callback, mimeType) {
		var id = this.callbackUID++;
		this.callbacks[id] = callback;
		this.postMessage({string: string, filename: filename, id: id, mimeType: mimeType});
	};


	var createFileListModel = function(fileCount, fileTree) {
		var geo = Geometry.makeGeometry(fileCount);

		var fileIndex = 0;

		fileTree.index = [fileTree];

		var labels = new THREE.Object3D();
		var thumbnails = new THREE.Object3D();
		Layout.createFileListQuads(fileTree, fileIndex, geo.attributes.position.array, geo.attributes.color.array, 0, 0, 0, 1, 0, labels, thumbnails, fileTree.index);

		var bigGeo = createText({text:'', font: font});
		var vertCount = 0;
		labels.traverse(function(c) {
			if (c.geometry) {
				vertCount += c.geometry.attributes.position.array.length;
			}
		});
		var parr = bigGeo.attributes.position.array = new Float32Array(vertCount);
		var uarr = bigGeo.attributes.uv.array = new Float32Array(vertCount/2);
		var j = 0;
		labels.traverse(function(c) {
			if (c.geometry) {
				parr.set(c.geometry.attributes.position.array, j);
				uarr.set(c.geometry.attributes.uv.array, j/2);
				j += c.geometry.attributes.position.array.length;
			}
		});

		var bigMesh = new THREE.Mesh(bigGeo, textMaterial);

		var mesh = new THREE.Mesh(
			geo,
			new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: THREE.VertexColors })
		);
		mesh.fileTree = fileTree;
		mesh.material.side = THREE.DoubleSide;
		mesh.add(bigMesh);
		mesh.add(thumbnails);
		// mesh.castShadow = true;
		// mesh.receiveShadow = true;
		return mesh;
	};

	var renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
	renderer.domElement.id = 'renderCanvas';
	renderer.setPixelRatio( window.devicePixelRatio || 1 );
	renderer.setClearColor(0x03060C, 1);
	// renderer.shadowMap.enabled = true;
	// renderer.shadowMap.type = THREE.BasicShadowMap;
	document.body.appendChild(renderer.domElement);

	var scene = new THREE.Scene();
	// scene.add(new THREE.AmbientLight(0x111111));

	// var pointLight = new THREE.PointLight(0xffffff, 2, 6);
	// pointLight.position.set(1.25, 2, -1.5);

	// pointLight.target = scene;

	// pointLight.castShadow = false;

	// pointLight.shadow.mapSize.x = 1024;
	// pointLight.shadow.mapSize.y = 1024;
	// pointLight.shadow.camera.near = 1;
	// pointLight.shadow.camera.far = 20;
	// pointLight.shadow.camera.visible = true;
	// pointLight.shadow.bias = 0.01;

	// scene.add(pointLight);

	// var light = new THREE.PointLight(0xffffff);
	// light.position.set(-5,-5,-5);

	// scene.add(light);

	var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 5);

	camera.position.z = 2;

	scene.add(camera);



	window.onresize = function() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
		changed = true;
	};

	window.onresize();

	var addLine = function(geo, processPath) {
		var a = getPathEntry(window.ProcessTree, processPath);
		var b = getPathEntry(window.FileTree, processPath.replace(/^\/\d+\/files/, '').replace(/\:/g, '/'));
		if (a && b) {
			// console.log(processPath, a);
			var av = new THREE.Vector3(a.x, a.y, a.z);
			av.multiply(processModel.scale);
			av.add(processModel.position);
			var bv = new THREE.Vector3(b.x, b.y, b.z);
			bv.add(model.position);
			var aUp = new THREE.Vector3(av.x, av.y, Math.max(av.z, bv.z) + 0.1);
			var bUp = new THREE.Vector3(bv.x, bv.y, Math.max(av.z, bv.z) + 0.1);

			geo.vertices.push(av);
			geo.vertices.push(aUp);
			geo.vertices.push(aUp);
			geo.vertices.push(bUp);
			geo.vertices.push(bUp);
			geo.vertices.push(bv);
		}
	};

	var addLineBetweenEntries = function(geo, color, modelA, entryA, modelB, entryB) {
		var a = entryA;
		var b = entryB;

		var av = new THREE.Vector3(a.x, a.y, a.z);
		av.applyMatrix4(modelA.matrix);

		var bv = new THREE.Vector3(b.x, b.y, b.z);
		bv.applyMatrix4(modelB.matrix);

		var aUp = new THREE.Vector3(av.x+(bv.x-av.x)*0.1, av.y+(bv.y-av.y)*0.1, Math.max(av.z, bv.z) + 0.1);
		var bUp = new THREE.Vector3(bv.x-(bv.x-av.x)*0.1, bv.y-(bv.y-av.y)*0.1, Math.max(av.z, bv.z) + 0.1);

		geo.vertices.push(av);
		geo.vertices.push(aUp);
		geo.vertices.push(aUp);
		geo.vertices.push(bUp);
		geo.vertices.push(bUp);
		geo.vertices.push(bv);

		if (color) {
			geo.colors.push(color, color, color, color, color, color);
		}
	};

	var model;
	var processModel;
	var processTick = function() {
		return;
		utils.loadFiles('http://localhost:8080/?processes=1', function(processTree, processString) {
			window.ProcessTree = processTree.tree;
			if (processModel) {
				scene.remove(processModel);
				scene.remove(processModel.line);
				processModel.line.geometry.dispose();
				processModel.geometry.dispose();
			}
			processModel = createFileTreeModel(processTree.count, processTree.tree);
			processModel.position.set(0.5, -0.25, 0.0);
			processModel.scale.multiplyScalar(0.5);
			scene.add(processModel);

			var geo = new THREE.Geometry();

			processString.split("\n").forEach(function(proc) {
				if (/^\/\d+\/files\/.+/.test(proc)) {
					addLine(geo, proc);
				}
			});

			var line = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
				color: 0xffffff, opacity: 0.1, blending: THREE.AdditiveBlending, transparent: true
			}));
			processModel.line = line;
			scene.add(line);

			// setTimeout(processTick, 1000);
		});
	};

	var modelTop = new THREE.Object3D();
	modelTop.position.set(-0.5, -0.5, 0.0);
	var modelPivot = new THREE.Object3D();
	modelPivot.rotation.x = -0.5;
	// modelPivot.rotation.z = 0;
	modelPivot.position.set(0.5, 0.5, 0.0);
	scene.add(modelTop);
	modelTop.add(modelPivot);

	var showFileTree = function(fileTree) {
		if (processXHR) {
			processXHR.onload = undefined;
		}
		changed = true;
		if (model) {
			model.parent.remove(model);
			model.traverse(function(m) {
				if (m.geometry) {
					m.geometry.dispose();
				}
			});
			model = null;
		}
		if (processModel) {
			processModel.parent.remove(processModel);
			processModel.traverse(function(m) {
				if (m.geometry) {
					m.geometry.dispose();
				}
			});
			processModel = null;
		}
		if (authorModel) {
			authorModel.visible = false;
			authorModel.parent.remove(authorModel);
			authorModel = null;
		}
		if (connectionLines) {
			connectionLines.visible = false;
			connectionLines.parent.remove(connectionLines);
			connectionLines = null;
		}
		window.FileTree = fileTree.tree;
		model = createFileTreeModel(fileTree.count, fileTree.tree);
		model.position.set(-0.5, -0.5, 0.0);
		modelPivot.add(model);
		// processTick();
	};

	var setLoaded = function(loaded) {
		if (loaded) {
			document.body.classList.add('loaded');
			setTimeout(function() {
				if (document.body.classList.contains('loaded')) {
					document.getElementById('loader').style.display = 'none';
				}
			}, 1000);
		} else {
			document.getElementById('loader').style.display = 'block';
			document.body.classList.remove('loaded');
		}
	};

	var navigateTo = function(url, onSuccess, onFailure) {
		window.SearchIndex = null;
		// var fileTree = {
		// 	count: 5,
		// 	tree: {name:"/", title:"/", index: 0, entries: {
		// 		"a": {name:"a", title:"axes\nbaxes\ntraxes\nfaxes\n\nYo!\n\nWhat is this?", index: 0, entries: {
		// 			"b": {name:"b", title:"axes\nbaxes\na\nb\n\n\n\ntraxes\nfaxes\n\nYo!\n\n\nHey man what's up?", index: 0, entries: null}
		// 		}},
		// 		"c": {name:"c", title:"axes baxes", index: 0, entries: {
		// 			"b": {name:"b", title:"axes baxes naxes tralaxes faranges tralanges trafalgar phalanx", index: 0, entries: null}
		// 		}}
		// 	}}
		// };
		// showFileTree(fileTree);
		// setLoaded(true);
		// if (onSuccess) onSuccess();
		// return;
		utils.loadFiles(url, function(fileTree) {
			setLoaded(true);
			showFileTree(fileTree);
			if (onSuccess) onSuccess();
		}, onFailure);
	};

	var navigateToList = function(text, onSuccess, onFailure) {
		utils.loadFromText(text, function(fileTree) {
			setLoaded(true);
			showFileTree(fileTree);
			if (onSuccess) onSuccess();
		}, onFailure);
	};

	var inGitHubRepo = true;

	var ghInput;
	var currentRepoName = null;
	var ghNavTarget = '';
	var ghNavQuery = '';
	var authorModel, connectionLines;
	var processXHR;
	if (!document.body.classList.contains('gdrive')) {
		ghInput = document.getElementById('git');
		var ghButton = document.getElementById('gitshow');
		ghButton.onclick = function(ev) {
			var repoURL = ghInput.value;
			var match = repoURL.match(/^(((https?|git):\/*)?(git\.|www\.)?github.com\/)?([^\/]+)\/([^\/]+)/i);
			if (match) {
				var repoName = match[5] + '/' + match[6];

				if (repoName === currentRepoName) {
					return;
				}

				setLoaded(false);
				currentRepoName = repoName;
				var gitHubRepoURL = ('https://github.com/' + repoName + '.git');
				var gitHubAPIURL = 'https://api.github.com/repos/' + repoName + '/git/trees/master?recursive=1';
				global.gitHubAPIPrefix = 'https://api.github.com/repos/' + repoName;
				var commitsURL = 'https://api.github.com/repos/' + repoName + '/commits';
				navigateTo(gitHubAPIURL, function() {
					inGitHubRepo = true;

					camera.targetPosition.x = 0;
					camera.targetPosition.y = 0;
					camera.targetFOV = 50;
					if (ghNavTarget) {
						var fsEntry = getPathEntry(window.FileTree, ghNavTarget);
						if (fsEntry) {
							// console.log("navigating to", fsEntry);
							goToFSEntry(fsEntry, model);
						}
					}
					window.searchInput.value = ghNavQuery;
					window.searchInput.oninput();
					ghNavTarget = '';
					ghNavQuery = '';
					if (window.history && window.history.replaceState) {
						history.pushState({}, "", "?github/"+encodeURIComponent(ghInput.value));
					} else {
						location = '#github/'+encodeURIComponent(ghInput.value);
					}

					processXHR = new XMLHttpRequest();
					processXHR.open('GET', commitsURL);
					processXHR.onload = function(ev) {
						var commits = JSON.parse(ev.target.responseText);
						var authors = {};

						var byDate = {name: "By date", title: "By date", index: 0, entries: {}};
						var byAuthor = {name: "By author", title: "By author", index: 0, entries: {}};

						var commitsFSEntry = {name: "Commits", title: "Commits", index: 0, entries: {
							"By date": byDate,
							"By author": byAuthor
						}};
						var commitsRoot = {name:"/", title: "/", index:0, entries:{"Commits": commitsFSEntry}};

						var commitsFSCount = 4;
						for (var i=0; i<commits.length; i++) {
							var c = commits[i];
							var lines = c.commit.message.split("\n");
							var title = c.sha;
							for (var j=0; j<lines.length; j++) {
								if (!/^\s*$/.test(lines[j])) {
									title = lines[j];
									break;
								}
							}
							// console.log(c.html_url);
							var commitFSEntry = ({
								name: c.sha,
								title: title,
								index: 0,
								href: c.html_url,
								color: Colors.document,
								entries: {
									message: {name:'message', title:c.commit.message, href:c.html_url, index:0, entries: null},
									author: {name:'author', title:c.commit.author.name /* + ' <'+c.commit.author.email+'>' */, href: c.html_url /* 'mailto:'+c.commit.author.email */, index:0, entries: null},
									date: {name:'date', title: c.commit.author.date, href:c.html_url, entries: null},
									sha: {name:'sha', title:c.sha, href:c.html_url, index:0, entries: null}
								}
							});
							var commitFSEntry2 = ({
								name: c.sha,
								title: title,
								index: 0,
								href: c.html_url,
								color: Colors.document,
								entries: {
									message: {name:'message', title:c.commit.message, href:c.html_url, index:0, entries: null},
									author: {name:'author', title:c.commit.author.name /* + ' <'+c.commit.author.email+'>' */, href: c.html_url /* 'mailto:'+c.commit.author.email */, index:0, entries: null},
									date: {name:'date', title: c.commit.author.date, href:c.html_url, entries: null},
									sha: {name:'sha', title:c.sha, href:c.html_url, index:0, entries: null}
								}
							});
							var key = c.commit.author.name;
							var author = authors[key]
							if (!author) {
								author = authors[key] = {authors: [], commits: []};
								byAuthor.entries[key] = {name: key, title: c.commit.author.name, index: 0, entries: {}};
								commitsFSCount++;
							}
							byAuthor.entries[key].entries[c.sha] = commitFSEntry2;
							commitsFSCount+=5;
							author.authors.push(c.commit.author);
							author.commits.push(c);
							var date = new Date(c.commit.author.date);
							var year = date.getFullYear().toString();
							var month = (date.getMonth() + 1).toString();
							var day = date.getDate().toString();
							var year = c.commit.author.date.split("T")[0];
							var yearFSEntry = byDate.entries[year];
							if (!yearFSEntry) {
								yearFSEntry = byDate.entries[year] = {name: year, title: year, index: 0, entries: {}};
								commitsFSCount++;
							}
							// var monthFSEntry = yearFSEntry.entries[month];
							// if (!monthFSEntry) {
							// 	monthFSEntry = yearFSEntry.entries[month] = {name: month, title: month, index: 0, entries: {}};
							// 	commitsFSCount++;
							// }
							// var dayFSEntry = monthFSEntry.entries[day];
							// if (!dayFSEntry) {
							// 	dayFSEntry = monthFSEntry.entries[day] = {name: day, title: day, index: 0, entries: {}};
							// 	commitsFSCount++;
							// }
							yearFSEntry.entries[c.sha] = commitFSEntry;
							commitsFSCount+=5;
						}

						window.CommitTree = {tree: commitsRoot, count: commitsFSCount};
						processModel = createFileTreeModel(window.CommitTree.count, window.CommitTree.tree);
						processModel.position.set(0.5, -0.5, 0.0);
						modelPivot.add(processModel);
						changed = true;
					};
					processXHR.send();
				}, function() {
					setLoaded(true);
				});
				ghInput.blur();
				searchInput.blur();
			} else {
				setLoaded(false);
				navigateTo(repoURL, function() {
					inGitHubRepo = false;
					setLoaded(true);
					camera.targetPosition.x = 0;
					camera.targetPosition.y = 0;
					camera.targetFOV = 50;
					window.searchInput.value = ghNavQuery;
					window.searchInput.oninput();
					ghNavTarget = '';
					ghNavQuery = '';
					if (window.history && window.history.replaceState) {
						history.pushState({}, "", "?find/"+encodeURIComponent(ghInput.value));
					} else {
						location = '#find/'+encodeURIComponent(ghInput.value);
					}
				}, function() {
					setLoaded(true);
				});
				ghInput.blur();
				searchInput.blur();
			}
		};
		ghInput.addEventListener('keydown', function(ev) {
			if (ev.keyCode === 13) {
				ev.preventDefault();
				ghButton.onclick(ev);
			}
		}, false);
		ghInput.addEventListener('input', function(ev) {

		}, false);
		var hash = document.location.hash.replace(/^#/,'');
		if (hash.length === 0) {
			hash = document.location.search.replace(/^\?/,'');
		}
		if (hash.length > 0) {
			var pathQuery = hash.split("&");
			var query = pathQuery[1];
			var ghPath = decodeURIComponent(pathQuery[0].replace(/^(github|find)\//, ''));
			if (pathQuery[0].match(/^github/)) {
				var ghRepo = ghPath.split("/").slice(0,2).join("/");
				ghNavTarget = ghPath;
			} else {
				var ghRepo = ghPath;
				ghNavTarget = '';
			}
			ghNavQuery = (query || '').replace(/^q\=/,'');
			window.searchInput.value = ghNavQuery;
			ghInput.value = ghRepo;
			ghButton.click();
		} else {
			var commitLog, commitChanges;
			var treeLoaded = false;

			var loadTick = function() {
				if (!commitLog || !commitChanges || !treeLoaded) {
					return;
				}
				setLoaded(true);

				var commits = commitLog.split(/^commit /m);
				var authors = {};
				var commitIndex = {};
				commits.shift();
				console.log(commits.length);
				commits.splice(MAX_COMMITS);
				commits = commits.map(function(c) {
					var lines = c.split("\n");
					var hash = lines[0];
					var idx = 0;
					while (lines[idx] && !/^Author:/.test(lines[idx])) {
						idx++;
					}
					var author = lines[idx++].substring(8);
					var email = author.match(/<([^>]+)>/)[1];
					var authorName = author.substring(0, author.length - email.length - 3);
					var date = lines[idx++].substring(6);
					var message = lines.slice(idx+1).map(function(line) {
						return line.replace(/^    /, '');
					}).join("\n");
					var commit = {
						sha: hash,
						author: {
							name: authorName,
							email: email
						},
						message: message,
						date: new Date(date),
						files: []
					};
					var authorObj = authors[authorName];
					if (!authorObj) {
						authors[authorName] = authorObj = [];
					}
					authorObj.push(commit);
					commitIndex[commit.sha] = commit;
					return commit;
				});

				var changes = commitChanges.split('\n\n');
				changes.splice(MAX_COMMITS);

				changes.forEach(function(c, index) {
					if (c) {
						var lines = c.split("\n");
						var hash = lines[0];
						if (!commitIndex[hash]) {
							console.log(hash, index, c);
						} else {
							commitIndex[hash].files = lines.slice(1).map(function(fs) {
								var fileChange = {
									path: fs.substring(2),
									action: fs.charAt(0)
								};
								return fileChange;
							});
						}
					}
				});
				var commitsFSEntry = {name: "Commits", title: "Commits", index: 0, entries: {}};
				var commitsRoot = {name:"", title: "", index:0, entries:{"Commits": commitsFSEntry}};

				var mkfile = function(filename) {
					return {
						name: filename, title: filename, index: 0, entries: null
					};
				};

				var mkdir = function(dirname, files) {
					var entries = {};
					files.forEach(function(f) { entries[f] = mkfile(f) });
					return {
						name: dirname, title: dirname, index: 0, entries: entries
					};
				};

				var commitsFSCount = 2;
				var commitToFile;
				commits.forEach(function(c) {
					var entries = {
						Author: mkfile(c.author.name),
						SHA: mkfile(c.sha),
						Date: mkfile(c.date.toString()),
						Message: mkfile(c.message)
					}
					if (c.files.length > 0 && c.files[0]) {
						var fileTree = utils.parseFileList_(c.files.map(function(f) { return f.path }).join("\n")+'\n', true);
						fileTree.tree.title = fileTree.tree.name = 'Files';
						entries.Files = fileTree.tree;
						commitsFSCount += 1 + fileTree.count;
					}
					commitsFSEntry.entries[c.sha] = {
						name: c.sha, title: (c.message.match(/^\S+.*/) || [''])[0], index: 0, entries: entries
					};
					c.fsEntry = commitsFSEntry.entries[c.sha];
					commitsFSCount += 5;
				});

				var authorsFSEntry = {name: "Authors", title: "Authors", index: 0, entries: {}};
				var authorsRoot = {name:"", title: "", index:0, entries:{"Authors": authorsFSEntry}};
				var authorsFSCount = 2;

				for (var authorName in authors) {
					var author = authors[authorName];
					author.fsEntry = mkdir(authorName, []);
					authorsFSEntry.entries[authorName] = author.fsEntry;
					authorsFSCount++;
					for (var i=0; i<author.length; i++) {
						var c = author[i];
						if (!c ||!c.fsEntry) continue;
						var cEntry = mkfile(c.fsEntry.title);
						author.fsEntry.entries[c.sha] = cEntry;
						authorsFSCount++;
					}
				}

				window.AuthorTree = {tree: authorsRoot, count: authorsFSCount};
				authorModel = createFileListModel(window.AuthorTree.count, window.AuthorTree.tree);
				authorModel.position.set(1.5, -0.5, 0.0);
				modelPivot.add(authorModel);

				window.CommitTree = {tree: commitsRoot, count: commitsFSCount};
				processModel = createFileListModel(window.CommitTree.count, window.CommitTree.tree);
				processModel.position.set(0.5, -0.5, 0.0);
				modelPivot.add(processModel);

				model.updateMatrix();
				processModel.updateMatrix();
				authorModel.updateMatrix();

				var lineGeo = new THREE.Geometry();

				var h = 4;
				for (var authorName in authors) {
					var author = authors[authorName];
					var authorEntry = author.fsEntry;
					var color = new THREE.Color();
					color.setHSL((h%7)/7, 1, 0.5);
					h+=2;
					author.color = color;
					for (var i=0; i<author.length; i++) {
						var commit = author[i];
						if (commit && commit.fsEntry && author.fsEntry && author.fsEntry.entries[commit.sha]) {
							addLineBetweenEntries(lineGeo, color, processModel, commit.fsEntry, authorModel, author.fsEntry.entries[commit.sha]);
						}
					}
				}

				utils.traverseTree(window.CommitTree, function(fsEntry, fullPath) {
					if (/^\/Commits\/.{40}\/Files\//.test(fullPath) && fsEntry.entries === null) {
						// Files entry \ ^_^ /
						var sha = fullPath.substring(9, 49);
						var path = fullPath.substring(55);
						var filePath = repoPrefix + path;
						var fileEntry = getPathEntry(window.FileTree, filePath);
						// var lineGeo = commitIndex[sha].lineGeo;
						// if (!lineGeo) {
						// 	commitIndex[sha].lineGeo = lineGeo = new THREE.Geometry();
						// }
						if (fileEntry) {
							var author = authors[commitIndex[sha].author.name];
							var color = Colors.getThreeColor(fileEntry);
							addLineBetweenEntries(lineGeo, author.color, model, fileEntry, processModel, fsEntry);
						}
					}
				});
				lineGeo.vertices.push(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
				lineGeo.colors.push(new THREE.Color(0,0,0), new THREE.Color(0,0,0));
				connectionLines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({
					color: new THREE.Color(1.0, 1.0, 1.0), opacity: 0.3, transparent: true, depthWrite: false,
					// linewidth: (2 * window.devicePixelRatio || 1),
					vertexColors: true
					// blending: THREE.AdditiveBlending
				}))
				modelPivot.add(connectionLines);
				window.LineModel = connectionLines;
				changed = true;
			};

			var xhr = new XMLHttpRequest();
			xhr.open('GET', repo+'_log.txt');
			xhr.onload = function(ev) {
				commitLog = ev.target.responseText;
				loadTick();
			};
			xhr.send();

			var xhr = new XMLHttpRequest();
			xhr.open('GET', repo+'_changes.txt');
			xhr.onload = function(ev) {
				commitChanges = ev.target.responseText;
				loadTick();
			};
			xhr.send();

			navigateTo(repo+'.txt', function() {
				var xhr = new XMLHttpRequest;
				xhr.open('GET', repo+'.lunr.json');
				xhr.onload = function() {

					var filterByTrigrams = function(trigramIndex, token, smallestTrigram) {
						if (smallestTrigram === []) {
							return smallestTrigram;
						}
						for (var j=0; j<token.length-2; j++) {
							var trigram = token.substring(j, j+3);
							var tokens = trigramIndex[trigram];
							if (!tokens) {
								return [];
							} else if (smallestTrigram === null || tokens.length < smallestTrigram.length) {
								smallestTrigram = tokens;
							}
						}
						return smallestTrigram;
					};

					var idx = window.SearchIndex = JSON.parse(this.responseText);
					idx.tokenizer = lunr.tokenizer.load(idx.tokenizer);
					idx.pipeline = lunr.Pipeline.load(idx.pipeline);
					var trigramIndex = idx.trigramIndex = {};
					for (var i=0; i<idx.tokens.length; i++) {
						var token = idx.tokens[i][0];
						for (var j=0; j<token.length-2; j++) {
							var trigram = token.substring(j, j+3);
							if (!trigramIndex[trigram]) {
								trigramIndex[trigram] = [];
							}
							trigramIndex[trigram].push(idx.tokens[i]);
						}
						idx.tokens[i][1] = lunr.Index.deltaUnpack(idx.tokens[i][1]);
					};

					window.SearchIndex.searchByToken = function(queryToken) {
						var filteredTokens = filterByTrigrams(this.trigramIndex, queryToken, this.tokens);
						var hits = [];
						var hitIndex = {};
						for (var i=0; i<filteredTokens.length; i++) {
							var tokenDocTFs = filteredTokens[i];
							var token = tokenDocTFs[0];
							var docs = tokenDocTFs[1];
							var tfs = tokenDocTFs[2];
							var matchScore = 0;
							if (token.includes(queryToken)) {
								matchScore = Math.max(matchScore, 1 - (token.length - queryToken.length) / token.length);
							}
							if (matchScore > 0) {
								for (var j=0; j<docs.length; j++) {
									var doc = docs[j];
									if (!hitIndex[doc]) {
										hitIndex[doc] = {id: doc, ref: this.docs[doc], score: 0};
										hits.push(hitIndex[doc]);
									}
									hitIndex[doc].score += matchScore * tfs[j];
								}
							}
						}
						hits.sort(function(a,b) { return a.id - b.id; });
						return hits;
					};

					window.SearchIndex.mergeHits = function(a, b) {
						var hits = [];
						for (var i=0, j=0; i<a.length && j<b.length;) {
							if (a[i].id === b[j].id) {
								a[i].score += b[j].score;
								hits.push(a[i]);
								i++;
								j++;
							} else if (a[i].id < b[j].id) {
								i++;
							} else {
								j++;
							}
						}
						return hits;
					};

					window.SearchIndex.search = function(query) {
						var queryTokens = this.pipeline.run(this.tokenizer(query));
						if (queryTokens.length === 0) {
							return [];
						}
						if (queryTokens.length === 1 && queryTokens[0].length < 3) return [];
						var hits = this.searchByToken(queryTokens[0]);
						for (var j=1; j<queryTokens.length; j++) {
							hits = this.mergeHits(hits, this.searchByToken(queryTokens[j]));
						}
						hits.sort(function(a,b) { return b.score - a.score; });
						return hits;
					}
				};
				xhr.send();
				setLoaded(false);
				treeLoaded = true;
				loadTick();
			});

		}
	}
	window.GDriveCallback = showFileTree;

	var caseInsensitiveCmp = function(a, b) {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	};
	var localFileLoad = function() {
		inGitHubRepo = false;
		setLoaded(true);
		camera.targetPosition.x = 0;
		camera.targetPosition.y = 0;
		camera.targetFOV = 50;
		window.searchInput.value = ghNavQuery;
		window.searchInput.oninput();
		ghNavTarget = '';
		ghNavQuery = '';
		if (window.history && window.history.replaceState) {
			history.pushState({}, "", "");
		} else {
			location = '#';
		}
	};

	window.fileInput.onchange = function() {
		if (this.files.length === 0) {
			return;
		}
		setLoaded(false);

		var file = this.files[0];
		this.value = '';
		setTimeout(function() {
			var reader = new FileReader();
			reader.onload = function(res) {
				navigateToList(reader.result, localFileLoad);
				setLoaded(true);
			};
			reader.readAsText(file);
		}, 500);
	};

	if (
		(window.directoryInput.webkitdirectory === undefined && window.directoryInput.directory === undefined)
		|| (/mobile/i).test(window.navigator.userAgent)
	) {
		document.body.classList.add('no-directory');
	}
	if ((/mobile/i).test(window.navigator.userAgent)) {
		document.body.classList.add('mobile');
	}

	window.directoryInput.onchange = function() {
		if (this.files.length > 0) {
			setLoaded(false);

			var files = [].map.call(this.files, function(f) { return '/'+f.webkitRelativePath; });
			this.value = '';
			setTimeout(function() {
				var dirs = {};
				files.forEach(function(f) {
					var path = f.substring(0, f.lastIndexOf('/'));
					var segs = path.split("/");
					for (var i=1; i<=segs.length; i++) {
						var prefix = segs.slice(0, i).join("/");
						dirs[prefix] = 1;
					}
				});
				var prefixes = [];
				for (var i in dirs) {
					prefixes.push(i + '/');
				}
				navigateToList(prefixes.sort(caseInsensitiveCmp).concat(files).join("\n")+"\n", localFileLoad);
				setLoaded(true);
			}, 500);
		}
	};

	// var controls = new THREE.OrbitControls(camera, renderer.domElement);
	// //controls.addEventListener( 'change', render ); // add this only if there is no animation loop (requestAnimationFrame)
	// controls.enableDamping = true;
	// controls.dampingFactor = 0.25;
	// controls.enableZoom = true;

	var down = false;
	var previousX, previousY, startX, startY;
	var theta = 0, alpha = 0;
	var clickDisabled = false;

	var pinchStart, pinchMid;

	var inGesture = false;

	renderer.domElement.addEventListener('touchstart', function(ev) {
		if (ghInput) {
			ghInput.blur();
		}
		if (window.searchInput) {
			searchInput.blur();
		}
		if (window.DocFrame) return;
		ev.preventDefault();
		if (ev.touches.length === 1) {
			renderer.domElement.onmousedown(ev.touches[0]);
		} else if (ev.touches.length === 2) {
			inGesture = true;
			var dx = ev.touches[0].clientX - ev.touches[1].clientX;
			var dy = ev.touches[0].clientY - ev.touches[1].clientY;
			pinchStart = Math.sqrt(dx*dx + dy*dy);
			pinchMid = {
				clientX: ev.touches[1].clientX + dx/2,
				clientY: ev.touches[1].clientY + dy/2,
			};
			renderer.domElement.onmousedown(pinchMid);
		}
	}, false);
	renderer.domElement.addEventListener('touchmove', function(ev) {
		if (window.DocFrame) return;
		ev.preventDefault();
		if (ev.touches.length === 1) {
			if (!inGesture) {
				window.onmousemove(ev.touches[0], 0.0000525);
			}
		} else if (ev.touches.length === 2) {
			var dx = ev.touches[0].clientX - ev.touches[1].clientX;
			var dy = ev.touches[0].clientY - ev.touches[1].clientY;
			var zoom = pinchStart / Math.sqrt(dx*dx + dy*dy);
			pinchStart = Math.sqrt(dx*dx + dy*dy);
			pinchMid = {
				clientX: ev.touches[1].clientX + dx/2,
				clientY: ev.touches[1].clientY + dy/2,
			};
			var cx = (pinchMid.clientX - window.innerWidth / 2) * 0.0000575 * camera.fov;
			var cy = (pinchMid.clientY - window.innerHeight / 2) * 0.0000575 * camera.fov;
			zoomCamera(zoom, cx, cy);
			window.onmousemove(pinchMid);
		}
	}, false);
	renderer.domElement.addEventListener('touchend', function(ev) {
		if (window.DocFrame) return;
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
	}, false);
	renderer.domElement.addEventListener('touchcancel', function(ev) {
		if (window.DocFrame) return;
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
	}, false);
	window.onkeydown = function(ev) {
		if (!ev.target || ev.target.tagName !== 'INPUT') {
			var factor = 0.0001;
			var dx = 0, dy = 0;
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

			}
			camera.targetPosition.x -= factor*dx * camera.fov;
			camera.targetPosition.y += factor*dy * camera.fov;
		}
	};
	renderer.domElement.onmousedown = function(ev) {
		if (ghInput) {
			ghInput.blur();
		}
		if (window.searchInput) {
			searchInput.blur();
		}
		if (window.DocFrame) return;
		if (ev.preventDefault) ev.preventDefault();
		down = true;
		clickDisabled = false;
		startX = previousX = ev.clientX;
		startY = previousY = ev.clientY;
	};
	window.onmousemove = function(ev, factor) {
		if (window.DocFrame) return;
		if (down) {
			if (!factor) {
				factor = 0.0001;
			}
			changed = true;
			if (ev.preventDefault) ev.preventDefault();
			var dx = ev.clientX - previousX;
			var dy = ev.clientY - previousY;
			previousX = ev.clientX;
			previousY = ev.clientY;
			if (Math.abs(ev.clientX - startX) > 10 || Math.abs(ev.clientY - startY) > 10) {
				clickDisabled = true;
			}
			if (ev.shiftKey) {
				modelPivot.rotation.z += dx*0.01;
				modelPivot.rotation.x += dy*0.01;
			} else {
				camera.position.x -= factor*dx * camera.fov;
				camera.position.y += factor*dy * camera.fov;
				camera.targetPosition.copy(camera.position);
				camera.targetFOV = camera.fov;
			}
		}
	};
	var lastScroll = Date.now();
	var zoomCamera = function(zf, cx, cy) {
		if (zf < 1 || camera.fov < 120) {
			camera.position.x += cx - cx * zf;
			camera.position.y -= cy - cy * zf;
			camera.fov *= zf;
			if (camera.fov > 120) camera.fov = 120;
			camera.targetFOV = camera.fov;
			camera.targetPosition.copy(camera.position);
			camera.updateProjectionMatrix();
			changed = true;
		}
	};
	var prevD = 0;
	var wheelSnapTimer;
	var wheelFreePan = false;
	renderer.domElement.onwheel = function(ev) {
		if (window.DocFrame) return;
		ev.preventDefault();

		if (ev.ctrlKey) {
			// zoom on wheel
			var cx = (ev.clientX - window.innerWidth / 2) / window.innerWidth / 34 * camera.fov;
			var cy = (ev.clientY - window.innerHeight / 2) / window.innerHeight / 34 * camera.fov;
			var d = ev.deltaY !== undefined ? ev.deltaY*3 : ev.wheelDelta;
			if (Date.now() - lastScroll > 500) {
				prevD = d;
			}
			if (d > 20 || d < -20) {
				d = 20 * d / Math.abs(d);
			}
			if ((d < 0 && prevD > 0) || (d > 0 && prevD < 0)) {
				d = 0;
			}
			prevD = d;
			zoomCamera(Math.pow(1.003, d), cx, cy);
			lastScroll = Date.now();
		} else {
			clearTimeout(wheelSnapTimer);
			wheelSnapTimer = setTimeout(function() {wheelFreePan = false}, 1000);
			
			// pan on wheel
			const factor = 0.0000575;
			const adx = Math.abs(ev.deltaX);
			const ady = Math.abs(ev.deltaY);
			var xMove = false, yMove = true;
			if (adx > 3*ady) { xMove = true; yMove = false; }
			wheelFreePan = wheelFreePan || (adx > 5 && ady > 5);
			if (wheelFreePan || xMove) camera.position.x += factor*ev.deltaX * camera.fov;
			if (wheelFreePan || yMove) camera.position.y -= factor*ev.deltaY * camera.fov;
			camera.targetPosition.copy(camera.position);
			camera.targetFOV = camera.fov;
			changed = true;
		}
	};
	
	var gestureStartScale = 0;
	window.addEventListener("gesturestart", function (e) {
		e.preventDefault();
		gestureStartScale = 1;
	});
	window.addEventListener("gesturechange", function (ev) {
		ev.preventDefault();
		var cx = (ev.clientX - window.innerWidth / 2) / window.innerWidth / 34 * camera.fov;
		var cy = (ev.clientY - window.innerHeight / 2) / window.innerHeight / 34 * camera.fov;
		var d = ev.scale / gestureStartScale;
		gestureStartScale = ev.scale;
		zoomCamera(1/d, cx, cy);
	});
	window.addEventListener("gestureend", function (e) {
		e.preventDefault();
	});

	var loadThumbnail = function(fsEntry) {
		if (fsEntry.id) { // Google Drive file.
			var cachedTimeStamp = 1458296109305;
			// https://drive.google.com/thumbnail?id=0B71mO-nIPBuNOGM4Z2hZREdQeHc&authuser=0&v=1458296109305&sz=w128-h128-p-k-nu
			var img = new Image();
			var canvas = document.createElement('canvas');
			canvas.width = 128;
			canvas.height = 128;

			img.crossOrigin = "Anonymous";
			var retried = false;
			img.onload = function() {
				console.log(img);
				if (!img.complete) {
					if (retried) return;
					retried = true;
					console.log('failed image request', thumbnailLink);
					img.src = 'http://localhost:8080?thumbnail=' + encodeURIComponent(iconLink);
				} else {
					canvas.getContext('2d').drawImage(this, (canvas.width-this.width) / 2, 0, this.width, this.height);
					img.texture.needsUpdate = true;
					changed = true;
				}
			};
			img.onerror = function() {
				if (retried) return;
				retried = true;
				img.src = 'http://localhost:8080?thumbnail=' + encodeURIComponent(iconLink);
			};
			img.texture = new THREE.Texture();
			img.texture.image = canvas;
			img.texture.needsUpdate = true;
			// utils.getGDriveThumbnailURL(fsEntry.id, function(thumbnailURL) {
			// 	img.src = thumbnailURL;
			// });
			var iconLink = (fsEntry.iconLink || "").replace(
				/^https:\/\/ssl\.gstatic\.com\/docs\/doclist\/images\/icon_[\d]+_([^_]+)_list\.png$/,
				"https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_$1_x128.png"
			);
			var thumbnailLink = (fsEntry.thumbnailLink || "").replace(/s220$/, 'w128-h128');
			var thumbnailURL = thumbnailLink || iconLink || 'https://drive.google.com/thumbnail?id='+fsEntry.id+'&authuser=1&v='+cachedTimeStamp+"&sz=w128-h128";
			img.src = 'http://localhost:8080?thumbnail=' + encodeURIComponent(thumbnailURL);
			return img.texture;
		}
	};

	var openIFrame = function(url) {
		var iframe = document.createElement('iframe');
		iframe.style.width = window.innerWidth + 'px';
		iframe.style.height = window.innerHeight - 60 + 'px';
		iframe.style.position = 'absolute';
		iframe.style.top = '0px';
		iframe.style.transform = 'translateY(-'+iframe.style.height+')';
		iframe.style.transition = '0.5s';
		iframe.style.left = '0px';
		iframe.style.zIndex = 10;
		iframe.style.border = '0';
		iframe.style.background = 'white';
		window.DocFrame = iframe;
		document.body.appendChild(iframe);
		setTimeout(function() { iframe.style.transform = 'translateY(0px)'; }, 30);
		iframe.src = url;
	};

	var getFullPath = function(fsEntry) {
		if (!fsEntry.parent) return '';
		return getFullPath(fsEntry.parent) + '/' + fsEntry.name;
	};

	var openFile = function(fsEntry) {
		if (fsEntry.href) {
			window.open(fsEntry.href, '_blank');
		} else if (fsEntry.id) { // Google Drive file.
			var url = 'https://drive.google.com/file/d/' + fsEntry.id + '/preview';
			openIFrame(url);
		} else if (inGitHubRepo) {
			var fullPath = getFullPath(fsEntry);
			var segs = fullPath.split("/");
			if (segs[0] === "") {
				segs.shift();
			}
			var url = 'https://github.com/' + segs.slice(0,2).join("/") + '/blob/master/' + segs.slice(2).join("/");
			window.open(url, '_blank');
		}
	};

	var goToFSEntry = function(fsEntry, model) {
		scene.updateMatrixWorld();
		var fsPoint = new THREE.Vector3(fsEntry.x + fsEntry.scale/2, fsEntry.y + fsEntry.scale/2, fsEntry.z);
		fsPoint.applyMatrix4(model.matrixWorld);
		camera.targetPosition.copy(fsPoint);
		camera.targetFOV = fsEntry.scale * 50;
		fsEntry.fov = camera.targetFOV;
	};

	var goToFSEntryText = function(fsEntry, model) {
		scene.updateMatrixWorld();
		var textX = fsEntry.textX;
		textX += (fsEntry.scale * fsEntry.textScale) * window.innerWidth / 2 ;
		var fsPoint = new THREE.Vector3(textX, fsEntry.textY, fsEntry.z);
		fsPoint.applyMatrix4(model.matrixWorld);
		camera.targetPosition.copy(fsPoint);
		camera.targetFOV = fsEntry.scale * fsEntry.textScale * 2000 * 50;
		fsEntry.textFOV = camera.targetFOV;
	};

	var goToFSEntryTextAtLine = function(fsEntry, model, line, lineCount) {
		if (!fsEntry.textHeight) {
			fsEntry.targetLine = {line, lineCount};
			return goToFSEntry(fsEntry, model);
		}
		const textYOff = ((line+0.5) / lineCount) * fsEntry.textHeight;
		scene.updateMatrixWorld();
		var textX = fsEntry.textX;
		textX += (fsEntry.scale * fsEntry.textScale) * window.innerWidth / 2;
		var fsPoint = new THREE.Vector3(textX, fsEntry.textYZero - textYOff, fsEntry.z);
		fsPoint.applyMatrix4(model.matrixWorld);
		camera.targetPosition.copy(fsPoint);
		camera.targetFOV = fsEntry.scale * fsEntry.textScale * 2000 * 50;
		fsEntry.textFOV = camera.targetFOV;
	};

	var highlighted = null;
	window.onmouseup = function(ev) {
		if (ev.preventDefault) ev.preventDefault();
		if (clickDisabled) {
			down = false;
			return;
		}
		if (window.DocFrame) {
			window.DocFrame.style.transform = 'translateY(-'+window.DocFrame.style.height+')';
			var iframe = window.DocFrame;
			setTimeout(function() {
				iframe.parentNode.removeChild(iframe);
			}, 500);
			window.DocFrame = null;
			down = false;
			return;
		}
		if (down) {
			down = false;
			var models = [model];
			if (processModel) {
				models.push(processModel);
			}
			if (authorModel) {
				models.push(authorModel);
			}
			// console.log(models);
			var intersection = Geometry.findFSEntry(ev, camera, models, highlighted);
			if (intersection) {
				var fsEntry = intersection.fsEntry;
				var ca = intersection.object.geometry.attributes.color;
				var vs = intersection.object.geometry.attributes.position;
				var tvs = intersection.object.children[1].geometry.attributes.position;
				if (highlighted && highlighted.highlight) {
					var obj = highlighted.highlight;
					obj.parent.remove(obj);
				}
				if (highlighted !== fsEntry) {
					highlighted = fsEntry;

					/* Some sort of weird-ass object scaleup popup thing.

					highlighted.highlight = new THREE.Object3D();
					var mesh = intersection.object;
					var text = intersection.object.children[1];
					var highlightMesh = new THREE.Mesh(
						new THREE.BufferGeometry(),
						mesh.material
					);
					highlighted.highlight.add(highlightMesh);

					highlightMesh.geometry.addAttribute('position', mesh.geometry.attributes.position);
					highlightMesh.geometry.addAttribute('color', mesh.geometry.attributes.color);
					highlightMesh.geometry.setDrawRange(highlighted.vertexIndex, highlighted.lastVertexIndex-highlighted.vertexIndex);

					var highlightText = new THREE.Mesh(
						new THREE.BufferGeometry(),
						text.material
					);
					highlighted.highlight.add(highlightText);

					highlightText.geometry.addAttribute('position', text.geometry.attributes.position);
					highlightText.geometry.addAttribute('uv', text.geometry.attributes.uv);
					highlightText.geometry.setDrawRange(highlighted.textVertexIndex, highlighted.lastTextVertexIndex-highlighted.textVertexIndex);

					var x = vs.array[highlighted.vertexIndex*3] + highlighted.scale * 0.5;
					var y = vs.array[highlighted.vertexIndex*3+1] + highlighted.scale * 0.5;
					var z = vs.array[highlighted.vertexIndex*3+2];

					highlighted.highlight.position.set(x, y, z);
					var startTime = performance.now();
					highlighted.highlight.ontick = function() {
						animating = true;
						var elapsed = performance.now() - startTime;
						var f = 0.5 - 0.5 * Math.cos(Math.PI * elapsed / 500);
						if (elapsed > 500) {
							f = 1;
						}
						this.parent.position.z = -0.3 * f;
						this.position.z = z + 0.3 * f;
						this.position.x = x + 0.5 * f;
						this.position.y = y + 0.5 * f;
						this.scale.set(f/highlighted.scale, f/highlighted.scale, f/highlighted.scale);
						if (f === 1) {
							animating = false;
						}
					};
					highlightMesh.position.set(-x,-y,-z);
					highlightText.position.set(-x,-y,-z);
					mesh.add(highlighted.highlight);

					*/

					/*

					var scale = 0.5 / highlighted.scale;
					for (var i=highlighted.vertexIndex*3, l=highlighted.lastVertexIndex*3; i<l; i+=3) {
						vs.array[i] = (vs.array[i] - x) * scale + x;
						vs.array[i+1] = (vs.array[i+1] - y) * scale + y;
						vs.array[i+2] = (vs.array[i+2] - z) * scale + z;
						vs.array[i+2] += 0.1;
					}
					for (var i=highlighted.textVertexIndex*4, l=highlighted.lastTextVertexIndex*4; i<l; i+=4) {
						tvs.array[i] = (tvs.array[i] - x) * scale + x;
						tvs.array[i+1] = (tvs.array[i+1] - y) * scale + y;
						tvs.array[i+2] = (tvs.array[i+2] - z) * scale + z;
						tvs.array[i+2] += 0.1;
					}
					vs.needsUpdate = true;
					tvs.needsUpdate = true;

					setColor(ca.array, fsEntry.index, [0.1,0.25,0.5], 0);
					*/

					goToFSEntry(fsEntry, intersection.object);
				} else {
					if (highlighted.entries === null) {
						var fovDiff = (highlighted.scale * 50) / camera.fov;
						if (fovDiff > 1) {
							goToFSEntry(highlighted, intersection.object);
						} else {
							goToFSEntryText(highlighted, intersection.object);
						}
					} else {
						goToFSEntry(highlighted, intersection.object);
					}
				}
				// ca.needsUpdate = true;
				changed = true;
				// console.log(fsEntry, fsEntry.scale * camera.projectionMatrix.elements[0]);

				return;


				// console.log(fsEntry.fullPath);
				// if (fsEntry.entries === null) {
				// 	window.open('http://localhost:8080'+encodeURI(fsEntry.fullPath))
				// } else {
				// 	var oldModel = scene.children[1];
				// 	scene.remove(oldModel);
				// 	models = [];
				// 	oldModel.traverse(function(m) {
				// 		if (m.material) {
				// 			if (m.material.map) {
				// 				m.material.map.dispose();
				// 			}
				// 			m.material.dispose();
				// 		}
				// 		if (m.geometry) {
				// 			m.geometry.dispose();
				// 		}
				// 	});
				// 	navigateTo(fsEntry.fullPath);
				// 	controls.reset();
				// }
			}
		}
	};

	THREE.Object3D.prototype.tick = function(t, dt) {
		if (this.ontick) this.ontick(t, dt);
		for (var i=0; i<this.children.length; i++) {
			this.children[i].tick(t, dt);
		}
	};

	window.searchTree = function(query, fileTree, results) {
		if (query.every(function(re) { return re.test(fileTree.title); })) {
			results.push({fsEntry: fileTree, line: 0, lineCount: 0});
		}
		for (var i in fileTree.entries) {
			searchTree(query, fileTree.entries[i], results);
		}
		return results;
	};

	var highlightLater = [];
	var addHighlightedLine = function(fsEntry, line, lineCount) {
		if (fsEntry.textHeight) {
			var geo = searchHighlights.geometry;
			var index = searchHighlights.index;
			searchHighlights.index++;

			const lineBottom = fsEntry.textYZero - ((line+1) / lineCount) * fsEntry.textHeight;
			const lineTop    = fsEntry.textYZero - (line     / lineCount) * fsEntry.textHeight;
			var c0 = new THREE.Vector3(fsEntry.x, 					lineBottom, fsEntry.z);
			var c1 = new THREE.Vector3(fsEntry.x + fsEntry.scale, 	lineBottom, fsEntry.z);
			var c2 = new THREE.Vector3(fsEntry.x + fsEntry.scale, 	lineTop, 	fsEntry.z);
			var c3 = new THREE.Vector3(fsEntry.x, 					lineTop, 	fsEntry.z);

			c0.applyMatrix4(model.matrixWorld);
			c1.applyMatrix4(model.matrixWorld);
			c2.applyMatrix4(model.matrixWorld);
			c3.applyMatrix4(model.matrixWorld);

			var off = index * 4;

			geo.vertices[off++].copy(c0);
			geo.vertices[off++].copy(c1);
			geo.vertices[off++].copy(c2);
			geo.vertices[off++].copy(c3);

			geo.verticesNeedUpdate = true;
		} else {
			highlightLater.push([fsEntry, line, lineCount]);
		}
	};
	var searchHighlights = new THREE.Mesh(new THREE.Geometry(), new THREE.MeshBasicMaterial({
		side: THREE.DoubleSide,
		color: 0xff0000,
		opacity: 0.33,
		transparent: true,
		depthTest: false,
		depthWrite: false
	}));
	searchHighlights.frustumCulled = false;
	for (var i=0; i<40000; i++) {
		searchHighlights.geometry.vertices.push(new THREE.Vector3());
	}
	for (var i=0; i<10000; i++) {
		var off = i * 4;
		searchHighlights.geometry.faces.push(
			new THREE.Face3(off, off+1, off+2),
			new THREE.Face3(off, off+2, off+3)
		);
	}
	searchHighlights.ontick = function() {
		if (highlightLater.length > 0) {
			highlightLater.splice(0).forEach(args => addHighlightedLine.apply(null, args));
		}
	}
	var clearSearchHighlights = function() {
		var geo = searchHighlights.geometry;
		var verts = geo.vertices;
		for (var i=0; i<verts.length; i++){
			var v = verts[i];
			v.x = v.y = v.z = 0;
		}
		geo.verticesNeedUpdate = true;
		searchHighlights.index = 0;
		highlightLater = [];
		changed = true;
	};


	var highlightedResults = [];
	window.highlightResults = function(results) {
		var ca = model.geometry.attributes.color;
		highlightedResults.forEach(function(highlighted) {
			Geometry.setColor(ca.array, highlighted.fsEntry.index, Colors[highlighted.fsEntry.entries === null ? 'getFileColor' : 'getDirectoryColor'](highlighted.fsEntry), 0);
		});
		clearSearchHighlights();
		for (var i = 0; i < results.length; i++) {
			var fsEntry = results[i].fsEntry;
			if (fsEntry.entries !== null && results[i].line === 0) {
				Geometry.setColor(ca.array, fsEntry.index, fsEntry.entries === null ? [1,0,0] : [0.6, 0, 0], 0);
			} else if (fsEntry.entries === null && results[i].line > 0) {
				addHighlightedLine(fsEntry, results[i].line, results[i].lineCount);
			}
		}
		highlightedResults = results;
		ca.needsUpdate = true;
		changed = true;
	};

	var searchResultsTimeout;
	window.search = function(query, rawQuery) {
		var lunrResults = [];
		if (window.SearchIndex) {
			console.time('token search');
			lunrResults = window.SearchIndex.search(rawQuery);
			lunrResults = lunrResults.map(function(r) {
				const lineNumberMatch = r.ref.match(/:(\d+)\/(\d+)$/);
				const [_, lineStr, lineCountStr] = (lineNumberMatch || ['0','0','0']); 
				const line = parseInt(lineStr);
				const lineCount = parseInt(lineCountStr);
				return {fsEntry: getPathEntry(window.FileTree, r.ref.replace(/:\d+\/\d+$/, '')), line, lineCount};
			});
			console.timeEnd('token search');
		}
		window.highlightResults(window.searchTree(query, window.FileTree, lunrResults));
		updateSearchLines();
		clearTimeout(searchResultsTimeout);
		searchResultsTimeout = setTimeout(populateSearchResults, 200);
	};

	var screenPlane = new THREE.Mesh(new THREE.PlaneBufferGeometry(2000,2000), new THREE.MeshBasicMaterial({ color: 0xff00ff }));
	screenPlane.visible = false;
	screenPlane.position.z = 0.75;
	scene.add(screenPlane);

	var addScreenLine = function(geo, fsEntry, bbox, index, line, lineCount) {
		var a = new THREE.Vector3(fsEntry.x, fsEntry.y, fsEntry.z);
		a.applyMatrix4(model.matrixWorld);
		var b = a;

		var av = new THREE.Vector3(a.x + 0.05 * fsEntry.scale, a.y + 0.05 * fsEntry.scale, a.z);

		var off = index * 4;
		if (!bbox || bbox.bottom < 0 || bbox.top > window.innerHeight) {
			var bv = new THREE.Vector3(b.x - fsEntry.scale*0.075, av.y + 0.05*fsEntry.scale + 3.15*0.05, av.z);
			var aUp = new THREE.Vector3(av.x - fsEntry.scale*0.075, av.y + 0.05*fsEntry.scale, av.z);
			// geo.vertices[off++].set(-100,-100,-100);
			// geo.vertices[off++].set(-100,-100,-100);
			// geo.vertices[off++].set(-100,-100,-100);
			// geo.vertices[off++].set(-100,-100,-100);
			// geo.vertices[off++].set(-100,-100,-100);
			// geo.vertices[off++].set(-100,-100,-100);
			// return;
		} else {
			screenPlane.visible = true;
			var intersections = utils.findIntersectionsUnderEvent({clientX: bbox.left, clientY: bbox.top+24, target: renderer.domElement}, camera, [screenPlane]);
			screenPlane.visible = false;
			var b = intersections[0].point;
			var bv = new THREE.Vector3(b.x, b.y, b.z);
			var aUp = new THREE.Vector3(av.x, av.y, av.z);
			if (line > 0 && fsEntry.textHeight) {
				const textYOff = ((line+0.5) / lineCount) * fsEntry.textHeight;
				const textLinePos = new THREE.Vector3(fsEntry.textXZero, fsEntry.textYZero - textYOff, fsEntry.z);
				textLinePos.applyMatrix4(model.matrixWorld);
				aUp = av = textLinePos;
			}
		}

		geo.vertices[off++].copy(av);
		geo.vertices[off++].copy(aUp);
		geo.vertices[off++].copy(aUp);
		geo.vertices[off++].copy(bv);
	};
	var searchLine = new THREE.LineSegments(new THREE.Geometry(), new THREE.LineBasicMaterial({
		color: 0xff0000,
		opacity: 1,
		transparent: true,
		depthTest: false,
		depthWrite: false
		// linewidth: 2 * (window.devicePixelRatio || 1)
	}));
	searchLine.frustumCulled = false;
	searchLine.geometry.vertices.push(new THREE.Vector3());
	searchLine.geometry.vertices.push(new THREE.Vector3());
	for (var i=0; i<40000; i++) {
		searchLine.geometry.vertices.push(new THREE.Vector3(
			-100,-100,-100
		));
	}
	var updateSearchLines = function() {
		clearSearchLine();
		// searchLine.geometry.vertices.forEach(function(v) { v.x = v.y = v.z = -100; });
		var lis = [].slice.call(window.searchResults.querySelectorAll('li'));
		if (lis.length <= searchLine.geometry.vertices.length/4) {
			for (var i=0, l=lis.length; i<l; i++) {
				var bbox = null;
				var li = lis[i];
				if (li && li.classList.contains('hover') && !li.result.lineResults) {
					searchLine.hovered = true;
					bbox = li.getBoundingClientRect();
				}
				if (li) addScreenLine(searchLine.geometry, li.result.fsEntry, bbox, i, li.result.line, li.result.lineCount);
			}
		}
		if (i > 0 || i !== searchLine.lastUpdate) {
			searchLine.geometry.verticesNeedUpdate = true;
			changed = true;
			searchLine.lastUpdate = i;
		}
		if (window.LineModel) {
			window.LineModel.visible = highlightedResults.length === 0;
		}
	};
	searchLine.hovered = false;
	searchLine.ontick = function() {
		if (window.searchResults.querySelector('.hover') || searchLine.hovered) {
			updateSearchLines();
		}
	};
	var clearSearchLine = function() {
		var geo = searchLine.geometry;
		var verts = geo.vertices;
		for (var i=0; i<verts.length; i++){
			var v = verts[i];
			v.x = v.y = v.z = 0;
		}
		geo.verticesNeedUpdate = true;
		changed = true;
	};

	var createResultLink = function(result) {
		const {fsEntry, line} = result;
		const li = document.createElement('li');
		const title = document.createElement('div');
		title.className = 'searchTitle';
		title.textContent = fsEntry.title;
		if (line > 0) {
			title.textContent += ":" + line;
		}
		const fullPath = document.createElement('div');
		fullPath.className = 'searchFullPath';
		fullPath.textContent = getFullPath(fsEntry).replace(/^\/[^\/]*\/[^\/]*\//, '/');
		li.result = result;
		li.addEventListener('mouseover', function(ev) {
			this.classList.add('hover');
			changed = true;
		}, false);
		li.addEventListener('mouseout', function(ev) {
			this.classList.remove('hover');
			changed = true;
		}, false);
		li.onclick = function(ev) {
			ev.preventDefault();
			ev.stopPropagation();
			if (this.result.line > 0) {
				goToFSEntryTextAtLine(this.result.fsEntry, model, this.result.line, this.result.lineCount);
			} else {
				goToFSEntry(this.result.fsEntry, model);
			}
			// Zoom into the line for the result once the fsEntry contents have been loaded.
			// (You may be able to hack this by zooming into layout y-coord at lineNum / totalLines)
			// Highlight the line and the hit text in fsEntry contents.
			// How to add line-column info to search results?
			// Prioritize full word content hits, offer prefix/suffix/infix hits last
			// Hit list, shrink results not in view
			// Replace click-file-to-go-to-github with click-file-to-zoom-text-to-screen-width
		};
		li.appendChild(title);
		li.appendChild(fullPath);
		return li;
	};

	var populateSearchResults = function() {
		window.searchResults.innerHTML = '';
		if (window.innerWidth > 800) {
			const results = [];
			const resIndex = {};
			for (var i=0; i<highlightedResults.length; i++) {
				const r = highlightedResults[i];
				const fullPath = getFullPath(r.fsEntry);
				if (!resIndex[fullPath]) {
					const result = {fsEntry: r.fsEntry, line: 0, lineCount: 0, lineResults: []};
					resIndex[fullPath] = result;
					results.push(result);
				}
				if (r.line > 0) resIndex[fullPath].lineResults.push(r);
			}
			results.forEach(r => r.lineResults.sort((a,b) => a.line - b.line));
			for (var i=0; i<results.length; i++) {
				const result = results[i];
				const li = createResultLink(result);
				if (result.lineResults) {
					const ul = document.createElement('ul');
					result.lineResults.forEach(r => ul.appendChild(createResultLink(r)));
					li.appendChild(ul);
				}
				window.searchResults.appendChild(li);
			}
		}
		updateSearchLines();
		changed = true;
	};
	window.searchResults.onscroll = function() {
		changed = true;
	};

	window.searchInput.oninput = function() {
		if (this.value === '' && highlightedResults.length > 0) {
			window.searchResults.innerHTML = '';
			window.highlightResults([]);
			updateSearchLines();
		} else if (this.value === '') {
			window.searchResults.innerHTML = '';
			updateSearchLines();
		} else {
			var segs = this.value.split(/\s+/);
			var re = segs.map(function(r) { return new RegExp(r, "i"); });
			window.search(re, this.value);
		}
	};

	var tmpM4 = new THREE.Matrix4();
	var lastFrameTime = performance.now();
	window.animating = false;
	window.currentFrame = 0;
	var render = function() {
		var visCount = 0;
		scene.remove(searchLine);
		scene.add(searchLine);
		scene.remove(searchHighlights);
		scene.add(searchHighlights);
		scene.updateMatrixWorld(true);
		var t = performance.now();
		scene.tick(t, t - lastFrameTime);
		lastFrameTime = t;
		// scene.traverse(function(m) {
		// 	tmpM4.multiplyMatrices(camera.matrixWorldInverse, m.matrixWorld);
		// 	tmpM4.multiplyMatrices(camera.projectionMatrix, tmpM4);
		// 	if (
		// 		m.modelType === 'name' && (tmpM4.elements[0]/tmpM4.elements[15] < 0.01 || tmpM4.elements[5]/tmpM4.elements[15] < 0.1)
		// 		//|| m.modelType !== 'name' && (tmpM4.elements[0]/tmpM4.elements[15] < 0.001 || tmpM4.elements[5]/tmpM4.elements[15] < 0.001)
		// 	) {
		// 		m.visible = false;
		// 	} else {
		// 		m.visible = true;
		// 		visCount++;
		// 	}
		// });
		// console.log(visCount);
		renderer.render(scene, camera);
		window.currentFrame++;
	};

	var changed = true;

	camera.targetPosition = new THREE.Vector3().copy(camera.position);
	camera.targetFOV = camera.fov;
	var previousFrameTime = performance.now();
	var tick = function() {
		var currentFrameTime = performance.now();
		var dt = currentFrameTime - previousFrameTime;
		previousFrameTime += dt;
		if (dt < 16) {
			dt = 16;
		}

		if (camera.targetPosition.x !== camera.position.x || camera.targetPosition.y !== camera.position.y || camera.fov !== camera.targetFOV) {
			camera.position.x += (camera.targetPosition.x - camera.position.x) * (1-Math.pow(0.85, dt/16));
			camera.position.y += (camera.targetPosition.y - camera.position.y) * (1-Math.pow(0.85, dt/16));
			if (Math.abs(camera.position.x - camera.targetPosition.x) < camera.fov*0.00001) {
				camera.position.x = camera.targetPosition.x;
			}
			if (Math.abs(camera.position.y - camera.targetPosition.y) < camera.fov*0.00001) {
				camera.position.y = camera.targetPosition.y;
			}
			camera.fov += (camera.targetFOV - camera.fov) * (1-Math.pow(0.85, dt/16));
			if (Math.abs(camera.fov - camera.targetFOV) < camera.targetFOV / 1000) {
				camera.fov = camera.targetFOV;
			}
			camera.updateProjectionMatrix();
			changed = true;
			animating = true;
		} else {
			animating = false;
		}
		if (changed || animating) render();
		changed = false;
		window.requestAnimationFrame(tick);
	};

	tick();

	var fullscreenButton = document.getElementById('fullscreen');
	if (fullscreenButton && (document.exitFullscreen||document.webkitExitFullscreen||document.webkitExitFullScreen||document.mozCancelFullScreen||document.msExitFullscreen)) {
		fullscreenButton.onclick = function() {
			var d = document;
			if (d.fullscreenElement||d.webkitFullscreenElement||d.webkitFullScreenElement||d.mozFullScreenElement||d.msFullscreenElement) {
				(d.exitFullscreen||d.webkitExitFullscreen||d.webkitExitFullScreen||d.mozCancelFullScreen||d.msExitFullscreen).call(d);
			} else {
				var e = document.body;
				(e.requestFullscreen||e.webkitRequestFullscreen||e.webkitRequestFullScreen||e.mozRequestFullScreen||e.msRequestFullscreen).call(e);
			}
		}
		if (window.navigator.standalone === true) {
			fullscreenButton.style.opacity = '0';
		}
	} else if (fullscreenButton) {
		fullscreenButton.style.opacity = '0';
	}
	window.git.focus();
}
