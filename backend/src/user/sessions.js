module.exports = async function(req, res) {
	const { user_id } = await guardGetWithSession(req);
	const sessions = await sessionList(user_id);
	res.json(sessions);
};
