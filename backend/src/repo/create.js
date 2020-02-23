const { Exec, repoDataShape } = require('./lib');

module.exports = async function(req, res) {
	var [error, { user_id }] = await guardPostWithSession(req);
	if (error) return error;
	var [error, { url, name }] = assertShape(repoDataShape, await bodyAsJson(req));
	if (error) return error;
	await DB.queryTo(
		res,
		`INSERT INTO repos (url, name, user_id) VALUES ($1, $2, $3) RETURNING id`,
		[url, name, user_id]
	);
	const repoCreated = async function(error, stdout, stderr) {
		try {
			const log = 'error:\n' + error + '\nSTDOUT:\n' + stdout + '\nSTDERR:\n' + stderr;
			const dbRes = await DB.query(
				'UPDATE repos SET processing = false, processing_log = $3 WHERE name = $1 AND user_id = $2',
				[name, user_id, log]
			);
		} catch (err) {
			console.log('repos/create', 'repoCreated', err);
		}
	};
	try {
		const dbRes = await DB.query('SELECT name FROM users WHERE id = $1', [user_id]);
		const userName = dbRes.rows[0].name;
		if (url)
			Exec(
				`${process.cwd()}/bin/process_tree '${url}' '${userName}/${name}' 2>&1`,
				repoCreated
			);
		else Exec(`${process.cwd()}/bin/process_tree '${userName}/${name}' 2>&1`, repoCreated);
	} catch (err) {
		console.error('repos/create', err);
	}
};
