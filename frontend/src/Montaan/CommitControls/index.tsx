import React from 'react';
import './style.css';

export default class CommitControls extends React.Component<any, any> {
	constructor(props: any) {
		super(props);
		this.state = { visible: true };
	}

	toggleVisible = (ev: MouseEvent) => {
		this.setState({ visible: !this.state.visible });
	};

	render() {
		return (
			<div
				id="commitControls"
				className={this.state.visible ? 'visible' : 'hidden'}
				data-filename={'frontend/' + __filename.replace(/\\/g, '/')}
			>
				<div>
					<input
						id="commitSlider"
						type="range"
						min="0"
						max="999"
						step="1"
						defaultValue="0"
					></input>
					<button id="previousCommit">&lt;</button>
					<button id="nextCommit">&gt;</button>
					<button id="playCommits">&#9654;</button>
				</div>
				<div id="commitDetails"></div>
			</div>
		);
	}
}
