// User

const Mailer = require('./lib/mailer');
const bcrypt = require('bcryptjs');
const saltRounds = 10;

const validEmail = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
function validateEmail(email) {
    return isString(email) && validEmail.test(email);
}

function validatePassword(password) {
    return isString(password) && password.length >= 8 && password.length <= 72;
}

const validName = /^[a-z0-9_\.-]{3,}$/;
function validateName(name) {
    if (name === 'repo' || name === 'login' || name === 'activate' || name === 'user' || name === 'logout') {
        return false;
    }
    return validName.test(name);
}

const User = {
    activate: async function(req, res) {
        if (req.method !== 'POST') return "405: Only POST accepted";
        const [error, { activationToken }] = assertShape({activationToken:isStrlen(36,36)}, await bodyAsJson(req)); if (error) return error;
        await DB.queryTo(res, 'UPDATE users SET activated = TRUE WHERE activation_token = $1 RETURNING TRUE', [activationToken]);
    },

    create: async function(req, res) {
        if (req.method !== 'POST') return "405: Only POST accepted";
        const [error, { email, password, name }] = assertShape({
            email: validateEmail,
            password: validatePassword,
            name: isRegExp(/^[a-zA-Z0-9_-]{3,24}$/)
        }, await bodyAsJson(req)); if (error) return error;

        let cname = name.toString().toLowerCase().replace(/^(repo|activate|user|login|logout)$/, '$1_');
        if (cname.length === 0) cname = 'user-'+Math.random().toString().slice(2);
        if (!validateName(cname)) return "400: Invalid name";

        const passwordHash = await bcrypt.hash(password, saltRounds);
        let cindex = 0;

        const nameRes = DB.query(`
            SELECT name FROM users WHERE name ~ $1
            ORDER BY COALESCE(substring(name from '\\d+$'), '0')::int DESC
            LIMIT 1
        `, [`^${name.replace(/\./g, '\\.')}\.\d+$`]);
        if (nameRes.rowCount > 0) cindex = (parseInt(nameRes.rows[0].name.split('.').pop()) || 0) + 1;

        await DB.query('BEGIN');
        while (true) {
            try {
                const { rows: [user] } = await DB.query(
                    'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING email, name, activation_token', 
                    [email, passwordHash, cname]);
                try {
                    await Mailer.sendActivationEmail(user.email, user.activation_token);
                } catch (e) {
                    await DB.query('ROLLBACK');
                    return '500: Failed to send activation email';
                }
                await DB.query('COMMIT');
                res.json({ email: user.email, name: user.name });
                return;
            } catch(e) {
                cindex++;
                cname = name + '.' + cindex; 
                const { rowCount } = await client.query('SELECT FROM users WHERE email = $1', [email]);
                if (rowCount > 0) return '400: Email address already registered';
            }
        }
    },

    authenticate: async function(req, res) {
        if (req.method !== 'POST') return "405: Only POST accepted";
        const [error, { email, password, rememberme }] = assertShape({
            email:isEmail, password:isStrlen(8,72), rememberme:isMaybe(isBoolean)
        }, await bodyAsJson(req)); if (error) return error;

        const {rows: [user]} = await DB.query('SELECT id, password FROM users WHERE email = $1 AND NOT deleted', [email]);
        if (!user) return "401: Email or password is wrong";
        
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return "401: Email or password is wrong";

        const session = await sessionCreate(user.id);
        
        const secure = (req.CORSRequest) ? '' : 'Secure; SameSite=strict; ';
        const expiry = rememberme ? 'Max-Age=2602000; ' : '';
        res.setHeader('Set-Cookie', [`session=${session.id}; ${expiry}Path=/_/; ${secure}HttpOnly`]);
        res.json({session: true, csrf: session.csrf});
    },

    recover: async function(req, res) {
        if (req.method !== 'POST') return "405: Only POST accepted";
        const [error, {email}] = assertShape({email:isEmail}, await bodyAsJson(req)); if (error) return error;
        const {rows: [user]} = await DB.query('SELECT id FROM users WHERE email = $1', [email]);
        if (!user) return '404: User not found';
        const {rows: [userAct]} = await DB.query(
            'UPDATE users SET activation_token = gen_random_uuid() WHERE id = $1 RETURNING activation_token, email',
            [user.id]);
        await Mailer.sendRecoveryEmail(userAct.email, userAct.activation_token);
        res.json({sent: 1});
    },

    recoverSetPassword: async function(req, res) {
        if (req.method !== 'POST') return "405: Only POST accepted";
        const [error, {email, recoveryToken, password, rememberme}] = assertShape({
            email:isEmail, recoveryToken:isStrlen(36,36), password:validatePassword, rememberme:isMaybe(isBoolean)
        }, await bodyAsJson(req)); if (error) return error;
        const {rows: [user]} = await DB.query('SELECT id FROM users WHERE email = $1 AND activation_token = $2', [email, recoveryToken]);
        if (!user) return '401: Invalid recoveryToken';

        const passwordHash = await bcrypt.hash(password, saltRounds);
        await DB.query('UPDATE users SET password = $2, activation_token = gen_random_uuid() WHERE id = $1', [user.id, passwordHash]);
        
        const session = await sessionCreate(user.id);
        
        const secure = (req.CORSRequest) ? '' : 'Secure; SameSite=strict; ';
        const expiry = rememberme ? 'Max-Age=2602000; ' : '';
        res.setHeader('Set-Cookie', [`session=${session.id}; ${expiry}Path=/_/; ${secure}HttpOnly`]);
        res.json({session: true, csrf: session.csrf});
    },

    requestAuthenticationEmail: async function(req, res) {
        if (req.method !== 'POST') return "405: Only POST accepted";
        const [error, {email}] = assertShape({email:isEmail}, await bodyAsJson(req)); if (error) return error;
        const {rows: [user]} = await DB.query('SELECT id FROM users WHERE email = $1', [email]);
        if (!user) return '404: User not found';
        const {rows: [userAct]} = await DB.query(
            'UPDATE users SET activation_token = gen_random_uuid() WHERE id = $1 RETURNING activation_token, email',
            [user.id]);
        await Mailer.sendAuthenticationEmail(userAct.email, userAct.activation_token);
        res.json({sent: 1});
    },

    authenticateFromEmail: async function(req, res) {
        if (req.method !== 'POST') return "405: Only POST accepted";
        const [error, {email, authenticationToken, rememberme}] = assertShape({
            email:isEmail, authenticationToken:isStrlen(36,36), rememberme:isMaybe(isBoolean)
        }, await bodyAsJson(req)); if (error) return error;
        const {rows: [user]} = await DB.query('SELECT id FROM users WHERE email = $1 AND activation_token = $2', [email, authenticationToken]);
        if (!user) return '401: Invalid authenticationToken';
        
        const session = await sessionCreate(user.id);
        
        const secure = (req.CORSRequest) ? '' : 'Secure; SameSite=strict; ';
        const expiry = rememberme ? 'Max-Age=2602000; ' : '';
        res.setHeader('Set-Cookie', [`session=${session.id}; ${expiry}Path=/_/; ${secure}HttpOnly`]);
        res.json({session: true, csrf: session.csrf});
    },

    sessions: async function(req, res) {
        const { user_id } = await guardGetWithSession(req);
        const sessions = await sessionList(user_id);
        res.json(sessions);
    },

    logout: async function(req, res) {
        var [error, session] = await guardPostWithSession(req); if (error) return error;
        var [error, json] = assertShape({session:isMaybe(isStrlen(36,36))}, await bodyAsJson(req)); if (error) return error;
        const sessionRef = json.session || session.ref;
        if (!(await sessionDelete(sessionRef, session.user_id))) return '404: Session not found';
        if (sessionRef === session.ref) {
            const secure = (req.CORSRequest) ? '' : 'Secure; SameSite=strict; ';
            res.setHeader('Set-Cookie', [`session=; Path=/_/; ${secure}expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly`]);
        }
        res.json({deleted: 1});
    },

    logoutAll: async function(req, res) {
        const [error, session] = await guardPostWithSession(req); if (error) return error;
        const {rows} = await sessionDeleteAll(session.user_id)
        const secure = (req.CORSRequest) ? '' : 'Secure; SameSite=strict; ';
        res.setHeader('Set-Cookie', [`session=; Path=/_/; ${secure}expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly`]);
        res.json({deleted: rows.length});
    },

    view: async function(req, res) {
        await DB.queryTo(res,
            `SELECT u.name, u.email, u.created_time, u.updated_time, u.data, s.csrf 
            FROM users u, sessions s WHERE u.id = s.user_id AND s.id = $1 AND NOT u.deleted AND NOT s.deleted AND s.created_time > current_timestamp - interval '30 days'`, 
            [req.cookies.session]);
    },

    edit: async function(req, res) {                                                                 // Edit user. POST {"name"?, "email"?, "password"?, "data"?} to /_/user/edit
        var [error, { user_id }] = await guardPostWithSession(req); if (error) return error;
        var [error, { name, email, password, newPassword, data }] = assertShape({
            name:isMaybe(isString), email:isMaybe(isEmail), 
            password:isMaybe(validatePassword), newPassword:isMaybe(validatePassword), 
            data:isMaybe(isObject)
        }, await bodyAsJson(req));  if (error) return error; // Pull out the request params from the JSON.
        if (!(name || email || newPassword)) {
            if (!data) return '400: Provide something to edit';
            await DB.queryTo(res, 'UPDATE users SET data = $1 WHERE id = $2 RETURNING email, data', [JSON.stringify(data), user_id]);
        } else {
            const passwordHash = password && await bcrypt.hash(password, saltRounds);                    
            const newPasswordHash = newPassword && await bcrypt.hash(newPassword, saltRounds);           // If you're changing your password, we need to hash it for the database.
            if (!(!newPassword || password)) return '400: Provide password to set new password';         // Require existing password when changing password.
            if (!(!email || password)) return '400: Provide password to set new email';                  // Require password when changing email address.
            await DB.queryTo(res, 'UPDATE users SET data = COALESCE($1, data), email = COALESCE($2, email), password = COALESCE($3, password), name = COALESCE($4, name) WHERE id = $5 AND password = COALESCE($6, password) RETURNING email, data', 
                [data && JSON.stringify(data), email, newPasswordHash, name, user_id, passwordHash]);    // Update the fields that have changed, use previous values where not.
        }
    }
};

module.exports = User;