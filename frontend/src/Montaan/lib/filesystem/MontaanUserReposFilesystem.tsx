import { Filesystem, FSEntry, createFSTree, mount, NotImplementedError } from '.';
// import React from 'react';

import QFrameAPI from '../../../lib/api';

export class RepoInfo {
	static mock: RepoInfo = new RepoInfo('my-repo', [['master', 1234]], 'url', 'bob', false);

	name: string;
	branches: any[];
	url: string;
	owner: string;
	processing: boolean;

	constructor(name: string, branches: any[], url: string, owner: string, processing: boolean) {
		this.name = name;
		this.branches = branches;
		this.url = url;
		this.owner = owner;
		this.processing = processing;
	}
}

export default class MontaanUserReposFilesystem extends Filesystem {
	name: string;

	constructor(url: string, api: QFrameAPI, mountPoint: FSEntry) {
		super(url, api, mountPoint);
		this.name = this.url.pathname.replace(/^\/+/, '');
	}

	async readDir(path: string): Promise<FSEntry | null> {
		const tree = createFSTree('', '');
		(await this.api.get('/repo/list')).forEach((repo: RepoInfo) => {
			const fsEntry = mount(
				tree,
				`montaanGit:///${repo.owner}/${repo.name}/HEAD`,
				`/${repo.name}`,
				this.api
			);
			fsEntry.data = repo;
		});
		return tree;
	}

	async readFile(path: string): Promise<ArrayBuffer> {
		throw new NotImplementedError("montaanUserRepos doesn't support readFile");
	}

	async writeFile(path: string, contents: ArrayBuffer): Promise<boolean> {
		throw new NotImplementedError("montaanUserRepos doesn't support writes");
	}

	async rm(path: string): Promise<boolean> {
		throw new NotImplementedError("montaanUserRepos doesn't support writes");
	}

	async rmdir(path: string): Promise<boolean> {
		throw new NotImplementedError("montaanUserRepos doesn't support writes");
	}
}
