const { Path, Exec, assertRepoDir, escapeArg } = require('./lib');

const listDir = (repoPath, hash, path) => {
	return new Promise((resolve, reject) => {
		Exec(
			`cd ${escapeArg(repoPath)} && git ls-tree --full-tree -l -z ${escapeArg(
				hash
			)} ${escapeArg(path)}`,
			{ maxBuffer: 100000000 },
			(error, stdout, stderr) => {
				if (error) reject(error);
				resolve(stdout);
			}
		);
	});
};

const listTree = async (repoPath, hash, path, maxCount = 10000) => {
	const results = [];
	const stack = [path];
	while (stack.length > 0 && results.length < maxCount) {
		const currentPath = stack.pop();
		const res = await listDir(repoPath, hash, currentPath);
		const files = res.split('\x00');
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			const firstSpace = file.indexOf(' ');
			if (firstSpace !== -1) {
				if (file.charCodeAt(firstSpace + 1) === 116 /* t */) {
					stack.push(path + file.slice(file.indexOf('\t') + 1) + '/');
				}
				results.push(file);
			}
		}
	}
	return results;
};

module.exports = async function(req, res) {
	var [error, { repo, hash, paths, recursive }] = assertShape(
		{
			repo: isString,
			hash: isRegExp(/^[a-zA-Z0-9._/-]+$/),
			paths: isArray(isString),
			recursive: isBoolean,
		},
		await bodyAsJson(req)
	);
	if (error) return error;
	var [error, { filePath }] = assertRepoDir(Path.join(repo, 'repo'));
	if (error) return error;
	await new Promise(async (resolve, reject) => {
		// if (recursive) {
		Exec(
			`cd ${escapeArg(filePath)} && git ls-tree --full-tree -l ${
				recursive ? '-r' : ''
			} -z ${escapeArg(hash)} ${paths.map((path) => escapeArg(path)).join(' ')}`,
			{ maxBuffer: 100000000 },
			async function(error, stdout, stderr) {
				if (error) reject(error);
				res.writeHeader(200, { 'Content-Type': 'text/plain' });
				await res.end(stdout || '');
				resolve();
			}
		);
		// } else {
		// 	let maxCount = 100;
		// 	res.writeHeader(200, { 'Content-Type': 'text/plain' });
		// 	for (let i = 0; i < paths.length; i++) {
		// 		const pathResults = await listTree(filePath, hash, paths[i], maxCount);
		// 		pathResults.push('');
		// 		res.write(pathResults.join('\x00'));
		// 		maxCount = Math.max(1, maxCount - pathResults);
		// 	}
		// 	await res.end();
		// 	resolve();
		// }
	});
};
