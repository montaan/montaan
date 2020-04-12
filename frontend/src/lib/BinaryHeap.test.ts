import BinaryHeap from './BinaryHeap';

import fc, { assert } from 'fast-check';
import { deepEqual, equal } from 'assert';

test('Heap ordering property', () => {
	fc.assert(
		fc.property(fc.array(fc.integer()), (array) => {
			const heap = new BinaryHeap((a: number, b: number) => a - b);
			array.forEach((e) => heap.add(e));
			const result = [];
			while (heap.size > 0) result.push(heap.take());
			array.sort(heap.compare);
			return deepEqual(result, array, 'Heap is ordered by compare function');
		})
	);
});

test('Heap sundry tests', () => {
	expect(new BinaryHeap((a: number, b: number) => a - b).take()).toEqual(undefined);
	fc.assert(
		fc.property(fc.array(fc.integer()), (array) => {
			const heap = new BinaryHeap((a: number, b: number) => a - b);
			array.forEach((e, i) => {
				expect(heap.size).toEqual(i);
				heap.add(e);
			});
			expect(heap.size).toEqual(array.length);
		})
	);
});

test('Heap heapValues equals heap.take()', () => {
	fc.assert(
		fc.property(fc.array(fc.integer()), (numbers) => {
			numbers.sort((a, b) => a - b);
			const array = numbers.map((x) => ({ x }));
			const heap = new BinaryHeap((a: { x: number }, b: { x: number }) => a.x - b.x);
			array.forEach((e) => heap.add(e));
			const heapValues = heap.heapValues.slice();
			const result: { x: number }[] = [];
			while (heap.size > 0) result.push(heap.take()!);
			return heapValues.every((e, i) => e.x === result[i].x);
		})
	);
});
