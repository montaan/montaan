import createLayout from '../layout-bmfont-text-modified';
var inherits = require('inherits');
var buffer = require('../three-buffer-vertex-data-modified');
var THREE = require('three');

var vertices = require('./lib/vertices');
var utils = require('./lib/utils');

var Base = THREE.BufferGeometry;

export default async function createTextGeometry(opt, yieldFn) {
	var geo = new TextGeometry();
	await geo.update(opt, yieldFn);
	return geo;
}

function TextGeometry() {
	Base.call(this);
}

inherits(TextGeometry, Base);

TextGeometry.prototype.update = async function(opt, yieldFn) {
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
};

TextGeometry.prototype.computeBoundingSphere = function() {
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

TextGeometry.prototype.computeBoundingBox = function() {
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
