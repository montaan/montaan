// src/components/RepoSelector/index.js

import React, { Component } from 'react';

import { withRouter, Link } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import Form from "react-bootstrap/Form"
import { Formik, ErrorMessage } from "formik";
import * as yup from "yup";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faKey } from '@fortawesome/free-solid-svg-icons'

import FormGroupTextInput from '../../lib/FormGroupTextInput';

import strict from '../../lib/strictProxy.js'
import styles_ from './css/style.module.scss';
const styles = strict(styles_, 'components/RepoSelector/css/style.module.scss');

const schema = yup.object({
    name: yup.string().optional(),
	url: yup.string().optional()
});

class RepoSelector extends Component {
    constructor(props) {
        super(props);

        this.state = {
			showCreate: false,
            name: "",
            url: ""
        };
    }

    handleChange = event => {
        this.setState({
            [event.target.id]: event.target.value
        });
    }

    async handleSubmit(values, setSubmitting) {
		this.setState({showCreate: false});
        setSubmitting && setSubmitting(true);
        try {
			if (!values.name) values.name = values.url.split("/").filter(a => a).pop();
			this.props.createRepo(values.name, values.url);
        } finally {
            setSubmitting && setSubmitting(false);
        }
    }

    onCancel = () => this.setState({showCreate: false});

	setRepo = (eventKey, event) => {
		if (eventKey === '#new') this.setState({showCreate: true});
		else this.props.history.push(eventKey);
	}

	onSubmit = async (values, { setSubmitting }) => {
		setSubmitting(true);
		await this.handleSubmit(values);
		setSubmitting(false);
	}

    repoCmp(a, b) {
        return a.name.localeCompare(b.name);
    }

	render() {
		return (
			<div className={styles.RepoSelector}>
				<DropdownButton alignRight title="Your Repositories" onSelect={this.setRepo}>
					<Dropdown.Item eventKey="#new">Create New</Dropdown.Item>
					{this.props.repos.length > 0 && <>
					<Dropdown.Divider />
					{ this.props.repos.sort(this.repoCmp).map(repo => <Dropdown.Item key={repo.id} eventKey={"/" + this.props.userInfo.name + "/" + repo.name}>{this.props.userInfo.name + "/" +repo.name} ({repo.commit_count})</Dropdown.Item>) }
					</>}
				</DropdownButton>
				{this.state.showCreate && 
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
						<Form onSubmit={handleSubmit} disabled={isSubmitting}>
							<FormGroupTextInput label="Repo name" control="name" placeholder="Repo name" values={values} onChange={handleChange} touched={touched} onBlur={handleBlur} errors={errors} />
							<FormGroupTextInput label="Import URL (optional)" control="url" placeholder="Import URL" values={values} onChange={handleChange} touched={touched} onBlur={handleBlur} errors={errors} />
                            <Button block variant="primary" type="submit" disabled={isSubmitting}>
                                Create Repo
                            </Button>
                            <Button block variant="secondary" type="reset" onClick={this.onCancel} disabled={isSubmitting}>
                                Cancel
                            </Button>
						</Form>
					)}
				</Formik>
				}
			</div>
		);
	}

}

export default withRouter(RepoSelector);