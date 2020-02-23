const { bcrypt, saltRounds, validatePassword } = require('./lib');

module.exports = async function(req, res) {
	if (req.method !== 'POST') return '405: Only POST accepted';
	const [error, { email, recoveryToken, password, rememberme }] = assertShape(
		{
			email: isEmail,
			recoveryToken: isStrlen(36, 36),
			password: validatePassword,
			rememberme: isMaybe(isBoolean),
		},
		await bodyAsJson(req)
	);
	if (error) return error;
	const {
		rows: [user],
	} = await DB.query('SELECT id FROM users WHERE email = $1 AND activation_token = $2', [
		email,
		recoveryToken,
	]);
	if (!user) return '401: Invalid recoveryToken';

	const passwordHash = await bcrypt.hash(password, saltRounds);
	await DB.query(
		'UPDATE users SET password = $2, activation_token = gen_random_uuid() WHERE id = $1',
		[user.id, passwordHash]
	);

	const session = await sessionCreate(user.id);

	const secure = req.CORSRequest ? '' : 'Secure; SameSite=strict; ';
	const expiry = rememberme ? 'Max-Age=2602000; ' : '';
	res.setHeader('Set-Cookie', [`session=${session.id}; ${expiry}Path=/_/; ${secure}HttpOnly`]);
	res.json({ session: true, csrf: session.csrf });
};
