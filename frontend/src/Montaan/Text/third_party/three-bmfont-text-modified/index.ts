import { TextLayout, LayoutOptions, LayoutGlyph } from '../layout-bmfont-text-modified';
import * as THREE from 'three';

import * as vertices from './lib/vertices';
import * as utils from './lib/utils';

export default function createTextGeometry(options: LayoutOptions) {
	var geo = new SDFTextGeometry(options);
	return geo;
}

export class SDFTextGeometry extends THREE.BufferGeometry {
	sdfText: SDFText;

	constructor(options: LayoutOptions) {
		super();
		this.sdfText = new SDFText(options);
		this.setAttribute('position', new THREE.BufferAttribute(this.sdfText.position, 4));
		this.setAttribute('uv', new THREE.BufferAttribute(this.sdfText.uv, 2));
		if (this.sdfText.page)
			this.setAttribute('page', new THREE.BufferAttribute(this.sdfText.page, 1));
		if (!options.noBounds) this.computeBounds();
	}

	private bounds3(
		positions: Float32Array,
		itemSize: number,
		box: { min: number[]; max: number[] }
	) {
		box.min[0] = positions[0];
		box.min[1] = positions[1];
		box.min[2] = positions[2];
		box.max[0] = positions[0];
		box.max[1] = positions[1];
		box.max[2] = positions[2];

		for (let i = 0, l = positions.length; i < l; i += itemSize) {
			var x = positions[i + 0];
			var y = positions[i + 1];
			var z = positions[i + 2];
			if (x < box.min[0]) box.min[0] = x;
			else if (x > box.max[0]) box.max[0] = x;
			if (y < box.min[1]) box.min[1] = y;
			else if (y > box.max[1]) box.max[1] = y;
			if (z < box.min[2]) box.min[2] = z;
			else if (z > box.max[2]) box.max[2] = z;
		}
	}

	private computeBounds() {
		this.boundingBox = new THREE.Box3();
		this.boundingSphere = new THREE.Sphere();

		var itemSize = 4;
		var box = { min: [0, 0, 0], max: [0, 0, 0] };

		var positions = this.getAttribute('position').array as Float32Array;
		this.bounds3(positions, itemSize, box);

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
	}

	computeBoundingSphere() {
		if (!this.boundingSphere) {
			this.boundingSphere = new THREE.Sphere();
		}

		var positions = this.getAttribute('position');
		if (!positions) {
			this.boundingSphere.radius = 0;
			this.boundingSphere.center.set(0, 0, 0);
			return;
		}
		utils.computeSphere(positions.array as Float32Array, this.boundingSphere);
		if (isNaN(this.boundingSphere.radius)) {
			console.error(
				'THREE.BufferGeometry.computeBoundingSphere(): ' +
					'Computed radius is NaN. The ' +
					'"position" attribute is likely to have NaN values.'
			);
		}
	}

	computeBoundingBox() {
		if (!this.boundingBox) {
			this.boundingBox = new THREE.Box3();
		}

		var bbox = this.boundingBox;
		var positions = this.getAttribute('position').array;
		var itemSize = this.getAttribute('position').itemSize;
		if (!positions || !itemSize || positions.length < 2) {
			bbox.makeEmpty();
			return;
		}
		utils.computeBox(positions as Float32Array, bbox);
	}
}

export class SDFText {
	layout: TextLayout;
	visibleGlyphs: LayoutGlyph[];
	position: Float32Array;
	uv: Float32Array;
	page?: Float32Array;

	static mock: SDFText = {
		position: new Float32Array(),
		uv: new Float32Array(),
		visibleGlyphs: [],
		layout: TextLayout.mock,
	};

	constructor(options: LayoutOptions) {
		this.layout = new TextLayout(options);

		// get vec2 texcoords
		var flipY = options.flipY !== false;

		// the desired BMFont data
		var font = options.font;

		// determine texture size from font file
		var texWidth = font.common.scaleW;
		var texHeight = font.common.scaleH;

		// get visible glyphs
		const glyphs = [],
			lglyphs = this.layout.glyphs;
		for (let i = 0; i < lglyphs.length; i++) {
			const bitmap = lglyphs[i].data;
			if (bitmap.width * bitmap.height > 0) glyphs.push(lglyphs[i]);
		}

		// provide visible glyphs for convenience
		this.visibleGlyphs = glyphs;

		// get common vertex data
		this.position = vertices.positions(glyphs);
		this.uv = vertices.uvs(glyphs, texWidth, texHeight, flipY);

		// update multipage data
		if (options.multipage) {
			this.page = vertices.pages(glyphs);
		}
	}
}
