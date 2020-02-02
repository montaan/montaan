import React from 'react';
import './style.css';
import tabletree from '../../main.js';

export default class MainView extends React.Component {
	constructor(props) {
		tabletree.requestDirs = props.requestDirs;
		tabletree.requestDitchDirs = props.requestDitchDirs;
		tabletree.init(props.apiPrefix, props.repoPrefix);
		super(props);
	}

	shouldComponentUpdate(nextProps, nextState, nextContext) {
		if (this.props.fileTree !== nextProps.fileTree) tabletree.setFileTree(nextProps.fileTree);
		if (this.props.commitData !== nextProps.commitData)
			tabletree.setCommitData(nextProps.commitData);
		if (this.props.activeCommits !== nextProps.activeCommits)
			tabletree.setActiveCommits(nextProps.activeCommits);
		if (this.props.searchResults !== nextProps.searchResults)
			tabletree.setSearchResults(nextProps.searchResults);
		if (this.props.goToTarget !== nextProps.goToTarget)
			tabletree.goToTarget(nextProps.goToTarget);
		if (this.props.searchLinesRequest !== nextProps.searchLinesRequest)
			tabletree.updateSearchLines(true);
			tabletree.updateLinks();
		if (this.props.links !== nextProps.links) tabletree.setLinks(nextProps.links);
		if (this.props.navUrl !== nextProps.navUrl) tabletree.goToURL(nextProps.navUrl);
		if (this.props.frameRequestTime !== nextProps.frameRequestTime) tabletree.changed = true;
		return false;
	}

	render() {
		return <></>;
	}
}
