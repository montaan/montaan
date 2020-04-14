// src/TARGET/NAME/NAME.test.tsx

import React from 'react';
import NAME from './';
import QFrameAPI from '../../../lib/api';

const getAsync = async (x) => {
	return x;
};

test('NAME constructs without crashing', async () => {
	const filesystem = new NAME({ url: 'foo://bar', api: QFrameAPI.mock });
});

test('NAME public API smoke test', async () => {
	const filesystem = new NAME({ url: 'foo://bar', api: QFrameAPI.mock });
	filesystem.getUIComponents();
	await filesystem.readDir('/');
	expect(async () => await filesystem.write('/baz', new ArrayBuffer(0))).toThrow();
	await filesystem.readFile('/baz');
	expect(async () => await filesystem.rm('/baz')).toThrow();
	expect(async () => await filesystem.mkdir('/qux')).toThrow();
	expect(async () => await filesystem.rmdir('/qux')).toThrow();
});
