var utils = require('./utils.js');

module.exports = {

	quadCount: 2,

	findFSEntry: function(ev, camera, model) {
		var intersections = utils.findIntersectionsUnderEvent(ev, camera, [model]);
		if (intersections.length > 0) {
			var faceIndex = intersections[0].faceIndex;
			var fsEntry = model.fileTree.index[Math.floor(faceIndex / (6 * this.quadCount))];
			while (fsEntry && fsEntry.scale * camera.projectionMatrix.elements[0] < 0.2) {
				if (fsEntry.parent === highlighted) {
					break;
				}
				fsEntry = fsEntry.parent;
			}
			return fsEntry;
		}
	},

	makeGeometry: function(fileCount) {
		var geo = new THREE.BufferGeometry();
		var verts = new Float32Array(fileCount * 3 * 6 * this.quadCount);
		var colorVerts = new Float32Array(fileCount * 3 * 6 * this.quadCount);
		geo.addAttribute('position', new THREE.BufferAttribute(verts, 3));
		geo.addAttribute('color', new THREE.BufferAttribute(colorVerts, 3));

		// var normalVerts = new Float32Array(fileCount * 3 * 6 * 5); //* 2);
		// geo.addAttribute('normal', new THREE.BufferAttribute(normalVerts, 3));
		// for (var i=0; i<normalVerts.length; i+=3) {
		// 	normalVerts[i] = 0;
		// 	normalVerts[i+1] = 0;
		// 	normalVerts[i+2] = -1;
		// };

		return geo;
	},

	setColor: function(verts, index, color, depth) {
		var i = index * 18 * this.quadCount; //(index * 2 + 1) * 18;
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

		for (var j=1; j<this.quadCount; j++) {
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
		}
	},

	makeQuad: function(verts, index, x, y, w, h, z) {

		var i = index * 18 * this.quadCount;

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

		verts[i++] = x;
		verts[i++] = y;
		verts[i++] = z-h*0.2;
		verts[i++] = x + w;
		verts[i++] = y;
		verts[i++] = z-h*0.2;
		verts[i++] = x;
		verts[i++] = y;
		verts[i++] = z;

		verts[i++] = x;
		verts[i++] = y;
		verts[i++] = z;
		verts[i++] = x + w;
		verts[i++] = y;
		verts[i++] = z-h*0.2;
		verts[i++] = x + w;
		verts[i++] = y;
		verts[i++] = z;

		// verts[i++] = x;
		// verts[i++] = y + h;
		// verts[i++] = z-h*0.2;
		// verts[i++] = x + w;
		// verts[i++] = y + h;
		// verts[i++] = z-h*0.2;
		// verts[i++] = x;
		// verts[i++] = y + h;
		// verts[i++] = z;

		// verts[i++] = x;
		// verts[i++] = y + h;
		// verts[i++] = z;
		// verts[i++] = x + w;
		// verts[i++] = y + h;
		// verts[i++] = z-h*0.2;
		// verts[i++] = x + w;
		// verts[i++] = y + h;
		// verts[i++] = z;

		// verts[i++] = x;
		// verts[i++] = y;
		// verts[i++] = z-h*0.2;
		// verts[i++] = x;
		// verts[i++] = y + h;
		// verts[i++] = z-h*0.2;
		// verts[i++] = x;
		// verts[i++] = y;
		// verts[i++] = z;

		// verts[i++] = x;
		// verts[i++] = y;
		// verts[i++] = z;
		// verts[i++] = x;
		// verts[i++] = y + h;
		// verts[i++] = z-h*0.2;
		// verts[i++] = x;
		// verts[i++] = y + h;
		// verts[i++] = z;

		// verts[i++] = x + w;
		// verts[i++] = y;
		// verts[i++] = z-h*0.2;
		// verts[i++] = x + w;
		// verts[i++] = y + h;
		// verts[i++] = z-h*0.2;
		// verts[i++] = x + w;
		// verts[i++] = y;
		// verts[i++] = z;

		// verts[i++] = x + w;
		// verts[i++] = y;
		// verts[i++] = z;
		// verts[i++] = x + w;
		// verts[i++] = y + h;
		// verts[i++] = z-h*0.2;
		// verts[i++] = x + w;
		// verts[i++] = y + h;
		// verts[i++] = z;

	}

};