global.THREE = require('three');
var Geometry = require('./Geometry.js');
var Colors = require('./Colors.js');
var createText = require('three-bmfont-text');

module.exports = {

	thumbnailGeo: new THREE.PlaneBufferGeometry(1,1,1,1),
	font: null,

	layoutObjectsInRectangle: function(aspect, objects, fileTree, fileIndex, verts, colorVerts, parentX, parentY, parentZ, parentScale, depth, parentText, thumbnails, index) {
		var count = objects.length;
		var xCount = Math.ceil(count / aspect);
		var yCount = Math.ceil(count / xCount);

		var minCount = Math.min(xCount, yCount);

		for (var y=0; y<yCount; y++) {
			for (var x=0; x<xCount; x++) {
				var off = y * xCount + x;
				if (off >= count) {
					break;
				}
				var yOff = 1 - (y+1) * (1/yCount);
				var xOff = x * (1/xCount);

				var dir = objects[off];
				var subX = aspect * xOff;
				var subY = yOff;
				dir.x = parentX + parentScale * subX;
				dir.y = parentY + parentScale * subY;
				dir.scale = parentScale * (0.8 / minCount);
				dir.z = parentZ + dir.scale * 0.2;
				dir.index = fileIndex;
				dir.parent = fileTree;
				index[fileIndex] = dir;
				var dirColor = Colors.getDirectoryColor(dir);
				Geometry.setColor(colorVerts, dir.index, dirColor, depth);
				Geometry.makeQuad(verts, dir.index, dir.x, dir.y, dir.scale*aspect, dir.scale, dir.z);
				fileIndex++;
			}
		}
		return fileIndex;
	},

	createFileTreeQuads: function(fileTree, fileIndex, verts, colorVerts, parentX, parentY, parentZ, parentScale, depth, parentText, thumbnails, index) {
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
		// fileIndex = this.layoutObjectsInRectangle(1.5, dirs, fileTree, fileIndex, verts, colorVerts, parentX, parentY, parentZ, parentScale, depth, parentText, thumbnails, index);

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
							var fileColor = file.color || Colors.getFileColor(file);
							file.x = parentX + parentScale * subX + fileScale * fxOff;
							file.y = parentY + parentScale * subY + fileScale * fyOff;
							file.scale = fileScale * (0.9/squareSidef);
							file.z = parentZ + file.scale * 0.2*0.25;
							file.index = fileIndex;
							file.parent = fileTree;
							index[fileIndex] = file;
							Geometry.setColor(colorVerts, file.index, fileColor, depth);
							Geometry.makeQuad(verts, file.index, file.x, file.y, file.scale, file.scale*0.25, file.z);
							// file.thumbnail = Thumbnails.loadThumbnail(file);
							// if (file.thumbnail) {
							// 	file.thumbnailMesh = new THREE.Mesh(
							// 		this.thumbnailGeo, 
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
					var dirColor = dir.color || Colors.getDirectoryColor(dir);
					Geometry.setColor(colorVerts, dir.index, dirColor, depth);
					Geometry.makeQuad(verts, dir.index, dir.x, dir.y, dir.scale, dir.scale, dir.z);
					fileIndex++;
				}
			}
		}

		if (true || depth < 4) {
			for (var i in fileTree.entries) {
				var obj = fileTree.entries[i];
				var title = obj.title;
				if (title.indexOf('\n') === -1 && title.length > 16) {
					var breakPoint = Math.max(16, Math.floor(title.length / 2));
					title = title.substring(0, breakPoint) + '\n' + title.substring(breakPoint);
				}

				var textGeometry = createText({text: title, font: this.font});
				var text = new THREE.Object3D();
				text.geometry = textGeometry;
				var textScaleW = (220/Math.max(textGeometry.layout.width, 220));
				var textScaleH = (obj.entries ? 30 : 50)/textGeometry.layout.height;

				var scale = Math.min(textScaleW, textScaleH);

				text.position.x = obj.x + (obj.entries ? 0 : (obj.scale * 0.02));
				text.position.y = obj.y + (obj.entries ? obj.scale*1.01 : obj.scale*0.02);
				text.position.z = obj.z;
				text.scale.multiplyScalar(obj.scale*0.00436*scale);
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
				o.add(text);
				parentText.add(o);
				obj.text = o;
			}
		} else {
			// return;
		}

		for (var j=0; j<dirs.length; j++) {
			var dir = dirs[j];
			fileIndex = this.createFileTreeQuads(dir, fileIndex, verts, colorVerts, dir.x, dir.y, dir.z, dir.scale, depth+1, dir.text, thumbnails, index);
		}
		return fileIndex;
	}

};