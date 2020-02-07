// src/components/RepoSelector/index.js

import React, { Component } from 'react';

import { withRouter, RouteComponentProps } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Form from 'react-bootstrap/Form';
import { Formik } from 'formik';
import * as yup from 'yup';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
// import { faArrowLeft, faKey } from '@fortawesome/free-solid-svg-icons'

import FormGroupTextInput from '../../lib/FormGroupTextInput';

import styles from './RepoSelector.module.scss';

const schema = yup.object({
	name: yup.string().nullable(),
	url: yup.string().nullable(),
});

export interface Repo {
	name: string;
	commit_count: number;
	url: string;
	owner: string;
	processing: boolean;
}

interface RepoSelectorProps extends RouteComponentProps {
	repos: Repo[];
	createRepo(name: string, url?: string): Promise<Repo>;
}

interface RepoSelectorState {
	showCreate: boolean;
	name: string;
	url: string;
	search: string;
	repoSort: 'name' | 'commits';
}

type SubmitValues = { name: string; url: string };
type SetSubmitFunc = (value: boolean) => void;
type RepoSorter = (a: Repo, b: Repo) => number;

class RepoSelector extends Component<RepoSelectorProps, RepoSelectorState> {
	constructor(props: RepoSelectorProps) {
		super(props);

		this.state = {
			showCreate: false,
			name: '',
			url: '',
			search: '',
			repoSort: 'name',
		};
	}

	async handleSubmit(values: SubmitValues, setSubmitting?: SetSubmitFunc) {
		if (!values.name && !values.url) return;
		this.setState({ showCreate: false });
		setSubmitting && setSubmitting(true);
		try {
			if (!values.name) {
				values.name =
					values.url
						.split('/')
						.filter((a) => a)
						.pop() || '';
			}
			this.props.createRepo(values.name, values.url);
		} finally {
			setSubmitting && setSubmitting(false);
		}
	}

	onCancel = () => this.setState({ showCreate: false });

	setRepo = (eventKey: string, event: any) => {
		if (eventKey === '#new') this.setState({ showCreate: true });
		else this.props.history.push(eventKey);
	};

	onSubmit = async (
		values: SubmitValues,
		{ setSubmitting }: { setSubmitting: SetSubmitFunc }
	) => {
		setSubmitting(true);
		await this.handleSubmit(values);
		setSubmitting(false);
	};

	repoCmpName(a: Repo, b: Repo): number {
		return a.name.localeCompare(b.name);
	}
	repoCmpCommitCount(a: Repo, b: Repo): number {
		return b.commit_count - a.commit_count;
	}

	getRepoCmp(repoSort: string): RepoSorter {
		if (repoSort === 'commits') return this.repoCmpCommitCount;
		else return this.repoCmpName;
	}

	repoSearchOnChange = (ev: any) => this.setState({ search: ev.target.value });
	repoFilter = (repo: Repo) => repo.name.includes(this.state.search);

	render() {
		return (
			<div className={styles.RepoSelector}>
				<DropdownButton
					id="repoDropdown"
					alignRight
					title="Your Repositories"
					onSelect={this.setRepo}
				>
					<Dropdown.Header key="header">
						<Form.Group id="repoSearch">
							<Form.Control
								onChange={this.repoSearchOnChange}
								value={this.state.search}
							/>
						</Form.Group>
					</Dropdown.Header>
					<Dropdown.Item key="new" eventKey="#new">
						Create New
					</Dropdown.Item>
					{this.props.repos.length > 0 && <Dropdown.Divider />}
					<div key="repoList" className={styles.repoList}>
						{this.props.repos.length > 0 &&
							this.props.repos
								.filter(this.repoFilter)
								.sort(this.getRepoCmp(this.state.repoSort))
								.map((repo) => (
									<Dropdown.Item
										key={repo.owner + '/' + repo.name}
										eventKey={'/' + repo.owner + '/' + repo.name}
									>
										<span className={styles.repoOwner}>{repo.owner}</span>
										<span className={styles.repoName}>{repo.name}</span>
										<span className={styles.repoCommits}>
											{repo.commit_count}
										</span>
										{repo.processing && (
											<span className={styles.repoProcessing}>
												[processing]
											</span>
										)}
										<span className={styles.repoUrl}>{repo.url}</span>
									</Dropdown.Item>
								))}
					</div>
				</DropdownButton>
				{this.state.showCreate && (
					<Formik
						validationSchema={schema}
						initialValues={{ name: '', url: '' }}
						onSubmit={this.onSubmit}
					>
						{({
							values,
							errors,
							touched,
							handleChange,
							handleBlur,
							handleSubmit,
							isSubmitting,
							/* and other goodies */
						}) => (
							<Form onSubmit={isSubmitting ? () => {} : handleSubmit}>
								<FormGroupTextInput
									label="Repo name"
									control="name"
									placeholder="Repo name"
									values={values}
									onChange={handleChange}
									touched={touched}
									onBlur={handleBlur}
									errors={errors}
								/>
								<FormGroupTextInput
									label="Import URL (optional)"
									control="url"
									placeholder="Import URL"
									values={values}
									onChange={handleChange}
									touched={touched}
									onBlur={handleBlur}
									errors={errors}
								/>
								<Button
									block
									variant="primary"
									type="submit"
									disabled={isSubmitting}
								>
									Create Repo
								</Button>
								<Button
									block
									variant="secondary"
									type="reset"
									onClick={this.onCancel}
									disabled={isSubmitting}
								>
									Cancel
								</Button>
							</Form>
						)}
					</Formik>
				)}
			</div>
		);
	}
}

export default withRouter(RepoSelector);
