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
		if (depth < 5) {
			var canvas = document.createElement('canvas');
			var ctx = canvas.getContext('2d');
			ctx.font = '16px Arial';
			ctx.fillStyle = 'white';
			var txt = ctx.measureText(name);
			canvas.width = 128; //Math.max(128, Math.pow(2, Math.ceil(Math.log2(txt.width + 4))));
			canvas.height = 16;
			ctx.fillStyle = 'rgba(255,255,255,0.1)';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.font = '14px Arial';
			ctx.fillStyle = 'white';
			ctx.fillText(name, 2, 12);
			// document.body.appendChild(canvas);
			var h = canvas.height/canvas.width;
			var nameModel = new THREE.Mesh(
				height < 1
					? new THREE.PlaneGeometry(1, h, 1, 1)
					: new THREE.PlaneGeometry(1, h, 1, 1),
				new THREE.MeshBasicMaterial({map: new THREE.Texture(canvas), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending})
			);
			nameModel.material.side = THREE.DoubleSide;
			nameModel.material.map.needsUpdate = true;
			nameModel.material.map.generateMipmap = false;
			nameModel.position.x = -0.3;
			nameModel.position.z = 0.0;
			if (height < 1) {
				nameModel.position.x = 0;
				nameModel.position.y = 0;
			} else {
				nameModel.position.x = 0;
				nameModel.position.y = h*0.5 + (height / 2);
			}
			nameModel.modelType = 'name';
			model.add(nameModel);
		}
		models.push(model);
		model.material.side = THREE.DoubleSide;
		model.position.x = 0.5;
		model.position.y = height * 0.5;
		model.position.z = -0.01;
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

	var createFileTreeModel = function(fileCount, fullPath, dirName, fileTree, model, depth) {
		var first = false;
		if (!model) {
			model = {dirCount: 0, fileCount: 0, bfsQueue: []};
			first = true;
		}
		if (!depth) {
			depth = 0;
		}
		if (fullPath === '/') {
			fullPath = '';
		}
		var dirs = [];
		var files = [];
		var dotfiles = [];
		var dotdirs = [];
		for (var i in fileTree) {
			var obj = {name: i || '/', fullPath: fullPath + '/' + i, entries: fileTree[i], depth: depth};
			if (i.charAt(0) === '.') {
				if (obj.entries === null) {
					dotfiles.push(obj);
				} else {
					dotdirs.push(obj);
				}
			} else {
				if (obj.entries === null) {
					files.push(obj);
				} else {
					dirs.push(obj);
				}
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
				var yOff = 1 - (y+1) * (1.0/squareSide);
				var xOff = x * (1/squareSide);
				if (off >= dirs.length) {
					fileModel.position.set(xOff+0.1/squareSide, yOff+0.05/squareSide, 0);
					fileModel.scale.multiplyScalar(0.8/squareSide);
					fileModel.add(makeFileModel(files, depth));
					threeModel.add(fileModel);
				} else {
					var dir = dirs[off];
					var dirModel = new THREE.Object3D();
					dirModel.position.set(xOff+0.1/squareSide, yOff+0.05/squareSide, 0);
					dirModel.scale.multiplyScalar(0.8/squareSide);
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

		if (first) {

			console.time('build model');

			var queueIndex = 0;

			while (queueIndex < model.bfsQueue.length && (model.bfsQueue[queueIndex].depth < 2 || model.dirCount + model.fileCount < 1500)) {
				var dir = model.bfsQueue[queueIndex++];
				dir.model.add( createFileTreeModel(fileCount, dir.fullPath, dir.name, dir.entries, model, dir.depth+1) );
				if (queueIndex > 1000) {
					model.bfsQueue.splice(0, queueIndex);
					queueIndex = 0;
				}
			}

			console.timeEnd('build model');

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

	// var navigateToGDrive = function(path) {
	// 	loadGDriveFiles('https://www.googleapis.com/drive/v3/files?corpus=user&orderBy=folder&pageSize=1000&spaces=drive&key=', function(fileTree) {

	// // 	});
	// 	 // Your Client ID can be retrieved from your project in the Google
	// 	      // Developer Console, https://console.developers.google.com
	// 	      var CLIENT_ID = '671524571878.apps.googleusercontent.com';

	// 	      var SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];

	// 	      /**
	// 	       * Check if current user has authorized this application.
	// 	       */
	// 	      function checkAuth() {
	// 	      	console.log('checkAuth');
	// 	        gapi.auth.authorize(
	// 	          {
	// 	            'client_id': CLIENT_ID,
	// 	            'scope': SCOPES.join(' '),
	// 	            'immediate': true
	// 	          }, handleAuthResult);
	// 	      }

	// 	      window.checkAuth = checkAuth;

	// 	      /**
	// 	       * Handle response from authorization server.
	// 	       *
	// 	       * @param {Object} authResult Authorization result.
	// 	       */
	// 	      function handleAuthResult(authResult) {
	// 	      	console.log(handleAuthResult, authResult);
	// 	        var authorizeDiv = document.getElementById('authorize-div');
	// 	        if (authResult && !authResult.error) {
	// 	          // Hide auth UI, then load client library.
	// 	          authorizeDiv.style.display = 'none';
	// 	          loadDriveApi();
	// 	        } else {
	// 	          // Show auth UI, allowing the user to initiate authorization by
	// 	          // clicking authorize button.
	// 	          authorizeDiv.style.display = 'inline';
	// 	        }
	// 	      }

	// 	      /**
	// 	       * Initiate auth flow in response to user clicking authorize button.
	// 	       *
	// 	       * @param {Event} event Button click event.
	// 	       */
	// 	      function handleAuthClick(event) {
	// 	        gapi.auth.authorize(
	// 	          {client_id: CLIENT_ID, scope: SCOPES, immediate: false},
	// 	          handleAuthResult);
	// 	        return false;
	// 	      }

	// 	      window.handleAuthClick = handleAuthClick;

	// 	      /**
	// 	       * Load Drive API client library.
	// 	       */
	// 	      function loadDriveApi() {
	// 	        gapi.client.load('drive', 'v3', listFiles);
	// 	      }

	// 	      /**
	// 	       * Print files.
	// 	       */
	// 	      function listFiles() {
	// 	        var request = gapi.client.drive.files.list({
	// 	            'pageSize': 1000,
	// 	            'fields': "nextPageToken, files(id, name, parents)"
	// 	          });

	// 	          request.execute(function(resp) {
	// 	            appendPre('Files ('+ resp.files.length +'):');
	// 	            var files = resp.files;
	// 	            if (files && files.length > 0) {
	// 	              for (var i = 0; i < files.length; i++) {
	// 	                var file = files[i];
	// 	                appendPre((file.parents || '') + '/' + file.name + ' (' + file.id + ')');
	// 	              }
	// 	            } else {
	// 	              appendPre('No files found.');
	// 	            }
	// 	          });
	// 	      }

	// 	      /**
	// 	       * Append a pre element to the body containing the given message
	// 	       * as its text node.
	// 	       *
	// 	       * @param {string} message Text to be placed in pre element.
	// 	       */
	// 	      function appendPre(message) {
	// 	        var pre = document.getElementById('output');
	// 	        var textContent = document.createTextNode(message + '\n');
	// 	        pre.appendChild(textContent);
	// 	      }
	// // };

	var navigateTo = function(path) {
		loadFiles('http://localhost:8080'+encodeURI(path)+'?depth=3', function(fileTree) {
			window.FileTree = fileTree.tree;
			var model = createFileTreeModel(fileTree.count, '', '', fileTree.tree, null, -( path.split("/").length-1 ));
			model.position.set(-0.5, -0.5, 0.0);
			scene.add(model);
			console.log('ok');
		});
	};
	navigateTo('/Users/ilmari');

	// var controls = new THREE.OrbitControls(camera, renderer.domElement);
	// //controls.addEventListener( 'change', render ); // add this only if there is no animation loop (requestAnimationFrame)
	// controls.enableDamping = true;
	// controls.dampingFactor = 0.25;
	// controls.enableZoom = true;

	var down = false;
	var previousX, previousY, startX, startY;
	var theta = 0, alpha = 0;
	var clickDisabled = false;
	window.onmousedown = function(ev) {
		ev.preventDefault();
		down = true;
		clickDisabled = false;
		startX = previousX = ev.clientX;
		startY = previousY = ev.clientY;
	};
	window.onmousemove = function(ev) {
		if (down) {
			ev.preventDefault();
			var dx = ev.clientX - previousX;
			var dy = ev.clientY - previousY;
			previousX = ev.clientX;
			previousY = ev.clientY;
			if (Math.abs(ev.clientX - startX) > 5 || Math.abs(ev.clientY - startY) > 5) {
				clickDisabled = true;
			}
			camera.position.x -= 0.0001*dx * camera.fov;
			camera.position.y += 0.0001*dy * camera.fov;
		}
	};
	window.onmouseup = function(ev) {
		ev.preventDefault();
		down = false;
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
				camera.position.x = startCameraX;
				camera.position.y = startCameraY;
				camera.fov = startCameraFOV;
				camera.updateProjectionMatrix();
			}
		}
	};
	var startCameraX = camera.position.x;
	var startCameraY = camera.position.y;
	var startCameraFOV = camera.fov;
	var lastScroll = Date.now();
	window.onmousewheel = function(ev) {
		ev.preventDefault();
		var cx = (ev.clientX - window.innerWidth / 2) * 0.0000575 * camera.fov;
		var cy = (ev.clientY - window.innerHeight / 2) * 0.0000575 * camera.fov;
		var zf = Math.pow(1.005, ev.wheelDelta);
		camera.position.x += cx - cx * zf;
		camera.position.y -= cy - cy * zf;
		camera.fov *= zf;
		camera.updateProjectionMatrix();
		lastScroll = Date.now();
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