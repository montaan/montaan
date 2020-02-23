const FS = require('fs');
const Path = require('path');
const ChildProcess = require('child_process');
const Exec = ChildProcess.exec;
const Mime = require('mime-types');

const repoDataShape = {
	url: isMaybe(isURL),
	name: isRegExp(/^[a-zA-Z0-9._-]+$/),
};

function assertRepoFile(fsPath) {
	const filePath = Path.resolve('repos', fsPath);
	const reposPath = Path.resolve('repos');
	if (!filePath.startsWith(reposPath + '/')) return ['403: Access Denied', {}];
	if (!FS.existsSync(filePath)) return ['404: File Not Found', {}];
	const stat = FS.statSync(filePath);
	if (!stat.isFile()) return ['403: Access Denied', {}];
	return [null, { filePath, stat }];
}

function assertRepoDir(fsPath) {
	const filePath = Path.resolve('repos', fsPath);
	const reposPath = Path.resolve('repos');
	if (!filePath.startsWith(reposPath + '/')) return ['403: Access Denied', {}];
	if (!FS.existsSync(filePath)) return ['404: File Not Found', {}];
	const stat = FS.statSync(filePath);
	if (!stat.isDirectory()) return ['403: Access Denied', {}];
	return [null, { filePath, stat }];
}

module.exports = {
	FS,
	Path,
	ChildProcess,
	Exec,
	Mime,
	repoDataShape,
	assertRepoFile,
	assertRepoDir,
};
