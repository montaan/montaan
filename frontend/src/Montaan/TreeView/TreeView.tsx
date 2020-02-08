// src/Montaan/TreeView/TreeView.tsx

import React, { useRef, useState } from 'react';
import { withRouter, Link, RouteComponentProps } from 'react-router-dom';
import { Canvas, useFrame } from 'react-three-fiber';

import styles from './TreeView.module.scss';
import QFrameAPI from '../../lib/api';
import { FileTree, SearchResult } from '../MainApp';
import { CommitData } from '../lib/parse_commits';

export interface TreeViewProps extends RouteComponentProps {
	api: QFrameAPI;
	repoPrefix: string;
	fileTree: FileTree;
	commitData: null | CommitData;
	activeCommitData: null | CommitData;
	commitFilter: any;
	navigationTarget: string;
	searchResults: SearchResult[];
	searchLinesRequest: number;
	diffsLoaded: number;
	addLinks(links: Link[]): void;
	setLinks(links: Link[]): void;
	links: Link[];
	navUrl?: string;
	frameRequestTime: number;
	setNavigationTarget(target: string): void;
}

const TreeView = (props: TreeViewProps) => {
	return <div className={styles.TreeView}>Hello TreeView!</div>;
};

export default withRouter(TreeView);
