const { FS, Mime, assertRepoFile } = require('./lib');

module.exports = async function(req, res, fsPath) {
	const [error, { filePath, stat }] = assertRepoFile(decodeURIComponent(fsPath));
	if (error) return error;
	res.writeHeader(200, {
		'Content-Type': Mime.lookup(filePath) || 'text/plain',
		'Content-Length': stat.size,
	});
	const stream = FS.createReadStream(filePath);
	stream.on('open', () => stream.pipe(res));
	await new Promise((resolve, reject) => {
		stream.on('close', resolve);
		stream.on('error', reject);
	});
};
