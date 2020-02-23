module.exports = async function(req, res) {
	const [error, session] = await guardPostWithSession(req);
	if (error) return error;
	const { rows } = await sessionDeleteAll(session.user_id);
	const secure = req.CORSRequest ? '' : 'Secure; SameSite=strict; ';
	res.setHeader('Set-Cookie', [
		`session=; Path=/_/; ${secure}expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly`,
	]);
	res.json({ deleted: rows.length });
};
