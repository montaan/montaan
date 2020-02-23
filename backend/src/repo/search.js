const { Path, Exec, assertRepoFile } = require('./lib');

module.exports = async function(req, res) {
	var [error, { repo, query }] = assertShape(
		{ repo: isString, query: isString },
		await bodyAsJson(req)
	);
	if (error) return error;
	var [error, { filePath }] = assertRepoFile(Path.join(repo, 'index.csearch'));
	if (error) return error;
	await new Promise((resolve, reject) => {
		Exec(
			`CSEARCHINDEX='${filePath}' $HOME/go/bin/csearch -i -n '${query}' | sed -E 's:^.+/repo/::'`,
			async function(error, stdout, stderr) {
				res.writeHeader(200, { 'Content-Type': 'text/plain' });
				await res.end(stdout || '');
				resolve();
			}
		);
	});
};
