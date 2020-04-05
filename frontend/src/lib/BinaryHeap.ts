// Original JavaScript Code from  Marijn Haverbeke (http://eloquentjavascript.net/1st_edition/appendix2.html)
// Based on the TypeScript port by Davide Aversa (https://www.davideaversa.it/2016/06/typescript-binary-heap/)

export default class BinaryHeap<T> {
	heapValues: T[];
	heapScores: number[];

	constructor() {
		this.heapValues = [];
		this.heapScores = [];
	}

	add(element: T, score: number): void {
		this.heapValues.push(element);
		this.heapScores.push(score);
		this.bubbleUp(this.heapValues.length - 1);
	}

	peek(): T | undefined {
		if (this.heapValues.length === 0) return undefined;
		return this.heapValues[0];
	}

	take(): T | undefined {
		if (this.heapValues.length === 0) return undefined;
		const result = this.heapValues[0];
		const end = this.heapValues.pop();
		const endScore = this.heapScores.pop();
		if (this.heapValues.length > 0 && end !== undefined && endScore !== undefined) {
			this.heapValues[0] = end;
			this.heapScores[0] = endScore;
			this.sinkDown(0);
		}
		return result;
	}

	remove(node: T): void {
		const length = this.heapValues.length;
		// To remove a value, we must search through the array to find
		// it.
		for (let i = 0; i < length; i++) {
			if (this.heapValues[i] !== node) continue;
			// When it is found, the process seen in 'pop' is repeated
			// to fill up the hole.
			const end = this.heapValues.pop();
			const endScore = this.heapScores.pop();
			// If the element we popped was the one we needed to remove,
			// we're done.
			if (end === undefined || endScore === undefined || i >= length - 1) break;
			// Otherwise, we replace the removed element with the popped
			// one, and allow it to float up or sink down as appropriate.
			this.heapValues[i] = end;
			this.heapScores[i] = endScore;
			this.bubbleUp(i);
			this.sinkDown(i);
			break;
		}
	}

	get size(): number {
		return this.heapValues.length;
	}

	private bubbleUp(nf: number): void {
		let n = nf | 0; // Cast to integer.

		// Fetch the element that has to be moved.
		const element = this.heapValues[n];
		const score = this.heapScores[n];
		// When at 0, an element can not go up any further.
		while (n > 0) {
			// Compute the parent element's index, and fetch it.
			const parentN = (((n + 1) / 2) | 0) - 1;
			const parent = this.heapValues[parentN];
			const parentScore = this.heapScores[parentN];
			// If the parent has a lesser score, things are in order and we
			// are done.
			if (score >= parentScore) break;

			// Otherwise, swap the parent with the current element and
			// continue.
			this.heapValues[parentN] = element;
			this.heapValues[n] = parent;
			this.heapScores[parentN] = score;
			this.heapScores[n] = parentScore;
			n = parentN;
		}
	}

	private sinkDown(nf: number): void {
		let n = nf | 0; // Cast to integer.

		// Look up the target element and its score.
		const length = this.heapValues.length;
		const element = this.heapValues[n];
		const elemScore = this.heapScores[n];

		while (true) {
			// Compute the indices of the child elements.
			const child2N = (n + 1) * 2;
			const child1N = child2N - 1;
			// This is used to store the new position of the element,
			// if any.
			let score = elemScore;
			let swap = -1;
			// If the first child exists (is inside the array)...
			if (child1N < length) {
				// Look it up and compute its score.
				const child1Score = this.heapScores[child1N];
				// If the score is less than our element's, we need to swap.
				if (child1Score < score) {
					score = child1Score;
					swap = child1N;
				}
			}
			// Do the same checks for the other child.
			if (child2N < length) {
				const child2Score = this.heapScores[child2N];
				if (child2Score < score) {
					swap = child2N;
				}
			}

			// No need to swap further, we are done.
			if (swap === -1) break;

			// Otherwise, swap and continue.
			this.heapValues[n] = this.heapValues[swap];
			this.heapValues[swap] = element;
			this.heapScores[n] = this.heapScores[swap];
			this.heapScores[swap] = score;
			n = swap;
		}
	}
}
