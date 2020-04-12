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

	pushMergeEnd(exec: WorkFunction<T>, args: WorkArgs<T>): Promise<void> {
		if (this.queue.length > 0) {
			const last = this.queue[this.queue.length - 1];
			if (last && last.exec === exec) {
				last.args = args;
				return this.processQueue();
			}
		}
		return this.push(exec, args);
	}

	pushMerge(exec: WorkFunction<T>, args: WorkArgs<T>): Promise<void> {
		for (let i = 0; i < this.queue.length; i++) {
			if (this.queue[i].exec === exec) {
				this.queue[i].args = args;
				return this.processQueue();
			}
		}
		return this.push(exec, args);
	}

	clear() {
		this.queue.splice(0);
	}
}
