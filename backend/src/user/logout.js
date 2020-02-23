module.exports = async function(req, res) {
	var [error, session] = await guardPostWithSession(req);
	if (error) return error;
	var [error, json] = assertShape({ session: isMaybe(isStrlen(36, 36)) }, await bodyAsJson(req));
	if (error) return error;
	const sessionRef = json.session || session.ref;
	if (!(await sessionDelete(sessionRef, session.user_id))) return '404: Session not found';
	if (sessionRef === session.ref) {
		const secure = req.CORSRequest ? '' : 'Secure; SameSite=strict; ';
		res.setHeader('Set-Cookie', [
			`session=; Path=/_/; ${secure}expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly`,
		]);
	}
	res.json({ deleted: 1 });
};
