module.exports = async function(req, res) {
	var [error, { user_id }] = await guardPostWithSession(req);
	if (error) return error;
	var [error, { id }] = assertShape({ id: isStrlen(36, 36) }, await bodyAsJson(req));
	if (error) return error;
	await DB.queryTo(res, 'UPDATE repos SET deleted = TRUE WHERE id = $1 AND user_id = $2', [
		id,
		user_id,
	]);
};
