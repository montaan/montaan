// src/Montaan/PrettyPrinter/PrettyPrinter.test.ts

import { PrettyPrinter } from './PrettyPrinter.worker';

test('pretty-print some text', () => {
	const pp = new PrettyPrinter();
	expect(() => {
		pp.prettyPrint(new ArrayBuffer(1), 'foo');
	}).toThrow();
});
