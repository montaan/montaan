var prettyPrintWorker;
if (typeof Worker === 'undefined') {
	prettyPrintWorker = {
		prettyPrint: function(string, filename, callback, mimeType) {
			callback({ content: string, language: null });
		},
	};
} else {
	prettyPrintWorker = new Worker('/js/prettyPrintWorker.js');
	prettyPrintWorker.callbacks = {};
	prettyPrintWorker.callbackUID = 0;
	prettyPrintWorker.onmessage = function(event) {
		this.callbacks[event.data.id](event.data.result);
		delete this.callbacks[event.data.id];
	};
	prettyPrintWorker.prettyPrint = function(string, filename, callback, mimeType) {
		var id = this.callbackUID++;
		this.callbacks[id] = callback;
		this.postMessage({ string, filename, id, mimeType });
	};
}
export default prettyPrintWorker;
