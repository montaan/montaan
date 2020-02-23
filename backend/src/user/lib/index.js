const Mailer = require('../../lib/mailer');
const bcrypt = require('bcryptjs');
const saltRounds = 10;

const validEmail = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
function validateEmail(email) {
	return isString(email) && validEmail.test(email);
}

function validatePassword(password) {
	return isString(password) && password.length >= 8 && password.length <= 72;
}

const validName = /^[a-z0-9_\.-]{3,}$/;
function validateName(name) {
	if (
		name === 'repo' ||
		name === 'login' ||
		name === 'activate' ||
		name === 'user' ||
		name === 'logout'
	) {
		return false;
	}
	return validName.test(name);
}

module.exports = {
	Mailer,
	bcrypt,
	saltRounds,
	validEmail,
	validateEmail,
	validatePassword,
	validName,
	validateName,
};
