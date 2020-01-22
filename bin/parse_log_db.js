require('dotenv').config();
const fs = require('fs');
const { Client } = require('../src/lib/quickgres');
const dbConfig = {user: process.env.PGUSER, database: process.env.PGDATABASE};
const DB = new Client(dbConfig);

const config = {};

if (process.env.PGHOST || process.env.PGPORT) {
    if (process.env.PGHOST && process.env.PGHOST.startsWith('/')) {
        config.pgport = process.env.PGHOST + '/.s.PGSQL.' + (process.env.PGPORT || '5432');
    } else {
        config.pghost = process.env.PGHOST || 'localhost';
        config.pgport = process.env.PGPORT || 5432;
    }
} else {
    if (fs.existsSync('/var/run/postgresql/.s.PGSQL.5432')) {
        config.pgport = '/var/run/postgresql/.s.PGSQL.5432';
    } else if (fs.existsSync('/tmp/.s.PGSQL.5432')) {
        config.pgport = '/tmp/.s.PGSQL.5432';
    }
}

async function parseCommits(userName, repoName) {
    console.error(`Processing ${userName}/${repoName}`);

    await DB.connect(config.pgport, config.pghost);
    const {rows: [{repo_id}]} = await DB.query(`SELECT r.id as repo_id FROM repos r, users u WHERE u.name = $1 AND r.user_id = u.id AND r.name = $2`, [userName, repoName]);
    const commitsRes = await DB.query(`SELECT sha FROM commits WHERE repo_id = $1`, [repo_id]);
    var shaIdx = {};

    commitsRes.rows.forEach(r => shaIdx[r.sha] = true);

    var sha;
    var lineStart = 0;

    const commitRE = /^commit /;
    const authorRE = /^Author:/;
    const mergeRE = /^Merge:/;
    const dateRE = /^Date:/;
    const fileRE = /^[A-Z]\d*\t/;

    var lineBufs = [];
    var lineBufSize = 0;

    const commitQuery = `
        INSERT INTO commits (repo_id, sha, author, merge, date, message, files) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING
    `;
    const commitQueryValues = [repo_id];

    var head = '';

    await DB.query(`BEGIN`);

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
                    if (buf[lineStart] === 32) commitQueryValues[5] += line.substring(4) + "\n";
                    else if (fileRE.test(line)) {
                        const [action, path, renamed] = line.split("\t");
                        commitQueryValues[6].push({action, path, renamed});
                    } else if (commitRE.test(line)) {
                        if (sha) {
                            commitQueryValues[6] = JSON.stringify(commitQueryValues[6]);
                            process.stderr.write('\r' + (++commitIdx) + '\t');
                            DB.query(commitQuery, commitQueryValues);
                        }
                        sha = line.substring(7);
                        if (!head) head = sha;
                        if (shaIdx[sha]) {
                            console.error("Early exit at "+sha);
                            sha = null;
                            done();
                            instream.pause();
                            instream.close();
                            return;
                        }
                        commitQueryValues[1] = sha;
                        commitQueryValues[2] = commitQueryValues[3] = commitQueryValues[4] = null;
                        commitQueryValues[5] = "";
                        commitQueryValues[6] = [];
                    }
                    else if (mergeRE.test(line)) commitQueryValues[3] = line.substring(7); 
                    else if (authorRE.test(line)) commitQueryValues[2] = line.substring(8);
                    else if (dateRE.test(line)) commitQueryValues[4] = line.substring(8);
                }
                lineStart = (i+1 < block.length) ? i+1 : 0;
                if (lineBufs.length > 0) lineBufs.splice(0);
                lineBufSize = 0;
            } else {
                lineBufs.push(block);
                lineBufSize += block.length;
            }
        }
    }

    function done() {
        if (sha) {
            commitQueryValues[6] = JSON.stringify(commitQueryValues[6]);
            process.stderr.write('\r' + (++commitIdx) + '\t');
            DB.query(commitQuery, commitQueryValues);
        }
        DB.query(`
            INSERT INTO branches (repo_id, name, head, commit_count) 
            VALUES ($1, $2, $3, (SELECT count(*) FROM commits WHERE repo_id = $1))
            ON CONFLICT (repo_id, name) DO UPDATE SET commit_count = EXCLUDED.commit_count
        `, [repo_id, 'master', head]);
        console.error("\nQueries sent, waiting for COMMIT");
        DB.query(`COMMIT`).then(async () => {
            await DB.end();
            console.error("\nDone\n");
            process.exit(0);
        });
    }

    instream.on('data', parseBlock);
    instream.on('end', done);
}

const instream = fs.createReadStream('repos/' + process.argv[2] + '/' + process.argv[3] + '/log.txt');

parseCommits(process.argv[2], process.argv[3], instream);