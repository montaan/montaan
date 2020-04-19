// src/Montaan/Filesystems/GithubFilesystem/GithubFilesystem.test.tsx

import React from 'react';
import GithubFilesystem from './';
import QFrameAPI from '../../../lib/api';
import { FSState } from '../../MainApp';

const getAsync = async (x: any) => {
	return x;
};

test('GithubFilesystem constructs without crashing', async () => {
	const filesystem = new GithubFilesystem({ url: 'foo://bar', api: QFrameAPI.mock });
});

test('GithubFilesystem public API smoke test', async () => {
	const filesystem = new GithubFilesystem({ url: 'foo://bar', api: QFrameAPI.mock });
	expect(filesystem.getUIComponents(({} as unknown) as FSState)).not.toBeUndefined();
	await filesystem.readDir('/');
	await filesystem.readFile('/baz');
	await expect(filesystem.writeFile('/baz', new ArrayBuffer(0))).rejects.toThrow();
	await expect(filesystem.rm('/baz')).rejects.toThrow();
	await expect(filesystem.mkdir('/qux')).rejects.toThrow();
	await expect(filesystem.rmdir('/qux')).rejects.toThrow();
});
