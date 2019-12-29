import { faSlidersH } from '@fortawesome/free-solid-svg-icons';
import { EALREADY } from 'constants';

const apiPrefix = 'http://localhost:8008/_';
const repoPrefix = 'v8/v8';
const MAX_COMMITS = 1000;

const THREE = require('three');
global.THREE = THREE;

var utils = require('./utils.js');
var Geometry = require('./Geometry.js');
var Colors = require('./Colors.js').default;
var Layout = require('./Layout.js');
var createText = require('./lib/third_party/three-bmfont-text-modified');
var SDFShader = require('./lib/third_party/three-bmfont-text-modified/shaders/sdf');
var loadFont = require('load-bmfont');
var lunr = require('./lib/third_party/lunr.js');

window.lunr = lunr;


THREE.Object3D.prototype.tick = function(t, dt) {
	if (this.ontick) this.ontick(t, dt);
	for (var i=0; i<this.children.length; i++) {
		this.children[i].tick(t, dt);
	}
};

export default function init () {

	var animating = false;
	var currentFrame = 0;

	(function() {
		var input = document.createElement('input');
		input.type = 'file';
		if ((input.webkitdirectory === undefined && input.directory === undefined)) {
			document.body.classList.add('no-directory');
		}
		if ((/mobile/i).test(window.navigator.userAgent)) {
			document.body.classList.add('no-directory');
			document.body.classList.add('mobile');
		}
	})();

	var loadFontImage = function (opt, cb) {
		loadFont(opt.font, function (err, font) {
			if (err) throw err;
			new THREE.TextureLoader().load(opt.image, function (tex) {
				cb(font, tex);
			});
		});
	};

	// load up a 'fnt' and texture
	loadFontImage({
		font: 'fnt/DejaVu-sdf.fnt',
		image: 'fnt/DejaVu-sdf.png'
	}, start)

	function start(font, fontTexture) {

		// Scene setup
		{
			var renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
			renderer.domElement.id = 'renderCanvas';
			renderer.setPixelRatio( window.devicePixelRatio || 1 );
			renderer.setClearColor(Colors.backgroundColor, 1);
			document.body.appendChild(renderer.domElement);

			var scene = new THREE.Scene();

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

			var model;
			var processModel;

			var modelTop = new THREE.Object3D();
			modelTop.position.set(-0.5, -0.5, 0.0);
			var modelPivot = new THREE.Object3D();
			modelPivot.rotation.x = -0.5;
			// modelPivot.rotation.z = 0;
			modelPivot.position.set(0.5, 0.5, 0.0);
			scene.add(modelTop);
			modelTop.add(modelPivot);
		}

		// Text functions
		{
			Layout.font = font;

			var makeTextMaterial = function(palette) {
				if (!palette || palette.length < 8) {
					palette = [].concat(palette || []);
					while (palette.length < 8) {
						palette.push(palette[palette.length-1] || Colors.textColor);
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
					minScale = 1000; maxScale = 0;
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

			var countChars = function(s,charCode) {
				var j = 0;
				for (var i=0; i<s.length; i++) {
					if (s.charCodeAt(i) === charCode) j++;
				}
				return j;
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
		}

		// File tree functions
		{
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

			var getFullPath = function(fsEntry) {
				if (!fsEntry.parent) return '';
				return getFullPath(fsEntry.parent) + '/' + fsEntry.name;
			};

			var getSiblings = function(fileTree, path) {
				path = path.replace(/\/[^\/]+\/*$/, '');
				var fsEntry = getPathEntry(fileTree, path);
				return Object.keys(fsEntry.entries).map(n => path +'/'+ n);
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
				var parr = new Float32Array(vertCount);
				var uarr = new Float32Array(vertCount/2);
				var j = 0;
				labels.traverse(function(c) {
					if (c.geometry) {
						parr.set(c.geometry.attributes.position.array, j);
						uarr.set(c.geometry.attributes.uv.array, j/2);
						j += c.geometry.attributes.position.array.length;
					}
				});

				bigGeo.setAttribute('position', new THREE.BufferAttribute(parr, 4));
				bigGeo.setAttribute('uv', new THREE.BufferAttribute(uarr, 2));

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
						if (!Geometry.quadInsideFrustum(fsEntry.index, this, camera) || fsEntry.scale * 50 / Math.max(camera.fov, camera.targetFOV) < 0.2) {
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
							} else if (o.scale * 50 / Math.max(camera.fov, camera.targetFOV) > 0.2) {
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
											img.crossOrigin = 'anonymous';
											img.src = apiPrefix+'/repo/file'+fullPath;
											img.obj = obj3;
											img.onload = function() {
												if (this.obj.parent) {
													var canvas = document.createElement('canvas');
													var maxD = Math.max(this.width, this.height);
													this.obj.scale.x *= this.width/maxD;
													this.obj.scale.y *= this.height/maxD;
													this.obj.material = new THREE.MeshBasicMaterial({
														map: new THREE.Texture(this),
														transparent: true,
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
											xhr.open('GET', apiPrefix+'/repo/file'+fullPath, true);
											xhr.obj = obj3;
											xhr.fsEntry = o;
											xhr.fullPath = fullPath;
											xhr.onload = function() {
												if (this.responseText.length < 3e5 && this.obj.parent) {
													var contents = this.responseText;
													if (contents.length === 0) return;

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

														const lineCount = contents.split("\n").length;
														self.fsEntry.lineCount = lineCount;

														if (self.fsEntry.targetLine) {
															const {line} = self.fsEntry.targetLine;
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
					updateSearchResults(navigationTarget);
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
				var parr = new Float32Array(vertCount);
				var uarr = new Float32Array(vertCount/2);
				var j = 0;
				labels.traverse(function(c) {
					if (c.geometry) {
						parr.set(c.geometry.attributes.position.array, j);
						uarr.set(c.geometry.attributes.uv.array, j/2);
						j += c.geometry.attributes.position.array.length;
					}
				});

				bigGeo.setAttribute('position', new THREE.BufferAttribute(parr, 4));
				bigGeo.setAttribute('uv', new THREE.BufferAttribute(uarr, 2));

				var bigMesh = new THREE.Mesh(bigGeo, textMaterial);

				var mesh = new THREE.Mesh(
					geo,
					new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: THREE.VertexColors })
				);
				mesh.fileTree = fileTree;
				mesh.material.side = THREE.DoubleSide;
				mesh.add(bigMesh);
				mesh.add(thumbnails);
				return mesh;
			};

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

			var navigateTo = function(url, onSuccess, onFailure) {
				window.SearchIndex = null;

				utils.loadFiles(url, function(fileTree) {
					setLoaded(true);
					showFileTree(fileTree);
					if (onSuccess) onSuccess();
				}, onFailure, repoPrefix+'/');
			};

			var navigateToList = function(text, onSuccess, onFailure) {
				utils.loadFromText(text, function(fileTree) {
					setLoaded(true);
					showFileTree(fileTree);
					if (onSuccess) onSuccess();
				}, onFailure, repoPrefix+'/');
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
				camera.targetFOV = fsEntry.scale * fsEntry.textScale * 1500 * 50;
				fsEntry.textFOV = camera.targetFOV;
			};

			var goToFSEntryTextAtLine = function(fsEntry, model, line) {
				if (!fsEntry.textHeight) {
					fsEntry.targetLine = {line};
					return goToFSEntry(fsEntry, model);
				}
				const textYOff = ((line+0.5) / fsEntry.lineCount) * fsEntry.textHeight;
				scene.updateMatrixWorld();
				var textX = fsEntry.textX;
				textX += (fsEntry.scale * fsEntry.textScale) * window.innerWidth / 2;
				var fsPoint = new THREE.Vector3(textX, fsEntry.textYZero - textYOff, fsEntry.z);
				fsPoint.applyMatrix4(model.matrixWorld);
				camera.targetPosition.copy(fsPoint);
				camera.targetFOV = fsEntry.scale * fsEntry.textScale * 1500 * 50;
				fsEntry.textFOV = camera.targetFOV;
			};
		}

		// Running processes tree
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

		var breadcrumbPath = '';
		// Breadcrumb
		var updateBreadCrumb = function(path) {
			if (path === breadcrumbPath) return;
			breadcrumbPath = path;
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
							console.log('removed', link.path);
							this.parentNode.removeChild(this);
						}
					};
					[].slice.call(this.parentNode.querySelectorAll('ul')).forEach(u => u.parentNode.removeChild(u));
					this.appendChild(ul);
				};
				link.onmouseout = function(ev) {
					var ul = this.querySelector('ul');
					if (ev.target === this && ev.relatedTarget !== this.parentNode &&
						ul && !ul.contains(ev.relatedTarget)
					) {
						console.log('removed ul', link.path);
						this.removeChild(ul);
					}
				};
				el.appendChild(link);
			}
		};

		// Line drawing
		{
			var addLine = function(geo, processPath) {
				var a = getPathEntry(window.ProcessTree, processPath);
				var b = getPathEntry(window.FileTree, processPath.replace(/^\/\d+\/files/, '').replace(/\:/g, '/'));
				if (a && b) {
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
				var index = geo.vertices.length;

				if (!entryA.outgoingLines) entryA.outgoingLines = [];
				entryA.outgoingLines.push({src: {model: modelA, entry: entryA}, dst: {model:modelB, entry:entryB}, index, color});
				if (!entryB.outgoingLines) entryB.outgoingLines = [];
				entryB.outgoingLines.push({src: {model: modelB, entry: entryB}, dst: {model:modelA, entry:entryA}, index, color});

				geo.vertices.push(new THREE.Vector3());
				geo.vertices.push(new THREE.Vector3());
				geo.vertices.push(new THREE.Vector3());
				geo.vertices.push(new THREE.Vector3());
				geo.vertices.push(new THREE.Vector3());
				geo.vertices.push(new THREE.Vector3());

				if (color) {
					geo.colors.push(color, color, color, color, color, color);
				}
			};

			var updateLineBetweenEntries =  function(geo, index, color, modelA, entryA, modelB, entryB) {
				var a = entryA;
				var b = entryB;

				var av = new THREE.Vector3(a.x, a.y, a.z);
				av.applyMatrix4(modelA.matrix);

				var bv = new THREE.Vector3(b.x, b.y, b.z);
				bv.applyMatrix4(modelB.matrix);

				var aUp = new THREE.Vector3(av.x+(bv.x-av.x)*0.1, av.y+(bv.y-av.y)*0.1, Math.max(av.z, bv.z) + 0.1);
				var bUp = new THREE.Vector3(bv.x-(bv.x-av.x)*0.1, bv.y-(bv.y-av.y)*0.1, Math.max(av.z, bv.z) + 0.1);

				geo.vertices[index++].copy(av);
				geo.vertices[index++].copy(aUp);
				geo.vertices[index++].copy(aUp);
				geo.vertices[index++].copy(bUp);
				geo.vertices[index++].copy(bUp);
				geo.vertices[index++].copy(bv);
				geo.verticesNeedUpdate = true;

				if (color) {
					index -= 6;
					geo.colors[index++].copy(color);
					geo.colors[index++].copy(color);
					geo.colors[index++].copy(color);
					geo.colors[index++].copy(color);
					geo.colors[index++].copy(color);
					geo.colors[index++].copy(color);
				}
			};

			var showLinesForEntry = function(geo, entry, depth=0, recurse=true, avoidModel=null, first=true) {
				if (first) for (var i = 0; i < geo.vertices.length; i++) geo.vertices[i].set(-100,-100,-100);
				if (entry.outgoingLines) {
					entry.outgoingLines.forEach(l => {
						if (l.dst.model !== avoidModel) updateLineBetweenEntries(geo, l.index, l.color, l.src.model, l.src.entry, l.dst.model, l.dst.entry);
						if (depth > 0) showLinesForEntry(geo, l.dst.entry, depth-1, false, l.src.model, false);
					});
				}
				if (recurse) {
					for (let e in entry.entries) {
						showLinesForEntry(geo, entry.entries[e], depth, recurse, avoidModel, false);
					}
				}
			};
		}

		// Git commits and authors
		{
			var authorModel, connectionLines;
			var processXHR;

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
						var lines = c.split('\n');
						while (lines[lines.length-1] === '') lines.pop();
						var hash = lines[0];
						if (!commitIndex[hash]) {
							// console.log(hash, index, c);
						} else {
							commitIndex[hash].files = lines.slice(1).map(function(fs) {
								const [action, path, renamed] = fs.split(/\t/);
								return {action, path, renamed};
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
				var commitIndex
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

				var touchedFilesIndex = {};

				for (var i in window.CommitTree.tree.entries.Commits.entries) {
					var commitFSEntry = window.CommitTree.tree.entries.Commits.entries[i];
					utils.traverseFSEntry(commitFSEntry, function(fsEntry, fullPath) {
						if (/^\/Commits\/.{40}\/Files\//.test(fullPath) && fsEntry.entries === null) {
							var sha = fullPath.substring(9, 49);
							var path = fullPath.substring(55);
							var filePath = repoPrefix + path;
							var fileEntry = getPathEntry(window.FileTree, filePath);
							if (fileEntry) {
								if (!touchedFilesIndex[filePath]) touchedFilesIndex[filePath] = fileEntry;
								var author = authors[commitIndex[sha].author.name];
								addLineBetweenEntries(lineGeo, author.color, processModel, commitFSEntry, model, fileEntry);
							}
						}
					}, window.CommitTree.tree.name+"/Commits/");
				}
				var touchedFiles = Object.keys(touchedFilesIndex).sort().map(k => touchedFilesIndex[k]);
				lineGeo.vertices.push(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
				lineGeo.colors.push(new THREE.Color(0,0,0), new THREE.Color(0,0,0));
				connectionLines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({
					color: new THREE.Color(1.0, 1.0, 1.0), opacity: 1, transparent: true, depthWrite: false,
					vertexColors: true
				}));
				connectionLines.frustumCulled = false;
				modelPivot.add(connectionLines);
				window.LineModel = connectionLines;
				connectionLines.ontick = function() {
					var cf = (currentFrame / 2) | 0;
					if (false) {
						var aks = Object.keys(authors);
						showCommitsByAuthor(aks[cf % aks.length]);
						changed = true;
					} else if (false) {
						showCommitsForFile(touchedFiles[cf % touchedFiles.length]);
						changed = true;
					} else if (commitsPlaying) {
						var idx = activeCommitSet.length-1-(cf % activeCommitSet.length);
						var c = activeCommitSet[idx];
						var slider = document.getElementById('commitSlider');
						slider.value = idx;
						showCommit(c.sha);
						changed = true;
					}
				};
				changed = true;

				var activeCommitSet = commits;
				
				var showCommit = function(sha) {
					var c = commitIndex[sha];
					showLinesForEntry(lineGeo, commitsFSEntry.entries[sha], 0);
					var commitDetails = document.getElementById('commitDetails');
					commitDetails.textContent = `${sha}\n${c.date.toString()}\n${c.author.name} <${c.author.email}>\n\n${c.message}\n\n${c.files.map(
						({action,path,renamed}) => `${action} ${path}${renamed ? ' '+renamed : ''}`
					).join("\n")}`;
				};

				var showCommitsByAuthor = function(authorName) {
					showLinesForEntry(lineGeo, authors[authorName].fsEntry, 1);
				};

				var showCommitsForFile = function(fsEntry) {
					showLinesForEntry(lineGeo, fsEntry, 1);
				};

				var findCommitsForPath = function(path) {
					path = path.substring(repoPrefix.length + 2);
					return commits.filter(c => c.files.some(f => f.path.startsWith(path)));
				};

				var commitsPlaying = false;

				document.getElementById('playCommits').onclick = function(ev) {
					commitsPlaying = !commitsPlaying;
					changed = true;
				};

				var authorCmp = function(a, b) {
					return a.name.localeCompare(b.name) || a.email.localeCompare(b.email);
				};

				var span = function(className='', content='') {
					var el = document.createElement('span');
					el.className = className;
					el.textContent = content;
					return el;
				};

				var formatDiff = function(diff) {
					const lines = diff.split("\n");
					const container = span();
					lines.forEach(line => {
						var lineClass = '';
						if (line.startsWith("+ ")) lineClass = 'add';
						else if (line.startsWith("- ")) lineClass = 'sub';
						else if (line.startsWith("@@ ")) lineClass = 'pos';
						else if (line.startsWith("--- ")) lineClass = 'prev';
						else if (line.startsWith("+++ ")) lineClass = 'cur';
						container.appendChild(span(lineClass, line));
					});
					return container;
				};

				var updateActiveCommitSetDiffs = function() {
					var el = document.getElementById('activeCommits');
					while (el.firstChild) el.removeChild(el.firstChild);
					activeCommitSet.forEach(c => {
						var div = document.createElement('div');
						var hashSpan = span('commit-hash', c.sha);
						var dateSpan = span('commit-date', c.date.toString());
						var authorSpan = span('commit-author', `${c.author.name} <${c.author.email}>`);
						var messageSpan = span('commit-message', c.message);
						var diffSpan = span('commit-diff', '');
						if (c.diff) diffSpan.appendChild(formatDiff(c.diff));
						div.append(hashSpan, dateSpan, authorSpan, messageSpan, diffSpan);
						el.appendChild(div);
					});
				};

				var updateActiveCommitSetAuthors = function(authors) {
					var el = document.getElementById('authors');
					while (el.firstChild) el.removeChild(el.firstChild);
					authors.forEach(({name, email}) => {
						var div = document.createElement('div');
						var nameSpan = span('author-name', name);
						var emailSpan = span('author-email', email);
						div.append(nameSpan, emailSpan);
						el.appendChild(div);
					});
				};

				document.getElementById('showFileCommits').onclick = function(ev) {
					var fsEntry = getPathEntry(window.FileTree, breadcrumbPath);
					if (fsEntry) {
						activeCommitSet = findCommitsForPath(breadcrumbPath);
						const authors = utils.uniq(activeCommitSet.map(c => c.author), authorCmp);
						updateActiveCommitSetAuthors(authors);
						activeCommitSet.forEach(async c => {
							if (!c.diff) {
								const diff = await (await fetch(apiPrefix + '/repo/diff', {method: 'POST', body: JSON.stringify({repo: repoPrefix, hash: c.sha})})).text();
								c.diff = diff;
								updateActiveCommitSetDiffs();
							}
						});
						showCommitsForFile(fsEntry);
						changed = true;
					}
				};

				document.getElementById('commitSlider').oninput = function(ev) {
					var v = parseInt(this.value);
					if (activeCommitSet[v]) {
						showCommit(activeCommitSet[v].sha);
						changed = true;
					}
				};
				document.getElementById('previousCommit').onclick = function(ev) {
					var slider = document.getElementById('commitSlider');
					var v = parseInt(slider.value) - 1;
					if (activeCommitSet[v]) {
						slider.value = v;
						slider.oninput();
					}
				};
				document.getElementById('nextCommit').onclick = function(ev) {
					var slider = document.getElementById('commitSlider');
					var v = parseInt(slider.value) + 1;
					if (activeCommitSet[v]) {
						slider.value = v;
						slider.oninput();
					}
				};
			};
		}

		// Search
		{
			window.searchTree = function(query, fileTree, results) {
				if (query.every(function(re) { return re.test(fileTree.title); })) {
					results.push({fsEntry: fileTree, line: 0});
					// this.console.log(fileTree);
				}
				for (var i in fileTree.entries) {
					window.searchTree(query, fileTree.entries[i], results);
				}
				return results;
			};

			var searchResultsTimeout;
			var searchQueryNumber = 0;
			window.search = async function(query, rawQuery) {
				clearTimeout(searchResultsTimeout);
				var lunrResults = [];
				if (rawQuery.length > 2) {
					var myNumber = ++searchQueryNumber;
					var res = await fetch(apiPrefix+'/repo/search', {method: "POST", body: JSON.stringify({repo:repoPrefix, query:rawQuery})});
					var lines = (await res.text()).split("\n");
					if (searchQueryNumber !== myNumber) return;
					lunrResults = lines.map(line => {
						const lineNumberMatch = line.match(/^([^:]+):(\d+):(.*)$/);
						if (lineNumberMatch) {
							const [_, filename, lineStr, snippet] = lineNumberMatch;
							const line = parseInt(lineStr);
							return {fsEntry: getPathEntry(window.FileTree, repoPrefix + "/" + filename), line, snippet};
						}
					}).filter(l => l);
				}
				// if (window.SearchIndex) {
				// 	console.time('token search');
				// 	lunrResults = window.SearchIndex.search(rawQuery);
				// 	lunrResults = lunrResults.map(function(r) {
				// 		const lineNumberMatch = r.ref.match(/:(\d+)\/(\d+)$/);
				// 		const [_, lineStr, lineCountStr] = (lineNumberMatch || ['0','0','0']); 
				// 		const line = parseInt(lineStr);
				// 		const lineCount = parseInt(lineCountStr);
				// 		return {fsEntry: getPathEntry(window.FileTree, r.ref.replace(/^\./, repoPrefix).replace(/:\d+\/\d+$/, '')), line, lineCount};
				// 	});
				// 	console.timeEnd('token search');
				// }
				if (rawQuery.length > 2) {
					window.highlightResults(window.searchTree(query, window.FileTree, lunrResults));
				} else {
					window.highlightResults([]);
				}
				updateSearchLines();
				searchResultsTimeout = setTimeout(populateSearchResults, 200);
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
		}

		// Search results box
		{
			var createResultLink = function(result) {
				const {fsEntry, line} = result;
				const li = document.createElement('li');
				li.fullPath = result.fullPath;
				const title = document.createElement('div');
				title.className = 'searchTitle';
				title.textContent = fsEntry.title;
				if (line > 0) {
					title.textContent += ":" + line;
				}
				const fullPath = document.createElement('div');
				fullPath.className = 'searchFullPath';
				fullPath.textContent = li.fullPath.replace(/^\/[^\/]*\/[^\/]*\//, '/');
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
						goToFSEntryTextAtLine(this.result.fsEntry, model, this.result.line, this.result.fsEntry.lineCount);
					} else {
						goToFSEntry(this.result.fsEntry, model);
					}
				};
				li.appendChild(title);
				li.appendChild(fullPath);
				if (result.snippet){
					var snippet = document.createElement('div');
					snippet.className = 'searchSnippet prettyPrint';
					snippet.textContent = result.snippet;
					li.appendChild(snippet);
				}
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
						r.fullPath = fullPath;
						if (!resIndex[fullPath]) {
							const result = {fsEntry: r.fsEntry, line: 0, fullPath, lineResults: []};
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

			var updateSearchResults = function(navigationPath) {
				const lis = [].slice.call(window.searchResults.querySelectorAll('li'));
				for (var i = 0; i < lis.length; i++) {
					const li = lis[i];
					if (li.fullPath.startsWith(navigationPath + '/') || li.fullPath === navigationPath) li.classList.add('in-view');
					else li.classList.remove('in-view');
				}
			};

			window.searchResults.onscroll = function() {
				changed = true;
			};
		}

		// Search highlighting
		{
			var highlightLater = [];
			var addHighlightedLine = function(fsEntry, line) {
				if (fsEntry.textHeight) {
					const lineCount = fsEntry.lineCount;
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
					highlightLater.push([fsEntry, line]);
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
			};
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
						addHighlightedLine(fsEntry, results[i].line);
					}
				}
				highlightedResults = results;
				ca.needsUpdate = true;
				changed = true;
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
				searchLine.hovered = false;
				var lis = [].slice.call(window.searchResults.querySelectorAll('li'));
				if (lis.length <= searchLine.geometry.vertices.length/4) {
					for (var i=0, l=lis.length; i<l; i++) {
						var bbox = null;
						var li = lis[i];
						if (li && li.classList.contains('hover') && !li.result.lineResults) {
							searchLine.hovered = true;
							bbox = li.getBoundingClientRect();
						}
						if (li) {
							addScreenLine(searchLine.geometry, li.result.fsEntry, bbox, i, li.result.line, li.result.fsEntry.lineCount);
						}
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
		}

		// Lunr client-side search index
		{
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

			async function loadLunrIndex(url) {
				const idx = await (await fetch(url)).json();

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

				idx.searchByToken = function(queryToken) {
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

				idx.mergeHits = function(a, b) {
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

				idx.search = function(query) {
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
				};

				return idx;
			}
		}

		// Loading current repo data
		{
			fetch(apiPrefix+'/repo/fs/'+repoPrefix+'/log.txt').then(res => res.text()).then(txt => {
				commitLog = txt;
				loadTick();
			});

			fetch(apiPrefix+'/repo/fs/'+repoPrefix+'/changes.txt').then(res => res.text()).then(txt => {
				commitChanges = txt;
				loadTick();
			});

			navigateTo(apiPrefix+'/repo/fs/'+repoPrefix+'/files.txt', function() {
				// window.SearchIndex = loadLunrIndex(apiPrefix+'/repo/fs/'+repoPrefix+'/index.lunr.json');
				setLoaded(true);
				treeLoaded = true;
				loadTick();
			});

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
		}

		// UI event listeners
		{
			var down = false;
			var previousX, previousY, startX, startY;
			var clickDisabled = false;

			var pinchStart, pinchMid;

			var inGesture = false;

			renderer.domElement.addEventListener('touchstart', function(ev) {
				if (window.searchInput) {
					window.searchInput.blur();
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
				if (window.searchInput) {
					window.searchInput.blur();
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
					if (adx > ady) { xMove = true; yMove = false; }
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

			var highlighted = null;
			window.onmouseup = function(ev) {
				if (down && ev.preventDefault) ev.preventDefault();
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

							goToFSEntry(fsEntry, intersection.object);
						} else {
							if (highlighted.entries === null) {
								var fovDiff = (highlighted.scale * 50) / camera.fov;
								if (fovDiff > 1 || !fsEntry.lineCount) {
									goToFSEntry(highlighted, intersection.object);
								} else {
									goToFSEntryText(highlighted, intersection.object);
								}
							} else {
								goToFSEntry(highlighted, intersection.object);
							}
						}
						changed = true;

						return;
					}
				}
			};
		}

		// Main render loop
		{
			var lastFrameTime = performance.now();
			var render = function() {
				scene.remove(searchLine);
				scene.add(searchLine);
				scene.remove(searchHighlights);
				scene.add(searchHighlights);
				scene.updateMatrixWorld(true);
				var t = performance.now();
				scene.tick(t, t - lastFrameTime);
				lastFrameTime = t;
				renderer.render(scene, camera);
				currentFrame++;
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
				var wasChanged = changed;
				changed = false;
				if (wasChanged || animating) render();
				window.requestAnimationFrame(tick);
			};

			tick();
		}

		// Full screen button
		{
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
		}

		// Focus the search at page load
		window.searchInput.focus();
	}
}