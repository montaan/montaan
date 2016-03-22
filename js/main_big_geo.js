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
		directory: [0.8,0.8,0.8],
		music: [0.1,0.7,0.0],
		image: [0.3,0.6,1],
		document: [0.75,0.07,0.05],
		archive: [0.7,0.5,0.05],
		video: [0.0,0.7,0.4],
		unknown: [0.13,0.14,0.17],
		hidden: [0.7,0.77,0.8],

		directoryF: [0.8,0.8,0.8,1],
		musicF: [0.1,0.7,0.0,1],
		imageF: [0.3,0.6,1,1],
		documentF: [0.75,0.07,0.05,1],
		archiveF: [0.7,0.5,0.05,1],
		videoF: [0.0,0.7,0.4,1],
		unknownF: [0.13,0.14,0.17,1],
		hiddenF: [0.7,0.77,0.8,1],

		musicRE: /\.(mp3|m4a|ogg|ogm|aac|flac)$/i,
		imageRE: /\.(png|gif|psd|tga|webm|jpe?g)$/i,
		documentRE: /\.(pdf|docx?|pptx?|txt|html?)$/i,
		archiveRE: /\.(zip|gz|bz2|tar|rar|7z)$/i,
		videoRE: /\.(mp4|avi|mov|m4v|ogv|mpe?g|3gp)$/i,

		musicDirRE: /^music$/i,
		imageDirRE: /^(pictures|photos|images|screenshots|img)$/i,
		documentDirRE: /^(documents|html|css|js)$/i,
		archiveDirRE: /^(downloads|dropbox|public|\.git|applications|system|library|src)$/i,
		videoDirRE: /^(videos|movies)$/i,
		hiddenDirRE: /^\./,

		getFileColor: function(name) {
			if (this.musicRE.test(name)) {
				return this.musicF;
			} else if (this.imageRE.test(name)) {
				return this.imageF;
			} else if (this.documentRE.test(name)) {
				return this.documentF;
			} else if (this.archiveRE.test(name)) {
				return this.archiveF;
			} else if (this.videoRE.test(name)) {
				return this.videoF;
			} else if (this.hiddenDirRE.test(name)) {
				return this.hiddenF;
			} else {
				return this.unknownF;
			}
		},

		getDirectoryColor: function(name) {
			if (this.musicDirRE.test(name)) {
				return this.music;
			} else if (this.imageDirRE.test(name)) {
				return this.image;
			} else if (this.documentDirRE.test(name)) {
				return this.document;
			} else if (this.archiveDirRE.test(name)) {
				return this.archive;
			} else if (this.videoDirRE.test(name)) {
				return this.video;
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

	var createFileTreeQuads = function(fileTree, fileIndex, verts, colorVerts, parentX, parentY, parentZ, parentScale, depth, parentText) {
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
							var fileColor = Colors.getFileColor(file.name);
							file.x = parentX + parentScale * subX + fileScale * fxOff;
							file.y = parentY + parentScale * subY + fileScale * fyOff;
							file.z = parentZ + parentScale * 0.1;
							file.scale = fileScale * (0.9/squareSidef);
							file.index = fileIndex;
							setColor(colorVerts, file.index, fileColor, depth);
							makeQuad(verts, file.index, file.x, file.y, file.scale, file.scale * 0.25, file.z);
							fileIndex++;
						}
					}
				} else {
					var dir = dirs[off];
					var subX = xOff + 0.1 / squareSide;
					var subY = yOff + 0.1 / squareSide;
					dir.x = parentX + parentScale * subX;
					dir.y = parentY + parentScale * subY;
					dir.z = parentZ + parentScale * 0.1;
					dir.scale = parentScale * (0.8 / squareSide);
					dir.index = fileIndex;
					var dirColor = Colors.getDirectoryColor(dirs[off].name);
					setColor(colorVerts, dir.index, dirColor, depth);
					makeQuad(verts, dir.index, dir.x, dir.y, dir.scale, dir.scale, dir.z);
					fileIndex++;
				}
			}
		}

		if (true || depth < 4) {
			for (var i in fileTree.entries) {
				var textGeometry = createText({text: i, font: font});
				var text = new THREE.Mesh(textGeometry, textMaterial);
				var obj = fileTree.entries[i];
				text.position.x = obj.x;
				text.position.y = obj.y + (obj.entries ? obj.scale*1.05 : 0); // + (obj.entries ? obj.scale : 0.0);
				text.position.z = obj.z + 0.15*obj.scale;
				//text.rotation.x = obj.entries ? 1 : 0;
				text.scale.multiplyScalar(obj.scale*0.004*(250/Math.max(textGeometry.layout.width, 200)));
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
			fileIndex = createFileTreeQuads(dir, fileIndex, verts, colorVerts, dir.x, dir.y, dir.z, dir.scale, depth+1, dir.text);
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

		var labels = new THREE.Object3D();
		createFileTreeQuads(fileTree, fileIndex, verts, colorVerts, 0, 0, 0, 1, 0, labels);

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
		mesh.material.side = THREE.DoubleSide;
		mesh.add(bigMesh);
		// mesh.castShadow = true;
		// mesh.receiveShadow = true;
		return mesh;
	};

	var renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
	renderer.domElement.id = 'renderCanvas';
	renderer.setPixelRatio( window.devicePixelRatio || 1 );
	// renderer.setClearColor(0xffffff, 1);
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

	var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 3);

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

	var navigateTo = function(path) {
		utils.loadFiles('artoolkit5.txt', function(fileTree) { // http://localhost:8080'+encodeURI(path)+'?depth=12', function(fileTree) {
			changed = true;
			window.FileTree = fileTree.tree;
			model = createFileTreeModel(fileTree.count, fileTree.tree);
			model.position.set(-0.5, -0.5, 0.0);
			model.rotation.x = -0.5;
			model.rotation.z = 0;
			// model.scale.multiplyScalar(100);
			scene.add(model);
			
			// console.log('ok');

			// processTick();

		});
	};
	// navigateTo('/Users/ilmari/code/artoolkit5');
	window.GDriveCallback = function(fileTree) { // http://localhost:8080'+encodeURI(path)+'?depth=12', function(fileTree) {
		changed = true;
		window.FileTree = fileTree.tree;
		model = createFileTreeModel(fileTree.count, fileTree.tree);
		model.position.set(-0.5, -0.5, 0.0);
		model.rotation.x = -0.5;
		model.rotation.z = 0;
		// model.scale.multiplyScalar(100);
		scene.add(model);
		
		// console.log('ok');

		// processTick();

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

	window.addEventListener('touchstart', function(ev) {
		if (ev.touches.length === 1) {
			window.onmousedown(ev.touches[0]);
		} else if (ev.touches.length === 2) {
			inGesture = true;
			var dx = ev.touches[0].clientX - ev.touches[1].clientX;
			var dy = ev.touches[0].clientY - ev.touches[1].clientY;
			pinchStart = Math.sqrt(dx*dx + dy*dy);
			pinchMid = {
				clientX: ev.touches[1].clientX + dx/2,
				clientY: ev.touches[1].clientY + dy/2,
			};
			window.onmousedown(pinchMid);
		}
	}, false);
	window.addEventListener('touchmove', function(ev) {
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
	window.addEventListener('touchend', function(ev) {
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
	window.addEventListener('touchcancel', function(ev) {
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
	window.onmousedown = function(ev) {
		if (ev.preventDefault) ev.preventDefault();
		down = true;
		clickDisabled = false;
		startX = previousX = ev.clientX;
		startY = previousY = ev.clientY;
	};
	window.onmousemove = function(ev, factor) {
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
			if (Math.abs(ev.clientX - startX) > 5 || Math.abs(ev.clientY - startY) > 5) {
				clickDisabled = true;
			}
			camera.position.x -= factor*dx * camera.fov;
			camera.position.y += factor*dy * camera.fov;
		}
	};
	window.onmouseup = function(ev) {
		if (ev.preventDefault) ev.preventDefault();
		down = false;
	};
	var lastScroll = Date.now();
	var zoomCamera = function(zf, cx, cy) {
		if (zf < 1 || camera.fov < 120) {
			camera.position.x += cx - cx * zf;
			camera.position.y -= cy - cy * zf;
			camera.fov *= zf;
			if (camera.fov > 120) camera.fov = 120;
			camera.updateProjectionMatrix();
			changed = true;
		}
	};
	var prevD = 0;
	window.onmousewheel = function(ev) {
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
		zoomCamera(Math.pow(1.005, d), cx, cy);
		lastScroll = Date.now();
	};

	window.onclick = function(ev) {
		ev.preventDefault();
		if (clickDisabled) {
			return;
		}
		return;
		var target = utils.findObjectUnderEvent(ev, camera, models);
		if (target) {
			var fsEntry = (target.fsEntry || target.parent.fsEntry);
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
	};

	THREE.Object3D.prototype.tick = function() {
		if (this.ontick) this.ontick();
		for (var i=0; i<this.children.length; i++) {
			this.children[i].tick();
		}
	}

	var tmpM4 = new THREE.Matrix4();
	var render = function() {
		var visCount = 0;
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

	var tick = function() {
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
}
