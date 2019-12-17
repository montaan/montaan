// Repos

const repoDataShape = { url:isStrlen(1,1024) };

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
    }
};

module.exports = Repos;