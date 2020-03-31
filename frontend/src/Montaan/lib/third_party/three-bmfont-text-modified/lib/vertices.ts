import { LayoutGlyph } from '../../layout-bmfont-text-modified';

export function pages(glyphs: LayoutGlyph[]): Float32Array {
	const pages = new Float32Array(glyphs.length * 4);
	for (let i = 0; i < glyphs.length; i++) {
		const id = glyphs[i].data.page || 0;
		let j = i * 4;
		pages[j++] = id;
		pages[j++] = id;
		pages[j++] = id;
		pages[j++] = id;
	}
	return pages;
}

export function uvs(
	glyphs: LayoutGlyph[],
	texWidth: number,
	texHeight: number,
	flipY: boolean
): Float32Array {
	const iTexWidth = 1 / texWidth;
	const iTexHeight = 1 / texHeight;
	const uvs = new Float32Array(glyphs.length * 12);
	for (let j = 0; j < glyphs.length; j++) {
		const bitmap = glyphs[j].data;
		const bw = bitmap.x + bitmap.width;
		const bh = bitmap.y + bitmap.height;

		// top left position
		const u0 = bitmap.x * iTexWidth;
		const v1 = (flipY ? texHeight - bitmap.y : bitmap.y) * iTexHeight;
		const u1 = bw * iTexWidth;
		const v0 = (flipY ? texHeight - bh : bh) * iTexHeight;

		let i = j * 12;
		// BL
		uvs[i++] = u0;
		uvs[i++] = v1;
		// TL
		uvs[i++] = u0;
		uvs[i++] = v0;
		// TR
		uvs[i++] = u1;
		uvs[i++] = v0;
		// TR
		uvs[i++] = u1;
		uvs[i++] = v0;
		// BR
		uvs[i++] = u1;
		uvs[i++] = v1;
		// BL
		uvs[i++] = u0;
		uvs[i++] = v1;
	}
	return uvs;
}

export function positions(glyphs: LayoutGlyph[]): Float32Array {
	const positions = new Float32Array(glyphs.length * 6 * 4);
	for (let j = 0; j < glyphs.length; j++) {
		const bitmap = glyphs[j].data;

		// bottom left position
		const x = glyphs[j].x + bitmap.xoffset;
		const y = glyphs[j].y + bitmap.yoffset;

		// quad size
		const w = bitmap.width;
		const h = bitmap.height;

		let i = j * 24;
		// BL
		positions[i++] = x;
		positions[i++] = y;
		positions[i++] = 0;
		positions[i++] = 0;
		// TL
		positions[i++] = x;
		positions[i++] = y + h;
		positions[i++] = 0;
		positions[i++] = 0;
		// TR
		positions[i++] = x + w;
		positions[i++] = y + h;
		positions[i++] = 0;
		positions[i++] = 0;
		// TR
		positions[i++] = x + w;
		positions[i++] = y + h;
		positions[i++] = 0;
		positions[i++] = 0;
		// BR
		positions[i++] = x + w;
		positions[i++] = y;
		positions[i++] = 0;
		positions[i++] = 0;
		// BL
		positions[i++] = x;
		positions[i++] = y;
		positions[i++] = 0;
		positions[i++] = 0;
	}
	return positions;
}
