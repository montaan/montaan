module.exports = async function(req, res) {
	await DB.queryTo(
		res,
		`SELECT u.name, u.email, u.created_time, u.updated_time, u.data, s.csrf 
            FROM users u, sessions s WHERE u.id = s.user_id AND s.id = $1 AND NOT u.deleted AND NOT s.deleted AND s.created_time > current_timestamp - interval '30 days'`,
		[req.cookies.session]
	);
};
