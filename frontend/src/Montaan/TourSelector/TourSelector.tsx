// src/Montaan/TourSelector/TourSelector.tsx

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import styles from './TourSelector.module.scss';
import { FileTree } from '../MainApp';
import { getPathEntry, getFullPath } from '../lib/filetree';
import Dropdown from 'react-bootstrap/Dropdown';
import QFrameAPI from '../../lib/api';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Form from 'react-bootstrap/Form';
import Tour from '../Tour';

export interface TourSelectorProps extends RouteComponentProps {
	fileTree: FileTree;
	navigationTarget: string;
	api: QFrameAPI;
	repoPrefix: string;
}

const EMPTY_TOUR = { name: '', path: '' };

const TourSelector = ({ fileTree, navigationTarget, api, repoPrefix }: TourSelectorProps) => {
	const [currentTour, setCurrentTour] = useState(EMPTY_TOUR);
	const [search, setSearch] = useState('');
	const [tourContent, setTourContent] = useState({ name: '', markdown: '' });

	const toursInPath: string[] = useMemo(() => {
		let fsEntry = getPathEntry(fileTree.tree, navigationTarget);
		const foundTours = [];
		while (fsEntry) {
			if (fsEntry.entries && fsEntry.entries['.tour.md']) {
				foundTours.push(getFullPath(fsEntry.entries['.tour.md']));
			}
			fsEntry = fsEntry.parent;
		}
		return foundTours;
	}, [fileTree, navigationTarget]);
	const tours = useMemo(
		() =>
			toursInPath
				.filter((t) => t.includes(search))
				.map((path) => {
					const rawName = path
						.split('/')
						.slice(3, -1)
						.join('/');
					const name =
						(rawName ? rawName[0].toUpperCase() + rawName.slice(1) : 'Main') + ' tour';
					return { path, name };
				})
				.reverse(),
		[toursInPath, search]
	);

	useEffect(() => {
		if (!currentTour.path) setTourContent({ name: '', markdown: '' });
		else
			api.getType('/repo/file' + currentTour.path, {}, 'text').then((markdown) =>
				setTourContent({ name: currentTour.name, markdown })
			);
	}, [currentTour, api, setTourContent]);

	const onTourSelect = useCallback(
		(eventKey: string, event: any) =>
			setCurrentTour(tours.find(({ path }) => path === eventKey) || EMPTY_TOUR),
		[setCurrentTour, tours]
	);
	const tourSearchOnChange = useCallback((ev) => setSearch(ev.target.value), [setSearch]);

	return (
		<div className={styles.TourSelector}>
			{toursInPath.length > 0 && (
				<DropdownButton id="tourDropdown" alignRight title="Tours" onSelect={onTourSelect}>
					{toursInPath.length > 8 && (
						<>
							<Dropdown.Header key="header">
								<Form.Group id="tourSearch">
									<Form.Control
										placeholder="Search tours"
										onChange={tourSearchOnChange}
										value={search}
									/>
								</Form.Group>
							</Dropdown.Header>
							{tours.length > 0 && <Dropdown.Divider />}
						</>
					)}
					<div key="tourList" className={styles.TourList}>
						{tours.map(({ path, name }) => (
							<Dropdown.Item key={path} eventKey={path}>
								<span className={styles.TourName}>{name}</span>
							</Dropdown.Item>
						))}
					</div>
				</DropdownButton>
			)}
			{tourContent.markdown && (
				<Tour
					name={tourContent.name}
					tourMarkdown={tourContent.markdown}
					repoPrefix={repoPrefix}
				/>
			)}
		</div>
	);
};

export default withRouter(TourSelector);
