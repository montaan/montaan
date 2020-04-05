import { Filesystem, FSEntry, getPathEntry, NotImplementedError } from '../filesystem';
import React from 'react';

import QFrameAPI from '../../../lib/api';

import utils from '../utils';
import { RawCommitData, parseCommits, CommitData } from '../parse_commits';
import { TreeLink, TreeLinkKey, FSState } from '../../MainApp';
import * as THREE from 'three';
import TourSelector from '../../TourSelector';
import Player from '../../Player';
import CommitControls from '../../CommitControls';
import CommitInfo from '../../CommitInfo';
import { getFullPath, mount, FSDirEntry } from '../filesystem/filesystem';
import Search from '../../Search';

export class MontaanGitBranchFilesystem extends Filesystem {
	repo: string;
	ref: string;
	commitData?: CommitData;
	dependencies?: TreeLink[];
	dependencySrcIndex?: Map<TreeLinkKey, TreeLink[]>;
	dependencyDstIndex?: Map<TreeLinkKey, TreeLink[]>;
	fetchingCommits = false;

	options: { repo: string; branch: string; api: QFrameAPI };

	constructor(options: { repo: string; branch: string; api: QFrameAPI }) {
		super(options);
		this.options = options;
		this.repo = options.repo;
		this.ref = options.branch;
	}

	getUIComponents(state: FSState): React.ReactElement {
		// if (!this.commitData && !this.fetchingCommits) {
		// 	this.fetchingCommits = true;
		// 	this.readData().then((d) => {
		// 		this.fetchingCommits = false;
		// 		state.setCommitData(this.commitData);
		// 		state.setDependencies(this.dependencies || []);
		// 	});
		// } else if (state.commitData !== this.commitData) {
		// 	state.setCommitData(this.commitData);
		// 	state.setDependencies(this.dependencies || []);
		// }
		if (!this.mountPoint) return super.getUIComponents(state);
		const path = getFullPath(this.mountPoint);
		const repoPrefix = this.repo;
		return (
			<div key={path}>
				<Search
					navigationTarget={state.navigationTarget}
					searchResults={state.searchResults}
					setSearchQuery={state.setSearchQuery}
					searchQuery={state.searchQuery}
					updateSearchLines={state.updateSearchLines}
					setSearchHover={state.setSearchHover}
					clearSearchHover={state.clearSearchHover}
					repoPrefix={repoPrefix}
				/>
				<TourSelector
					path={path}
					repoPrefix={repoPrefix}
					fileTree={this.mountPoint}
					fileTreeUpdated={state.fileTreeUpdated}
					api={this.options.api}
				/>
				<Player
					repoPrefix={repoPrefix}
					fileTree={state.fileTree}
					fileTreeUpdated={state.fileTreeUpdated}
					navigationTarget={state.navigationTarget}
					api={this.options.api}
				/>
				{/* <CommitControls
					activeCommitData={state.activeCommitData}
					commitData={state.commitData}
					navigationTarget={state.navigationTarget}
					searchQuery={state.searchQuery}
					diffsLoaded={state.diffsLoaded}
					commitFilter={state.commitFilter}
					setCommitFilter={state.setCommitFilter}
					addLinks={state.addLinks}
					setLinks={state.setLinks}
					links={state.links}
				/> */}
				<CommitInfo
					activeCommitData={state.activeCommitData}
					commitData={state.commitData}
					navigationTarget={state.navigationTarget}
					searchQuery={state.searchQuery}
					commitsVisible={state.commitsVisible}
					setCommitsVisible={state.setCommitsVisible}
					path={path}
					repoPrefix={repoPrefix}
					diffsLoaded={state.diffsLoaded}
					commitFilter={state.commitFilter}
					setCommitFilter={state.setCommitFilter}
					fileContents={state.fileContents}
					loadFile={state.loadFile}
					loadFileDiff={state.loadFileDiff}
					closeFile={state.closeFile}
					loadDiff={state.loadDiff}
					addLinks={state.addLinks}
					setLinks={state.setLinks}
					links={state.links}
				/>
			</div>
		);
	}

