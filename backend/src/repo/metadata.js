/*
    Get file metadata (e.g. image dimensions, document page count.)
    Extracted with a metadata extraction tool, cached in the database.
*/

const { Path, Exec, assertRepoDir, escapeArg, FS } = require('./lib');
const promisify = require('util').promisify;
const { spawn } = require('child_process');

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

async function extractMetadataAndInsertToDB(repo, hash) {
	const repoPath = Path.join(repo, 'repo');
    const blob = await readBlob(repoPath, hash);
    const pdfInfo = spawn(`pdfinfo`, ['/dev/stdin']);
    const buffers = [];
    return new Promise((resolve, reject) => {
        pdfInfo.stdout.on('data', (data) => buffers.push(data));
        pdfInfo.stderr.on('data', (data) => console.error(`pdfInfo stderr: ${data}`));
        pdfInfo.on('close', (code) => {
            if (code !== 0) {
                console.log(`pdfinfo process exited with code ${code}`);
            }
            const metadata = { pages: 0 };
            const pagesMatch = Buffer.concat(buffers).toString().match(/^Pages:\s*(\d+)/m);
            if (pagesMatch) {
                metadata.pages = parseInt(pagesMatch[1]);
            }
            const metadataString = JSON.stringify(metadata);
            await DB.exec(`INSERT INTO files (hash, metadata) VALUES ($1, $2) ON CONFLICT files(hash) UPDATE metadata = $2`, [hash, metadataString]);
            resolve({hash, metadata: metadataString});
        });
    });
}

module.exports = async function(req, res) {
	var [error, { repo, hashes }] = assertShape(
		{
			repo: isString,
			hashes: isArray(isRegExp(/^[a-f0-9]{40}$/)),
		},
		await bodyAsJson(req)
	);
	if (error) return error;
	var [error, { filePath }] = assertRepoDir(repo);
	if (error) return error;
    const metadataArray = [];
    const res = await DB.query(`SELECT hash, metadata FROM files WHERE hash = ANY(string_to_array($1, ' '))`, [hashes.join(" ")]);
    const foundHashes = new Set();
    for (let i = 0; i < res.rows.length; i++) {
        const obj = {hash: res.rows[i].hash, metadata: res.rows[i].metadata};
        metadataArray.push(obj);
        foundHashes.set(obj.hash);
    }
    for (let i = 0; i < hashes.length; i++) {
        if (!foundHashes.has(hashes[i])) {
            metadataArray.push(await extractMetadataAndInsertToDB(filePath, hashes[i]));
        }
    }
	await res.json(metadataArray);
};
