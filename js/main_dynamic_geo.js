(function() {
	var findObjectUnderEvent = function(ev, camera, objects) {

		var style = getComputedStyle(ev.target);
		var elementTransform = style.getPropertyValue('transform');
		var elementTransformOrigin = style.getPropertyValue('transform-origin');

		var xyz = elementTransformOrigin.replace(/px/g, '').split(" ");
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
			var elems = elementTransform.replace(/^matrix3d\(|\)$/ig, '').split(' ');
			for (var i=0; i<16; i++) {
				mat.elements[i] = parseFloat(elems[i]);
			}
		}

		var mat2 = new THREE.Matrix4();
		mat2.makeTranslation(xyz[0], xyz[1], xyz[2]);
		mat2.multiply(mat);
		mat.makeTranslation(-xyz[0], -xyz[1], -xyz[2]);
		mat2.multiply(mat);

		var vec = new THREE.Vector3(ev.layerX, ev.layerY, 0);
		vec.applyMatrix4(mat2);

		var width = parseFloat(style.getPropertyValue('width'));
		var height = parseFloat(style.getPropertyValue('height'));

		var mouse3D = new THREE.Vector3(
			( vec.x / width ) * 2 - 1,
			-( vec.y / height ) * 2 + 1,
			0.5
		);
		mouse3D.unproject( camera );
		mouse3D.sub( camera.position );
		mouse3D.normalize();
		var raycaster = new THREE.Raycaster( camera.position, mouse3D );
		var intersects = raycaster.intersectObjects( objects );
		if ( intersects.length > 0 ) {
			var obj = intersects[ 0 ].object
			return obj;
		}
	};

	var slash = '/'.charCodeAt(0);
	var addFileTreeEntry = function(path, tree) {
		var dir = false;
		if (path.charCodeAt(path.length-1) === slash) {
			dir = true;
		}
		var segments = path.split("/");
		if (dir) {
			segments.pop();
		}
		var branch = tree;
		var parent;
		for (var i=0; i<segments.length-1; i++) {
			var segment = segments[i];
			if (!branch[segment]) {
				branch[segment] = {};
			}
			branch = branch[segment];
		}
		if (!branch[segments[i]]) {
			branch[segments[i]] = dir ? {} : null;
		}
	};

	var parseFileList = function(fileString) {
		console.log("Parsing file string", fileString.length);
		var fileTree = {};
		var name = "";
		var startIndex = 0;
		var fileCount = 0;
		for (var i=0; i<fileString.length; i++) {
			if (fileString.charCodeAt(i) === 10) {
				name = fileString.substring(startIndex, i);
				startIndex = i+1;
				addFileTreeEntry(name, fileTree);
				fileCount++;
			}
		}
		console.log("Parsed files", fileCount);
		return {tree: fileTree, count: fileCount};
	};

	var loadFiles = function(url, callback) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url);
		xhr.onload = function(ev) {
			callback(parseFileList(ev.target.responseText));
		};
		xhr.send();
	};

	var models = [];

	var makeSquareModel = function(name, depth, height) {
		var colorDepth = ((1+depth%8) / 9);
		var height = height || 1;
		if (height < 1) {
			var color = new THREE.Color(colorDepth * 0.6, colorDepth * 0.9, colorDepth * 1.0);
		} else {
			var color = new THREE.Color(colorDepth, colorDepth, colorDepth);
		}
		var model = new THREE.Mesh(
			new THREE.PlaneGeometry(1, height, 1, 1),
			new THREE.MeshBasicMaterial({ color: color})
		);
		if (false && depth < 5) {
			var canvas = document.createElement('canvas');
			var ctx = canvas.getContext('2d');
			ctx.font = ('Arial 16px');
			ctx.fillStyle = 'white';
			var txt = ctx.measureText(name);
			canvas.width = 128; //Math.max(128, Math.pow(2, Math.ceil(Math.log2(txt.width + 4))));
			canvas.height = 32;
			ctx.font = ('Arial 16px');
			ctx.fillStyle = 'white';
			ctx.fillText(name, 2, 30);
			// document.body.appendChild(canvas);
			var h = canvas.height/canvas.width;
			var nameModel = new THREE.Mesh(
				new THREE.PlaneGeometry(1, canvas.height/canvas.width, 1, 1),
				new THREE.MeshBasicMaterial({map: new THREE.Texture(canvas), transparent: true, depthWrite: false})
			);
			nameModel.material.side = THREE.DoubleSide;
			nameModel.material.map.needsUpdate = true;
			nameModel.position.z = 0.03;
			nameModel.position.y = (height - 0.25) * 0.85;
			nameModel.modelType = 'name';
			model.add(nameModel);
		}
		models.push(model);
		model.material.side = THREE.DoubleSide;
		model.position.x = 0.5;
		model.position.y = height * 0.5;
		model.position.z = -0.1;
		return model;
	};

	var makeFileModel = function(files, depth) {
		var rootModel = new THREE.Object3D();
		var squares = Math.ceil(files.length / 4);
		var squareSide = Math.ceil(Math.sqrt(squares));
		for (var x=0; x<squareSide; x++) {
			for (var y=0; y<squareSide*4; y++) {
				var xOff = x * (1/squareSide);
				var yOff = 1 - ((y+1)/4) * (1/squareSide);
				var off = x * squareSide * 4 + y;
				if (off >= files.length) {
					break;
				}
				var model = makeSquareModel(files[off].name, depth, 0.25);
				model.position.set(xOff+0.5/squareSide, yOff+0.125/squareSide, 0);
				model.scale.multiplyScalar(0.9/squareSide);
				model.fsEntry = files[off];
				rootModel.add(model);
			}
		}
		return rootModel;
	};

	var makeQuad = function(verts, index, x, y, w, h) {
		var i = index * 18;

		verts[i] = x;
		verts[i+1] = y;
		verts[i+2] = 0;
		verts[i+3] = x + w;
		verts[i+4] = y;
		verts[i+5] = 0;
		verts[i+6] = x;
		verts[i+7] = y + h;
		verts[i+8] = 0;

		verts[i+9] = x;
		verts[i+10] = y + h;
		verts[i+11] = 0;
		verts[i+12] = x + w;
		verts[i+13] = y;
		verts[i+14] = 0;
		verts[i+15] = x + w;
		verts[i+16] = y + h;
		verts[i+17] = 0;
	};

	var createFileTreeQuads = function(fileTree, fileIndex, verts, parentX, parentY, parentScale, depth) {
		var dirs = [];
		var files = [];
		for (var i in fileTree) {
			var obj = {entries: fileTree[i], x: 0, y: 0, scale: 0};
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
					var subX = xOff + 0.05 / squareSide;
					var subY = yOff + 0.05 / squareSide;
					var squares = Math.ceil(files.length / 4);
					var squareSidef = Math.ceil(Math.sqrt(squares));
					var fileScale = parentScale * (0.9 / squareSide) ;
					for (var xf=0; xf<squareSidef; xf++) {
						for (var yf=0; yf<squareSidef*4; yf++) {
							var fxOff = xf * (1/squareSidef);
							var fyOff = 1 - ((yf+1)/4) * (1/squareSidef);
							var foff = xf * squareSidef * 4 + yf;
							if (foff >= files.length) {
								break;
							}
							makeQuad(verts, fileIndex++,
								parentX + parentScale * subX + fileScale * fxOff, 
								parentY + parentScale * subY + fileScale * fyOff,
								fileScale * (0.9/squareSidef),
								fileScale * 0.25 * (0.9/squareSidef),
								depth);
						}
					}
				} else {
					var dir = dirs[off];
					var subX = xOff + 0.05 / squareSide;
					var subY = yOff + 0.05 / squareSide;
					dir.x = parentX + parentScale * subX;
					dir.y = parentY + parentScale * subY;
					dir.scale = parentScale * (0.9 / squareSide);
					makeQuad(verts, fileIndex++, dir.x, dir.y, dir.scale, dir.scale, depth);
				}
			}
		}
		for (var j=0; j<dirs.length; j++) {
			var dir = dirs[j];
			createFileTreeQuads(dir.entries, fileIndex, verts, dir.x, dir.y, dir.scale, depth+1);
		}
	};

	var createFileTreeModel = function(fileCount, a, b, fileTree) {
		var geo = new THREE.BufferGeometry();
		var verts = new Float32Array(fileCount * 3 * 6);
		geo.addAttribute('position', new THREE.BufferAttribute(verts, 3));

		var fileIndex = 0;

		createFileTreeQuads(fileTree, fileIndex, verts, 0, 0, 1, 0);

		return new THREE.Mesh(
			geo,
			new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, blending: THREE.AdditiveBlending })
		);
	};

	var createFileTreeModel = function(fileCount, fullPath, dirName, fileTree, model, depth) {
		if (!model) {
			model = {dirCount: 0, fileCount: 0, bfsQueue: []};
			depth = 0;
		}
		if (fullPath === '/') {
			fullPath = '';
		}
		var dirs = [];
		var files = [];
		for (var i in fileTree) {
			var obj = {name: i || '/', fullPath: fullPath + '/' + i, entries: fileTree[i], depth: depth};
			if (obj.entries === null) {
				files.push(obj);
			} else {
				dirs.push(obj);
			}
		}
		var threeModel = new THREE.Object3D();
		var dirCount = dirs.length + (files.length > 0 ? 1 : 0);
		var squareSide = Math.ceil(Math.sqrt(dirCount));
		var fileModel = new THREE.Object3D();
		fileModel.isLeaf = true;

		for (var y=0; y<squareSide; y++) {
			for (var x=0; x<squareSide; x++) {
				var off = y * squareSide + x;
				if (off >= dirCount) {
					break;
				}
				var yOff = 1 - (y+1) * (1/squareSide);
				var xOff = x * (1/squareSide);
				if (off >= dirs.length) {
					fileModel.position.set(xOff+0.05/squareSide, yOff+0.05/squareSide, 0);
					fileModel.scale.multiplyScalar(0.9/squareSide);
					fileModel.add(makeFileModel(files, depth));
					threeModel.add(fileModel);
				} else {
					var dir = dirs[off];
					var dirModel = new THREE.Object3D();
					dirModel.position.set(xOff+0.05/squareSide, yOff+0.05/squareSide, 0);
					dirModel.scale.multiplyScalar(0.9/squareSide);
					dirModel.add(makeSquareModel(dir.name, depth));
					dirModel.isLeaf = false;
					dir.model = dirModel;
					dirModel.fsEntry = dir;
					threeModel.add(dirModel);
				}
			}
		}
		model.dirCount += dirs.length;
		model.fileCount += files.length;
		for (var j=0; j<dirs.length; j++) {
			var dir = dirs[j];
			model.bfsQueue.push(dir);
		}
		threeModel.isLeaf = (dirs.length === 0);

		if (depth === 0) {

			console.time('build model');

			var mat = new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, blending: THREE.AdditiveBlending })
			var mergeds = [];
			var lastCount = 0;
			var queueIndex = 0;
			while (queueIndex < model.bfsQueue.length) { // && (model.bfsQueue[0].depth === 0 || model.dirCount + model.fileCount < 1500)) {
				var dir = model.bfsQueue[queueIndex++];
				dir.model.add( createFileTreeModel(fileCount, dir.fullPath, dir.name, dir.entries, model, dir.depth+1) );
				if (queueIndex === model.bfsQueue.length || model.dirCount + model.fileCount > lastCount + 20000) {
					model.bfsQueue.splice(0, queueIndex);
					queueIndex = 0;
					lastCount = model.dirCount + model.fileCount;
					console.log(lastCount + ' / ' + fileCount);
					var theEnd = lastCount === fileCount;
					threeModel.position.set(-0.5, -0.5, 0.0);
					threeModel.updateMatrixWorld(true);
					var merged = new THREE.Geometry();
					var removedGeos = 0;
					var removedLeafs = 0;
					var traversed = 0;
					var toRemove = [];
					console.log("At the end", theEnd);
					threeModel.traverseBottomUp(function(m) {
						traversed++;
					});
					console.log('Traversed', traversed);
					threeModel.traverseBottomUp(function(m) {
						if (m.geometry) {
							if (m.modelType !== 'name') {
								merged.merge(m.geometry, m.matrixWorld);
							}
							if (!theEnd) toRemove.push(m);
							removedGeos++;
						} else if (m.isLeaf) {
							if (m.parent.children.every(c => c.isLeaf)) {
								m.parent.isLeaf = true;
							}
							if (!theEnd) toRemove.push(m);
							removedLeafs++;
						}
					});
					toRemove.forEach(m => m.parent.remove(m));
					console.log('Removing', removedGeos, 'geos', removedLeafs, 'leaves');
					mergeds.push(new THREE.Mesh(merged, mat));
				}
			}

			console.timeEnd('build model');

			console.log(model.dirCount + model.fileCount);
			var o = new THREE.Object3D();
			mergeds.forEach(m => o.add(m));

			return o;
		}

		return threeModel;
	};

	THREE.Object3D.prototype.traverseBottomUp = function ( callback ) {

		var children = this.children;

		for ( var i = 0, l = children.length; i < l; i ++ ) {

			children[ i ].traverseBottomUp( callback );

		}

		callback( this );

	};

	var renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.domElement.id = 'renderCanvas';
	document.body.appendChild(renderer.domElement);

	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 5);

	camera.position.z = 2;

	scene.add(camera);



	window.onresize = function() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	};

	window.onresize();

	var navigateTo = function(path) {
		loadFiles('http://localhost:8080'+encodeURI(path)+'?depth=10', function(fileTree) {
			window.FileTree = fileTree.tree;
			var model = createFileTreeModel(fileTree.count, '', '', fileTree.tree);
			//model.position.set(-0.5, -0.5, 0.0);
			scene.add(model);

			// model.updateMatrixWorld(true);
			// var merged = new THREE.Geometry();
			// model.traverse(function(m) {
			// 	if (m.geometry && m.modelType !== 'name')
			// 		merged.merge(m.geometry, m.matrixWorld);
			// });

			// scene.add(new THREE.Mesh(
			// 	merged,
			// 	new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, blending: THREE.AdditiveBlending })
			// ));
			console.log('ok');
		});
	};
	navigateTo('/Users/ilmari');

	var controls = new THREE.OrbitControls(camera, renderer.domElement);
	//controls.addEventListener( 'change', render ); // add this only if there is no animation loop (requestAnimationFrame)
	controls.enableDamping = true;
	controls.dampingFactor = 0.25;
	controls.enableZoom = true;

	var down = false;
	var downX, downY, startX, startY;
	var theta = 0, alpha = 0;
	var clickDisabled = false;
	window.onmousedown = function(ev) {
		ev.preventDefault();
		down = true;
		clickDisabled = false;
		startX = downX = ev.clientX;
		startY = downY = ev.clientY;
	};
	window.onmousemove = function(ev) {
		if (down) {
			ev.preventDefault();
			var dx = ev.clientX - downX;
			var dy = ev.clientY - downY;
			if (Math.abs(ev.clientX - startX) > 5 || Math.abs(ev.clientY - startY) > 5) {
				clickDisabled = true;
			}
		}
	};
	window.onmouseup = function(ev) {
		ev.preventDefault();
		down = false;
	};

	window.onclick = function(ev) {
		ev.preventDefault();
		if (clickDisabled) {
			return;
		}
		var target = findObjectUnderEvent(ev, camera, models);
		if (target) {
			var fsEntry = (target.fsEntry || target.parent.fsEntry);
			console.log(fsEntry.fullPath);
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

	var tmpM4 = new THREE.Matrix4();
	var render = function() {
		var visCount = 0;
		scene.updateMatrixWorld(true);
		scene.traverse(function(m) {
			tmpM4.multiplyMatrices(camera.matrixWorldInverse, m.matrixWorld);
			tmpM4.multiplyMatrices(camera.projectionMatrix, tmpM4);
			if (
				m.modelType === 'name' && (tmpM4.elements[0]/tmpM4.elements[15] < 0.01 || tmpM4.elements[5]/tmpM4.elements[15] < 0.1)
				//|| m.modelType !== 'name' && (tmpM4.elements[0]/tmpM4.elements[15] < 0.001 || tmpM4.elements[5]/tmpM4.elements[15] < 0.001)
			) {
				m.visible = false;
			} else {
				m.visible = true;
				visCount++;
			}
		});
		// console.log(visCount);
		renderer.render(scene, camera);
	};

	var tick = function() {
		render();
		window.requestAnimationFrame(tick);
	};

	tick();

})();