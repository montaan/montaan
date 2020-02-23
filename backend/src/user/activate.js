module.exports = async function(req, res) {
	if (req.method !== 'POST') return '405: Only POST accepted';
	const [error, { activationToken }] = assertShape(
		{ activationToken: isStrlen(36, 36) },
		await bodyAsJson(req)
	);
	if (error) return error;
	await DB.queryTo(
		res,
		'UPDATE users SET activated = TRUE WHERE activation_token = $1 RETURNING TRUE',
		[activationToken]
	);
};
