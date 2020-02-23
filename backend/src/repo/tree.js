const { Path, Exec, assertRepoDir } = require('./lib');

module.exports = async function(req, res) {
	var [error, { repo, hash, paths, recursive }] = assertShape(
		{ repo: isString, hash: isString, paths: isArray(isString), recursive: isBoolean },
		await bodyAsJson(req)
	);
	if (error) return error;
	if (!/^[a-zA-Z0-9\-\_]+$/.test(hash)) return '400: Malformed hash';
	var [error, { filePath }] = assertRepoDir(Path.join(repo, 'repo'));
	if (error) return error;
	await new Promise((resolve, reject) => {
		Exec(
			`cd ${filePath} && git ls-tree --full-tree -l ${
				recursive ? '-r' : ''
			} -z ${hash} ${paths.join(' ')}`,
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
