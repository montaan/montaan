const { Path, Exec, assertRepoDir, escapeArg } = require('./lib');

module.exports = async function(req, res) {
	var [error, { repo, path, hash }] = assertShape(
		{ repo: isString, path: isString, hash: isRegExp(/^[a-zA-Z0-9._/-]+$/) },
		await bodyAsJson(req)
	);
	if (error) return error;
	var [error, { filePath }] = assertRepoDir(Path.join(repo, 'repo'));
	if (error) return error;
	await new Promise((resolve, reject) => {
		Exec(
			`cd ${escapeArg(filePath)} && git show ${escapeArg(hash)}:${escapeArg(path)}`,
			{ maxBuffer: 100000000 },
			async function(error, stdout, stderr) {
				if (error) reject(error);
				res.writeHeader(200, { 'Content-Type': 'application/octet-stream' });
				await res.end(stdout || '');
				resolve();
			}
		);
	});
};
