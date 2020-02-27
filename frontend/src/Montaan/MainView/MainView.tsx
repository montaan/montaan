import React from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import './MainView.scss';
import tabletree from './main.js';
import { TreeLink } from '../MainApp';

interface MainViewProps extends RouteComponentProps {
	requestDirs(paths: string[], dropEntries: any[]): Promise<void>;
	api: any;
	diffsLoaded: number;
	fileTree: any;
	commitData: any;
	activeCommitData: any;
	commitFilter: any;
	navigationTarget: string;
	searchResults: any[];
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
		tabletree.setNavigationTarget = props.setNavigationTarget;
		tabletree.init(props.api);
		tabletree.history = props.history;
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
			tabletree.updateSearchLines();
		tabletree.updateLinks();
		if (this.props.links !== nextProps.links) tabletree.setLinks(nextProps.links);
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
