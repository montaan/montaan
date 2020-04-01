import { wordWrapLines } from '../word-wrapper-modified';

const X_HEIGHTS = ['x', 'e', 'a', 'o', 'n', 's', 'r', 'c', 'u', 'm', 'v', 'w', 'z'];
const M_WIDTHS = ['m', 'w'];
const CAP_HEIGHTS = ['H', 'I', 'N', 'E', 'F', 'K', 'L', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

const TAB_ID = '\t'.charCodeAt(0);
const SPACE_ID = ' '.charCodeAt(0);
const FALLBACK_ID = '?'.charCodeAt(0);

export type Glyph = {
	id: number;
	x: number;
	y: number;
	page: number;
	height: number;
	xadvance: number;
	xoffset: number;
	yoffset: number;
	width: number;
};

export type Kerning = {
	amount: number;
	first: number;
	second: number;
};

export type Font = {
	chars: Glyph[];
	glyphs: Map<number, Glyph>;
	kernings?: Map<number, Map<number, number>>;
	common: {
		lineHeight: number;
		base: number;
		scaleW: number;
		scaleH: number;
	};
	fallbackGlyphsInitialized: boolean;
	fallbackGlyph: Glyph;
	fallbackSpaceGlyph: Glyph;
	fallbackTabGlyph: Glyph;
};

export interface Metrics {
	start: number;
	end: number;
	width: number;
}

export enum Align {
	left,
	center,
	right,
}

export interface LayoutOptionsWithoutFont {
	font?: Font;
	align?: Align;
	measure?: (text: string, start: number, end: number, width: number) => Metrics;
	tabSize?: number;
	text: string;
	width?: number;
	lineHeight?: number;
	letterSpacing?: number;
	flipY?: boolean;
	multipage?: boolean;
	noBounds?: boolean;
	mode?: 'pre' | 'normal' | 'nowrap';
}

export interface LayoutOptions extends LayoutOptionsWithoutFont {
	font: Font;
}

export class LayoutGlyph {
	x: number;
	y: number;
	data: Glyph;
	index: number;
	line: number;
	constructor(x: number, y: number, data: Glyph, index: number, line: number) {
		this.x = x;
		this.y = y;
		this.data = data;
		this.index = index;
		this.line = line;
	}
}

export class TextLayout {
	glyphs: LayoutGlyph[];
	options: LayoutOptions;
	width: number;
	height: number;
	descender: number;
	baseline: number;
	xHeight: number;
	capHeight: number;
	lineHeight: number;
	ascender: number;
	linesTotal: number;

	defaultTabSize: number = 4;

	static mock: TextLayout = {
		glyphs: [] as LayoutGlyph[],
		options: { text: '', font: ({} as unknown) as Font },
		width: 0,
		height: 0,
		descender: 0,
		baseline: 0,
		xHeight: 0,
		capHeight: 0,
		lineHeight: 0,
		ascender: 0,
		linesTotal: 0,

		defaultTabSize: 4,
		setupFallbackGlyphs: () => {},
		computeMetrics: (text: string, start: number, end: number, width: number): Metrics => ({
			start: 0,
			end: 0,
			width: 0,
		}),
	};

	constructor(options: LayoutOptions) {
		this.glyphs = [];
		this.options = options;
		options.measure = this.computeMetrics;

		if (this.options.tabSize === undefined) this.options.tabSize = this.defaultTabSize;

		if (!this.options.font) throw new Error('must provide a valid bitmap font');

		var glyphs = this.glyphs;
		var text = this.options.text || '';
		var font = this.options.font;
		this.setupFallbackGlyphs(font);

		const lines = wordWrapLines(text, {
			mode: this.options.mode,
			width: this.options.width,
			measure: this.options.measure,
		});
		var minWidth = this.options.width || 0;

		//clear glyphs
		glyphs.length = 0;

		//get max line width
		var maxLineWidth = minWidth;
		for (let i = 0; i < lines.length; i++) {
			if (lines[i].width > maxLineWidth) maxLineWidth = lines[i].width;
		}

		//the pen position
		var x = 0;
		var y = 0;
		var lineHeight = this.options.lineHeight;
		if (lineHeight === undefined) lineHeight = font.common.lineHeight as number;
		var baseline = font.common.base;
		var descender = lineHeight - baseline;
		var letterSpacing = this.options.letterSpacing || 0;
		var height = lineHeight * lines.length - descender;
		var align = this.options.align;

		//draw text along baseline
		y -= height;

		//the metrics for this text layout
		this.width = maxLineWidth;
		this.height = height;
		this.descender = lineHeight - baseline;
		this.baseline = baseline;
		this.xHeight = getXHeight(font);
		this.capHeight = getCapHeight(font);
		this.lineHeight = lineHeight;
		this.ascender = lineHeight - descender - this.xHeight;

		//layout each glyph
		for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
			const line = lines[lineIndex];
			var start = line.start;
			var end = line.end;
			var lineWidth = line.width;
			var lastGlyph;

			//for each glyph in that line...
			for (let i = start; i < end; i++) {
				var id = text.charCodeAt(i);
				var glyph = font.glyphs.get(id) || font.fallbackGlyph;
				if (glyph) {
					if (lastGlyph) x += getKerning(font, lastGlyph.id, glyph.id);

					var tx = x;
					if (align === Align.center) tx += (maxLineWidth - lineWidth) / 2;
					else if (align === Align.right) tx += maxLineWidth - lineWidth;

					glyphs.push(new LayoutGlyph(tx, y, glyph, i, lineIndex));

					//move pen forward
					x += glyph.xadvance + letterSpacing;
					lastGlyph = glyph;
				}
			}

			//next line down
			y += lineHeight;
			x = 0;
		}
		this.linesTotal = lines.length;
	}

	setupFallbackGlyphs(font: Font) {
		//These are fallbacks, when the font doesn't include
		//' ' or '\t' glyphs

		if (font.fallbackGlyphsInitialized) return;
		font.fallbackGlyphsInitialized = true;

		font.fallbackGlyph = font.glyphs.get(FALLBACK_ID) /* "?" */ || {
			x: 0,
			y: 0,
			page: 0,
			xadvance: 0,
			id: FALLBACK_ID,
			xoffset: 0,
			yoffset: 0,
			width: 0,
			height: 0,
		};

		//try to get space glyph
		//then fall back to the 'm' or 'w' glyphs
		//then fall back to the first glyph available
		font.fallbackSpaceGlyph = font.glyphs.get(SPACE_ID) ||
			getMGlyph(font) || {
				x: 0,
				y: 0,
				page: 0,
				xadvance: 0,
				id: SPACE_ID,
				xoffset: 0,
				yoffset: 0,
				width: 0,
				height: 0,
			};

		//and create a fallback for tab
		font.fallbackTabGlyph = {
			x: 0,
			y: 0,
			page: 0,
			xadvance:
				(this.options.tabSize || this.defaultTabSize) * font.fallbackSpaceGlyph.xadvance,
			id: TAB_ID,
			xoffset: 0,
			yoffset: 0,
			width: 0,
			height: 0,
		};
		font.glyphs.set(SPACE_ID, font.fallbackSpaceGlyph);
		font.glyphs.set(TAB_ID, font.fallbackTabGlyph);
	}

	computeMetrics = (text: string, start: number, end: number, width: number): Metrics => {
		const letterSpacing = this.options.letterSpacing || 0;
		const font = this.options.font;
		let curPen = 0;
		let curWidth = 0;
		let count = 0;
		let lastGlyph;

		if (font.glyphs.size === 0) {
			return {
				start: start,
				end: start,
				width: 0,
			};
		}

		end = Math.min(text.length, end);
		for (let i = start; i < end; i++) {
			const id = text.charCodeAt(i);
			const glyph = font.glyphs.get(id);

			if (glyph) {
				//move pen forward
				// var xoff = glyph.xoffset
				const kern = lastGlyph ? getKerning(font, lastGlyph.id, glyph.id) : 0;
				curPen += kern;

				const nextPen = curPen + glyph.xadvance + letterSpacing;
				const nextWidth = curPen + glyph.width;

				//we've hit our limit; we can't move onto the next glyph
				if (nextWidth >= width || nextPen >= width) break;

				//otherwise continue along our line
				curPen = nextPen;
				curWidth = nextWidth;
				lastGlyph = glyph;
			}
			count++;
		}

		//make sure rightmost edge lines up with rendered glyphs
		if (lastGlyph) curWidth += lastGlyph.xoffset;

		return {
			start: start,
			end: start + count,
			width: curWidth,
		};
	};
}

function getXHeight(font: Font): number {
	for (var i = 0; i < X_HEIGHTS.length; i++) {
		var id = X_HEIGHTS[i].charCodeAt(0);
		const glyph = font.glyphs.get(id);
		if (glyph !== undefined) return glyph.height;
	}
	return 0;
}

function getMGlyph(font: Font): Glyph | null {
	for (var i = 0; i < M_WIDTHS.length; i++) {
		var id = M_WIDTHS[i].charCodeAt(0);
		const glyph = font.glyphs.get(id);
		if (glyph !== undefined) return glyph;
	}
	return null;
}

function getCapHeight(font: Font): number {
	for (var i = 0; i < CAP_HEIGHTS.length; i++) {
		const id = CAP_HEIGHTS[i].charCodeAt(0);
		const glyph = font.glyphs.get(id);
		if (glyph !== undefined) return glyph.height;
	}
	return 0;
}

function getKerning(font: Font, left: number, right: number): number {
	if (!font.kernings || font.kernings.size === 0) return 0;
	const kernings = font.kernings.get(left);
	if (!kernings) return 0;
	return kernings.get(right) || 0;
}
