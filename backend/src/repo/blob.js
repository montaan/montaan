const { Path, Exec, assertRepoDir, escapeArg } = require('./lib');

module.exports = async function(req, res) {
	var [error, { repo, hash }] = assertShape(
		{ repo: isString, hash: isRegExp(/^[a-zA-Z0-9._/-]+$/) },
		await bodyAsJson(req)
	);
	if (error) return error;
	var [error, { filePath }] = assertRepoDir(Path.join(repo, 'repo'));
	if (error) return error;
	await new Promise((resolve, reject) => {
		Exec(
			`cd ${escapeArg(filePath)} && git cat-file blob ${escapeArg(hash)}`,
			{ maxBuffer: 100000000, encoding: 'buffer' },
			async function(error, stdout, stderr) {
				if (error) reject(error);
				res.writeHeader(200, {
					'Content-Type': 'application/octet-stream',
					Expires: new Date(Date.now() + 2592000000).toUTCString(),
				});
				await res.end(stdout || '');
				resolve();
			}
		);
	});
};
