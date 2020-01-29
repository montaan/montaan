import PrettyPrintWorker from 'pretty-print.worker.js';

const prettyPrintWorker = new PrettyPrintWorker();
prettyPrintWorker.callbacks = {};
prettyPrintWorker.callbackUID = 0;
prettyPrintWorker.onmessage = function(event) {
	this.callbacks[event.data.id](event.data.result);
	delete this.callbacks[event.data.id];
};
prettyPrintWorker.prettyPrint = function(string, filename, callback, mimeType) {
	var id = this.callbackUID++;
	this.callbacks[id] = callback;
	this.postMessage({ string: string, filename: filename, id: id, mimeType: mimeType });
};
export default prettyPrintWorker;
