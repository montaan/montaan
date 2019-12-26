import './Colors.css';
import './main.css';
import './railscast.min.css';

import * as THREE from 'three';

var Colors = {
	musicRE: /\.(mp3|m4a|ogg|ogm|wav|aac|flac)$/i,
	configRE: /(^(makefile.*|configure|cmake.*|InfoPlist)|\.(gyp.?|pyt|isolate|json|xcscheme|projitems|shproj|gradle|properties|mk|xml|cfg|conf|vcxproj|xcconfig|plist|config|in)$)/i,
	imageRE: /\.(ai|c4d|obj|png|gif|psd|tga|webm|jpe?g|svg)$/i,
	documentRE: /(^(Doxyfile|readme))|(\.(pdf|mtl|docx?|pptx?|xaml|txt|html?|pages|dox|md)$)/i,
	archiveRE: /\.(zip|gz|bz2|tar|rar|7z|js|c|cpp|rb|py|pl|php\d?|java|vbs|cs|mm?|hlsl|glsl|vert|frag|vs|fs|cc|ts)$/i,
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

	getFileColor: function(file) {
		var name = file.name;
		var mimeType = file.mimeType;
		if (mimeType) {
			if (/^image/.test(mimeType)) {
				return this.imageF;
			} else if (/^audio/.test(mimeType)) {
				return this.musicF;
			} else if (/^video/.test(mimeType)) {
				return this.videoF;
			}
		}

		if (this.musicRE.test(name)) {
			return this.musicF;
		} else if (this.configRE.test(name)) {
			return this.configF;
		} else if (this.legalRE.test(name)) {
			return this.legalF;
		} else if (this.imageRE.test(name)) {
			return this.imageF;
		} else if (this.headerRE.test(name)) {
			return this.headerF;
		} else if (this.documentRE.test(name)) {
			return this.documentF;
		} else if (this.archiveRE.test(name)) {
			return this.archiveF;
		} else if (this.exeRE.test(name)) {
			return this.exeF;
		} else if (this.objectRE.test(name)) {
			return this.objectF;
		} else if (this.videoRE.test(name)) {
			return this.videoF;
		} else if (this.hiddenDirRE.test(name)) {
			return this.hiddenF;
		} else {
			return this.unknownF;
		}
	},

	getDirectoryColor: function(file) {
		var name = file.name;
		if (this.musicDirRE.test(name)) {
			return this.music;
		} else if (this.imageDirRE.test(name)) {
			return this.image;
		} else if (this.documentDirRE.test(name)) {
			return this.document;
		} else if (this.archiveDirRE.test(name)) {
			return this.archive;
		} else if (this.videoDirRE.test(name)) {
			return this.video;
		} else if (this.exeDirRE.test(name)) {
			return this.exe;
		} else if (this.hiddenDirRE.test(name)) {
			return this.hidden;
		} else {
			return this.unknown;
		}
	},

	threeColors: {},
	getThreeColor: function(fsEntry) {
		var color = this.getColor(fsEntry);
		var key = color.join(",");
		var threeColor = this.threeColors[key];
		if (!threeColor) {
			threeColor = this.threeColors[key] = new THREE.Color(color[0], color[1], color[2]);
		}
		return threeColor;
	},

	getColor: function(fsEntry) {
		if (fsEntry.entries !== null) {
			return this.getDirectoryColor(fsEntry);
		}
		return this.getFileColor(fsEntry);
	},

	parseColors: function() {
		var div = document.createElement('div');
		document.body.appendChild(div);
		var types = [
			'music', 'image', 'document', 'archive', 'video', 'exe', 'hidden', 'unknown',
			'musicF', 'configF', 'legalF', 'imageF', 'headerF', 'documentF', 'archiveF', 'exeF', 'objectF', 'videoF', 'hiddenF', 'unknownF'
		];
		types.forEach(t => {
			div.className = t;
			const color = getComputedStyle(div).color;
			const [_, r, g, b] = color.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
			this[t] = [r/255, g/255, b/255];
		});
		document.body.removeChild(div);
		var bodyStyle = getComputedStyle(document.body);
		var [_, r, g, b] = bodyStyle.color.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
		this.textColor = new THREE.Color(r/255, g/255, b/255);
		var [_, r, g, b] = bodyStyle.backgroundColor.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
		this.backgroundColor = new THREE.Color(r/255, g/255, b/255);
	}
};

Colors.parseColors();

export default Colors;