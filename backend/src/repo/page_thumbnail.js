const { Path, Exec, assertRepoDir, escapeArg, FS } = require('./lib');
const sharp = require('sharp');
const promisify = require('util').promisify;
const tmp = require('tmp');

const readFile = promisify(FS.readFile);
const mkdir = promisify(FS.mkdir);
const exists = promisify(FS.exists);
const unlink = promisify(FS.unlink);

const PDFImage = require('pdf-image').PDFImage;

async function readBlob(repoPath, hash) {
	return new Promise(function(resolve, reject) {
		Exec(
			`cd ${escapeArg(repoPath)} && git cat-file blob ${escapeArg(hash)}`,
			{ maxBuffer: 100000000, encoding: 'buffer' },
			function(error, stdout, stderr) {
				if (error) reject(error);
				resolve(stdout);
			}
		);
	});
}

async function createPDFThumbnail(repo, hash, page, targetZ) {
	const repoPath = Path.join(repo, 'repo');
	const thumbnailsPath = Path.join(repo, 'thumbnails');
	const hashDir = `${hash.slice(0, 2)}/${hash.slice(2, 4)}`;
	const hashSuffix = `${hashDir}/${hash.slice(4)}-pages/${page}`;
	const blob = await readBlob(repoPath, hash);

	return new Promise(async (resolve, reject) => {
		tmp.file({ postfix: '.pdf' }, async function(err, path, fd, cleanupCallback) {
			if (err) throw err;
			const blobPath = path;
			const pdfImage = new PDFImage(blobPath, {
				convertOptions: { '-resize': '2048x2048' },
			});
			const imagePath = await pdfImage.convertPage(page);
			await unlink(blobPath);
			const image = sharp(imagePath);
			const metadata = await image.metadata();
			for (let z = 12; z >= 0; z--) {
				await mkdir(Path.join(thumbnailsPath, z.toString(), hashDir), { recursive: true });
				await image
					.resize(Math.pow(2, z), Math.pow(2, z), {
						fit: 'contain',
						background: { r: 0, g: 0, b: 0, alpha: 0 },
					})
					.webp()
					.toFile(Path.join(thumbnailsPath, z.toString(), hashSuffix));
			}
			await unlink(imagePath);
			cleanupCallback();
			resolve();
		});
	});
}

module.exports = async function(req, res) {
	var [error, { repo, thumbnails }] = assertShape(
		{
			repo: isString,
			thumbnails: isArray(
				isShape({
					z: (z) => isNumber(z) && z >= 0 && z <= 12,
					hash: isRegExp(/^[a-f0-9]{40}$/),
					page: (page) => isNumber(page) && page >= 0,
				})
			),
		},
		await bodyAsJson(req)
	);
	if (error) return error;
	var [error, { filePath }] = assertRepoDir(repo);
	if (error) return error;
	const buffers = [];
	for (let i = 0; i < thumbnails.length; i++) {
		const z = thumbnails[i].z;
		const hash = thumbnails[i].hash;
		const thumbnailPath = Path.join(
			filePath,
			'thumbnails',
			z.toString(),
			hash.slice(0, 2),
			hash.slice(2, 4),
			hash.slice(4) + '-pages',
			page
		);
		if (!(await exists(thumbnailPath))) {
			var error = await createPDFThumbnail(filePath, hash, page, z);
			if (error) return error;
		}
		const thumbnailBuffer = await readFile(thumbnailPath);
		const header = new Buffer(8);
		header.writeUInt32LE(thumbnailBuffer.length + 48, 0);
		header.writeUInt32LE(z, 4);
		buffers.push(header);
		buffers.push(new Buffer(hash));
		buffers.push(thumbnailBuffer);
	}
	res.writeHeader(200, {
		'Content-Type': 'application/octet-stream',
	});
	await res.end(Buffer.concat(buffers));
};
