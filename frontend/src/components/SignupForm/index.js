
import React from 'react';
import { withRouter, Link } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form"
import { Formik, ErrorMessage } from "formik";
import * as yup from "yup";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faKey } from '@fortawesome/free-solid-svg-icons'

import './style.css';

const signUpSchema = yup.object({
    company: yup.string().optional(),
    name: yup.string().required('Please enter your name'),
    title: yup.string().optional(),
    email: yup.string()
        .email('Invalid email')
        .required('Please enter your email address'),
    password: yup.string()
        .min(8, 'Password is too short')
        .max(256, 'Password is too long')
        .required('Please enter a password'),
    website: yup.string().optional(),
    tel: yup.string().optional(),
    mobile: yup.string().optional(),
    rememberme: yup.bool().optional()
});


class FormGroupTextInput extends React.Component {
    render() {
        const { rows, label, type, control, placeholder, values, onChange, onBlur, touched, errors } = this.props;
        return (
            <Form.Group controlId={"formCard" + control}>
                {label && <Form.Label size="lg">{label}</Form.Label>}
                <ErrorMessage name={control}>{msg => 
                    <div className="error error-message">{msg}</div>
                }</ErrorMessage>
                <Form.Control
                    name={control}
                    aria-label={label || placeholder}
                    defaultValue={values[control]}
                    onChange={onChange}
                    onBlur={onBlur}
                    isValid={touched[control] && !errors[control]}
                    isInvalid={touched[control] && errors[control]}
                    type={type || "text"}
                    rows={rows}
                    as={rows !== undefined ? "textarea" : undefined}
                    placeholder={placeholder}
                />
            </Form.Group>
        );
    }
}

class SignupForm extends React.Component {
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

    async handleSubmit(values, setSubmitting) {
        setSubmitting && setSubmitting(true);
        try {
            const api = this.props.api;
            const userCreated = await api.post('/user/create', {
                    email: values.email,
                    password: values.password,
                    name: values.name.toLowerCase().replace(/[^a-z0-9_.-]+/g, '.')
            });
            if (userCreated.status) {
                throw(Error("Error creating user: " + userCreated.message));
            }
            const auth = await api.post('/user/authenticate', {
                    email: values.email,
                    password: values.password,
                    rememberme: values.rememberme
            });
            delete values.password;
            delete values.rememberme;
            this.props.onSuccess(auth);
            this.props.history.push('/');
        } finally {
            setSubmitting && setSubmitting(false);
        }
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
        const emailLabel = <span>Email</span>;
        const nameLabel = <span>Name</span>;
        return (
            <div className="login-form-container">
                <Formik
                    validationSchema={signUpSchema}
                    initialValues={{ name: '', email: '', password: '' }}
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
                        <Form className='sign-up-form' onSubmit={handleSubmit} variant="flush">
                            <h1 className='sign-up-title'><br/>Sign up to Montaan</h1>
                            <FormGroupTextInput label={nameLabel} control="name" placeholder="Your name" values={values} onChange={handleChange} touched={touched} onBlur={handleBlur} errors={errors} />
                            <FormGroupTextInput label={emailLabel} control="email" placeholder="Your e-mail address" values={values} onChange={handleChange} onBlur={handleBlur} touched={touched} errors={errors} />
                            <FormGroupTextInput label="" type="password" control="password" placeholder="Password" values={values} onChange={handleChange} onBlur={handleBlur} touched={touched} errors={errors} />
                            <Form.Group controlId="formBasicChecbox">
                                <Form.Check name="rememberme" checked={values.rememberme} onChange={handleChange} onBlur={handleBlur} size="sm" type="checkbox" label="Remember me" />
                            </Form.Group>
                            <Button block variant="primary" type="submit" disabled={isSubmitting}>
                                Sign up
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

export default withRouter(SignupForm);