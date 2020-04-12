// src/Montaan/Breadcrumb/Breadcrumb.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { withRouter, Link, RouteComponentProps } from 'react-router-dom';

import styles from './Breadcrumb.module.scss';
import { getSiblings } from '../Filesystems';
import { FileTree } from '../MainApp';

const filename = 'frontend/' + __filename.replace(/\\/g, '/');

const BreadcrumbSegment = ({
	path,
	segment,
	fileTree,
	fileTreeUpdated,
}: {
	path: string;
	segment: string;
	fileTree: FileTree;
	fileTreeUpdated: number;
}) => {
	const [open, setOpen] = useState(false);
	const onMouseEnter = useCallback(() => setOpen(true), [setOpen]);
	const onMouseLeave = useCallback(() => setOpen(false), [setOpen]);
	const siblingLinks = useMemo(
		() => (
			<ul>
				{getSiblings(fileTree.tree, path).map(
					(siblingPath) =>
						siblingPath !== path && (
							<li key={siblingPath}>
								<Link to={siblingPath}>{siblingPath.split('/').pop()}</Link>
							</li>
						)
				)}
			</ul>
		),
		[fileTree, path]
	);
	return (
		<li onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} data-filename={filename}>
			<Link to={path}>{segment}</Link>
			{open && siblingLinks}
		</li>
	);
};

export interface BreadcrumbProps extends RouteComponentProps {
	navigationTarget: string;
	fileTree: FileTree;
	fileTreeUpdated: number;
}

const Breadcrumb = ({ navigationTarget, fileTree, fileTreeUpdated }: BreadcrumbProps) => {
	const segments = useMemo(() => {
		const version = fileTreeUpdated;
		const pathSegments = navigationTarget.split('/').slice(1);
		let path = '';
		let paths = pathSegments.map((segment) => {
			path += '/' + segment;
			return { segment, path };
		});
		return paths.map(({ segment, path }) => (
			<BreadcrumbSegment
				key={path}
				path={path}
				segment={segment}
				fileTree={fileTree}
				fileTreeUpdated={fileTreeUpdated}
			/>
		));
	}, [fileTree, fileTreeUpdated, navigationTarget]);
	return (
		<ul className={styles.Breadcrumb} data-filename={filename}>
			{segments}
		</ul>
	);
};

export default withRouter(Breadcrumb);
