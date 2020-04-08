const { writeFileSync } = require('fs');

function getIndex(list, index, elem) {
	if (elem === undefined) return undefined;

	let idx = index[elem];
	if (idx === undefined) {
		idx = index[elem] = list.length;
		list.push(elem);
	}
	return idx;
}

function addElem(index, key, elem) {
	let arr = index[key];
	if (!arr) arr = index[key] = [];
	arr.push(elem);
}

function addElemSet(index, key, elem, excludeIndex) {
	if (!excludeIndex[key]) excludeIndex[key] = {};
	if (!excludeIndex[key][elem]) {
		excludeIndex[key][elem] = true;
		addElem(index, key, elem);
	}
}

function addDate(index, date, elem) {
	const year = date.getUTCFullYear();
	const month = date.getUTCMonth() + 1;
	const day = date.getUTCDate();
	let yo = index[year];
	if (!yo) yo = index[year] = {};
	let mo = yo[month];
	if (!mo) mo = yo[month] = {};
	let dayo = mo[day];
	if (!dayo) dayo = mo[day] = [];
	dayo.push(elem);
}

function parseCommits(instream, outstream) {
	let sha,
		author,
		message,
		date,
		files = [];
	let lineStart = 0;

	const commitRE = /^commit /;
	const authorRE = /^Author:/;
	let commitSep = '\n';
	const nextCommitSep = '\n,';

	const authors = [];
	const authorsIndex = {};

	const allFiles = [];
	const allFilesIndex = {};

	const authorCommits = {};
	const authorFiles = {};
	const authorFilesExclude = {};
	const fileCommits = {};
	const fileAuthors = {};
	const fileAuthorsExclude = {};
	const dateCommits = {};

	outstream.write('{"commits":[');

	const lineBufs = [];
	let lineBufSize = 0;

	let lineNum = 0;
	let commitIdx = 0;
	let commitBlock = [];
	let commitBlockCount = 0;

	function parseBlock(block) {
		for (let i = 0; i < block.length; ++i) {
			while (block[i] !== 10 && i < block.length) ++i;
			if (i < block.length) {
				if (lineBufSize + i > lineStart) {
					let buf = block;
					if (lineBufs.length > 0) {
						lineBufs.push(block);
						buf = Buffer.concat(lineBufs);
					}
					const line = buf.slice(lineStart, lineBufSize + i).toString();
					if (commitRE.test(line)) {
						if (sha) {
							const commit = [sha, author, message, date, files];
							outstream.write(commitSep + JSON.stringify(commit));
							commitBlock.push(commit);
							if (commitBlock.length === 1000) {
								writeFileSync(
									`../log_${commitBlockCount++}.json`,
									JSON.stringify(commitBlock)
								);
								commitBlock = [];
							}
							commitSep = nextCommitSep;
							commitIdx++;
						}
						sha = line.substring(7);
						author = date = message = undefined;
						files = [];
					} else if (authorRE.test(line)) {
						author = getIndex(authors, authorsIndex, line.substring(8));
						addElem(authorCommits, author, commitIdx);
					} else if (author !== undefined && date === undefined) {
						const dateObj = new Date(line.substring(6));
						date = dateObj.getTime();
						addDate(dateCommits, dateObj, commitIdx);
					} else if (author !== undefined && date !== undefined) {
						if (buf[lineStart] === 32) {
							if (message === undefined) message = line.substring(4);
						} else {
							const fileObj = line.split('\t');
							fileObj[1] = getIndex(allFiles, allFilesIndex, fileObj[1]);
							addElemSet(authorFiles, author, fileObj[1], authorFilesExclude);
							// addElemSet(fileAuthors, fileObj[1], author, fileAuthorsExclude);
							// addElem(fileCommits, fileObj[1], commitIdx);
							if (fileObj.length > 2) {
								fileObj[2] = getIndex(allFiles, allFilesIndex, fileObj[2]);
								addElemSet(authorFiles, author, fileObj[2], authorFilesExclude);
								// addElemSet(fileAuthors, fileObj[2], author, fileAuthorsExclude);
								// addElem(fileCommits, fileObj[2], commitIdx);
							}
							files.push(fileObj);
						}
					}
				}
				lineNum++;
				lineStart = i + 1 < block.length ? i + 1 : 0;
				if (lineBufs.length > 0) lineBufs.splice(0);
				lineBufSize = 0;
			} else {
				lineBufs.push(block);
				lineBufSize += block.length;
			}
		}
	}

	instream.on('data', parseBlock);
	instream.on('end', () => {
		if (sha) {
			const commit = [sha, author, message, date, files];
			outstream.write(commitSep + JSON.stringify(commit));
			commitBlock.push(commit);
			writeFileSync(`../log_${commitBlockCount++}.json`, JSON.stringify(commitBlock));
			commitIdx++;
		}
		const indexes = { authorFiles, authorCommits, dateCommits };
		outstream.write(
			`],"authors":${JSON.stringify(authors)},"files":${JSON.stringify(
				allFiles
			)},"indexes":${JSON.stringify(indexes)}}`
		);
		writeFileSync(
			'../log_meta.json',
			JSON.stringify({ authors, files: allFiles, indexes, commitCount: commitIdx })
		);
		outstream.end();
	});
}

parseCommits(process.stdin, process.stdout);
