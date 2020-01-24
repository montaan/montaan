// Repos
const FS = require('fs');
const Path = require('path');
const ChildProcess = require('child_process');
const Exec = ChildProcess.exec;
const Mime = require('mime-types');

const repoDataShape = {
    url: isMaybe(isURL), 
    name: isRegExp(/^[a-zA-Z0-9_-]+$/)
};

function assertRepoFile(fsPath) {
    const filePath = Path.resolve('repos', fsPath);
    const reposPath = Path.resolve('repos');
    if (!filePath.startsWith(reposPath+'/')) return ['403: Access Denied', {}];
    if (!FS.existsSync(filePath)) return ['404: File Not Found', {}];
    const stat = FS.statSync(filePath);
    if (!stat.isFile()) return ['403: Access Denied', {}];
    return [null, {filePath, stat}];
}

function assertRepoDir(fsPath) {
    const filePath = Path.resolve('repos', fsPath);
    const reposPath = Path.resolve('repos');
    if (!filePath.startsWith(reposPath+'/')) return ['403: Access Denied', {}];
    if (!FS.existsSync(filePath)) return ['404: File Not Found', {}];
    const stat = FS.statSync(filePath);
    if (!stat.isDirectory()) return ['403: Access Denied', {}];
    return [null, {filePath, stat}];
}

