import * as THREE from 'three';

export interface MSDFShaderOptions {
	map?: THREE.Texture;
	side?: THREE.Side;
	transparent?: boolean;
	color?: string | number | THREE.Color;
	palette?: THREE.Vector3[];
	polygonOffset?: boolean;
	polygonOffsetFactor?: number;
	polygonOffsetUnits?: number;
	depthTest?: boolean;
	depthWrite?: boolean;
	opacity?: number;
	alphaTest?: number;
	precision?: 'highp' | 'mediump' | 'lowp' | null;
	negate?: boolean;
}

export default function createMSDFShader(opt: MSDFShaderOptions) {
	opt = opt || {};
	var opacity = typeof opt.opacity === 'number' ? opt.opacity : 1;
	var alphaTest = typeof opt.alphaTest === 'number' ? opt.alphaTest : 0.0001;
	var precision = opt.precision || 'highp';
	var color = opt.color;
	var map = opt.map;
	var negate = typeof opt.negate === 'boolean' ? opt.negate : false;
	var palette = opt.palette;
	var maxPaletteLength = Math.max(palette ? palette.length : 1, 8);

	// remove to satisfy r73
	delete opt.map;
	delete opt.color;
	delete opt.precision;
	delete opt.opacity;
	delete opt.negate;
	delete opt.palette;

	if (!palette) {
		var tColor = new THREE.Color(color);
		var colorVec = new THREE.Vector3(tColor.r, tColor.g, tColor.b);
		palette = [colorVec];
	}

	var paletteElseIfs = [];
	for (var i = 1; i < maxPaletteLength; i++) {
		paletteElseIfs.push('    else if (pIdx == ' + i + '.0) pColor = palette[' + i + '];');
	}

	return {
		uniforms: {
			opacity: { type: 'f', value: opacity },
			map: { type: 't', value: map || new THREE.Texture() },
			palette: { type: 'v3v', value: palette },
		},

		vertexShader: [
			'attribute vec2 uv;',
			'attribute vec4 position;',
			'uniform mat4 projectionMatrix;',
			'uniform mat4 modelViewMatrix;',
			'uniform vec3 palette[' + maxPaletteLength + '];',
			'varying vec2 vUv;',
			'varying vec3 pColor;',
			'varying float bold;',
			'void main() {',
			'    vUv = uv;',
			'    float pIdx = floor(position.a);',
			'    bold = 0.0;',
			'    if (pIdx >= 256.0) {',
			'      bold = 1.0;',
			'      pIdx -= 256.0;',
			'    }',
			'    pIdx = mod(pIdx, ' + maxPaletteLength + '.0);',
			'    if (pIdx == 0.0) pColor = palette[0];',
		]
			.concat(paletteElseIfs)
			.concat([
				'gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1);',
				'}',
			])
			.join('\n'),

		fragmentShader: [
			'#ifdef GL_OES_standard_derivatives',
			'#extension GL_OES_standard_derivatives : enable',
			'#endif',
			'#define AA_SIZE ' +
				(4.0 / window.devicePixelRatio).toString().replace(/^(\d+)$/, '$1.0'),
			'precision ' + precision + ' float;',
			'uniform float opacity;',
			'uniform sampler2D map;',
			'varying vec3 pColor;',
			'varying vec2 vUv;',
			'varying float bold;',

			'float median(float r, float g, float b) {',
			'  return max(min(r, g), min(max(r, g), b));',
			'}',

			'float aastep(vec4 sample) {',
			negate ? 'sample = 1.0 - sample;' : '',
			'  float sigDist = median(sample.r, sample.g, sample.b) - 0.5;',
			'  return clamp(sigDist/fwidth(sigDist) + 0.5 + bold * 0.125, 0.0, 1.0);',
			'}',

			'void main() {',
			'    vec4 texColor = texture2D(map, vUv);',
			'    float valpha = (1.0 / (AA_SIZE*AA_SIZE)) * aastep(texColor);',

			'  #ifdef GL_OES_standard_derivatives',
			'    for (float x = 0.0; x < AA_SIZE; x++) for (float y = 0.0; y < AA_SIZE; y++) {',
			'      texColor = texture2D(map, vUv+vec2(x,y)*(1.0/AA_SIZE)*vec2(dFdx(vUv.x), dFdy(vUv.y)), -100.0);',
			'      valpha += (1.0 / (AA_SIZE*AA_SIZE)) * aastep(texColor);',
			'    }',

			// '    float maxD = max(dFdx(vUv.x), dFdy(vUv.y));',
			// '    valpha *= smoothstep(0.07, 0.01, maxD);', // Fade out small text (= when UV derivative gets big)

			'  #else',
			'    valpha *= AA_SIZE*AA_SIZE;',
			'  #endif',

			'    gl_FragColor = vec4(pColor, opacity * valpha);',
			alphaTest === 0 ? '' : '  if (gl_FragColor.a < ' + alphaTest + ') discard;',
			'}',
		].join('\n'),
		...opt,
	};
}
