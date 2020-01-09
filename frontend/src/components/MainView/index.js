import React from 'react';
import './style.css';
import init from '../../main.js';

export default class MainView extends React.Component {
    constructor() {
        init();
        super();
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        if (this.props.searchQuery !== nextProps.searchQuery) window.searchString(nextProps.searchQuery);
        if (this.props.commitLog !== nextProps.commitLog) window.setCommitLog(nextProps.commitLog);
        if (this.props.commitChanges !== nextProps.commitChanges) window.setCommitChanges(nextProps.commitChanges);
        if (this.props.files !== nextProps.files) window.setFiles(nextProps.files);
        return false;
    }

    render() {
        return <></>;
    }
}
