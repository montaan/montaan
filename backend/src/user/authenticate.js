const { bcrypt } = require('./lib');

module.exports = async function(req, res) {
	if (req.method !== 'POST') return '405: Only POST accepted';
	const [error, { email, password, rememberme }] = assertShape(
		{
			email: isEmail,
			password: isStrlen(8, 72),
			rememberme: isMaybe(isBoolean),
		},
		await bodyAsJson(req)
	);
	if (error) return error;

	const {
		rows: [user],
	} = await DB.query('SELECT id, password FROM users WHERE email = $1 AND NOT deleted', [email]);
	if (!user) return '401: Email or password is wrong';

	const passwordMatch = await bcrypt.compare(password, user.password);
	if (!passwordMatch) return '401: Email or password is wrong';

	const session = await sessionCreate(user.id);

	const secure = req.CORSRequest ? '' : 'Secure; SameSite=strict; ';
	const expiry = rememberme ? 'Max-Age=2602000; ' : '';
	res.setHeader('Set-Cookie', [`session=${session.id}; ${expiry}Path=/_/; ${secure}HttpOnly`]);
	res.json({ session: true, csrf: session.csrf });
};
