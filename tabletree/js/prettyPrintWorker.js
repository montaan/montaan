importScripts("/js/third_party/highlight.min.js");

onmessage = function(ev) {
	var id = ev.data.id - 0;
	var str = ev.data.string;
	var result = self.hljs.highlightAuto(str);
	postMessage({id: id, result: result});
};
