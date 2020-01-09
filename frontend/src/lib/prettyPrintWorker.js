importScripts("/js/third_party/highlight.min.js");

onmessage = function(ev) {
	var id = ev.data.id - 0;
	var str = ev.data.string;
	var ext = null;
	if (ev.data.filename && ev.data.filename.indexOf('.') !== -1) {
		var exts = ev.data.filename.split(".");
		ext = exts[exts.length-1];
	}
	var language = self.hljs.getLanguage(ext);
	if (language) {
		var result = self.hljs.highlight(ext, str, true);
		result = {
			value: result.value.substring(0),
			language: language.aliases ? language.aliases[0] : (result.language || ext)
		};
	} else {
		var result = {value: str, language: null};
	}
	postMessage({id: id, result: result});
};
