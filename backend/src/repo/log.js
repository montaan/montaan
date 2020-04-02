const { Path, Exec, assertRepoDir } = require('./lib');

module.exports = async function(req, res) {
	var [error, { repo, branch, start, count }] = assertShape(
		{
			repo: isString,
			branch: isRegExp(/^[a-zA-Z0-9._/-]+$/),
			start: isNumber,
			count: isNumber,
		},
		await bodyAsJson(req)
	);
	if (error) return error;
	var [error, { filePath }] = assertRepoDir(Path.join(repo, 'repo'));
	if (error) return error;
	await new Promise(async (resolve, reject) => {
		Exec(
			`cd ${filePath} && git log ${branch} | head -n 1000`,
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
