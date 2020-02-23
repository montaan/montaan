module.exports = async function(req, res) {
	if (req.method !== 'POST') return '405: Only POST accepted';
	const [error, { email, authenticationToken, rememberme }] = assertShape(
		{
			email: isEmail,
			authenticationToken: isStrlen(36, 36),
			rememberme: isMaybe(isBoolean),
		},
		await bodyAsJson(req)
	);
	if (error) return error;
	const {
		rows: [user],
	} = await DB.query('SELECT id FROM users WHERE email = $1 AND activation_token = $2', [
		email,
		authenticationToken,
	]);
	if (!user) return '401: Invalid authenticationToken';

	const session = await sessionCreate(user.id);

	const secure = req.CORSRequest ? '' : 'Secure; SameSite=strict; ';
	const expiry = rememberme ? 'Max-Age=2602000; ' : '';
	res.setHeader('Set-Cookie', [`session=${session.id}; ${expiry}Path=/_/; ${secure}HttpOnly`]);
	res.json({ session: true, csrf: session.csrf });
};
