const newline = /\n/;
const newlineChar = '\n';
const whitespace = /\s/;

export interface WrappedLine {
	start: number;
	end: number;
	width: number;
}

export type MeasuringFunction = (
	text: string,
	start: number,
	end: number,
	width: number
) => WrappedLine;

export type WordWrapMode = 'nowrap' | 'normal' | 'pre';

export interface WordWrapOptions {
	width?: number;
	mode?: WordWrapMode;
	start?: number;
	end?: number;
	measure?: MeasuringFunction;
}

export function wordWrap(text: string, opt?: WordWrapOptions): string {
	const wrappedLines = wordWrapLines(text, opt);
	let res = '';
	for (let i = 0; i < wrappedLines.length; i++) {
		const { start, end } = wrappedLines[i];
		res += (i === 0 ? '' : '\n') + text.substring(start, end);
	}
	return res;
}

export function wordWrapLines(text: string, opt?: WordWrapOptions): WrappedLine[] {
	opt = opt || {};

	//zero width results in nothing visible
	if (opt.width === 0 && opt.mode !== 'nowrap') return [];

	text = text || '';
	const width = typeof opt.width === 'number' ? opt.width : Number.MAX_VALUE;
	const start = Math.max(0, opt.start || 0);
	const end = typeof opt.end === 'number' ? opt.end : text.length;
	const mode = opt.mode || 'nowrap';

	const measure = opt.measure || monospace;
	if (mode === 'pre') return pre(measure, text, start, end, width);
	else return greedy(measure, text, start, end, width, mode);
}

function idxOf(text: string, chr: string, start: number, end: number) {
	var idx = text.indexOf(chr, start);
	if (idx === -1 || idx > end) return end;
	return idx;
}

function isWhitespace(chr: string) {
	return whitespace.test(chr);
}

function pre(measure: MeasuringFunction, text: string, start: number, end: number, width: number) {
	const lines = [];
	let lineStart = start;
	let isNewline = true;
	for (let i = start; i < end && i < text.length; i++) {
		const chr = text.charAt(i);
		isNewline = newline.test(chr);

		//If we've reached a newline, then step down a line
		//Or if we've reached the EOF
		if (isNewline || i === end - 1) {
			const lineEnd = isNewline ? i : i + 1;
			const measured = measure(text, lineStart, lineEnd, width);
			lines.push(measured);

			lineStart = i + 1;
		}
	}
	if (isNewline) {
		const lineEnd = end;
		const measured = measure(text, lineStart, lineEnd, width);
		lines.push(measured);
	}

	return lines;
}

function greedy(
	measure: MeasuringFunction,
	text: string,
	start: number,
	end: number,
	width: number,
	mode: WordWrapMode
) {
	//A greedy word wrapper based on LibGDX algorithm
	//https://github.com/libgdx/libgdx/blob/master/gdx/src/com/badlogic/gdx/graphics/g2d/BitmapFontCache.java
	var lines = [];

	var testWidth = width;
	//if 'nowrap' is specified, we only wrap on newline chars
	if (mode === 'nowrap') {
		let start = 0;
		while (start < text.length) {
			let end = text.indexOf('\n', start);
			if (end === -1) end = text.length;
			lines.push(measure(text, start, end, Number.MAX_VALUE));
			start = end + 1;
		}
		return lines;
	}

	while (start < end && start < text.length) {
		//get next newline position
		var newLine = idxOf(text, newlineChar, start, end);

		//eat whitespace at start of line
		while (start < newLine) {
			if (!isWhitespace(text.charAt(start))) break;
			start++;
		}

		//determine visible # of glyphs for the available width
		var measured = measure(text, start, newLine, testWidth);

		var lineEnd = start + (measured.end - measured.start);
		var nextStart = lineEnd + newlineChar.length;

		//if we had to cut the line before the next newline...
		if (lineEnd < newLine) {
			//find char to break on
			while (lineEnd > start) {
				if (isWhitespace(text.charAt(lineEnd))) break;
				lineEnd--;
			}
			if (lineEnd === start) {
				if (nextStart > start + newlineChar.length) nextStart--;
				lineEnd = nextStart; // If no characters to break, show all.
			} else {
				nextStart = lineEnd;
				//eat whitespace at end of line
				while (lineEnd > start) {
					if (!isWhitespace(text.charAt(lineEnd - newlineChar.length))) break;
					lineEnd--;
				}
			}
		}
		if (lineEnd >= start) {
			var result = measure(text, start, lineEnd, testWidth);
			lines.push(result);
		}
		start = nextStart;
	}
	return lines;
}

//determines the visible number of glyphs within a given width
function monospace(text: string, start: number, end: number, width: number): WrappedLine {
	var glyphs = Math.min(width, end - start);
	return {
		start: start,
		end: start + glyphs,
		width: glyphs,
	};
}
