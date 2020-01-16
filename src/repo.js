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
        var [error, json] = assertShape(repoDataShape, await bodyAsJson(req)); if (error) return error;
        const {url, name} = json;
        const dbRes = await DB.query('SELECT name FROM users WHERE id = $1', [user_id]);
        const userName = dbRes.rows[0].name;
        if (url) Exec(`${process.cwd()}/bin/process_tree '${url}' '${userName}/${name}'`);
        else Exec(`TEMP=$(mktemp -d) ((cd "$TEMP" && git init) && ${process.cwd()}/bin/process_tree "$TEMP" '${userName}/${name}'; rm -r "$TEMP")`);
        await DB.queryTo(res, `INSERT INTO repos (url, name, user_id) VALUES ($1, $2, $3) RETURNING id`, [url, name, user_id]);
    },

    list: async function(req, res) {
        var [error, { user_id }] = await guardPostWithSession(req); if (error) return error;
        await DB.queryTo(res, `SELECT * FROM repos WHERE user_id = $1`, [user_id]);
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