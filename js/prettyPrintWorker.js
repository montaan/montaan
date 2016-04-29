importScripts("/js/third_party/highlight.min.js");

onmessage = function(ev) {
	var id = ev.data.id - 0;
	var str = ev.data.string;
	var language = self.hljs.getLanguage(ev.data.ext);
	if (language) {
		var result = self.hljs.highlightAuto(str, [ev.data.ext]);
		result = {
			value: result.value.substring(0),
			language: result.language
		};
	} else {
		var result = {value: str, language: null};
	}
	postMessage({id: id, result: result});
};
