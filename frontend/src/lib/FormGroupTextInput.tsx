import React from 'react';

import Form from 'react-bootstrap/Form';
import { ErrorMessage } from 'formik';

export interface FormGroupTextInputProps {
	rows?: number;
	label?: string;
	type?: string;
	control: string;
	placeholder?: string;
	values: { [control: string]: any };
	onChange: any;
	onBlur: any;
	touched: { [control: string]: any };
	errors: { [control: string]: any };
}

const FormGroupTextInput = ({
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
}: FormGroupTextInputProps) => (
	<Form.Group controlId={'formCard' + control}>
		{label && <Form.Label>{label}</Form.Label>}
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

export default FormGroupTextInput;
