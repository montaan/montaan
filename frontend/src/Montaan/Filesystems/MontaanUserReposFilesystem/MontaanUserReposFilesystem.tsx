import {
	Filesystem,
	FSDirEntry,
	NotImplementedError,
	mountURL,
	getFullPath,
} from '../../lib/filesystem';
import React from 'react';

import QFrameAPI from '../../../lib/api';
import { FSState } from '../../MainApp';
import RepoSelector from '../../RepoSelector';

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

export class MontaanUserReposFilesystem extends Filesystem {
	name: string;
	repoCache: RepoInfo[] = [];
	cacheVersion: number = 0;
	componentVersion: number = -1;
	cachedComponent: React.ReactElement = (<div key="MontaanUserReposFilesystem" />);

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
		this.repoCache = [];
		this.cacheVersion++;
		repos.forEach((repo: RepoInfo) => {
			const fsEntry = mountURL(
				tree,
				`montaanGit:///${repo.owner}/${repo.name}`,
				`/${repo.name}`,
				this.options.api
			);
			fsEntry.data = repo;
			this.repoCache.push(repo);
		});
		return tree;
	}

	getUIComponents(state: FSState): React.ReactElement {
		if (!this.mountPoint) return super.getUIComponents(state);
		const path = getFullPath(this.mountPoint);
		if (this.componentVersion !== this.cacheVersion) {
			this.cachedComponent = (
				<div key={path}>
					<RepoSelector
						repos={this.repoCache}
						createRepo={state.createRepo}
						renameRepo={state.renameRepo}
					/>
				</div>
			);
			this.componentVersion = this.cacheVersion;
		}
		return this.cachedComponent;
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
