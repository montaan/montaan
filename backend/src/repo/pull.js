const { Exec, repoDataShape, escapeArg } = require('./lib');

module.exports = async function(req, res) {
	var [error, { user_id }] = await guardPostWithSession(req);
	if (error) return error;
	var [error, { url, name }] = assertShape(repoDataShape, await bodyAsJson(req));
	if (error) return error;
	const {
		rows,
	} = await DB.query(
		`SELECT r.id, r.url, u.name as userName FROM repos r, users u WHERE u.id = $1 AND r.user_id = $1 AND r.name = $2`,
		[user_id, name]
	);
	if (rows.length === 0) return '404: Repo not found';
	const repoData = rows[0];
	await DB.queryTo(res, 'UPDATE repos SET processing = true WHERE id = $1', [repoData.id]);
	const repoCreated = async function(error, stdout, stderr) {
		try {
			const log = 'error:\n' + error + '\nSTDOUT:\n' + stdout + '\nSTDERR:\n' + stderr;
			const dbRes = await DB.query(
				'UPDATE repos SET processing = false, processing_log = $3 WHERE name = $1 AND user_id = $2',
				[name, user_id, log]
			);
		} catch (err) {
			console.log('repos/pull', 'repoCreated', err);
		}
	};
	try {
		if (url)
			Exec(
				`${escapeArg(process.cwd())}/bin/process_tree ${escapeArg(url)} ${escapeArg(
					repoData.userName
				)}/${escapeArg(name)} 2>&1`,
				repoCreated
			);
		else
			Exec(
				`${escapeArg(process.cwd())}/bin/process_tree ${escapeArg(
					repoData.url
				)} ${escapeArg(repoData.userName)}/${escapeArg(name)} 2>&1`,
				repoCreated
			);
	} catch (err) {
		console.error('repos/pull', err);
	}
};
