// src/Montaan/Breadcrumb/Breadcrumb.tsx

import React, { useState } from 'react';
import { withRouter, Link, RouteComponentProps } from 'react-router-dom';

import styles from './Breadcrumb.module.scss';
import { getSiblings } from '../lib/filetree';

const BreadcrumbSegment = ({
	path,
	segment,
	fileTree,
}: {
	path: string;
	segment: string;
	fileTree: any;
}) => {
	const [open, setOpen] = useState(false);
	return (
		<li onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
			<Link to={path}>{segment}</Link>
			{open && (
				<ul>
					{getSiblings(fileTree.tree, path).map((path) => (
						<li key={path}>
							<Link to={path}>{path.split('/').pop()}</Link>
						</li>
					))}
				</ul>
			)}
		</li>
	);
};

export interface BreadcrumbProps extends RouteComponentProps {
	navigationTarget: string;
	fileTree: any;
}

const Breadcrumb = ({ navigationTarget, fileTree }: BreadcrumbProps) => {
	const segments = navigationTarget.split('/').slice(1);
	// var siblings = getSiblings(fileTree, path);
	let path = '';
	let paths = segments.map((segment) => {
		path += '/' + segment;
		return { segment, path };
	});
	return (
		<ul className={styles.Breadcrumb}>
			{paths.map(({ segment, path }) => (
				<BreadcrumbSegment key={path} path={path} segment={segment} fileTree={fileTree} />
			))}
		</ul>
	);
};

export default withRouter(Breadcrumb);
