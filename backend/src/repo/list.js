module.exports = async function(req, res) {
	const [error, { user_id }] = await guardPostWithSession(req);
	if (error) return error;
	await DB.queryTo(
		res,
		`SELECT 
            r.name AS name, 
            u.name AS owner, 
            r.processing, 
            r.created_time, 
            r.updated_time, 
            r.url, 
            r.data, 
            to_jsonb(array(
                SELECT jsonb_build_array(b.name, commit_count) 
                FROM branches b WHERE b.repo_id = r.id
            )) as branches 
        FROM repos r, users u WHERE r.user_id = $1 AND u.id = r.user_id`,
		[user_id]
	);
};
