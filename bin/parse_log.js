function getIndex(list, index, elem) {
    if (elem === undefined) return undefined;

    var idx = index[elem];
    if (idx === undefined) {
        idx = index[elem] = list.length;
        list.push(elem);
    }
    return idx;
}

function addElem(index, key, elem) {
    var arr = index[key];
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
    const month = date.getUTCMonth()+1;
    const day = date.getUTCDate();
    var yo = index[year]; if (!yo) yo = index[year] = {};
    var mo = yo[month]; if (!mo) mo = yo[month] = {};
    var dayo = mo[day]; if (!dayo) dayo = mo[day] = [];
    dayo.push(elem);
}

function parseCommits(instream, outstream) {

    var sha, author, message, date, files = [];
    var lineStart = 0;

    const commitRE = /^commit /;
    const authorRE = /^Author:/;
    var commitSep = '\n';
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

    var lineBufs = [];
    var lineBufSize = 0;

    var lineNum = 0;
    var commitIdx = 0;

    function parseBlock(block) {
        for (var i = 0; i < block.length; ++i) {
            while (block[i] !== 10 && i < block.length) ++i;
            if (i < block.length) {
                if ((lineBufSize + i) > lineStart) {
                    var buf = block;
                    if (lineBufs.length > 0) {
                        lineBufs.push(block);
                        buf = Buffer.concat(lineBufs);
                    }
                    const line = buf.slice(lineStart, lineBufSize + i).toString();
                    if (commitRE.test(line)) {
                        if (sha) {
                            const commit = [sha, author, message, date, files];
                            outstream.write(commitSep + JSON.stringify(commit));
                            commitSep = nextCommitSep;
                            commitIdx++;
                        }
                        sha = line.substring(7);
                        author = date = message = undefined;
                        files = [];
                    }
                    else if (authorRE.test(line)) {
                        author = getIndex(authors, authorsIndex, line.substring(8));
                        addElem(authorCommits, author, commitIdx);
                    }
                    else if (author !== undefined && date === undefined) {
                        const dateObj = new Date(line.substring(6));
                        date = dateObj.getTime();
                        addDate(dateCommits, dateObj, commitIdx);
                    } else if (author !== undefined && date !== undefined) {
                        if (buf[lineStart] === 32) {
                            if (message === undefined) message = line.substring(4);
                        } else {
                            const fileObj = line.split("\t");
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
                lineStart = (i+1 < block.length) ? i+1 : 0;
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
        }
        const indexes = {authorFiles, authorCommits, dateCommits};
        outstream.write(`],"authors":${JSON.stringify(authors)},"files":${JSON.stringify(allFiles)},"indexes":${JSON.stringify(indexes)}}`);
        outstream.end();
    });
}

parseCommits(process.stdin, process.stdout);