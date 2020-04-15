const { Path, Exec, assertRepoDir, escapeArg } = require('./lib');

module.exports = async function(req, res, repoAndHash) {
	const lastSlash = repoAndHash.lastIndexOf('/');
	const repo = repoAndHash.slice(0, lastSlash);
	const hash = repoAndHash.slice(lastSlash + 1);
	console.log(repoAndHash, repo, hash);
	if (!/^[a-f0-9]{40}$/.test(hash)) return '404: Hash not found';
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
