global.THREE = require('three')
var utils = require('./utils.js');
var createText = require('three-bmfont-text')
var SDFShader = require('three-bmfont-text/shaders/sdf')
var loadFont = require('load-bmfont')

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

function start(font, texture) {

	Colors = {
		music: [0.13,0.34,0.17],
		image: [0.13,0.34,0.25],
		document: [0.13,0.14,0.37,1],
		archive: [0.28,0.24,0.2],
		video: [0.13,0.34,0.3],
		exe: [0.28,0.14,0.17],
		unknown: [0.13,0.14,0.17],
		hidden: [0.63,0.64,0.67],

		musicF: [0.13,0.14,0.27],
		imageF: [0.23,0.44,0.57],
		documentF: [0.13,0.14,0.57],
		archiveF: [0.13,0.24,0.27],
		headerF: [0.13,0.44,0.37],
		exeF: [0.43,0.34,0.17],
		objectF: [0.13,0.14,0.17],
		legalF: [0.13,0.14,0.47],
		videoF: [0.13,1.0,0.8],
		unknownF: [0.13,0.14,0.17],
		hiddenF: [0.53,0.54,0.57],

		musicRE: /(^(makefile.*|configure|cmake.*|InfoPlist)|\.(gyp.?|pyt|isolate|json|xcscheme|projitems|shproj|gradle|properties|mp3|m4a|ogg|ogm|aac|flac|mk|xml|cfg|conf|vcxproj|xcconfig|plist|config|in)$)/i,
		imageRE: /\.(ai|c4d|obj|png|gif|psd|tga|webm|jpe?g|svg)$/i,
		documentRE: /(^(Doxyfile|readme))|(\.(pdf|mtl|docx?|pptx?|xaml|txt|html?|pages|dox|md)$)/i,
		archiveRE: /\.(zip|gz|bz2|tar|rar|7z|js|c|cpp|rb|py|pl|php\d?|java|vbs|cs|mm?|hlsl|glsl|vert|frag|vs|fs|cc|ts)$/i,
		objectRE: /\.(a|jar|dylib|lib|pri|so|aar)$/i,
		headerRE: /\.(h|hpp|css|sass|less|scss|d\.ts)$/i,
		exeRE: /\.(sh|exe|bsh|bat)$/i,
		legalRE: /^(OWNERS|LICENSE.*)$/i,
		videoRE: /\.(mp4|avi|mov|m4v|ogv|mpe?g|3gp)$/i,

		musicDirRE: /^music$/i,
		imageDirRE: /^(pictures|photos|images|screenshots|img)$/i,
		documentDirRE: /^(docs?|documentation|html|static)$/i,
		exeDirRE: /^(bin)$/i,
		archiveDirRE: /^(\.git|src)$/i,
		videoDirRE: /^(videos?|movies?)$/i,
		hiddenDirRE: /^\./i,

		getFileColor: function(file) {
			var name = file.name;
			var mimeType = file.mimeType;
			if (mimeType) {
				if (mimeType === 'application/vnd.google-apps.spreadsheet') {
					return this.musicF;
				} else if (mimeType === 'application/vnd.google-apps.document') {
					return this.documentF;
				} else if (mimeType === 'application/vnd.google-apps.map') {
					return this.videoF;
				} else if (mimeType === 'application/vnd.google-apps.photo') {
					return this.imageF;
				} else if (mimeType === 'application/vnd.google-apps.drawing') {
					return this.imageF;
				} else if (mimeType === 'application/vnd.google-apps.presentation') {
					return this.archiveF;
				} else if (mimeType === 'application/vnd.google-apps.script') {
					return this.archiveF;
				} else if (mimeType === 'application/vnd.google-apps.sites') {
					return this.archiveF;
				} else if (/^image/.test(mimeType)) {
					return this.imageF;
				} else if (/^audio/.test(mimeType)) {
					return this.musicF;
				} else if (/^video/.test(mimeType)) {
					return this.videoF;
				}
			}

			if (this.musicRE.test(name)) {
				return this.musicF;
			} else if (this.legalRE.test(name)) {
				return this.legalF;
			} else if (this.imageRE.test(name)) {
				return this.imageF;
			} else if (this.headerRE.test(name)) {
				return this.headerF;
			} else if (this.documentRE.test(name)) {
				return this.documentF;
			} else if (this.archiveRE.test(name)) {
				return this.archiveF;
			} else if (this.exeRE.test(name)) {
				return this.exeF;
			} else if (this.objectRE.test(name)) {
				return this.objectF;
			} else if (this.videoRE.test(name)) {
				return this.videoF;
			} else if (this.hiddenDirRE.test(name)) {
				return this.hiddenF;
			} else {
				return this.unknownF;
			}
		},

		getDirectoryColor: function(file) {
			var name = file.name;
			// if (this.musicDirRE.test(name)) {
			// 	return this.music;
			// } else if (this.imageDirRE.test(name)) {
			// 	return this.image;
			// } else 
			if (this.documentDirRE.test(name)) {
				return this.document;
			} else if (this.archiveDirRE.test(name)) {
				return this.archive;
			// } else if (this.videoDirRE.test(name)) {
			// 	return this.video;
			} else if (this.exeDirRE.test(name)) {
				return this.exe;
			} else if (this.hiddenDirRE.test(name)) {
				return this.hidden;
			} else {
				return this.unknown;
			}
		},
	};

	var setColor = function(verts, index, color, depth) {
		var i = index * 36; //(index * 2 + 1) * 18;
		var dx = color[0], dy = color[1], dz = color[2];
		var f = 1; //((2 + (depth+3) % 8) / 16);
		dx *= f;
		dy *= f;
		dz *= f;
		var x = dx, y = dy, z = dz;
		if (color.length === 3) {
			x = dx * 1.77, y = dy * 1.88, z = dz * 1.85;
		}


		verts[i++] = dx;
		verts[i++] = dy;
		verts[i++] = dz;
		verts[i++] = dx;
		verts[i++] = dy;
		verts[i++] = dz;
		verts[i++] = x;
		verts[i++] = y;
		verts[i++] = z;

		verts[i++] = x;
		verts[i++] = y;
		verts[i++] = z;
		verts[i++] = dx;
		verts[i++] = dy;
		verts[i++] = dz;
		verts[i++] = x;
		verts[i++] = y;
		verts[i++] = z;

		verts[i++] = dx*0.5;
		verts[i++] = dy*0.5;
		verts[i++] = dz*0.5;
		verts[i++] = dx*0.5;
		verts[i++] = dy*0.5;
		verts[i++] = dz*0.5;
		verts[i++] = dx*0.73;
		verts[i++] = dy*0.73;
		verts[i++] = dz*0.73;

		verts[i++] = dx*0.73;
		verts[i++] = dy*0.73;
		verts[i++] = dz*0.73;
		verts[i++] = dx*0.5;
		verts[i++] = dy*0.5;
		verts[i++] = dz*0.5;
		verts[i++] = dx*0.73;
		verts[i++] = dy*0.73;
		verts[i++] = dz*0.73;
	};

	var makeQuad = function(verts, index, x, y, w, h, z) {
//		makeVertQuad(verts, index*2, x, y, w, 0.05, z-0.05);

		var i = index * 36; //(index * 2 + 1) * 18;

		verts[i++] = x;
		verts[i++] = y;
		verts[i++] = z;
		verts[i++] = x + w;
		verts[i++] = y;
		verts[i++] = z;
		verts[i++] = x;
		verts[i++] = y + h;
		verts[i++] = z;

		verts[i++] = x;
		verts[i++] = y + h;
		verts[i++] = z;
		verts[i++] = x + w;
		verts[i++] = y;
		verts[i++] = z;
		verts[i++] = x + w;
		verts[i++] = y + h;
		verts[i++] = z;

		verts[i++] = x + w*0.1;
		verts[i++] = y;
		verts[i++] = z-h*0.2;
		verts[i++] = x + w*0.9;
		verts[i++] = y;
		verts[i++] = z-h*0.2;
		verts[i++] = x;
		verts[i++] = y;
		verts[i++] = z;

		verts[i++] = x;
		verts[i++] = y;
		verts[i++] = z;
		verts[i++] = x + w*0.9;
		verts[i++] = y;
		verts[i++] = z-h*0.2;
		verts[i++] = x + w;
		verts[i++] = y;
		verts[i++] = z;
	};

	var makeVertQuad = function(verts, index, x, y, w, h, z) {
		var i = index * 18;

		verts[i] = x;
		verts[i+1] = y;
		verts[i+2] = z;
		verts[i+3] = x + w;
		verts[i+4] = y;
		verts[i+5] = z;
		verts[i+6] = x;
		verts[i+7] = y;
		verts[i+8] = z + h;

		verts[i+9] = x;
		verts[i+10] = y;
		verts[i+11] = z + h;
		verts[i+12] = x + w;
		verts[i+13] = y;
		verts[i+14] = z;
		verts[i+15] = x + w;
		verts[i+16] = y;
		verts[i+17] = z + h;
	};

	var getPathEntry = function(fileTree, path) {
		path = path.replace(/\/+$/, '');
		var segments = path.split("/");
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

	var textMaterial = new THREE.RawShaderMaterial(SDFShader({
		map: texture,
		side: THREE.DoubleSide,
		transparent: true,
		color: 0xffffff,
		depthTest: false,
		depthWrite: false
	}));

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

	var thumbnailGeo = new THREE.PlaneBufferGeometry(1,1,1,1);
	var createFileTreeQuads = function(fileTree, fileIndex, verts, colorVerts, parentX, parentY, parentZ, parentScale, depth, parentText, thumbnails, index) {
		var dirs = [];
		var files = [];
		for (var i in fileTree.entries) {
			var obj = fileTree.entries[i];
			obj.x = 0;
			obj.y = 0;
			obj.z = 0;
			obj.scale = 0;
			if (obj.entries === null) {
				files.push(obj);
			} else {
				dirs.push(obj);
			}
		}

		var dirCount = dirs.length + (files.length > 0 ? 1 : 0);
		var squareSide = Math.ceil(Math.sqrt(dirCount));

		for (var y=0; y<squareSide; y++) {
			for (var x=0; x<squareSide; x++) {
				var off = y * squareSide + x;
				if (off >= dirCount) {
					break;
				}
				var yOff = 1 - (y+1) * (1/squareSide);
				var xOff = x * (1/squareSide);
				if (off >= dirs.length) {
					var subX = xOff + 0.1 / squareSide;
					var subY = yOff + 0.1 / squareSide;
					var squares = Math.ceil(files.length / 4);
					var squareSidef = Math.ceil(Math.sqrt(squares));
					var fileScale = parentScale * (0.8 / squareSide) ;
					for (var xf=0; xf<squareSidef; xf++) {
						for (var yf=0; yf<squareSidef*4; yf++) {
							var fxOff = xf * (1/squareSidef);
							var fyOff = 1 - ((yf+1)/4) * (1/squareSidef);
							var foff = xf * squareSidef * 4 + yf;
							if (foff >= files.length) {
								break;
							}
							var file = files[foff];
							var fileColor = Colors.getFileColor(file);
							file.x = parentX + parentScale * subX + fileScale * fxOff;
							file.y = parentY + parentScale * subY + fileScale * fyOff;
							file.scale = fileScale * (0.9/squareSidef);
							file.z = parentZ + file.scale * 0.2;
							file.index = fileIndex;
							file.parent = fileTree;
							index[fileIndex] = file;
							setColor(colorVerts, file.index, fileColor, depth);
							makeQuad(verts, file.index, file.x, file.y, file.scale, file.scale*0.25, file.z);
							// file.thumbnail = loadThumbnail(file);
							// if (file.thumbnail) {
							// 	file.thumbnailMesh = new THREE.Mesh(
							// 		thumbnailGeo, 
							// 		new THREE.MeshBasicMaterial({
							// 			map: file.thumbnail,
							// 			transparent: true,
							// 			depthWrite: false
							// 		})
							// 	);
							// 	file.thumbnailMesh.position.set(file.x+file.scale/2, file.y+file.scale/2, file.z+file.scale*0.01);
							// 	file.thumbnailMesh.scale.multiplyScalar(file.scale);
							// 	thumbnails.add(file.thumbnailMesh);
							// }
							fileIndex++;
						}
					}
				} else {
					var dir = dirs[off];
					var subX = xOff + 0.1 / squareSide;
					var subY = yOff; // + 0.1 / squareSide;
					dir.x = parentX + parentScale * subX;
					dir.y = parentY + parentScale * subY;
					dir.scale = parentScale * (0.8 / squareSide);
					dir.z = parentZ + dir.scale * 0.2;
					dir.index = fileIndex;
					dir.parent = fileTree;
					index[fileIndex] = dir;
					var dirColor = Colors.getDirectoryColor(dirs[off]);
					setColor(colorVerts, dir.index, dirColor, depth);
					makeQuad(verts, dir.index, dir.x, dir.y, dir.scale, dir.scale, dir.z);
					fileIndex++;
				}
			}
		}

		if (true || depth < 4) {
			for (var i in fileTree.entries) {
				var obj = fileTree.entries[i];
				var title = obj.title;
				if (title.length > 16) {
					var breakPoint = Math.max(16, Math.floor(title.length / 2));
					title = title.substring(0, breakPoint) + '\n' + title.substring(breakPoint);
				}

				var textGeometry = createText({text: title, font: font});
				var text = new THREE.Mesh(textGeometry, textMaterial);
				var textScaleW = (220/Math.max(textGeometry.layout.width, 220));
				var textScaleH = 0.25 * (textScaleW * textGeometry.layout.height/30);
				text.position.x = obj.x + (obj.entries ? 0 : (obj.scale * 0.02));
				text.position.y = obj.y + (obj.entries ? obj.scale*1.01 : (obj.scale * (0.125-textScaleH*0.175))); // + (obj.entries ? obj.scale : 0.0);
				text.position.z = obj.z;// + 0.15*obj.scale;
				// text.rotation.x = obj.entries ? 1 : 0;
				text.scale.multiplyScalar(obj.scale*0.004*textScaleW*24/22);
				text.scale.y *= -1;
				var arr = textGeometry.attributes.position.array;
				for (var j=0; j<arr.length; j+=4) {
					arr[j] = arr[j] * text.scale.x + text.position.x;
					arr[j+1] = arr[j+1] * text.scale.y + text.position.y;
					arr[j+2] = arr[j+2] * text.scale.z + text.position.z;
				}
				text.position.set(0,0,0);
				text.scale.set(1,1,1);
				var o = new THREE.Object3D();
				if (parentText.children.length === 0) o.isFirst = true;
				o.tick = textTick;
				o.add(text);
				parentText.add(o);
				obj.text = o;
			}
		} else {
			// return;
		}

		for (var j=0; j<dirs.length; j++) {
			var dir = dirs[j];
			fileIndex = createFileTreeQuads(dir, fileIndex, verts, colorVerts, dir.x, dir.y, dir.z, dir.scale, depth+1, dir.text, thumbnails, index);
		}
		return fileIndex;
	};

	var createFileTreeModel = function(fileCount, fileTree) {
		var geo = new THREE.BufferGeometry();
		var verts = new Float32Array(fileCount * 3 * 6 * 2); //* 2);
		var normalVerts = new Float32Array(fileCount * 3 * 6 * 2); //* 2);
		var colorVerts = new Float32Array(fileCount * 3 * 6 * 2); //* 2);
		geo.addAttribute('position', new THREE.BufferAttribute(verts, 3));
		geo.addAttribute('normal', new THREE.BufferAttribute(normalVerts, 3));
		geo.addAttribute('color', new THREE.BufferAttribute(colorVerts, 3));
		// geo.addAttribute('position', new THREE.BufferAttribute(verts, 3));

		for (var i=0; i<normalVerts.length; i+=3) {
			normalVerts[i] = 0;
			normalVerts[i+1] = 0;
			normalVerts[i+2] = -1;
		};

		var fileIndex = 0;

		fileTree.index = [fileTree];

		var labels = new THREE.Object3D();
		var thumbnails = new THREE.Object3D();
		createFileTreeQuads(fileTree, fileIndex, verts, colorVerts, 0, 0, 0, 1, 0, labels, thumbnails, fileTree.index);

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
	renderer.setClearColor(0x000000, 1);
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

	var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1.2, 2.2);

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
	modelPivot.rotation.z = 0;
	modelPivot.position.set(0.5, 0.5, 0.0);
	scene.add(modelTop);
	modelTop.add(modelPivot);

	var showFileTree = function(fileTree) {
		changed = true;
		if (model) {
			model.parent.remove(model);
			model.traverse(function(m) {
				if (m.geometry) {
					m.geometry.dispose();
				}
			});
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
		utils.loadFiles(url, function(fileTree) {
			setLoaded(true);
			showFileTree(fileTree);
			if (onSuccess) onSuccess();
		}, onFailure);
	};

	var ghInput;
	var currentRepoName = null;
	var ghNavTarget = '';
	var ghNavQuery = '';
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
				var xhr = new XMLHttpRequest();
				xhr.open('GET', gitHubAPIURL);
				xhr.onload = function() {
					setLoaded(true);
					var json = JSON.parse(xhr.responseText);
					// console.log(json);
					var paths = json.tree.map(function(file) { return '/' + repoName + '/' + file.path + (file.type === 'tree' ? '/' : ''); });
					// console.log(paths);
					showFileTree(utils.parseFileList('/' + match[5] + '/\n/' + repoName + '/\n' + paths.join("\n") + '\n'));
					camera.targetPosition.x = 0;
					camera.targetPosition.y = 0;
					camera.targetFOV = 50;
					if (ghNavTarget) {
						var fsEntry = getPathEntry(window.FileTree, ghNavTarget);
						if (fsEntry) {
							// console.log("navigating to", fsEntry);
							goToFSEntry(fsEntry);
						}
					}
					window.searchInput.value = ghNavQuery;
					window.searchInput.oninput();
					ghNavTarget = '';
					ghNavQuery = '';
					if (window.history && window.history.replaceState) {
						history.replaceState({}, "", "?github/"+encodeURIComponent(ghInput.value));
					} else {
						location = '#github/'+encodeURIComponent(ghInput.value);
					}
				};
				xhr.onerror = function() {
					setLoaded(true);
				};
				xhr.send();
				ghInput.blur();
				searchInput.blur();
			} else {
				setLoaded(false);
				navigateTo(repoURL, function() {
					setLoaded(true);
					camera.targetPosition.x = 0;
					camera.targetPosition.y = 0;
					camera.targetFOV = 50;
					window.searchInput.value = ghNavQuery;
					window.searchInput.oninput();
					ghNavTarget = '';
					ghNavQuery = '';
					if (window.history && window.history.replaceState) {
						history.replaceState({}, "", "?find/"+encodeURIComponent(ghInput.value));
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
			navigateTo('artoolkit5.txt');
		}
	}
	window.GDriveCallback = showFileTree;

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
	renderer.domElement.onmousewheel = function(ev) {
		if (window.DocFrame) return;
		ev.preventDefault();
		var cx = (ev.clientX - window.innerWidth / 2) * 0.0000575 * camera.fov;
		var cy = (ev.clientY - window.innerHeight / 2) * 0.0000575 * camera.fov;
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
	};

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
		if (fsEntry.id) { // Google Drive file.
			var url = 'https://drive.google.com/file/d/' + fsEntry.id + '/preview';
			openIFrame(url);
		} else {
			// console.log(fsEntry);
			var fullPath = getFullPath(fsEntry);
			// console.log(fullPath);
			var segs = fullPath.split("/");
			var url = 'https://github.com/' + segs.slice(1,3).join("/") + '/blob/master/' + segs.slice(3).join("/");
			// console.log(url);
			window.open(url, '_blank');
		}
	};

	var goToFSEntry = function(fsEntry) {
		scene.updateMatrixWorld();
		var fsPoint = new THREE.Vector3(fsEntry.x + fsEntry.scale/2, fsEntry.y + fsEntry.scale/2, fsEntry.z);
		fsPoint.applyMatrix4(model.matrixWorld);
		camera.targetPosition.copy(fsPoint);
		camera.targetFOV = fsEntry.scale * 50;
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
			var intersections = utils.findIntersectionsUnderEvent(ev, camera, [model]);
			if (intersections.length > 0) {
				var faceIndex = intersections[0].faceIndex;
				var fsEntry = model.fileTree.index[Math.floor(faceIndex / 12)];
				while (fsEntry && fsEntry.scale * camera.projectionMatrix.elements[0] < 0.2) {
					if (fsEntry.parent === highlighted) {
						break;
					}
					fsEntry = fsEntry.parent;
				}
				var off = fsEntry.index * 18 * 3;
				var ca = model.geometry.attributes.color;
				if (highlighted) {
					// setColor(ca.array, highlighted.index, Colors[highlighted.entries === null ? 'getFileColor' : 'getDirectoryColor'](highlighted), 0);
				}
				if (highlighted !== fsEntry) {
					// setColor(ca.array, fsEntry.index, [0.1,0.25,0.5], 0);
					highlighted = fsEntry;
					var targetFOV = fsEntry.scale * 50;
					window.debug.textContent = (targetFOV / camera.fov);
					if (targetFOV / camera.fov <= 1.1 && targetFOV / camera.fov > 0.3 && highlighted.entries === null) {
						if (highlighted.entries === null) {
							// File, let's open it.
							openFile(highlighted);
						}
					} else {
						goToFSEntry(fsEntry);
					}
				} else {
					if (highlighted.entries === null) {
						// File, let's open it.
						openFile(highlighted);
					}
					highlighted = null;
				}
				// ca.needsUpdate = true;
				changed = true;
				// console.log(fsEntry, fsEntry.scale * camera.projectionMatrix.elements[0]);
				return;
				// console.log(fsEntry.fullPath);
				if (fsEntry.entries === null) {
					window.open('http://localhost:8080'+encodeURI(fsEntry.fullPath))
				} else {
					var oldModel = scene.children[1];
					scene.remove(oldModel);
					models = [];
					oldModel.traverse(function(m) {
						if (m.material) {
							if (m.material.map) {
								m.material.map.dispose();
							}
							m.material.dispose();
						}
						if (m.geometry) {
							m.geometry.dispose();
						}
					});
					navigateTo(fsEntry.fullPath);
					controls.reset();
				}
			}
		}
	};

	THREE.Object3D.prototype.tick = function() {
		if (this.ontick) this.ontick();
		for (var i=0; i<this.children.length; i++) {
			this.children[i].tick();
		}
	}

	window.searchTree = function(query, fileTree, results) {
		if (query.every(function(re) { return re.test(fileTree.title); })) {
			results.push(fileTree);
		}
		for (var i in fileTree.entries) {
			searchTree(query, fileTree.entries[i], results);
		}
		return results;
	};

	var highlightedResults = [];
	window.highlightResults = function(results) {
		var ca = model.geometry.attributes.color;
		highlightedResults.forEach(function(highlighted) {
			setColor(ca.array, highlighted.index, Colors[highlighted.entries === null ? 'getFileColor' : 'getDirectoryColor'](highlighted), 0);
		});
		for (var i = 0; i < results.length; i++) {
			var fsEntry = results[i];
			setColor(ca.array, fsEntry.index, fsEntry.entries === null ? [1,0,0] : [0.6, 0, 0], 0);
		}
		highlightedResults = results;
		ca.needsUpdate = true;
		changed = true;
	};

	var searchResultsTimeout;
	window.search = function(query) {
		window.highlightResults(window.searchTree(query, window.FileTree, []));
		updateSearchLines();
		window.searchResults.innerHTML = '';
		clearTimeout(searchResultsTimeout);
		searchResultsTimeout = setTimeout(populateSearchResults, 200);
	};

	var screenPlane = new THREE.Mesh(new THREE.PlaneBufferGeometry(2000,2000), new THREE.MeshBasicMaterial({ color: 0xff00ff }));
	screenPlane.visible = false;
	screenPlane.position.z = 0.75;
	scene.add(screenPlane);

	var addScreenLine = function(geo, fsEntry, bbox, index) {
		var a = new THREE.Vector3(fsEntry.x, fsEntry.y, fsEntry.z);
		a.applyMatrix4(model.matrixWorld);
		var b = a;

		var av = new THREE.Vector3(a.x, a.y, a.z);

		var off = index * 4;
		if (!bbox || bbox.bottom < 0 || bbox.top > window.innerHeight) {
			var bv = new THREE.Vector3(b.x, b.y, b.z);
			var aUp = new THREE.Vector3(av.x, av.y + 0.05/10, av.z + 0.15/10);
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
		}

		geo.vertices[off++].copy(av);
		geo.vertices[off++].copy(aUp);
		geo.vertices[off++].copy(aUp);
		geo.vertices[off++].copy(bv);
	};
	var searchLine = new THREE.LineSegments(new THREE.Geometry(), new THREE.LineBasicMaterial({
		color: 0xff0000,
		opacity: 0.5,
		transparent: true,
		depthTest: false,
		depthWrite: false
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
		if (highlightedResults.length <= searchLine.geometry.vertices.length/4) {
			for (var i=0, l=highlightedResults.length; i<l; i++) {
				var bbox = null;
				var li = window.searchResults.childNodes[i];
				if (li && li.classList.contains('hover')) {
					searchLine.hovered = true;
					bbox = li.getBoundingClientRect();
				}
				addScreenLine(searchLine.geometry, highlightedResults[i], bbox, i);
			}
		}
		if (i > 0 || i !== searchLine.lastUpdate) {
			searchLine.geometry.verticesNeedUpdate = true;
			changed = true;
			searchLine.lastUpdate = i;
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

	var populateSearchResults = function() {
		window.searchResults.innerHTML = '';
		if (window.innerWidth > 800) {
			for (var i=0; i<Math.min(highlightedResults.length, 100); i++) {
				var fsEntry = highlightedResults[i];
				var li = document.createElement('li');
				var title = document.createElement('div');
				title.className = 'searchTitle';
				title.textContent = fsEntry.title;
				var fullPath = document.createElement('div');
				fullPath.className = 'searchFullPath';
				fullPath.textContent = getFullPath(fsEntry).replace(/^\/[^\/]*\/[^\/]*\//, '/');
				li.fsEntry = fsEntry;
				li.addEventListener('mouseover', function() {
					this.classList.add('hover');
					changed = true;
				}, false);
				li.addEventListener('mouseout', function() {
					this.classList.remove('hover');
					changed = true;
				}, false);
				li.onclick = function(ev) {
					ev.preventDefault();
					goToFSEntry(this.fsEntry);
				};
				li.appendChild(title);
				li.appendChild(fullPath);
				window.searchResults.appendChild(li);
			}
		}
		updateSearchLines();
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
			window.search(re);
		}
	};

	var tmpM4 = new THREE.Matrix4();
	var render = function() {
		var visCount = 0;
		scene.remove(searchLine);
		scene.add(searchLine);
		scene.updateMatrixWorld(true);
		scene.tick();
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
			camera.position.x += (camera.targetPosition.x - camera.position.x) * (1-Math.pow(0.95, dt/16));
			camera.position.y += (camera.targetPosition.y - camera.position.y) * (1-Math.pow(0.95, dt/16));
			if (Math.abs(camera.position.x - camera.targetPosition.x) < camera.fov*0.00001) {
				camera.position.x = camera.targetPosition.x;
			}
			if (Math.abs(camera.position.y - camera.targetPosition.y) < camera.fov*0.00001) {
				camera.position.y = camera.targetPosition.y;
			}
			camera.fov += (camera.targetFOV - camera.fov) * (1-Math.pow(0.95, dt/16));
			if (Math.abs(camera.fov - camera.targetFOV) < camera.targetFOV / 1000) {
				camera.fov = camera.targetFOV;
			}
			camera.updateProjectionMatrix();
			changed = true;
		}
		if (changed) render();
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
