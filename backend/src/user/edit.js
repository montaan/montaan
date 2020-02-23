const { bcrypt, saltRounds, validatePassword } = require('./lib');

module.exports = async function(req, res) {
	// Edit user. POST {"name"?, "email"?, "password"?, "data"?} to /_/user/edit
	var [error, { user_id }] = await guardPostWithSession(req);
	if (error) return error;
	var [error, { name, email, password, newPassword, data }] = assertShape(
		{
			name: isMaybe(isString),
			email: isMaybe(isEmail),
			password: isMaybe(validatePassword),
			newPassword: isMaybe(validatePassword),
			data: isMaybe(isObject),
		},
		await bodyAsJson(req)
	);
	if (error) return error; // Pull out the request params from the JSON.
	if (!(name || email || newPassword)) {
		if (!data) return '400: Provide something to edit';
		await DB.queryTo(res, 'UPDATE users SET data = $1 WHERE id = $2 RETURNING email, data', [
			JSON.stringify(data),
			user_id,
		]);
	} else {
		const passwordHash = password && (await bcrypt.hash(password, saltRounds));
		const newPasswordHash = newPassword && (await bcrypt.hash(newPassword, saltRounds)); // If you're changing your password, we need to hash it for the database.
		if (!(!newPassword || password)) return '400: Provide password to set new password'; // Require existing password when changing password.
		if (!(!email || password)) return '400: Provide password to set new email'; // Require password when changing email address.
		await DB.queryTo(
			res,
			'UPDATE users SET data = COALESCE($1, data), email = COALESCE($2, email), password = COALESCE($3, password), name = COALESCE($4, name) WHERE id = $5 AND password = COALESCE($6, password) RETURNING email, data',
			[data && JSON.stringify(data), email, newPasswordHash, name, user_id, passwordHash]
		); // Update the fields that have changed, use previous values where not.
	}
};
