import createText from './third_party/three-bmfont-text-modified';
import Colors from './Colors.ts';
import Geometry from './Geometry';

const THREE = require('three');

export default {
	thumbnailGeo: new THREE.PlaneBufferGeometry(1, 1, 1, 1),
	font: null,

	createFileListQuads: async function(
		yieldFn,
		fileTree,
		fileIndex,
		verts,
		colorVerts,
		parentX,
		parentY,
		parentZ,
		parentScale,
		depth,
		parentText,
		thumbnails,
		index
	) {
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
		var squareSide = Math.ceil(dirCount);

		var maxX = 0,
			maxY = 0;
		var x = 0;
		for (var y = 0; y < dirCount; y++) {
			var off = x * squareSide + y;
			if (off >= dirCount) {
				break;
			}
			maxX = Math.max(x, maxX);
			maxY = Math.max(y, maxY);
			var yOff = 1 - (y + 1) * (1 / squareSide);
			var xOff = x * (1 / squareSide);
			if (off >= dirs.length) {
				var subX = xOff + 0.1 / squareSide;
				var subY = yOff + 0.1 / squareSide;
				var squares = Math.ceil(files.length / 4);
				var squareSidef = Math.ceil(squares);
				var fileScale = parentScale * (0.8 / squareSide);
				var xf = 0;
				for (var yf = 0; yf < files.length; yf++) {
					var fxOff = xf * (1 / squareSidef);
					var fyOff = 1 - ((yf + 1) / 4) * (1 / squareSidef);
					var foff = xf * squareSidef * 4 + yf;
					if (foff >= files.length) {
						break;
					}
					var file = files[foff];
					var fileColor = file.color || Colors.getFileColor(file);
					file.x = parentX + parentScale * subX + fileScale * fxOff;
					file.y = parentY + parentScale * subY + fileScale * fyOff;
					file.scale = fileScale * (0.9 / squareSidef);
					file.z = parentZ + file.scale * 0.2 * 0.25;
					file.index = fileIndex;
					file.parent = fileTree;
					index[fileIndex] = file;
					Geometry.setColor(colorVerts, file.index, fileColor, depth);
					Geometry.makeQuad(
						verts,
						file.index,
						file.x,
						file.y,
						file.scale,
						file.scale * 0.25,
						file.z
					);
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
			} else {
				var dir = dirs[off];
				let subX = xOff + 0.1 / squareSide;
				let subY = yOff; // + 0.1 / squareSide;
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
		if (squareSide > 1) {
			var xScale = (maxX + 1) / squareSide;
			var yScale = (maxY + 1) / squareSide;
			Geometry.makeQuad(
				verts,
				fileTree.index,
				fileTree.x,
				fileTree.y + fileTree.scale * (1.0 - yScale),
				fileTree.scale * xScale,
				fileTree.scale * yScale,
				fileTree.z
			);
		}

		if (true || depth < 4) {
			for (let i in fileTree.entries) {
				let obj = fileTree.entries[i];
				var title = obj.title;
				if (obj.entries == null) {
					if (title.indexOf('\n') === -1 && title.length > 16) {
						var breakPoint = Math.max(16, Math.floor(title.length / 2));
						title = title.substring(0, breakPoint) + '\n' + title.substring(breakPoint);
					}
				} else if (title.indexOf('\n') === -1 && title.length > 26) {
					var words = title.split(/\s+/g);
					var lineLength = 0;
					var s = '';
					var lineBreakLength = 26;
					if (title.length < 52) {
						lineBreakLength = 26;
					} else if (title.length < 107) {
						lineBreakLength = 39;
					} else if (title.length < 208) {
						lineBreakLength = 52;
					} else {
						lineBreakLength = title.length + 10;
					}
					var re = new RegExp('.{' + lineBreakLength + '}|.+$', 'g');
					for (let j = 0; j < words.length; j++) {
						var w = words[j];
						if (lineLength + w.length >= lineBreakLength) {
							if (w.length > lineBreakLength) {
								var prefix = w.substring(0, lineBreakLength - lineLength);
								s += prefix + '\n';
								var suffix = w.substring(lineBreakLength - lineLength);
								var bits = suffix.match(re);
								s += bits.slice(0, -1).join('\n') + '\n';
								s += bits[bits.length - 1] + ' ';
								lineLength = bits[bits.length - 1].length + 1;
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

				var textGeometry = await createText({ text: title, font: this.font }, yieldFn);
				var text = new THREE.Object3D();
				text.geometry = textGeometry;
				var textScaleW = 220 / Math.max(textGeometry.layout.width, 220);
				var textScaleH = (obj.entries ? 30 : 50) / textGeometry.layout.height;

				var scale = Math.min(textScaleW, textScaleH);

				text.position.x = obj.x + (obj.entries ? 0 : obj.scale * 0.02);
				text.position.y = obj.y + (obj.entries ? obj.scale * 1.01 : obj.scale * 0.02);
				text.position.z = obj.z;
				text.scale.multiplyScalar(obj.scale * 0.00436 * scale);
				text.scale.y *= -1;
				var arr = textGeometry.attributes.position.array;
				for (var j = 0; j < arr.length; j += 4) {
					arr[j] = arr[j] * text.scale.x + text.position.x;
					arr[j + 1] = arr[j + 1] * text.scale.y + text.position.y;
					arr[j + 2] = arr[j + 2] * text.scale.z + text.position.z;
				}
				text.position.set(0, 0, 0);
				text.scale.set(1, 1, 1);
				var o = new THREE.Object3D();
				if (parentText.children.length === 0) o.isFirst = true;
				o.add(text);
				parentText.add(o);
				obj.text = o;
			}
		} else {
			// return;
		}

		for (let j = 0; j < dirs.length; j++) {
			let dir = dirs[j];
			fileIndex = this.createFileListQuads(
				yieldFn,
				dir,
				fileIndex,
				verts,
				colorVerts,
				dir.x,
				dir.y,
				dir.z,
				dir.scale,
				depth + 1,
				dir.text,
				thumbnails,
				index
			);
		}
		return fileIndex;
	},

	createFileTreeQuads: async function(
		yieldFn,
		fileTree,
		fileIndex,
		verts,
		colorVerts,
		parentText,
		thumbnails,
		index,
		vertexIndices
	) {
		var dirs = [];
		var files = [];
		var dotDirs = [];
		var dotFiles = [];
		for (let i in fileTree.entries) {
			const obj = fileTree.entries[i];
			obj.x = 0;
			obj.y = 0;
			obj.z = 0;
			obj.scale = 0;
			if (obj.entries === null) {
				if (obj.name.startsWith('.')) dotFiles.push(obj);
				else files.push(obj);
			} else {
				if (obj.name.startsWith('.')) dotDirs.push(obj);
				else dirs.push(obj);
			}
		}

		fileTree.index = fileIndex;
		fileIndex++;
		if (!vertexIndices) {
			vertexIndices = { textVertexIndex: 0, vertexIndex: 0 };
			fileTree.textVertexIndex = 0;
			fileTree.vertexIndex = 0;
		}

		const dirScale = files.length === 0 ? 1 : 1;
		const filesScale = dirs.length === 0 ? 0.5 : 0.5;
		const fileXOff = dirs.length === 0 ? 0 : 0;
		let filesPerRow = dirs.length === 0 ? 2 : 2;

		const dirSquareSide = Math.ceil(
			Math.sqrt(Math.ceil(dirScale * (dirs.length + (files.length > 0 ? 1 : 0))))
		);
		let fileSquareSide = Math.ceil(Math.sqrt(Math.ceil(files.length / filesPerRow)));

		var maxX = 0,
			maxY = 0;
		var filesBox = fileTree;
		outer: for (let x = 0; x < dirSquareSide; x++) {
			for (let y = 0; y < dirSquareSide / dirScale; y++) {
				const off = x * Math.ceil(dirSquareSide / dirScale) + y;
				if (off >= dirs.length) {
					if (dirs.length > 0) {
						if (dirs.length <= 2) {
							x = 1;
							y = 1;
							filesPerRow = 1;
							fileSquareSide = Math.ceil(
								Math.sqrt(Math.ceil(files.length / filesPerRow))
							);
							const yOff = 1 - (0.675 * y + 1) * (1 / dirSquareSide);
							const xOff = 1.0 * x * (1 / dirSquareSide);
							const subX = xOff + 0.0 / dirSquareSide;
							const subY = yOff + 0.0 / dirSquareSide;
							fileTree.filesBox = filesBox = {};
							filesBox.x = fileTree.x + fileTree.scale * subX * dirScale;
							filesBox.y =
								fileTree.y +
								fileTree.scale * subY * dirScale +
								(1 - dirScale) * fileTree.scale;
							filesBox.scale = 2 * fileTree.scale * (0.8 / dirSquareSide) * dirScale;
							filesBox.z = fileTree.z;
						} else if (dirs.length !== dirSquareSide * dirSquareSide - 1) {
							y = x === dirSquareSide - 1 ? y + 2 : 2;
							x = dirSquareSide - 1;
							filesPerRow = 1;
							fileSquareSide = Math.ceil(
								Math.sqrt(Math.ceil(files.length / filesPerRow))
							);
							const yOff = 1 - (0.5 * y + 1) * (1 / dirSquareSide);
							const xOff = 0.9 * x * (1 / dirSquareSide);
							const subX = xOff + 0.1 / dirSquareSide;
							const subY = yOff + 0.125 / dirSquareSide;
							fileTree.filesBox = filesBox = {};
							filesBox.x = fileTree.x + fileTree.scale * subX * dirScale;
							filesBox.y =
								fileTree.y +
								fileTree.scale * subY * dirScale +
								(1 - dirScale) * fileTree.scale;
							filesBox.scale = 2 * fileTree.scale * (0.9 / dirSquareSide) * dirScale;
							filesBox.z = fileTree.z;
						} else {
							const yOff = 1 - (0.5 * y + 1) * (1 / dirSquareSide);
							const xOff = 0.9 * x * (1 / dirSquareSide);
							const subX = xOff + 0.1 / dirSquareSide;
							const subY = yOff + 0.125 / dirSquareSide;
							fileTree.filesBox = filesBox = {};
							filesBox.x = fileTree.x + fileTree.scale * subX * dirScale;
							filesBox.y =
								fileTree.y +
								fileTree.scale * subY * dirScale +
								(1 - dirScale) * fileTree.scale;
							filesBox.scale = fileTree.scale * (0.8 / dirSquareSide) * dirScale;
							filesBox.z = fileTree.z;
						}
					}
					break outer;
				}
				maxX = Math.max(x, maxX);
				maxY = Math.max(y, maxY);
				const yOff = 1 - (0.5 * y + 1) * (1 / dirSquareSide);
				const xOff = 0.9 * x * (1 / dirSquareSide);
				const dir = dirs[off];
				const subX = xOff + 0.1 / dirSquareSide;
				const subY = yOff + 0.125 / dirSquareSide;
				dir.x = fileTree.x + fileTree.scale * subX * dirScale;
				dir.y =
					fileTree.y + fileTree.scale * subY * dirScale + (1 - dirScale) * fileTree.scale;
				dir.scale = fileTree.scale * (0.8 / dirSquareSide) * dirScale;
				dir.z = fileTree.z + dir.scale * 0.2;
				dir.index = fileIndex;
				dir.vertexIndex = vertexIndices.vertexIndex;
				dir.textVertexIndex = vertexIndices.textVertexIndex;
				dir.parent = fileTree;
				index[fileIndex] = dir;
				var dirColor = dir.color || Colors.getDirectoryColor(dir);
				Geometry.setColor(colorVerts, dir.index, dirColor);
				vertexIndices.vertexIndex = Geometry.makeQuad(
					verts,
					dir.index,
					dir.x,
					dir.y + 0.5 * dir.scale,
					dir.scale,
					dir.scale * 0.5,
					dir.z
				);
				vertexIndices.textVertexIndex = await this.createTextForEntry(
					dir,
					parentText,
					vertexIndices.textVertexIndex,
					yieldFn,
					0.5
				);
				fileIndex = await this.createFileTreeQuads(
					yieldFn,
					dir,
					fileIndex,
					verts,
					colorVerts,
					dir.text,
					thumbnails,
					index,
					vertexIndices
				);
			}
		}

		maxX = 0;
		maxY = 0;
		outer: for (let x = 0; x < fileSquareSide * filesPerRow; x++) {
			for (let y = 0; y < fileSquareSide; y++) {
				const off = x * fileSquareSide + y;
				if (off >= files.length) {
					break outer;
				}
				maxX = Math.max(x, maxX);
				maxY = Math.max(y, maxY);
				const yOff = 1 - (y + 1) * (1 / fileSquareSide);
				const xOff = fileXOff + x * (1 / fileSquareSide);
				const subX = xOff + 0.05 / fileSquareSide;
				const subY = yOff + 0.05 / fileSquareSide;

				const file = files[off];
				const fileColor = file.color || Colors.getFileColor(file);
				file.x = filesBox.x + filesBox.scale * subX * filesScale;
				file.y =
					filesBox.y +
					filesBox.scale * subY * filesScale +
					filesBox.scale * (1 - filesScale);
				file.scale = filesBox.scale * (0.9 / fileSquareSide) * filesScale;
				file.z = filesBox.z + file.scale * 0.2;
				file.index = fileIndex;
				file.vertexIndex = vertexIndices.vertexIndex;
				file.lastIndex = fileIndex;
				file.parent = fileTree;
				index[fileIndex] = file;
				Geometry.setColor(colorVerts, file.index, fileColor);
				vertexIndices.vertexIndex = Geometry.makeQuad(
					verts,
					file.index,
					file.x,
					file.y,
					file.scale,
					file.scale,
					file.z
				);
				vertexIndices.textVertexIndex = await this.createTextForEntry(
					file,
					parentText,
					vertexIndices.textVertexIndex,
					yieldFn,
					1
				);
				file.lastVertexIndex = vertexIndices.vertexIndex;
				fileIndex++;
			}
		}

		fileTree.lastIndex = fileIndex - 1;
		fileTree.lastTextVertexIndex = vertexIndices.textVertexIndex;
		fileTree.lastVertexIndex = vertexIndices.vertexIndex;
		return fileIndex;
	},

	createTextForEntry: async function(obj, parentText, textVertexIndex, yieldFn, xScale = 1) {
		var title = obj.title;
		if (obj.entries == null) {
			if (title.indexOf('\n') === -1 && title.length > 16) {
				var breakPoint = Math.max(16, Math.floor(title.length / 2));
				title = title.substring(0, breakPoint) + '\n' + title.substring(breakPoint);
			}
		}

		var textGeometry = await createText(
			{ text: title, font: this.font, noBounds: true },
			yieldFn
		);
		var text = new THREE.Object3D();
		text.geometry = textGeometry;

		obj.textVertexIndex = textVertexIndex;
		obj.lastTextVertexIndex =
			textVertexIndex + text.geometry.attributes.position.array.length / 4;

		var textScaleW = 220 / Math.max(textGeometry.layout.width, 220);
		var textScaleH = (obj.entries ? 30 : 50) / textGeometry.layout.height;

		var scale = Math.min(textScaleW, textScaleH);

		text.position.x = obj.x + (obj.entries ? 0 : obj.scale * 0.02);
		text.position.y = obj.y + (obj.entries ? obj.scale * 1.02 : obj.scale * 0.02);
		text.position.z = obj.z;
		text.scale.multiplyScalar(xScale * obj.scale * 0.00436 * scale);
		text.scale.y *= -1;
		var arr = textGeometry.attributes.position.array;
		for (var j = 0; j < arr.length; j += 4) {
			arr[j] = arr[j] * text.scale.x + text.position.x;
			arr[j + 1] = arr[j + 1] * text.scale.y + text.position.y;
			arr[j + 2] = arr[j + 2] * text.scale.z + text.position.z;
		}
		text.position.set(0, 0, 0);
		text.scale.set(1, 1, 1);
		var o = new THREE.Object3D();
		if (parentText.children.length === 0) o.isFirst = true;
		o.add(text);
		parentText.add(o);
		obj.text = o;

		return obj.lastTextVertexIndex;
	},
};
