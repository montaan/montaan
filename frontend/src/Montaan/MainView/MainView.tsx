import React from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import './MainView.scss';
import tabletree from './main';
import { TreeLink, ActiveCommitData, FileTree, CommitFilter, SearchResult } from '../MainApp';
import QFrameAPI from '../../lib/api';
import { CommitData } from '../CommitParser/parse_commits';

interface MainViewProps extends RouteComponentProps {
	requestDirs(paths: string[], dropEntries: any[]): Promise<void>;
	requestThumbnails: (thumbnails: { path: string; z: number }[]) => Promise<void>;
	api: QFrameAPI;
	diffsLoaded: number;
	fileTree: FileTree;
	commitData?: CommitData;
	activeCommitData?: ActiveCommitData;
	commitFilter: CommitFilter;
	navigationTarget: string;
	searchResults: SearchResult[];
	searchQuery: string;
	searchLinesRequest: number;
	addLinks(links: TreeLink[]): void;
	setLinks(links: TreeLink[]): void;
	links: TreeLink[];
	navUrl?: string;
	frameRequestTime: number;
	setNavigationTarget(target: string): void;
	treeLoaded(): void;
	fileTreeUpdated: number;
}

class MainView extends React.Component<MainViewProps, {}> {
	constructor(props: MainViewProps) {
		tabletree.requestDirs = props.requestDirs;
		tabletree.requestThumbnails = props.requestThumbnails;
		tabletree.setNavigationTarget = props.setNavigationTarget;
		tabletree.init(props.api, props.history);
		super(props);
	}

	shouldComponentUpdate(nextProps: MainViewProps) {
		if (
			this.props.fileTree !== nextProps.fileTree ||
			this.props.fileTreeUpdated !== nextProps.fileTreeUpdated
		) {
			tabletree.setFileTree(nextProps.fileTree).then(() => this.props.treeLoaded());
		}
		if (this.props.searchResults !== nextProps.searchResults)
			tabletree.setSearchResults(nextProps.searchResults);
		if (this.props.searchLinesRequest !== nextProps.searchLinesRequest)
			tabletree.searchLandmarks.updateSearchLines();
		tabletree.linksModel.updateLinks(tabletree.currentFrame);
		if (this.props.links !== nextProps.links) tabletree.linksModel.setLinks(nextProps.links);
		if (this.props.navUrl !== nextProps.navUrl) tabletree.goToURL(nextProps.navUrl);
		if (this.props.frameRequestTime !== nextProps.frameRequestTime) tabletree.changed = true;
		tabletree.history = nextProps.history;
		return false;
	}

	render() {
		return <></>;
	}
}

export default withRouter(MainView);
