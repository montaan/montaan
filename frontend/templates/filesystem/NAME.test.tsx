// src/TARGET/NAME/NAME.test.tsx

import React from 'react';
import NAME from './';
import QFrameAPI from '../../../lib/api';
import { FSState } from '../../MainApp';

const getAsync = async (x: any) => {
	return x;
};

test('NAME constructs without crashing', async () => {
	const filesystem = new NAME({ url: 'foo://bar', api: QFrameAPI.mock });
});

test('NAME public API smoke test', async () => {
	const filesystem = new NAME({ url: 'foo://bar', api: QFrameAPI.mock });
	expect(filesystem.getUIComponents(({} as unknown) as FSState)).not.toBeUndefined();
	await filesystem.readDir('/');
	await filesystem.readFile('/baz');
	await expect(filesystem.writeFile('/baz', new ArrayBuffer(0))).rejects.toThrow();
	await expect(filesystem.rm('/baz')).rejects.toThrow();
	await expect(filesystem.mkdir('/qux')).rejects.toThrow();
	await expect(filesystem.rmdir('/qux')).rejects.toThrow();
});
