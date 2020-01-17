function getIndex(list, index, elem) {
    if (elem === undefined) return undefined;

    var idx = index[elem];
    if (idx === undefined) {
        idx = index[elem] = list.length;
        list.push(elem);
    }
    return idx;
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

    outstream.write('{"commits":[');

    var lineBufs = [];
    var lineBufSize = 0;

    var lineNum = 0;

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
                        }
                        sha = line.substring(7);
                        author = date = message = undefined;
                        files = [];
                    }
                    else if (authorRE.test(line)) author = getIndex(authors, authorsIndex, line.substring(8));
                    else if (author !== undefined && date === undefined) date = new Date(line.substring(6)).getTime();
                    else if (author !== undefined && date !== undefined) {
                        if (buf[lineStart] === 32) {
                            if (message === undefined) message = line.substring(4);
                        } else {
                            const fileObj = line.split("\t");
                            fileObj[1] = getIndex(allFiles, allFilesIndex, fileObj[1]);
                            if (fileObj.length > 2) fileObj[2] = getIndex(allFiles, allFilesIndex, fileObj[2]);
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
        outstream.write(`],"authors":${JSON.stringify(authors)},"files":${JSON.stringify(allFiles)}}`);
        outstream.end();
    });
}

parseCommits(process.stdin, process.stdout);