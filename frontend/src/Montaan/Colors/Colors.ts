import './css/main.css';
import './css/ColorsDark.css';

import * as THREE from 'three';
import { FSEntry } from '../Filesystems';

type ColorArray = number[];

interface THREEColors {
	[propType: string]: THREE.Color;
}

interface FileColors {
	musicFile: ColorArray;
	configFile: ColorArray;
	imageFile: ColorArray;
	documentFile: ColorArray;
	archiveFile: ColorArray;
	objectFile: ColorArray;
	headerFile: ColorArray;
	exeFile: ColorArray;
	legalFile: ColorArray;
	videoFile: ColorArray;
	hiddenFile: ColorArray;
	unknownFile: ColorArray;
	actionAFile: ColorArray;
	actionMFile: ColorArray;
	actionRFile: ColorArray;
	actionCFile: ColorArray;
	actionDFile: ColorArray;

	musicDir: ColorArray;
	configDir: ColorArray;
	imageDir: ColorArray;
	documentDir: ColorArray;
	archiveDir: ColorArray;
	objectDir: ColorArray;
	headerDir: ColorArray;
	exeDir: ColorArray;
	legalDir: ColorArray;
	videoDir: ColorArray;
	hiddenDir: ColorArray;
	unknownDir: ColorArray;
	actionADir: ColorArray;
	actionMDir: ColorArray;
	actionRDir: ColorArray;
	actionCDir: ColorArray;
	actionDDir: ColorArray;
}

