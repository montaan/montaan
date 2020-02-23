const { Mailer } = require('./lib');

module.exports = async function(req, res) {
	if (req.method !== 'POST') return '405: Only POST accepted';
	const [error, { email }] = assertShape({ email: isEmail }, await bodyAsJson(req));
	if (error) return error;
	const {
		rows: [user],
	} = await DB.query('SELECT id FROM users WHERE email = $1', [email]);
	if (!user) return '404: User not found';
	const {
		rows: [userAct],
	} = await DB.query(
		'UPDATE users SET activation_token = gen_random_uuid() WHERE id = $1 RETURNING activation_token, email',
		[user.id]
	);
	await Mailer.sendAuthenticationEmail(userAct.email, userAct.activation_token);
	res.json({ sent: 1 });
};
