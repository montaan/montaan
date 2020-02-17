// src/Montaan/Tour/Tour.tsx

import React, { useState, useMemo, useCallback } from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import styles from './Tour.module.scss';
import Button from 'react-bootstrap/Button';
import showdown from 'showdown';

export interface TourProps extends RouteComponentProps {
	tourMarkdown: string;
}

const Tour = ({ tourMarkdown }: TourProps) => {
	const [position, setPosition] = useState(0);
	const tourSections = useMemo(() => {
		setPosition(0);
		const converter = new showdown.Converter();
		const html = converter.makeHtml(tourMarkdown);
		console.log(html);
		return [html];
	}, [tourMarkdown]);
	const decrementPosition = useCallback(() => () => setPosition(Math.max(0, position - 1)), [position]);
	const incrementPosition = useCallback(
		() => () => setPosition(Math.min(tourSections.length - 1, position + 1)),
		[tourSections.length, position]
	);
	return (
		<div className={styles.Tour}>
			<div className={styles.TourSection}>{tourSections[position]}</div>
			<Button onClick={decrementPosition} disabled={position === 0}>
				Previous
			</Button>
			<Button onClick={incrementPosition} disabled={position === tourSections.length - 1}>
				Next
			</Button>
		</div>
	);
};

export default withRouter(Tour);
