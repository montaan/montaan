interface PrettyPrintWorker extends Worker {
	callbacks: { [uid: number]: (result: any) => void };
	callbackUID: number;
	prettyPrint: PrettyPrinter;
}

type PrettyPrinter = (
	text: string,
	filename: string,
	callback: (result: any) => void,
	mimeType?: string
) => void;

const workers: PrettyPrintWorker[] = [];
for (var i = 0; i < 10; i++) {
	const prettyPrintWorker: PrettyPrintWorker = new Worker(
		'/js/prettyPrintWorker.js'
	) as PrettyPrintWorker;
	prettyPrintWorker.callbacks = {};
	prettyPrintWorker.callbackUID = 0;
	prettyPrintWorker.onmessage = function(event) {
		const pp = this as PrettyPrintWorker;
		pp.callbacks[event.data.id](event.data.result);
		delete pp.callbacks[event.data.id];
	};
	prettyPrintWorker.prettyPrint = function(string, filename, callback, mimeType) {
		var id = this.callbackUID++;
		this.callbacks[id] = callback;
		if (/\.tsx$/.test(filename)) filename = filename.replace(/tsx$/, 'jsx');
		this.postMessage({ string, filename, id, mimeType });
	};
	workers.push(prettyPrintWorker);
}

const poolPrinter = {
	prettyPrint: function(
		text: string,
		filename: string,
		callback: (result: any) => void,
		mimeType?: string
	): void {
		let leastBusyWorker = workers[0];
		let minCallbacks = Object.keys(leastBusyWorker.callbacks).length;
		workers.forEach((w) => {
			const callbackCount = Object.keys(w.callbacks).length;
			if (callbackCount < minCallbacks) {
				leastBusyWorker = w;
				minCallbacks = callbackCount;
			}
		});
		return leastBusyWorker.prettyPrint(text, filename, callback, mimeType);
	},
};

export default poolPrinter;
