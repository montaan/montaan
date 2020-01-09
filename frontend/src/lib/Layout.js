var THREE = require('three');
var Geometry = require('./Geometry.js');
var Colors = require('./Colors.js').default;
var createText = require('./third_party/three-bmfont-text-modified');

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

	createFileListQuads: function(fileTree, fileIndex, verts, colorVerts, parentX, parentY, parentZ, parentScale, depth, parentText, thumbnails, index) {
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
		var squareSide = Math.ceil(dirCount);

		var maxX = 0, maxY = 0;
		var x = 0;
		{
			for (var y=0; y<dirCount; y++) {
				var off = x * squareSide + y;
				if (off >= dirCount) {
					break;
				}
				maxX = Math.max(x, maxX);
				maxY = Math.max(y, maxY);
				var yOff = 1 - (y+1) * (1/squareSide);
				var xOff = x * (1/squareSide);
				if (off >= dirs.length) {
					var subX = xOff + 0.1 / squareSide;
					var subY = yOff + 0.1 / squareSide;
					var squares = Math.ceil(files.length / 4);
					var squareSidef = Math.ceil(squares);
					var fileScale = parentScale * (0.8 / squareSide);
					var xf = 0;
					{
						for (var yf=0; yf<files.length; yf++) {
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
		if (squareSide > 1) {
			var xScale = (maxX+1)/squareSide;
			var yScale = (maxY+1)/squareSide;
			Geometry.makeQuad(verts, fileTree.index, fileTree.x, fileTree.y+fileTree.scale*(1.0-yScale), fileTree.scale*xScale, fileTree.scale*yScale, fileTree.z);
		}

		if (true || depth < 4) {
			for (var i in fileTree.entries) {
				var obj = fileTree.entries[i];
				var title = obj.title;
				if (obj.entries == null) {
					if (title.indexOf('\n') === -1 && title.length > 16) {
						var breakPoint = Math.max(16, Math.floor(title.length / 2));
						title = title.substring(0, breakPoint) + '\n' + title.substring(breakPoint);
					}
				} else if (title.indexOf('\n') === -1 && title.length > 26) {
					var words = title.split(/\s+/g);
					var lineLength = 0;
					var s = "";
					var lineBreakLength = 26;
					if (title.length < 52) {
						lineBreakLength = 26
					} else if (title.length < 107) {
						lineBreakLength = 39;
					} else if (title.length < 208) {
						lineBreakLength = 52;
					} else {
						lineBreakLength = title.length+10;
					}
					var re = new RegExp(".{"+lineBreakLength+"}|.+$", 'g');
					for (var i=0; i<words.length; i++) {
						var w = words[i];
						if (lineLength + w.length >= lineBreakLength) {
							if (w.length > lineBreakLength) {
								var prefix = w.substring(0, lineBreakLength-lineLength);
								s += prefix + '\n';
								var suffix = w.substring(lineBreakLength-lineLength);
								var bits = suffix.match(re);
								s += bits.slice(0, -1).join("\n") + "\n";
								s += bits[bits.length-1] + ' ';
								lineLength = bits[bits.length-1].length + 1;
							} else {
								s += '\n' + w + ' ';
								lineLength = w.length + 1;
							}
						} else {
							s += w + ' ';
							lineLength += w.length + 1;
						}
					}
					title = s;
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
			fileIndex = this.createFileListQuads(dir, fileIndex, verts, colorVerts, dir.x, dir.y, dir.z, dir.scale, depth+1, dir.text, thumbnails, index);
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

		var maxX = 0, maxY = 0;
		for (var x=0; x<squareSide; x++) {
			for (var y=0; y<squareSide; y++) {
				var off = x * squareSide + y;
				if (off >= dirCount) {
					break;
				}
				maxX = Math.max(x, maxX);
				maxY = Math.max(y, maxY);
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
							Geometry.setColor(colorVerts, fileIndex, fileColor, depth);
							Geometry.makeQuad(verts, fileIndex, file.x, file.y, file.scale, file.scale*0.25, file.z);
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
		if (squareSide > 1) {
			var xScale = (maxX+1)/squareSide;
			var yScale = (maxY+1)/squareSide;
			Geometry.makeQuad(verts, fileTree.index, fileTree.x, fileTree.y+fileTree.scale*(1.0-yScale), fileTree.scale*yScale, fileTree.scale*yScale, fileTree.z);
		}

		if (true || depth < 4) {
			for (var i in fileTree.entries) {
				var obj = fileTree.entries[i];
				var title = obj.title;
				if (obj.entries == null) {
					if (title.indexOf('\n') === -1 && title.length > 16) {
						var breakPoint = Math.max(16, Math.floor(title.length / 2));
						title = title.substring(0, breakPoint) + '\n' + title.substring(breakPoint);
					}
				} else if (title.indexOf('\n') === -1 && title.length > 26) {
					var words = title.split(/ /);
					var lineLength = 0;
					var s = "";
					var lineBreakLength = 26;
					if (title.length < 52) {
						lineBreakLength = 26
					} else if (title.length < 107) {
						lineBreakLength = 39;
					} else if (title.length < 208) {
						lineBreakLength = 52;
					} else {
						lineBreakLength = title.length+10;
					}
					var re = new RegExp(".{"+lineBreakLength+"}|.+$", 'g');
					for (var i=0; i<words.length; i++) {
						var w = words[i];
						if (lineLength + w.length >= lineBreakLength) {
							if (w.length >= lineBreakLength) {
								var prefix = w.substring(0, lineBreakLength-lineLength);
								s += prefix + '\n';
								var suffix = w.substring(lineBreakLength-lineLength);
								var bits = suffix.match(re);
								s += bits.slice(0, -1).join("\n") + "\n";
								s += bits[bits.length-1] + ' ';
								lineLength = bits[bits.length-1].length + 1;
							} else {
								s += '\n' + w + ' ';
								lineLength = w.length + 1;
							}
						} else {
							s += w + ' ';
							lineLength += w.length + 1;
						}
					}
					title = s;
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
	},


	createFileTreeQuads: function(fileTree, fileIndex, verts, colorVerts, parentX, parentY, parentZ, parentScale, depth, parentText, thumbnails, index, accum) {
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

		fileTree.index = fileIndex;
		fileIndex++;
		if (!accum) {
			accum = { textVertexIndex: 0, vertexIndex: 0 };
			fileTree.textVertexIndex = 0;
			fileTree.vertexIndex = 0;
		}

		var dirCount = dirs.length + (files.length > 0 ? 1 : 0);
		var squareSide = Math.ceil(Math.sqrt(dirCount));

		var maxX = 0, maxY = 0;
		for (var x=0; x<squareSide; x++) {
			for (var y=0; y<squareSide; y++) {
				var off = x * squareSide + y;
				if (off >= dirCount) {
					break;
				}
				maxX = Math.max(x, maxX);
				maxY = Math.max(y, maxY);
				var yOff = 1 - (y+1) * (1/squareSide);
				var xOff = x * (1/squareSide);
				if (off >= dirs.length) {
					var subX = xOff + 0.1 / squareSide;
					var subY = yOff + 0.1 / squareSide;
					var squares = Math.ceil(files.length);
					var squareSidef = Math.ceil(Math.sqrt(squares));
					var fileScale = parentScale * (0.8 / squareSide) ;
					for (var xf=0; xf<squareSidef; xf++) {
						for (var yf=0; yf<squareSidef; yf++) {
							var fxOff = xf * (1/squareSidef);
							var fyOff = 1 - ((yf+1)) * (1/squareSidef);
							var foff = xf * squareSidef + yf;
							if (foff >= files.length) {
								break;
							}
							var file = files[foff];
							var fileColor = file.color || Colors.getFileColor(file);
							file.x = parentX + parentScale * subX + fileScale * fxOff;
							file.y = parentY + parentScale * subY + fileScale * fyOff;
							file.scale = fileScale * (0.9/squareSidef);
							file.z = parentZ + file.scale * 0.2;
							file.index = fileIndex;
							file.vertexIndex = accum.vertexIndex;
							file.lastIndex = fileIndex;
							file.parent = fileTree;
							index[fileIndex] = file;
							Geometry.setColor(colorVerts, file.index, fileColor, depth);
							accum.vertexIndex = Geometry.makeQuad(verts, file.index, file.x, file.y, file.scale, file.scale, file.z);
							accum.textVertexIndex = this.createTextForEntry(file, parentText, accum.textVertexIndex);
							file.lastVertexIndex = accum.vertexIndex;
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
					dir.vertexIndex = accum.vertexIndex;
					dir.textVertexIndex = accum.textVertexIndex;
					dir.parent = fileTree;
					index[fileIndex] = dir;
					var dirColor = dir.color || Colors.getDirectoryColor(dir);
					Geometry.setColor(colorVerts, dir.index, dirColor, depth);
					accum.vertexIndex = Geometry.makeQuad(verts, dir.index, dir.x, dir.y, dir.scale, dir.scale, dir.z);
					accum.textVertexIndex = this.createTextForEntry(dir, parentText, accum.textVertexIndex);
					fileIndex = this.createFileTreeQuads(dir, fileIndex, verts, colorVerts, dir.x, dir.y, dir.z, dir.scale, depth+1, dir.text, thumbnails, index, accum);
				}
			}
		}
		if (squareSide > 1) {
			var xScale = (maxX+1)/squareSide;
			var yScale = (maxY+1)/squareSide;
			Geometry.makeQuad(verts, fileTree.index, fileTree.x, fileTree.y+fileTree.scale*(1.0-yScale), fileTree.scale*yScale, fileTree.scale*yScale, fileTree.z);
		}

		fileTree.lastIndex = fileIndex-1;
		fileTree.lastTextVertexIndex = accum.textVertexIndex;
		fileTree.lastVertexIndex = accum.vertexIndex;
		return fileIndex;
	},

	createTextForEntry: function(obj, parentText, textVertexIndex) {
		var title = obj.title;
		if (obj.entries == null) {
			if (title.indexOf('\n') === -1 && title.length > 16) {
				var breakPoint = Math.max(16, Math.floor(title.length / 2));
				title = title.substring(0, breakPoint) + '\n' + title.substring(breakPoint);
			}
		} else if (title.indexOf('\n') === -1 && title.length > 26) {
			var words = title.split(/ /);
			var lineLength = 0;
			var s = "";
			var lineBreakLength = 26;
			if (title.length < 52) {
				lineBreakLength = 26
			} else if (title.length < 107) {
				lineBreakLength = 39;
			} else if (title.length < 208) {
				lineBreakLength = 52;
			} else {
				lineBreakLength = title.length+10;
			}
			var re = new RegExp(".{"+lineBreakLength+"}|.+$", 'g');
			for (var i=0; i<words.length; i++) {
				var w = words[i];
				if (lineLength + w.length >= lineBreakLength) {
					if (w.length >= lineBreakLength) {
						var prefix = w.substring(0, lineBreakLength-lineLength);
						s += prefix + '\n';
						var suffix = w.substring(lineBreakLength-lineLength);
						var bits = suffix.match(re);
						s += bits.slice(0, -1).join("\n") + "\n";
						s += bits[bits.length-1] + ' ';
						lineLength = bits[bits.length-1].length + 1;
					} else {
						s += '\n' + w + ' ';
						lineLength = w.length + 1;
					}
				} else {
					s += w + ' ';
					lineLength += w.length + 1;
				}
			}
			title = s;
		}

		var textGeometry = createText({text: title, font: this.font});
		var text = new THREE.Object3D();
		text.geometry = textGeometry;

		obj.textVertexIndex = textVertexIndex;
		obj.lastTextVertexIndex = textVertexIndex + text.geometry.attributes.position.array.length/4;

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

		return obj.lastTextVertexIndex;
	}

};