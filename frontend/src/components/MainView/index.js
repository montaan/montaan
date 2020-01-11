import React from 'react';
import './style.css';
import tabletree from '../../main.js';

export default class MainView extends React.Component {
    constructor(props) {
        super(props);
        tabletree.init(props.apiPrefix, props.repoPrefix);
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        if (this.props.commitLog !== nextProps.commitLog) tabletree.setCommitLog(nextProps.commitLog);
        if (this.props.commitChanges !== nextProps.commitChanges) tabletree.setCommitChanges(nextProps.commitChanges);
        if (this.props.files !== nextProps.files) tabletree.setFiles(nextProps.files);
        if (this.props.searchResults !== nextProps.searchResults) tabletree.setSearchResults(nextProps.searchResults);
        if (this.props.frameRequestTime !== nextProps.frameRequestTime) tabletree.changed = true;
        return false;
    }

    render() {
        return <></>;
    }
}
