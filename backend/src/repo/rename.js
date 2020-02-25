const { isRepoName, FS, Path } = require('./lib');

module.exports = async function(req, res) {
	var [error, { user_id }] = await guardPostWithSession(req);
	if (error) return error;
	var [error, { name, newName }] = assertShape(
		{ name: isRepoName, newName: isRepoName },
		await bodyAsJson(req)
	);
	if (error) return error;
	const dbRes = await DB.query('UPDATE repos SET name = $3 WHERE name = $1 AND user_id = $2', [
		name,
		user_id,
		newName,
	]);
	if (dbRes.rowCount > 0) {
		const nameRes = await DB.query('SELECT name FROM users WHERE id = $1', [user_id]);
		const path = Path.resolve('repos', nameRes.rows[0].name, name);
		const newPath = Path.resolve('repos', nameRes.rows[0].name, newName);
		console.log(path, newPath);
		FS.renameSync(path, newPath);
		await res.json('OK');
	}
};
