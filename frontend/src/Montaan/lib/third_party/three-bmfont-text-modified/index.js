import createLayout from '../layout-bmfont-text-modified';
var inherits = require('inherits');
var buffer = require('../three-buffer-vertex-data-modified');
var THREE = require('three');

var vertices = require('./lib/vertices');
var utils = require('./lib/utils');

var Base = THREE.BufferGeometry;

export default async function createTextGeometry(opt, yieldFn) {
	var geo = new SDFTextGeometry();
	await geo.update(opt, yieldFn);
	return geo;
}

export function SDFTextGeometry() {
	Base.call(this);
}

inherits(SDFTextGeometry, Base);

SDFTextGeometry.prototype.update = async function(opt, yieldFn) {
	if (typeof opt === 'string') {
		opt = { text: opt };
	}

	// use constructor defaults
	opt = { ...this._opt, ...opt };

	if (!opt.font) {
		throw new TypeError('must specify a { font } in options');
	}

	this.layout = await createLayout(opt, yieldFn);

	// get vec2 texcoords
	var flipY = opt.flipY !== false;

	// the desired BMFont data
	var font = opt.font;

	// determine texture size from font file
	var texWidth = font.common.scaleW;
	var texHeight = font.common.scaleH;

	// get visible glyphs
	const glyphs = [],
		lglyphs = this.layout.glyphs;
	for (let i = 0; i < lglyphs.length; i++) {
		const bitmap = lglyphs[i].data;
		if (bitmap.width * bitmap.height > 0) glyphs.push(lglyphs[i]);
		if (i % 10000 === 9999) await yieldFn();
	}

	// provide visible glyphs for convenience
	this.visibleGlyphs = glyphs;

	// get common vertex data
	var positions = vertices.positions(glyphs);
	var uvs = vertices.uvs(glyphs, texWidth, texHeight, flipY);

	// update vertex data
	buffer.attr(this, 'position', positions, 4);
	buffer.attr(this, 'uv', uvs, 2);

	// update multipage data
	if (!opt.multipage && 'page' in this.attributes) {
		// disable multipage rendering
		this.removeAttribute('page');
	} else if (opt.multipage) {
		var pages = vertices.pages(glyphs);
		// enable multipage rendering
		buffer.attr(this, 'page', pages, 1);
	}

	if (!opt.noBounds) await this.computeBounds(yieldFn);
};

SDFTextGeometry.prototype.computeBounds = async function(yieldFn) {
	this.boundingBox = new THREE.Box3();
	this.boundingSphere = new THREE.Sphere();

	var itemSize = 4;
	var box = { min: [0, 0, 0], max: [0, 0, 0] };

	const bounds = async function(positions) {
		const count = positions.length / itemSize;
		box.min[0] = positions[0];
		box.min[1] = positions[1];
		box.min[2] = positions[2];
		box.max[0] = positions[0];
		box.max[1] = positions[1];
		box.max[2] = positions[2];

		for (let i = 0; i < count; i++) {
			var x = positions[i * itemSize + 0];
			var y = positions[i * itemSize + 1];
			var z = positions[i * itemSize + 2];
			if (x < box.min[0]) box.min[0] = x;
			else if (x > box.max[0]) box.max[0] = x;
			if (y < box.min[1]) box.min[1] = y;
			else if (y > box.max[1]) box.max[1] = y;
			if (z < box.min[2]) box.min[2] = z;
			else if (z > box.max[2]) box.max[2] = z;
			if (i % 10000 === 9999) await yieldFn();
		}
	};

	var positions = this.attributes.position.array;
	if (!positions || positions.length < 3) {
		this.boundingSphere.radius = 0;
		this.boundingSphere.center.set(0, 0, 0);
		this.boundingBox.makeEmpty();
		return;
	}

	await bounds(positions);

	var width = box.max[0] - box.min[0];
	var height = box.max[1] - box.min[1];
	var depth = box.max[2] - box.min[2];
	var length = Math.sqrt(width * width + height * height + depth * depth);
	this.boundingSphere.center.set(
		box.min[0] + width / 2,
		box.min[1] + height / 2,
		box.min[2] + depth / 2
	);
	this.boundingSphere.radius = length / 2;

	this.boundingBox.min.set(box.min[0], box.min[1], box.min[2]);
	this.boundingBox.max.set(box.max[0], box.max[1], box.max[2]);
};

SDFTextGeometry.prototype.computeBoundingSphere = function() {
	if (this.boundingSphere === null) {
		this.boundingSphere = new THREE.Sphere();
	}

	var positions = this.attributes.position.array;
	var itemSize = this.attributes.position.itemSize;
	if (!positions || !itemSize || positions.length < 2) {
		this.boundingSphere.radius = 0;
		this.boundingSphere.center.set(0, 0, 0);
		return;
	}
	utils.computeSphere(positions, this.boundingSphere);
	if (isNaN(this.boundingSphere.radius)) {
		console.error(
			'THREE.BufferGeometry.computeBoundingSphere(): ' +
				'Computed radius is NaN. The ' +
				'"position" attribute is likely to have NaN values.'
		);
	}
};

SDFTextGeometry.prototype.computeBoundingBox = function() {
	if (this.boundingBox === null) {
		this.boundingBox = new THREE.Box3();
	}

	var bbox = this.boundingBox;
	var positions = this.attributes.position.array;
	var itemSize = this.attributes.position.itemSize;
	if (!positions || !itemSize || positions.length < 2) {
		bbox.makeEmpty();
		return;
	}
	utils.computeBox(positions, bbox);
};
