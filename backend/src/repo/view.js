module.exports = async function(req, res, repoPath) {
	const session = await sessionGet(req);
	const [userName, repoName] = repoPath.split('/');
	if (!userName || !repoName) return '404: Repo not found';
	if (session) {
		const user_id = session.user_id;
		await DB.queryTo(
			res,
			`
                SELECT r.name AS name, u.name AS owner, r.processing, r.created_time, r.updated_time, r.url, r.data FROM repos r, users u 
                WHERE r.user_id = u.id AND u.name = $1 AND r.name = $2 AND (NOT r.private OR r.user_id = $3)
            `,
			[userName, repoName, user_id]
		);
	} else {
		await DB.queryTo(
			res,
			`
                SELECT r.name AS name, u.name AS owner, r.processing, r.created_time, r.updated_time, r.url, r.data FROM repos r, users u 
                WHERE r.user_id = u.id AND u.name = $1 AND r.name = $2 AND NOT r.private
            `,
			[userName, repoName]
		);
	}
};
