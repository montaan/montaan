const { Path, Exec, assertRepoDir } = require('./lib');

module.exports = async function(req, res) {
	var [error, { repo }] = assertShape(
		{
			repo: isString,
		},
		await bodyAsJson(req)
	);
	if (error) return error;
	var [error, { filePath }] = assertRepoDir(Path.join(repo, 'repo'));
	if (error) return error;
	await new Promise(async (resolve, reject) => {
		Exec(`cd ${filePath} && git branch -a`, { maxBuffer: 100000000 }, async function(
			error,
			stdout,
			stderr
		) {
			if (error) reject(error);
			const lines = stdout.split('\n');
			lines.pop();
			const cleanedUpLines = lines.map((l) =>
				l
					.slice(2)
					.replace(/ -> .*/, '')
					.replace(/^remotes\//, '')
			);
			await res.json(cleanedUpLines);
			resolve();
		});
	});
};
