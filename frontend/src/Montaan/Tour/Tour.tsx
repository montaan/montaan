// src/Montaan/Tour/Tour.tsx

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { withRouter, RouteComponentProps, Link } from 'react-router-dom';

import styles from './Tour.module.scss';
import Button from 'react-bootstrap/Button';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import parse, { domToReact, HTMLReactParserOptions } from 'html-react-parser';

function parseMarkdown(tourMarkdown: string, repoPrefix: string) {
	const converter = new MarkdownIt();
	const html = DOMPurify.sanitize(converter.render(tourMarkdown));
	const doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html');
	const htmlSections = doc.body.children;
	const sections = [];
	let currentSection = document.createElement('div');
	for (let i = 0; i < htmlSections.length; i++) {
		let el = htmlSections[i];
		if (el.tagName === 'H3') {
			currentSection = document.createElement('div');
			sections.push(currentSection);
		}
		currentSection.appendChild(el.cloneNode(true));
	}
	return sections.map((d, i) => {
		const links = d.querySelectorAll('a');
		const baseHref = links.length > 0 ? repoPrefix + links[0].getAttribute('href') : undefined;
		for (let i = 0; i < links.length; i++) {
			const href = links[i].getAttribute('href');
			if (!href || /^[a-z0-9]+:/i.test(href)) continue;
			const absoluteHref = href.startsWith('/') ? repoPrefix + href : baseHref + '/' + href;
			links[i].setAttribute('href', absoluteHref.replace(/\/\/+/g, '/'));
		}
		const options: HTMLReactParserOptions = {
			replace: (d) => {
				if (
					d.attribs &&
					d.attribs.href &&
					d.children &&
					!/^[a-z0-9]+:/i.test(d.attribs.href)
				)
					return <Link to={d.attribs.href}>{domToReact(d.children, options)}</Link>;
				else return false;
			},
		};
		const parsed = parse(d.innerHTML, options);
		return {
			href: baseHref,
			title: d.firstElementChild?.textContent,
			el: <div key={i}>{parsed}</div>,
		};
	});
}

export interface TourProps extends RouteComponentProps {
	tourMarkdown: string;
	repoPrefix: string;
	name: string;
}

const Tour = ({ tourMarkdown, history, repoPrefix, name }: TourProps) => {
	const [position, setPosition] = useState(0);
	const [tocOpen, setTOCOpen] = useState(false);
	const tourSections = useMemo(() => {
		setPosition(0);
		return parseMarkdown(tourMarkdown, repoPrefix);
	}, [tourMarkdown, repoPrefix]);
	const decrementPosition = useCallback(() => setPosition(Math.max(0, position - 1)), [
		setPosition,
		position,
	]);
	const incrementPosition = useCallback(
		() => setPosition(Math.min(tourSections.length - 1, position + 1)),
		[tourSections.length, setPosition, position]
	);
	const goToStart = useCallback(() => setPosition(0), [setPosition]);
	const toggleTOC = useCallback(() => setTOCOpen(!tocOpen), [tocOpen, setTOCOpen]);

	useEffect(() => {
		if (tourSections[position]?.href) {
			history.push(tourSections[position]?.href);
		}
	}, [history, position, tourSections]);

	return (
		<div className={styles.Tour} data-filename={'frontend/' + __filename.replace(/\\/g, '/')}>
			<div className={styles.TourControls}>
				<Button variant="secondary" onClick={goToStart} disabled={position === 0}>
					Restart
				</Button>
				<Button onClick={decrementPosition} disabled={position === 0}>
					Previous
				</Button>
				<Button onClick={incrementPosition} disabled={position === tourSections.length - 1}>
					Next
				</Button>
			</div>
			<h5
				className={styles.TOCTitle + ' ' + (tocOpen ? styles.open : styles.closed)}
				onClick={toggleTOC}
			>
				Table of Contents
			</h5>
			<ol className={styles.TOC + ' ' + (tocOpen ? styles.open : styles.closed)}>
				{tourSections.map((s, i) => (
					<li
						key={i}
						onClick={() => setPosition(i)}
						className={position === i ? styles.current : ''}
					>
						{s.title}
					</li>
				))}
			</ol>
			<div className={styles.TourPage}>
				<span className={styles.TourName}>{name}</span>
				{position + 1} / {tourSections.length}
			</div>
			<div className={styles.TourSection}>{tourSections[position].el}</div>
		</div>
	);
};

export default withRouter(Tour);
