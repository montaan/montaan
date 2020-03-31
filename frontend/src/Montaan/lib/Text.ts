import createText, { SDFTextGeometry, SDFText } from './third_party/three-bmfont-text-modified';
import SDFShader from './third_party/three-bmfont-text-modified/shaders/msdf';
import Colors from './Colors';
import * as THREE from 'three';
import {
	Font,
	LayoutOptionsWithoutFont,
	LayoutOptions,
} from './third_party/layout-bmfont-text-modified';

const emptyMaterial = new THREE.RawShaderMaterial();
const emptyGeometry = (new THREE.BufferGeometry() as unknown) as SDFTextGeometry;

export class SDFTextMesh extends THREE.Mesh {
	material: THREE.RawShaderMaterial = emptyMaterial;
	geometry: SDFTextGeometry = emptyGeometry;
}

export default {
	font: undefined as Font | undefined,
	fontTexture: undefined as THREE.Texture | undefined,
	textMaterial: emptyMaterial,

	makeTextMaterial(
		palette?: THREE.Vector3[],
		fontTexture?: THREE.Texture
	): THREE.RawShaderMaterial {
		if (!fontTexture && !this.fontTexture) throw new Error('Layout.fontTexture not set');
		if (!palette) palette = [];
		if (!fontTexture && this.fontTexture) fontTexture = this.fontTexture;
		if (palette.length < 8) {
			palette = palette.slice();
			while (palette.length < 8) {
				palette.push(
					palette[palette.length - 1] ||
						new THREE.Vector3(
							Colors.textColor.r,
							Colors.textColor.g,
							Colors.textColor.b
						)
				);
			}
		}
		return new THREE.RawShaderMaterial(
			SDFShader({
				map: fontTexture,
				side: THREE.DoubleSide,
				transparent: true,
				color: 0xffffff,
				palette: palette,
				polygonOffset: true,
				polygonOffsetFactor: -0.5,
				polygonOffsetUnits: 0.5,
				depthTest: false,
				depthWrite: false,
			})
		);
	},

	createText: function(options: LayoutOptionsWithoutFont): SDFTextGeometry {
		options.font = options.font || this.font;
		if (!options.font) throw new Error('No font specified and no default font set.');
		return createText(options as LayoutOptions);
	},

	createTextArrays: function(options: LayoutOptionsWithoutFont): SDFText {
		options.font = options.font || this.font;
		if (!options.font) throw new Error('No font specified and no default font set.');
		return new SDFText(options as LayoutOptions);
	},
};
