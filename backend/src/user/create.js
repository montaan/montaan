const {
	Mailer,
	bcrypt,
	saltRounds,
	validateEmail,
	validatePassword,
	validateName,
} = require('./lib');

module.exports = async function(req, res) {
	if (req.method !== 'POST') return '405: Only POST accepted';
	const [error, { email, password, name }] = assertShape(
		{
			email: validateEmail,
			password: validatePassword,
			name: isRegExp(/^[a-zA-Z0-9_-]{3,24}$/),
		},
		await bodyAsJson(req)
	);
	if (error) return error;

	let uniqueName = name
		.toString()
		.toLowerCase()
		.replace(/^(repo|activate|user|login|logout)$/, '$1_');
	if (uniqueName.length === 0)
		uniqueName =
			'user-' +
			Math.random()
				.toString()
				.slice(2);
	if (!validateName(uniqueName)) return '400: Invalid name';

	const passwordHash = await bcrypt.hash(password, saltRounds);
	let uniqueNameIndex = 0;

	const nameRes = DB.query(
		`
            SELECT name FROM users WHERE name ~ $1
            ORDER BY COALESCE(substring(name from '\\d+$'), '0')::int DESC
            LIMIT 1
        `,
		[`^${name.replace(/\./g, '\\.')}\.\d+$`]
	);
	if (nameRes.rowCount > 0)
		uniqueNameIndex = (parseInt(nameRes.rows[0].name.split('.').pop()) || 0) + 1;

	await DB.query('BEGIN');
	while (true) {
		try {
			const {
				rows: [user],
			} = await DB.query(
				'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING email, name, activation_token',
				[email, passwordHash, uniqueName]
			);
			try {
				await Mailer.sendActivationEmail(user.email, user.activation_token);
			} catch (e) {
				await DB.query('ROLLBACK');
				return '500: Failed to send activation email';
			}
			await DB.query('COMMIT');
			res.json({ email: user.email, name: user.name });
			return;
		} catch (e) {
			uniqueNameIndex++;
			uniqueName = name + '.' + uniqueNameIndex;
			const { rowCount } = await client.query('SELECT FROM users WHERE email = $1', [email]);
			if (rowCount > 0) return '400: Email address already registered';
		}
	}
};
