// Repos
const fs = require('fs');
const path = require('path');
const repoDataShape = { url:isStrlen(1,1024) };
const child_process = require('child_process');
const exec = child_process.exec;
const mime = require('mime-types');

function assertRepoFile(fsPath) {
    const filePath = path.resolve('repos', fsPath);
    const reposPath = path.resolve('repos');
    if (!filePath.startsWith(reposPath+'/')) return ['403: Access Denied', {}];
    if (!fs.existsSync(filePath)) return ['404: File Not Found', {}];
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return ['403: Access Denied', {}];
    return [null, {filePath, stat}];
}

function assertRepoDir(fsPath) {
    const filePath = path.resolve('repos', fsPath);
    const reposPath = path.resolve('repos');
    if (!filePath.startsWith(reposPath+'/')) return ['403: Access Denied', {}];
    if (!fs.existsSync(filePath)) return ['404: File Not Found', {}];
    const stat = fs.statSync(filePath);
    if (!stat.isDirectory()) return ['403: Access Denied', {}];
    return [null, {filePath, stat}];
}

const Repos = {
    create: async function(req, res) {
        var [error, { user_id }] = await guardPostWithSession(req); if (error) return error;
        var [error, json] = assertShape(repoDataShape, await bodyAsJson(req));
        await DB.queryTo(res, `INSERT INTO repos (data, user_id) VALUES ($1, $2) RETURNING id`, [JSON.stringify(json), user_id]);
    },

    delete: async function(req, res) {
        var [error, { user_id }] = await guardPostWithSession(req); if (error) return error;
        var [error, { id }] = assertShape({id:isStrlen(36,36)}, await bodyAsJson(req)); if (error) return error;
        await DB.queryTo(res, 'UPDATE repos SET deleted = TRUE WHERE id = $1 AND user_id = $2', [id, user_id]);
    },

    fs: async function(req, res, fsPath) {
        var [error, { filePath, stat }] = assertRepoFile(decodeURIComponent(fsPath)); if (error) return error;
        res.writeHeader(200, {'Content-Type': mime.lookup(filePath) || 'text/plain', 'Content-Length': stat.size});
        const stream = fs.createReadStream(filePath);
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
        var [error, { filePath }] = assertRepoFile(path.join(repo, 'index.csearch')); if (error) return error;
        await new Promise((resolve, reject) => {
            exec(`CSEARCHINDEX='${filePath}' $HOME/go/bin/csearch -i -n '${query}' | sed -E 's:^.+/repo/::'`, async function(error, stdout, stderr){
                res.writeHeader(200, {'Content-Type': 'text/plain'});
                await res.end(stdout || '');
                resolve();
            });
        });
    },

    diff: async function(req, res) {
        var [error, { repo, hash }] = assertShape({repo:isString, hash:isString}, await bodyAsJson(req)); if (error) return error;
        if (!/^[a-f0-9]+$/.test(hash)) return '400: Malformed hash';
        var [error, { filePath }] = assertRepoDir(path.join(repo, 'repo')); if (error) return error;
        await new Promise((resolve, reject) => {
            exec(`cd ${filePath} && git show --pretty=format:%b ${hash}`, {maxBuffer: 100000000}, async function(error, stdout, stderr){
                if (error) reject(error);
                res.writeHeader(200, {'Content-Type': 'text/plain'});
                await res.end(stdout || '');
                resolve();
            });
        });
    }

};

module.exports = Repos;