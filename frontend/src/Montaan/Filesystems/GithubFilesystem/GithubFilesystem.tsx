// src/Montaan/Filesystems/GithubFilesystem/GithubFilesystem.tsx

import { Filesystem, FSDirEntry, NotImplementedError, getFullPath } from '..';
import React from 'react';

import QFrameAPI from '../../../lib/api';
import { FSState } from '../../MainApp';

import styles from './GithubFilesystem.module.scss';

export default class GithubFilesystem extends Filesystem {
	name: string;
	cacheVersion: number = 0;
	componentVersion: number = -1;
	cachedComponent: React.ReactElement = (<div key="GithubFilesystem" />);

	constructor(options: { url: string; api: QFrameAPI }) {
		super(options);
		this.name = new URL(this.options.url).pathname.replace(/^\/+/, '');
	}

	async readDir(path: string): Promise<FSDirEntry | null> {
		return null;
	}

	getUIComponents(state: FSState): React.ReactElement {
		if (!this.mountPoint) return super.getUIComponents(state);
		const path = getFullPath(this.mountPoint);
		if (this.componentVersion !== this.cacheVersion) {
			this.cachedComponent = <div key={path}></div>;
			this.componentVersion = this.cacheVersion;
		}
		return this.cachedComponent;
	}

	async readFile(path: string): Promise<ArrayBuffer> {
		return new ArrayBuffer(0);
	}

	async mkdir(path: string): Promise<boolean> {
		throw new NotImplementedError("GithubFilesystem doesn't support mkdir");
	}

	async writeFile(path: string, contents: ArrayBuffer): Promise<boolean> {
		throw new NotImplementedError("GithubFilesystem doesn't support writes");
	}

	async rm(path: string): Promise<boolean> {
		throw new NotImplementedError("GithubFilesystem doesn't support rm");
	}

	async rmdir(path: string): Promise<boolean> {
		throw new NotImplementedError("GithubFilesystem doesn't support rmdir");
	}
}
