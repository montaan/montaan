import React from 'react';
import { withRouter } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form"
import { Formik, ErrorMessage } from "formik";
import * as yup from "yup";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faKey, faEnvelope } from '@fortawesome/free-solid-svg-icons'

import "./style.css";
import '../LoginForm/style.css';

const passwordResetSchema = yup.object({
    email: yup.string()
        .email('Invalid email')
        .required('Please enter your email address'),
    password: yup.string()
        .required('Please enter a password'),
    recoveryToken: yup.string().required(),
    rememberme: yup.bool().optional()
});

class _PasswordResetForm extends React.Component {
    componentDidMount() {
        window.scrollTo(0,0);
    }

    handleSubmit = (values) => {
        const email = values.email;
        const password = values.password;
        const recoveryToken = values.recoveryToken;
        this.props.api.post('/user/recoverSetPassword', {email, password, recoveryToken}).then(auth => {
            this.props.setAuthHeaders(auth);
            this.props.history.push('/');
        });
    };

    render() {
        return (
            <div className="login-form-container">
                <Formik
                    validationSchema={passwordResetSchema}
                    initialValues={{ email: '', password: '', recoveryToken: this.props.match.params.token }}
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
                                <h1>Recover account</h1>
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
                                    <Form.Label size="lg">New password</Form.Label>
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
                                </Form.Group>

                                <Form.Group controlId="formBasicChecbox">
                                    <Form.Check name="rememberme" value={values.rememberme} onChange={handleChange} size="sm" type="checkbox" label="Remember me" />
                                </Form.Group>

                                <Button block variant="primary" type="submit">
                                    <FontAwesomeIcon icon={faKey}/> Set new password
                                </Button>
                            </Form>
                        )}
                </Formik>
            </div>
        );
    }
}


const schema = yup.object({
    email: yup.string()
        .email('Invalid email')
        .required('Please enter your email address')
});

class _RecoverForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {doneForEmail: false};
    }

    componentDidMount() {
        window.scrollTo(0,0);
    }

    handleSubmit = (values) => {
        const email = values.email;
        this.props.api.post('/user/recover', {email}).then(() => {
            this.setState({doneForEmail: email});
        });
    };

    render() {
        if (this.state.doneForEmail) {
            return (
                <div className="login-form-container">
                    <Form>
                        <h1>Recover account</h1>
                        <p>Recovery email sent to {this.state.doneForEmail}</p>
                    </Form>
                </div>
            );
        }
        return (
            <div className="login-form-container">
                <Formik
                    validationSchema={schema}
                    initialValues={{ email: '' }}
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
                                <h1>Recover account</h1>
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

                                <Button block variant="primary" type="submit">
                                    <FontAwesomeIcon icon={faEnvelope}/> Send Recovery Email
                                </Button>
                            </Form>
                        )}
                </Formik>
            </div>
        );
    }
}

export const PasswordResetForm = withRouter(_PasswordResetForm);
export const RecoverForm = withRouter(_RecoverForm);