const Colors = {
	colors: {
		musicFile: [1, 0, 1],
		configFile: [1, 0, 1],
		imageFile: [1, 0, 1],
		documentFile: [1, 0, 1],
		archiveFile: [1, 0, 1],
		objectFile: [1, 0, 1],
		headerFile: [1, 0, 1],
		exeFile: [1, 0, 1],
		legalFile: [1, 0, 1],
		videoFile: [1, 0, 1],
		hiddenFile: [1, 0, 1],
		unknownFile: [1, 0, 1],
		actionAFile: [1, 0, 1],
		actionMFile: [1, 0, 1],
		actionRFile: [1, 0, 1],
		actionCFile: [1, 0, 1],
		actionDFile: [1, 0, 1],

		musicDir: [1, 0, 1],
		configDir: [1, 0, 1],
		imageDir: [1, 0, 1],
		documentDir: [1, 0, 1],
		archiveDir: [1, 0, 1],
		objectDir: [1, 0, 1],
		headerDir: [1, 0, 1],
		exeDir: [1, 0, 1],
		legalDir: [1, 0, 1],
		videoDir: [1, 0, 1],
		hiddenDir: [1, 0, 1],
		unknownDir: [1, 0, 1],
		actionADir: [1, 0, 1],
		actionMDir: [1, 0, 1],
		actionRDir: [1, 0, 1],
		actionCDir: [1, 0, 1],
		actionDDir: [1, 0, 1],
	} as FileColors,

	textColor: new THREE.Color(1, 0, 1),
	backgroundColor: new THREE.Color(0, 1, 1),

	threeColors: {} as THREEColors,

	musicRE: /\.(mp3|m4a|ogg|ogm|wav|aac|flac)$/i,
	configRE: /(^(makefile.*|configure|cmake.*|InfoPlist)|\.(gyp.?|pyt|isolate|json|xcscheme|projitems|shproj|gradle|properties|mk|xml|cfg|conf|vcxproj|xcconfig|plist|config|in)$)/i,
	imageRE: /\.(ai|c4d|obj|png|gif|psd|tga|webm|jpe?g|svg)$/i,
	documentRE: /(^(Doxyfile|readme))|(\.(pdf|mtl|docx?|pptx?|xaml|txt|html?|pages|dox|md)$)/i,
	archiveRE: /\.(zip|gz|bz2|tar|rar|7z|jsx?|tsx?|c|cpp|rb|py|pl|php\d?|java|vbs|cs|mm?|hlsl|glsl|vert|frag|vs|fs|cc|ts)$/i,
	objectRE: /\.(a|jar|dylib|lib|pri|so|aar)$/i,
	headerRE: /\.(h|hh|hpp|css|sass|less|scss|d\.ts)$/i,
	exeRE: /\.(sh|exe|bsh|bat)$/i,
	legalRE: /^(OWNERS|LICENSE.*)$/i,
	videoRE: /\.(mp4|avi|mov|m4v|ogv|mpe?g|3gp)$/i,

	musicDirRE: /^music$/i,
	imageDirRE: /^(pictures|photos|images|screenshots|img)$/i,
	documentDirRE: /^(docs?|documentation|html|static)$/i,
	exeDirRE: /^(bin)$/i,
	archiveDirRE: /^(\.git|src)$/i,
	videoDirRE: /^(videos?|movies?)$/i,
	hiddenDirRE: /^\./i,

	getFileColor: function(file: FSEntry): ColorArray {
		var name = file.name;
		// var mimeType = file.mimeType;
		if (file.action) {
			switch (file.action[0]) {
				case 'M':
					return this.colors.actionMFile;
				case 'A':
					return this.colors.actionAFile;
				case 'D':
					return this.colors.actionDFile;
				case 'R':
					return this.colors.actionRFile;
				case 'C':
					return this.colors.actionCFile;
			}
		}
		// if (mimeType) {
		// 	if (/^image/.test(mimeType)) {
		// 		return this.colors.imageFile;
		// 	} else if (/^audio/.test(mimeType)) {
		// 		return this.colors.musicFile;
		// 	} else if (/^video/.test(mimeType)) {
		// 		return this.colors.videoFile;
		// 	}
		// }

		if (this.musicRE.test(name)) {
			return this.colors.musicFile;
		} else if (this.configRE.test(name)) {
			return this.colors.configFile;
		} else if (this.legalRE.test(name)) {
			return this.colors.legalFile;
		} else if (this.imageRE.test(name)) {
			return this.colors.imageFile;
		} else if (this.headerRE.test(name)) {
			return this.colors.headerFile;
		} else if (this.documentRE.test(name)) {
			return this.colors.documentFile;
		} else if (this.archiveRE.test(name)) {
			return this.colors.archiveFile;
		} else if (this.exeRE.test(name)) {
			return this.colors.exeFile;
		} else if (this.objectRE.test(name)) {
			return this.colors.objectFile;
		} else if (this.videoRE.test(name)) {
			return this.colors.videoFile;
		} else if (this.hiddenDirRE.test(name)) {
			return this.colors.hiddenFile;
		} else {
			return this.colors.unknownFile;
		}
	},

	getDirectoryColor: function(file: FSEntry): ColorArray {
		if (file.action) {
			switch (file.action[0]) {
				case 'M':
					return this.colors.actionMDir;
				case 'A':
					return this.colors.actionADir;
				case 'D':
					return this.colors.actionDDir;
				case 'R':
					return this.colors.actionRDir;
				case 'C':
					return this.colors.actionCDir;
			}
		}
		var name = file.name;
		if (this.musicDirRE.test(name)) {
			return this.colors.musicDir;
		} else if (this.imageDirRE.test(name)) {
			return this.colors.imageDir;
		} else if (this.documentDirRE.test(name)) {
			return this.colors.documentDir;
		} else if (this.archiveDirRE.test(name)) {
			return this.colors.archiveDir;
		} else if (this.videoDirRE.test(name)) {
			return this.colors.videoDir;
		} else if (this.exeDirRE.test(name)) {
			return this.colors.exeDir;
		} else if (this.hiddenDirRE.test(name)) {
			return this.colors.hiddenDir;
		} else {
			return this.colors.unknownDir;
		}
	},

	getThreeColor: function(fsEntry: FSEntry): THREE.Color {
		var color = this.getColor(fsEntry);
		var key = color.join(',');
		var threeColor = this.threeColors[key];
		if (!threeColor) {
			threeColor = this.threeColors[key] = new THREE.Color(color[0], color[1], color[2]);
		}
		return threeColor;
	},

	getColor: function(fsEntry: FSEntry) {
		if (fsEntry.isDirectory) {
			return this.getDirectoryColor(fsEntry);
		}
		return this.getFileColor(fsEntry);
	},

	parseColors: function() {
		const div = document.createElement('div');
		document.body.appendChild(div);
		const types: (keyof FileColors)[] = [
			'musicDir',
			'imageDir',
			'documentDir',
			'archiveDir',
			'videoDir',
			'exeDir',
			'hiddenDir',
			'unknownDir',
			'musicFile',
			'configFile',
			'legalFile',
			'imageFile',
			'headerFile',
			'documentFile',
			'archiveFile',
			'exeFile',
			'objectFile',
			'videoFile',
			'hiddenFile',
			'unknownFile',
			'actionMDir',
			'actionADir',
			'actionCDir',
			'actionRDir',
			'actionDDir',
			'actionMFile',
			'actionAFile',
			'actionCFile',
			'actionRFile',
			'actionDFile',
		];
		const ec = 'rgb(255,0,255)';
		types.forEach((t) => {
			div.className = t;
			const color = getComputedStyle(div).color || ec;
			// eslint-disable-next-line
			const [_, r, g, b] = color.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/) || [];
			this.colors[t] = [parseInt(r) / 255, parseInt(g) / 255, parseInt(b) / 255];
		});
		document.body.removeChild(div);

		var bodyStyle = getComputedStyle(document.body);

		{
			// eslint-disable-next-line
			const [_, r, g, b] =
				(bodyStyle.color || ec).match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/) || [];
			this.textColor = new THREE.Color(
				parseInt(r) / 255,
				parseInt(g) / 255,
				parseInt(b) / 255
			);
		}

		{
			// eslint-disable-next-line
			const [_, r, g, b] =
				(bodyStyle.backgroundColor || ec).match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/) || [];
			this.backgroundColor = new THREE.Color(
				parseInt(r) / 255,
				parseInt(g) / 255,
				parseInt(b) / 255
			);
		}
	},
};

Colors.parseColors();

export default Colors;
