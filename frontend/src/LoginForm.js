import React from 'react';
import { withRouter, Link } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form"
import { Formik, ErrorMessage } from "formik";
import * as yup from "yup";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faKey } from '@fortawesome/free-solid-svg-icons'

import './LoginForm.css';

const schema = yup.object({
    email: yup.string()
        .email('Invalid email')
        .required('Please enter your email address'),
    password: yup.string()
        .required('Please enter a password'),
    rememberme: yup.bool().optional()
});

class LoginForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            email: "",
            password: ""
        };
    }

    handleChange = event => {
        this.setState({
            [event.target.id]: event.target.value
        });
    }

    handleSubmit = async (values) => {
        const res = await this.props.api('/user/authenticate', {
            method: 'POST',
            body: JSON.stringify({
                email: values.email,
                password: values.password,
                rememberme: values.rememberme
            })
        });
        const json = await res.json();
        this.props.onSuccess(json);
    }

    onCancel = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        this.props.onCancel(ev);
    }

    componentDidMount() {
        window.scrollTo(0,0);
    }

    render() {
        return (
            <div className="login-form-container">
                <Formik
                    validationSchema={schema}
                    initialValues={{ email: '', password: '' }}
                    onSubmit={async (values, { setSubmitting }) => {
                        setSubmitting(true);
                        await this.handleSubmit(values);
                        setSubmitting(false);
                    }}
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
                                <h1>Montaan login</h1>
                                <Form.Group controlId="formBasicEmail">
                                    <Form.Label size="lg">Email address</Form.Label>
                                    <Form.Control
                                        name="email"
                                        value={values.email}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        isValid={touched.email && !errors.email}
                                        isInvalid={touched.email && errors.email}
                                        type="email"
                                        placeholder="Enter email"
                                    />
                                    <ErrorMessage name="email">{msg => 
                                        <div className="error error-message">{msg}</div>
                                    }</ErrorMessage>
                                </Form.Group>

                                <Form.Group controlId="formBasicPassword">
                                    <Form.Label size="lg">Password</Form.Label>
                                    <Form.Control
                                        name="password"
                                        value={values.password}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        isValid={touched.password && !errors.password}
                                        isInvalid={touched.password && errors.password}
                                        type="password"
                                        placeholder="Password"
                                    />
                                    <ErrorMessage name="password">{msg => 
                                        <div className="error error-message">{msg}</div>
                                    }</ErrorMessage>
                                    <Link to="/recoverAccount">Forgot your password?</Link>
                                </Form.Group>

                                <Form.Group controlId="formBasicChecbox">
                                    <Form.Check name="rememberme" value={values.rememberme} onChange={handleChange} size="sm" type="checkbox" label="Remember me" />
                                </Form.Group>

                                <Button block variant="primary" type="submit">
                                    <FontAwesomeIcon icon={faKey}/> Log in
                                </Button>

                                <Button block variant="secondary" type="close" onClick={this.onCancel}>
                                    <FontAwesomeIcon icon={faArrowLeft}/> Go back
                                </Button>
                            </Form>
                        )}
                </Formik>
            </div>
        );
    }
}

export default withRouter(LoginForm);