// src/Montaan/TourSelector/TourSelector.tsx

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import styles from './TourSelector.module.scss';
import Dropdown from 'react-bootstrap/Dropdown';
import QFrameAPI from '../../lib/api';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Tour from '../Tour';
import utils from '../Utils/utils';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FSEntry, getFullPath } from '../Filesystems';

export interface TourSelectorProps extends RouteComponentProps {
	fileTree: FSEntry;
	fileTreeUpdated: number;
	api: QFrameAPI;
	repoPrefix: string;
	path: string;
}

type TourRef = { name: string; path: string };
const EMPTY_TOUR: TourRef = { name: '', path: '' };
type TourContent = { name: string; markdown: string };
const EMPTY_TOUR_CONTENT: TourContent = { name: '', markdown: '' };

const TourSelector = ({ path, fileTree, api, repoPrefix, fileTreeUpdated }: TourSelectorProps) => {
	const [currentTour, setCurrentTour] = useState(EMPTY_TOUR);
	const [search, setSearch] = useState('');
	const [tourContent, setTourContent] = useState(EMPTY_TOUR_CONTENT);

	const toursInTree: TourRef[] = useMemo(() => {
		// eslint-disable-next-line
		const version = fileTreeUpdated;
		const fileTreePath = getFullPath(fileTree);
		const foundTours = utils.findFiles(fileTree, '.tour.md').map(getFullPath);
		return foundTours.sort().map((fullPath) => {
			const path = fullPath.slice(fileTreePath.length);
			const rawName = path
				.split('/')
				.slice(1, -1)
				.join('/');
			const name = (rawName ? rawName[0].toUpperCase() + rawName.slice(1) : 'Main') + ' tour';
			return { path, name };
		});
	}, [fileTree, fileTreeUpdated]);
	const tours = useMemo(() => toursInTree.filter((t) => t.name.includes(search)), [
		toursInTree,
		search,
	]);

	useEffect(() => {
		if (!currentTour.path) setTourContent(EMPTY_TOUR_CONTENT);
		else {
			fileTree.filesystem!.readFile(currentTour.path).then((ab) => {
				const markdown = new TextDecoder().decode(ab);
				setTourContent({ name: currentTour.name, markdown });
			});
		}
	}, [currentTour, api, setTourContent, fileTree]);

	const onTourSelect = useCallback(
		(eventKey: string, event: any) =>
			setCurrentTour(tours.find(({ path }) => path === eventKey) || EMPTY_TOUR),
		[setCurrentTour, tours]
	);
	const tourSearchOnChange = useCallback((ev) => setSearch(ev.target.value), [setSearch]);
	const endTour = useCallback(() => setCurrentTour(EMPTY_TOUR), [setCurrentTour]);

	return (
		<div
			className={styles.TourSelector}
			data-filename={'frontend/' + __filename.replace(/\\/g, '/')}
		>
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
						repoPrefix={path}
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
