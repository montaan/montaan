// src/Montaan/TourSelector/TourSelector.tsx

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import styles from './TourSelector.module.scss';
import { FileTree } from '../MainApp';
import Dropdown from 'react-bootstrap/Dropdown';
import QFrameAPI from '../../lib/api';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Tour from '../Tour';
import utils from '../lib/utils';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FSEntry } from '../lib/filesystem';

export interface TourSelectorProps extends RouteComponentProps {
	fileTree: FileTree;
	navigationTarget: string;
	api: QFrameAPI;
	repoPrefix: string;
}

type TourRef = { name: string; path: string };
const EMPTY_TOUR: TourRef = { name: '', path: '' };
type TourContent = { name: string; markdown: string };
const EMPTY_TOUR_CONTENT: TourContent = { name: '', markdown: '' };

const TourSelector = ({ fileTree, navigationTarget, api, repoPrefix }: TourSelectorProps) => {
	const [currentTour, setCurrentTour] = useState(EMPTY_TOUR);
	const [search, setSearch] = useState('');
	const [tourContent, setTourContent] = useState(EMPTY_TOUR_CONTENT);

	const toursInTree: TourRef[] = useMemo(() => {
		const foundTours = [] as string[];
		utils.traverseTree(fileTree, (fsEntry: FSEntry, path: string) => {
			if (fsEntry.entries === null && fsEntry.title === '.tour.md') foundTours.push(path);
		});
		return foundTours.sort().map((path) => {
			const rawName = path
				.split('/')
				.slice(3, -1)
				.join('/');
			const name = (rawName ? rawName[0].toUpperCase() + rawName.slice(1) : 'Main') + ' tour';
			return { path, name };
		});
	}, [fileTree]);
	const tours = useMemo(() => toursInTree.filter((t) => t.name.includes(search)), [
		toursInTree,
		search,
	]);

	useEffect(() => {
		if (!currentTour.path) setTourContent(EMPTY_TOUR_CONTENT);
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
	const endTour = useCallback(() => setCurrentTour(EMPTY_TOUR), [setCurrentTour]);

	return (
		<div className={styles.TourSelector} data-filename={'frontend/' + __filename.replace(/\\/g, '/')} >
			{toursInTree.length > 0 && (
				<DropdownButton id="tourDropdown" alignRight title="Tours" onSelect={onTourSelect}>
					{toursInTree.length > 8 && (
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
				<>
					<Tour
						name={tourContent.name}
						tourMarkdown={tourContent.markdown}
						repoPrefix={repoPrefix}
					/>
					<Button
						type="button"
						variant="secondary"
						className={styles.close}
						onClick={endTour}
					>
						<FontAwesomeIcon icon={faTimes} />
					</Button>
				</>
			)}
		</div>
	);
};

export default withRouter(TourSelector);
