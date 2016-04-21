module.exports = {
	music: [0.13,0.34,0.17],
	image: [0.13,0.34,0.25],
	document: [0.13,0.14,0.37,1],
	archive: [0.28,0.24,0.2],
	video: [0.13,0.34,0.3],
	exe: [0.28,0.14,0.17],
	unknown: [0.53,0.54,0.57],
	hidden: [0.63,0.64,0.67],

	musicF: [0.13,0.34,0.17],
	configF: [0.13,0.14,0.27],
	imageF: [0.23,0.44,0.57],
	documentF: [0.13,0.14,0.57],
	archiveF: [0.13,0.24,0.27],
	headerF: [0.13,0.44,0.37],
	exeF: [0.43,0.34,0.17],
	objectF: [0.13,0.14,0.17],
	legalF: [0.13,0.14,0.47],
	videoF: [0.13,1.0,0.8],
	unknownF: [0.33,0.34,0.37],
	hiddenF: [0.53,0.54,0.57],

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
			if (mimeType === 'application/vnd.google-apps.spreadsheet') {
				return this.musicF;
			} else if (mimeType === 'application/vnd.google-apps.document') {
				return this.documentF;
			} else if (mimeType === 'application/vnd.google-apps.map') {
				return this.videoF;
			} else if (mimeType === 'application/vnd.google-apps.photo') {
				return this.imageF;
			} else if (mimeType === 'application/vnd.google-apps.drawing') {
				return this.imageF;
			} else if (mimeType === 'application/vnd.google-apps.presentation') {
				return this.archiveF;
			} else if (mimeType === 'application/vnd.google-apps.script') {
				return this.archiveF;
			} else if (mimeType === 'application/vnd.google-apps.sites') {
				return this.archiveF;
			} else if (/^image/.test(mimeType)) {
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
		// if (this.musicDirRE.test(name)) {
		// 	return this.music;
		// } else if (this.imageDirRE.test(name)) {
		// 	return this.image;
		// } else 
		if (this.documentDirRE.test(name)) {
			return this.document;
		} else if (this.archiveDirRE.test(name)) {
			return this.archive;
		// } else if (this.videoDirRE.test(name)) {
		// 	return this.video;
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
	}
};
for (var i in module.exports) {
	if (module.exports[i] instanceof Array) {
		module.exports[i] = module.exports[i].map(function(c) { return Math.min(1, (c+0.3)); });
	}
}
