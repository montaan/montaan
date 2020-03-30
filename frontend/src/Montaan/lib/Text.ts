import createText, { SDFTextGeometry } from './third_party/three-bmfont-text-modified';
import SDFShader from './third_party/three-bmfont-text-modified/shaders/msdf';
import Colors from './Colors';
import * as THREE from 'three';

export interface ISDFTextGeometry extends THREE.BufferGeometry {
	layout: {
		width: number;
		height: number;
		_opt: { text: string };
	};
}

const emptyMaterial = new THREE.RawShaderMaterial();
const emptyGeometry = (new SDFTextGeometry() as unknown) as ISDFTextGeometry;

export class SDFTextMesh extends THREE.Mesh {
	material: THREE.RawShaderMaterial = emptyMaterial;
	geometry: ISDFTextGeometry = emptyGeometry;
}

export default {
	font: null as any | null,
	fontTexture: null as THREE.Texture | null,
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

	createText: function(opts: any) {
		return (createText({ font: this.font, ...opts }) as unknown) as ISDFTextGeometry;
	},
};
