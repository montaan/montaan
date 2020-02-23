const fs = require('./fs');

module.exports = async function(req, res, fsPath) {
	const repoFilePath = decodeURIComponent(fsPath).replace(/^([^\/]+\/[^\/]+\/)/, '$1repo/');
	return fs(req, res, repoFilePath);
};