const Repos = {
    create: async function(req, res) {
        var [error, { user_id }] = await guardPostWithSession(req); if (error) return error;
        var [error, { url, name }] = assertShape(repoDataShape, await bodyAsJson(req)); if (error) return error;
        await DB.queryTo(res, `INSERT INTO repos (url, name, user_id) VALUES ($1, $2, $3) RETURNING id`, [url, name, user_id]);
        const repoCreated = async function(error, stdout, stderr) {
            try {
                const log = "error:\n" + error + "\nSTDOUT:\n" + stdout + "\nSTDERR:\n" + stderr;
                const dbRes = await DB.query('UPDATE repos SET processing = false, processing_log = $3 WHERE name = $1 AND user_id = $2', [name, user_id, log]);
            } catch(err) { console.log("repos/create", "repoCreated", err); }
        };
        try {
            const dbRes = await DB.query('SELECT name FROM users WHERE id = $1', [user_id]);
            const userName = dbRes.rows[0].name;
            if (url) Exec(`${process.cwd()}/bin/process_tree '${url}' '${userName}/${name}' 2>&1`, repoCreated);
            else Exec(`${process.cwd()}/bin/process_tree '${userName}/${name}' 2>&1`, repoCreated);
        } catch(err) { console.error("repos/create", err); }
    },

    pull: async function(req, res) {
        var [error, { user_id }] = await guardPostWithSession(req); if (error) return error;
        var [error, { url, name }] = assertShape(repoDataShape, await bodyAsJson(req)); if (error) return error;
        const {rows} = await DB.query(`SELECT r.id, r.url, u.name as userName FROM repos r, users u WHERE u.id = $1 AND r.user_id = $1 AND r.name = $2`, [user_id, name]);
        if (rows.length === 0) return "404: Repo not found";
        const repoData = rows[0];
        await DB.queryTo(res, 'UPDATE repos SET processing = true WHERE id = $1', [repoData.id]);
        const repoCreated = async function(error, stdout, stderr) {
            try {
                const log = "error:\n" + error + "\nSTDOUT:\n" + stdout + "\nSTDERR:\n" + stderr;
                const dbRes = await DB.query('UPDATE repos SET processing = false, processing_log = $3 WHERE name = $1 AND user_id = $2', [name, user_id, log]);
            } catch(err) { console.log("repos/pull", "repoCreated", err); }
        };
        try {
            if (url) Exec(`${process.cwd()}/bin/process_tree '${url}' '${repoData.userName}/${name}' 2>&1`, repoCreated);
            else Exec(`${process.cwd()}/bin/process_tree '${repoData.url}' '${repoData.userName}/${name}' 2>&1`, repoCreated);
        } catch(err) { console.error("repos/pull", err); }
    },

    list: async function(req, res) {
        var [error, { user_id }] = await guardPostWithSession(req); if (error) return error;
        await DB.queryTo(res, `SELECT r.name AS name, u.name AS owner, r.processing, r.created_time, r.updated_time, r.url, r.data, (SELECT b.commit_count FROM branches b WHERE b.repo_id = r.id) FROM repos r, users u WHERE r.user_id = $1 AND u.id = r.user_id`, [user_id]);
    },

    view: async function(req, res, repoPath) {
        var session = await sessionGet(req);
        const [userName, repoName] = repoPath.split("/");
        if (!userName || !repoName) return "404: Repo not found";
        if (session) {
            const user_id = session.user_id;
            await DB.queryTo(res, `
                SELECT r.name AS name, u.name AS owner, r.processing, r.created_time, r.updated_time, r.url, r.data FROM repos r, users u 
                WHERE r.user_id = u.id AND u.name = $1 AND r.name = $2 AND (NOT r.private OR r.user_id = $3)
            `, [userName, repoName, user_id]);
        } else {
            await DB.queryTo(res, `
                SELECT r.name AS name, u.name AS owner, r.processing, r.created_time, r.updated_time, r.url, r.data FROM repos r, users u 
                WHERE r.user_id = u.id AND u.name = $1 AND r.name = $2 AND NOT r.private
            `, [userName, repoName]);
        }
    },


    delete: async function(req, res) {
        var [error, { user_id }] = await guardPostWithSession(req); if (error) return error;
        var [error, { id }] = assertShape({id:isStrlen(36,36)}, await bodyAsJson(req)); if (error) return error;
        await DB.queryTo(res, 'UPDATE repos SET deleted = TRUE WHERE id = $1 AND user_id = $2', [id, user_id]);
    },

    fs: async function(req, res, fsPath) {
        var [error, { filePath, stat }] = assertRepoFile(decodeURIComponent(fsPath)); if (error) return error;
        res.writeHeader(200, {'Content-Type': Mime.lookup(filePath) || 'text/plain', 'Content-Length': stat.size});
        const stream = FS.createReadStream(filePath);
        stream.on('open', () => stream.pipe(res));
        await new Promise((resolve, reject)  => {
            stream.on('close', resolve);
            stream.on('error', reject);
        });
    },

    tree: async function(req, res) {
        var [error, { repo, hash }] = assertShape({repo:isString, hash:isString}, await bodyAsJson(req)); if (error) return error;
        if (!/^[a-zA-Z0-9\-\_]+$/.test(hash)) return '400: Malformed hash';
        var [error, { filePath }] = assertRepoDir(Path.join(repo, 'repo')); if (error) return error;
        await new Promise((resolve, reject) => {
            Exec(`cd ${filePath} && git ls-tree --full-tree -r --name-only -z ${hash}`, {maxBuffer: 100000000}, async function(error, stdout, stderr){
                if (error) reject(error);
                res.writeHeader(200, {'Content-Type': 'text/plain'});
                await res.end(stdout || '');
                resolve();
            });
        });
    },

    file: async function(req, res, fsPath) {
        const repoFilePath = decodeURIComponent(fsPath).replace(/^([^\/]+\/[^\/]+\/)/, '$1repo/');
        return Repos.fs(req, res, repoFilePath);
    },

    search: async function(req, res) {
        var [error, { repo, query }] = assertShape({repo:isString, query:isString}, await bodyAsJson(req)); if (error) return error;
        var [error, { filePath }] = assertRepoFile(Path.join(repo, 'index.csearch')); if (error) return error;
        await new Promise((resolve, reject) => {
            Exec(`CSEARCHINDEX='${filePath}' $HOME/go/bin/csearch -i -n '${query}' | sed -E 's:^.+/repo/::'`, async function(error, stdout, stderr){
                res.writeHeader(200, {'Content-Type': 'text/plain'});
                await res.end(stdout || '');
                resolve();
            });
        });
    },

    diff: async function(req, res) {
        var [error, { repo, hash }] = assertShape({repo:isString, hash:isString}, await bodyAsJson(req)); if (error) return error;
        if (!/^[a-f0-9]+$/.test(hash)) return '400: Malformed hash';
        var [error, { filePath }] = assertRepoDir(Path.join(repo, 'repo')); if (error) return error;
        await new Promise((resolve, reject) => {
            Exec(`cd ${filePath} && git show --pretty=format:%b ${hash}`, {maxBuffer: 100000000}, async function(error, stdout, stderr){
                if (error) reject(error);
                res.writeHeader(200, {'Content-Type': 'text/plain'});
                await res.end(stdout || '');
                resolve();
            });
        });
    },

    // Returns the file in repo/path at the commit hash.
    // Useful for fetching individual file history.
    checkout: async function(req, res) {
        var [error, { repo, path, hash }] = assertShape({repo:isString, path:isString, hash:isString}, await bodyAsJson(req)); if (error) return error;
        if (!/^[a-f0-9]+$/.test(hash)) return '400: Malformed hash';
        var [error, { filePath }] = assertRepoDir(Path.join(repo, 'repo')); if (error) return error;
        await new Promise((resolve, reject) => {
            Exec(`cd ${filePath} && git show ${hash}:${path}`, {maxBuffer: 100000000}, async function(error, stdout, stderr){
                if (error) reject(error);
                res.writeHeader(200, {'Content-Type': 'text/plain'});
                await res.end(stdout || '');
                resolve();
            });
        });
    }
};

module.exports = Repos;