	async readData() {
		const commitObj = // await this.api.postType(
			// '/repo/log',
			// { repo: this.repo, ref: this.ref },
			// {},
			// 'json'
			// )
			(await this.options.api.getType(
				'/repo/fs/' + this.repo + '/log.json',
				{},
				'json'
			)) as RawCommitData;
		this.commitData = parseCommits(commitObj);
		try {
			const deps = (await this.options.api.getType(
				'/repo/fs/' + this.repo + '/deps.json',
				{},
				'json'
			)) as { modules: { source: string; dependencies: { resolved: string }[] }[] };
			const links: TreeLink[] = [];
			deps.modules.forEach(({ source, dependencies }, i) => {
				const src = '/' + this.repo + '/' + source;
				const color = new THREE.Color().setHSL((i / 7) % 1, 0.5, 0.6);
				dependencies.forEach(({ resolved }) => {
					const dst = '/' + this.repo + '/' + resolved;
					links.push({ src, dst, color });
				});
			});
			const srcIndex = new Map<TreeLinkKey, TreeLink[]>();
			const dstIndex = new Map<TreeLinkKey, TreeLink[]>();
			links.forEach((link) => {
				const { src, dst } = link;
				if (!srcIndex.has(src)) srcIndex.set(src, []);
				srcIndex.get(src)?.push(link);
				if (!dstIndex.has(dst)) dstIndex.set(dst, []);
				dstIndex.get(dst)?.push(link);
			});
			this.dependencies = links;
			this.dependencySrcIndex = srcIndex;
			this.dependencyDstIndex = dstIndex;
		} catch (err) {
			/* No deps */
		}
	}

	async readDir(path: string): Promise<FSEntry> {
		let reqPath = path;
		if (reqPath === '') reqPath = '.';
		if (reqPath[0] === '/') reqPath = '.' + reqPath;
		reqPath += '/';
		const pathBuf: ArrayBuffer = await this.options.api.postType(
			'/repo/tree',
			{ repo: this.repo, paths: [reqPath], hash: this.ref, recursive: false },
			{},
			'arrayBuffer'
		);
		const tree = utils.parseFileList_(pathBuf, true, '');
		return getPathEntry(tree.tree, path) || tree.tree;
	}

	async readFile(path: string) {
		return this.options.api.postType(
			'/repo/checkout',
			{ repo: this.repo, path: path.replace(/^\//, ''), hash: this.ref },
			{},
			'arrayBuffer'
		);
	}

	async writeFile(path: string, contents: ArrayBuffer): Promise<boolean> {
		throw new NotImplementedError("montaanGit doesn't support writes");
	}

	async rm(path: string): Promise<boolean> {
		throw new NotImplementedError("montaanGit doesn't support writes");
	}

	async rmdir(path: string): Promise<boolean> {
		throw new NotImplementedError("montaanGit doesn't support writes");
	}
}
export class MontaanGitFilesystem extends Filesystem {
	repo: string;
	commitData?: CommitData;
	dependencies?: TreeLink[];
	dependencySrcIndex?: Map<TreeLinkKey, TreeLink[]>;
	dependencyDstIndex?: Map<TreeLinkKey, TreeLink[]>;
	fetchingBranches = true;

	options: { url: string; api: QFrameAPI };

	constructor(options: { url: string; api: QFrameAPI }) {
		super(options);
		this.options = options;
		this.repo = new URL(this.options.url).pathname.replace(/^\/+/, '');
	}

	async readDir(path: string): Promise<FSDirEntry | null> {
		if (path !== '') return null;
		const tree = new FSDirEntry();
		const branches: string[] = await this.options.api.post('/repo/branch', { repo: this.repo });
		branches.sort();
		branches.forEach((branch: string) => {
			const pathSegments = branch.split('/');
			let dir = tree;
			for (let i = 0; i < pathSegments.length - 1; i++) {
				const pathSegment = pathSegments[i];
				let fsEntry = dir.entries.get(pathSegment);
				if (!fsEntry) {
					fsEntry = new FSDirEntry(pathSegment);
					fsEntry.parent = dir;
					dir.entries.set(pathSegment, fsEntry);
				}
				dir = fsEntry;
				dir.fetched = true;
			}
			const fsEntry = mount(
				tree,
				`/${branch}`,
				new MontaanGitBranchFilesystem({
					repo: this.repo,
					branch: branch,
					api: this.options.api,
				})
			);
			fsEntry.data = branch;
		});
		this.fetchingBranches = false;
		return tree;
	}

	async readFile(path: string): Promise<ArrayBuffer> {
		throw new NotImplementedError("montaanGit doesn't support readFile");
	}

	async writeFile(path: string, contents: ArrayBuffer): Promise<boolean> {
		throw new NotImplementedError("montaanGit doesn't support writes");
	}

	async rm(path: string): Promise<boolean> {
		throw new NotImplementedError("montaanGit doesn't support writes");
	}

	async rmdir(path: string): Promise<boolean> {
		throw new NotImplementedError("montaanGit doesn't support writes");
	}
}
