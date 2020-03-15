const { Path, Exec, assertRepoDir } = require('./lib');

module.exports = async function(req, res) {
	var [error, { repo, path, hash }] = assertShape(
		{ repo: isString, path: isString, hash: isString },
		await bodyAsJson(req)
	);
	if (error) return error;
	if (!/^[a-f0-9A-Z]+$/.test(hash)) return '400: Malformed hash';
	var [error, { filePath }] = assertRepoDir(Path.join(repo, 'repo'));
	if (error) return error;
	await new Promise((resolve, reject) => {
		Exec(`cd ${filePath} && git show ${hash}:${path}`, { maxBuffer: 100000000 }, async function(
			error,
			stdout,
			stderr
		) {
			if (error) reject(error);
			res.writeHeader(200, { 'Content-Type': 'text/plain' });
			await res.end(stdout || '');
			resolve();
		});
	});
};
