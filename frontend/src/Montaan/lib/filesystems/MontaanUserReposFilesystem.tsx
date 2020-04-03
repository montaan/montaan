import { Filesystem, FSDirEntry, NotImplementedError, mountURL } from '../filesystem';
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

	constructor(options: { url: string; api: QFrameAPI }) {
		super(options);
		this.name = new URL(this.options.url).pathname.replace(/^\/+/, '');
	}

	async readDir(path: string): Promise<FSDirEntry | null> {
		const tree = new FSDirEntry();
		const repos = await this.options.api.get('/repo/list');
		repos.sort((a: RepoInfo, b: RepoInfo) => {
			let cmp = a.owner.localeCompare(b.owner);
			if (cmp === 0) cmp = a.name.localeCompare(b.name);
			return cmp;
		});
		repos.forEach((repo: RepoInfo) => {
			const fsEntry = mountURL(
				tree,
				`montaanGit:///${repo.owner}/${repo.name}`,
				`/${repo.name}`,
				this.options.api
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
