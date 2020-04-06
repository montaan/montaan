// src/Montaan/Player/Player.tsx

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from './Player.module.scss';
import QFrameAPI from '../../lib/api';
import utils from '../lib/utils';
import { FSEntry, getFullPath } from '../lib/filesystem';

let iframeID = 0;

const PlayerCard = ({ url }: { url: string }) => {
	const v = url;
	const yt = v.match(
		/^(https?:\/\/)?(www\.)?(youtu\.be\/|youtube\.com\/watch(\/|\/?(\?v=)?))([a-zA-Z0-9_-]+)/
	);
	const vimeo = v.match(/^(https?:\/\/)?((www\.)?vimeo\.com)\/([a-zA-Z0-9_-]+)/);
	const soundCloud = v.match(/^(https?:\/\/)?((www\.)?soundcloud\.com)\//);
	const sketchFab = v.match(/^(https?:\/\/)?skfb.ly\//);
	const iframeTitle = 'player-card-' + (iframeID++).toString();
	if (yt) {
		return (
			<div className={styles.card + ' ' + styles.youtube}>
				<iframe
					title={iframeTitle}
					width="720"
					height="480"
					src={"http://www.youtube.com/embed/' + encodeURIComponent(yt[6]) + '?html5=1"}
					frameBorder="0"
					allowFullScreen={true}
				></iframe>
			</div>
		);
	} else if (vimeo) {
		return (
			<div className={styles.card + ' ' + styles.vimeo}>
				<iframe
					title={iframeTitle}
					width="720"
					height="480"
					src={
						"http://player.vimeo.com/video/' + encodeURIComponent(vimeo[4]) + '?html5=1"
					}
					frameBorder="0"
					allowFullScreen={true}
				></iframe>
			</div>
		);
	} else if (/^spotify:\S+$/.test(v) || /^http:\/\/open\.spotify\.com\/.+$/.test(v)) {
		const urls = v.match(/spotify\.com\/(.+)$/);
		const sv = urls ? 'spotify:' + urls[1].replace(/\//g, ':') : v;
		return (
			<div className={styles.card + ' ' + styles.spotify}>
				<iframe
					title={iframeTitle}
					src={
						'https://open.spotify.com/embed/' +
						sv.replace(/^spotify:/, '').replace(/:/g, '/')
					}
					width="300"
					height="380"
					frameBorder="0"
					allowTransparency={true}
					allow="encrypted-media"
				></iframe>
			</div>
		);
	} else if (soundCloud) {
		return (
			<div className={styles.card + ' ' + styles.soundcloud}>
				<iframe
					title={iframeTitle}
					src={'https://w.soundcloud.com/player/?url=' + encodeURIComponent(v)}
					width="320"
					height="400"
					frameBorder="0"
					allowTransparency={true}
				/>
			</div>
		);
	} else if (sketchFab) {
		return (
			<div className={styles.card + ' ' + styles.sketchFab}>
				<iframe
					title={iframeTitle}
					src={v + '?autostart=0&transparent=0&autospin=0.2&controls=1'}
					width="720"
					height="480"
					frameBorder="0"
					allowTransparency={true}
					allowFullScreen={true}
				/>
			</div>
		);
	} else if (/^([a-z]+:)?\/\//.test(v)) {
		if (/\.(png|gif|jpe?g|webp)$/.test(v)) {
			return (
				<div className={styles.card + ' ' + styles.image}>
					<img alt={''} src={v} />
				</div>
			);
		} else if (/\.(webm|mp4)$/.test(v)) {
			return (
				<div className={styles.card + ' ' + styles.video}>
					<video src={v} />
				</div>
			);
		} else if (/\.(mp3|m4a)$/.test(v)) {
			return (
				<div className={styles.card + ' ' + styles.audio}>
					<audio src={v} />
				</div>
			);
		} else {
			return (
				<div className={styles.card + ' ' + styles.link}>
					<a href={v} target="_blank" rel="noopener noreferrer">
						{v}
					</a>
				</div>
			);
		}
	} else {
		return <div className={styles.card + ' ' + styles.text}>{v}</div>;
	}
};

export interface PlayerProps extends RouteComponentProps {
	fileTree: FSEntry;
	fileTreeUpdated: number;
	navigationTarget: string;
	api: QFrameAPI;
	repoPrefix: string;
}

type PlaylistRef = { path: string; name: string };
const EMPTY_PLAYLIST: PlaylistRef = { name: '', path: '' };
type PlaylistContent = { name: string; url: string };
const EMPTY_PLAYLIST_CONTENT: PlaylistContent = { name: '', url: '' };

const Player = ({ fileTree, navigationTarget, api, fileTreeUpdated }: PlayerProps) => {
	const [currentPlaylist, setCurrentPlaylist] = useState(EMPTY_PLAYLIST);
	const [search, setSearch] = useState('');
	const [playlistContent, setPlaylistContent] = useState(EMPTY_PLAYLIST_CONTENT);

	const playlistsInTree: PlaylistRef[] = useMemo(() => {
		// eslint-disable-next-line
		const version = fileTreeUpdated;
		const foundPlaylists = utils.findFiles(fileTree, '.playlist').map(getFullPath);
		return foundPlaylists.sort().map((path) => {
			const rawName = path
				.split('/')
				.slice(3, -1)
				.join('/');
			const name =
				(rawName ? rawName[0].toUpperCase() + rawName.slice(1) : 'Main') + ' playlist';
			return { path, name };
		});
	}, [fileTree, fileTreeUpdated]);
	const playlists = useMemo(() => playlistsInTree.filter((t) => t.name.includes(search)), [
		playlistsInTree,
		search,
	]);

	useEffect(() => {
		if (!currentPlaylist.path) setPlaylistContent(EMPTY_PLAYLIST_CONTENT);
		else
			api.getType('/repo/file' + currentPlaylist.path, {}, 'text').then((url) =>
				setPlaylistContent({ name: currentPlaylist.name, url })
			);
	}, [currentPlaylist, api, setPlaylistContent]);

	const onPlaylistSelect = useCallback(
		(eventKey: string, event: any) =>
			setCurrentPlaylist(playlists.find(({ path }) => path === eventKey) || EMPTY_PLAYLIST),
		[setCurrentPlaylist, playlists]
	);
	const searchOnChange = useCallback((ev) => setSearch(ev.target.value), [setSearch]);
	const endPlaylist = useCallback(() => setCurrentPlaylist(EMPTY_PLAYLIST), [setCurrentPlaylist]);

	return (
		<div className={styles.Player} data-filename={'frontend/' + __filename.replace(/\\/g, '/')}>
			{playlistsInTree.length > 0 && (
				<DropdownButton
					id="tourDropdown"
					alignRight
					title="Playlists"
					onSelect={onPlaylistSelect}
				>
					{playlistsInTree.length > 8 && (
						<>
							<Dropdown.Header key="header">
								<Form.Group id="playlistSearch">
									<Form.Control
										placeholder="Search playlists"
										onChange={searchOnChange}
										value={search}
									/>
								</Form.Group>
							</Dropdown.Header>
							{playlists.length > 0 && <Dropdown.Divider />}
						</>
					)}
					<div key="playlistList" className={styles.PlaylistList}>
						{playlists.map(({ path, name }) => (
							<Dropdown.Item key={path} eventKey={path}>
								<span className={styles.PlaylistName}>{name}</span>
							</Dropdown.Item>
						))}
					</div>
				</DropdownButton>
			)}
			{playlistContent.url && (
				<>
					<PlayerCard url={playlistContent.url} />
					<div className={styles.playerName}>{playlistContent.name}</div>
					<Button
						type="button"
						variant="secondary"
						className={styles.close}
						onClick={endPlaylist}
					>
						<FontAwesomeIcon icon={faTimes} />
					</Button>
				</>
			)}
		</div>
	);
};

export default withRouter(Player);
