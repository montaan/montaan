const { Path, Exec, assertRepoDir, escapeArg } = require('./lib');

module.exports = async function(req, res) {
	var [error, { repo, hash }] = assertShape(
		{ repo: isString, hash: isRegExp(/^[a-f0-9]+$/) },
		await bodyAsJson(req)
	);
	if (error) return error;
	var [error, { filePath }] = assertRepoDir(Path.join(repo, 'repo'));
	if (error) return error;
	await new Promise((resolve, reject) => {
		Exec(
			`cd ${escapeArg(filePath)} && git show --pretty=format:%b ${escapeArg(hash)}`,
			{ maxBuffer: 100000000 },
			async function(error, stdout, stderr) {
				if (error) reject(error);
				res.writeHeader(200, { 'Content-Type': 'text/plain' });
				await res.end(stdout || '');
				resolve();
			}
		);
	});
};
