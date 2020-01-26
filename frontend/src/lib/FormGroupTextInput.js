import React from 'react';

import Form from 'react-bootstrap/Form';
import { ErrorMessage } from 'formik';

export default class FormGroupTextInput extends React.Component {
	render() {
		const {
			rows,
			label,
			type,
			control,
			placeholder,
			values,
			onChange,
			onBlur,
			touched,
			errors,
		} = this.props;
		return (
			<Form.Group controlId={'formCard' + control}>
				{label && <Form.Label size="lg">{label}</Form.Label>}
				<ErrorMessage name={control}>
					{(msg) => <div className="error error-message">{msg}</div>}
				</ErrorMessage>
				<Form.Control
					name={control}
					aria-label={label || placeholder}
					defaultValue={values[control]}
					onChange={onChange}
					onBlur={onBlur}
					isValid={touched[control] && !errors[control]}
					isInvalid={touched[control] && errors[control]}
					type={type || 'text'}
					rows={rows}
					as={rows !== undefined ? 'textarea' : undefined}
					placeholder={placeholder}
				/>
			</Form.Group>
		);
	}
}
