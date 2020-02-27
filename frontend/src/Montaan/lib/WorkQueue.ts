export type WorkFunction<T> = (args: T) => Promise<void>;
export type WorkArgs<T> = T;
export type WorkItem<T> = { exec: WorkFunction<T>; args: WorkArgs<T> };

export default class WorkQueue<T> {
	queue: WorkItem<T>[] = [];

	processingQueue: boolean = false;

	async processQueue() {
		if (this.processingQueue) return;
		this.processingQueue = true;
		while (this.queue.length > 0) {
			const { exec, args } = this.queue[0];
			this.queue.shift();
			await exec(args);
		}
		this.processingQueue = false;
	}

	push(exec: WorkFunction<T>, args: WorkArgs<T>): Promise<void> {
		this.queue.push({ exec, args });
		return this.processQueue();
	}

	clear() {
		this.queue.splice(0);
	}
}
