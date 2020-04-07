import * as THREE from 'three';

const style: { [className: string]: { [attr: string]: string } } = {};

style['hljs'] = {
	color: '#e6e1dc',
};

style['hljs-comment'] = style['hljs-quote'] = {
	color: '#bc9458',
	'font-style': 'italic',
};

style['hljs-keyword'] = style['hljs-selector-tag'] = {
	'font-weight': 'bold',
	color: '#c26230',
};

style['hljs-string'] = style['hljs-number'] = style['hljs-regexp'] = style['hljs-variable'] = style[
	'hljs-template-variable'
] = {
	color: '#a5c261',
};

style['hljs-subst'] = {
	color: '#519f50',
};

style['hljs-tag'] = style['hljs-name'] = {
	color: '#e8bf6a',
};

style['hljs-type'] = {
	color: '#da4939',
};

style['hljs-symbol'] = style['hljs-bullet'] = style['hljs-built_in'] = style[
	'hljs-builtin-name'
] = style['hljs-attr'] = style['hljs-link'] = {
	color: '#6d9cbe',
};

style['hljs-params'] = {
	color: '#d0d0ff',
};

style['hljs-attribute'] = {
	color: '#cda869',
};

style['hljs-meta'] = {
	color: '#9b859d',
};

style['hljs-title'] = style['hljs-section'] = {
	color: '#ffc66d',
};

style['hljs-addition'] = {
	'background-color': '#144212',
	color: '#e6e1dc',
	display: 'inline-block',
	width: '100%',
};

style['hljs-deletion'] = {
	'background-color': '#600',
	color: '#e6e1dc',
	display: 'inline-block',
	width: '100%',
};

style['hljs-selector-class'] = {
	color: '#9b703f',
};

style['hljs-selector-id'] = {
	color: '#8b98ab',
};

style['hljs-emphasis'] = {
	'font-style': 'italic',
};

style['hljs-strong'] = {
	'font-weight': 'bold',
};

style['hljs-link'] = {
	'text-decoration': 'underline',
};

export class NodeStyle {
	color: number;
	bold: 0 | 1;
	italic: 0 | 1;
	underline: 0 | 1;
	text: string;
	constructor(text: string, color: number, bold: 0 | 1, italic: 0 | 1, underline: 0 | 1) {
		this.text = text;
		this.color = color;
		this.bold = bold;
		this.italic = italic;
		this.underline = underline;
	}
}

export class CharacterStyle {
	color: string;
	italic: boolean;
	bold: boolean;
	underline: boolean;
	constructor(color: string, italic: boolean, bold: boolean, underline: boolean) {
		this.color = color;
		this.italic = italic;
		this.bold = bold;
		this.underline = underline;
	}
}

export default {
	resolve: (
		text: string,
		classes: string[],
		palette: THREE.Vector3[],
		paletteIndex: Map<string, number>
	): NodeStyle => {
		const s = new CharacterStyle(
			style['hljs'].color,
			style['hljs']['font-style'] === 'italic',
			style['hljs']['font-weight'] !== 'bold',
			style['hljs']['text-decoration'] === 'underline'
		);
		classes.forEach((c) => {
			if (!style[c]) return;
			const cs = style[c];
			if (cs.color) s.color = cs.color;
			if (cs['font-style']) s.italic = cs['font-style'] === 'italic';
			if (cs['font-weight']) s.bold = cs['font-weight'] !== 'bold';
			if (cs['text-decoration']) s.underline = cs['text-decoration'] === 'underline';
		});
		let color = paletteIndex.get(s.color);
		if (!color) {
			paletteIndex.set(s.color, palette.length);
			color = palette.length;
			var c = new THREE.Color(s.color);
			palette.push(new THREE.Vector3(c.r, c.g, c.b));
		}
		const bold = s.bold ? 1 : 0;
		const italic = s.italic ? 1 : 0;
		const underline = s.underline ? 1 : 0;
		return new NodeStyle(text, color, bold, italic, underline);
	},
};
