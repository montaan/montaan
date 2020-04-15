#!/usr/bin/env node
const HTTP = require('http');                                                                        // HTTP server, built-in.
const HTTP2 = require('http2');                                                                      // HTTP2 server for HTTP2 and HTTPS, built-in.
const cluster = require('cluster');                                                                  // For running a HTTP server worker per hardware thread, built-in.
const { performance } = require('perf_hooks');                                                       // For timing requests using performance.now(), built-in.
const uuidv4 = require('uuid/v4');                                                                   // UUIDv4 generates random UUIDs and doesn't have deps.
const bcrypt = require('bcryptjs');                                                                  // Bcryptjs doesn't have deps, doesn't require compiling extensions, and doesn't support unsafe memory access. 
const zlib = require('zlib');                                                                        // Compress responses, built-in.
const { Client } = require('./src/lib/quickgres');                                                             // quickgres for talking to PostgreSQL databases, no deps, 400 lines of code.
const fs = require('fs');                                                                            // Read files for file serving, built-in.
const path = require('path');                                                                        // Join file paths for file serving, built-in.
const mime = require('mime');                                                                        // File extension mimetype lookup for file serving, one dep and that's by the author.
const chokidar = require('chokidar');                                                                // fs.watch helper wrapper for updating file serving cache. Light on deps, mostly for path globbing.
const numCPUs = require('os').cpus().length;                                                         // The number of hardware threads on the system.
global.getOwnProperty = (o, p) => Object.prototype.hasOwnProperty.call(o, p) ? o[p] : undefined;      // If o hasOwnProperty p return o[p], otherwise return undefined.

// JSON shape validation
global.assertShape = function (shape, obj) {                                                          // Asserts that obj matches shape and leaves out unmatched parts.
    const result = {};
    if (typeof obj !== 'object') return [`400: Missing property`, {}];                               // If obj isn't an object, it fails to match.
    for (const n in shape) {                                                                           // Go through every property matcher in shape.
        if (typeof shape[n] === 'function') if (!shape[n](obj[n])) return [`400: Invalid property: ${n}`, {}]; // A function shape property should return true when called with the obj property.
        if (typeof shape[n] === 'object') { // Validate object property.
            const [error, res] = assertShape(shape[n], obj[n]);
            if (error) return [error + ` ${n}`, res];
            result[n] = res;
        } else result[n] = obj[n]; // Copy the validated obj property to result.
    }
    return [null, result];                                                                                   // Return a pruned validated copy of obj.
};
global.isMaybe = x => o => typeof o === 'undefined' || x(o);                                         // Create a validator that allows undefined values.
['string', 'number', 'boolean', 'object', 'function'].forEach(n => global[`is${n[0].toUpperCase() + n.slice(1)}`] = o => typeof o === n); // Is the parameter a named type?
global.isEmail = o => /@/.test(o) && o.length < 256;                                                 // Is the parameter a reasonable email address?
global.isURL = o => /^https?:\/\//.test(o) && o.length < 1024;                                       // Is the parameter a reasonable URL?
global.isStrlen = (min, max) => o => isString(o) && o.length <= max && o.length >= min;               // Create a validator that matches strings between min and max lengths (both inclusive).
global.isRegExp = (re) => o => isString(o) && re.test(o);                                            // Create a validator that matches strings matching the given RegExp.
global.isEvery = (...validators) => o => validators.every(p => p(o));                                    // Create a validator that matches all the given validators.
global.isSome = (...validators) => o => validators.some(p => p(o));                                   // Create a validator that matches some of the given validators.
global.isArray = (validator) => o => o instanceof Array && o.every(validator);                         // Test that o is an array of objects that pass the given validator.
global.isShape = shape => o => assertShape(shape, o);

const config = {
    port: 8000, root: 'public', workerCount: numCPUs / 2, saltRounds: 10, // Default config.
    pgport: '/tmp/.s.PGSQL.5432', pghost: undefined, pg: { user: process.env.USER, database: 'qframe' }, // Default database config.
    allowCORSHeaders: 'csrf', allowCORS: (origin) => /^https?:\/\/((192\.168|172\.(1[6-9]|2\d|3[01]))(\.\d{1,3}){2}|10(\.\d{1,3}){3}|localhost|.*\.local)(:\d+)?$/.test(origin), // Matches 192.168.0.0, 172.16-31.0.0, 10.0.0.0, localhost and *.local.
    logError: (req, status, error, elapsed) => { console.error(status, error); },
    ...(process.argv[2] && require(process.argv[2]) || JSON.parse(process.env.QFRAME_CONFIG || '{}'))
}; // Extend the config by requiring a config file or using the config in an env var.

global.DB = new Client(config.pg);                                                                   // Create the database connection pool.

// Migrations
const migrations = config.replaceMigrations || [{                                                    // Initialize the database either with config.replaceMigrations or the default tables.
    name: 'Initial tables',                                                                      // Each migration has a name, this is used in logging and for migrating the database to a wanted migration.
    up: [`CREATE EXTENSION IF NOT EXISTS "pgcrypto";             -- Load up pgcrypto for gen_random_uuid(). It's also nice for using crypt() and gen_salt().
            `, `CREATE TABLE users (                                   -- Users have a name, email and a password. They also have a grab-bag data field full of JSON.
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                activation_token UUID DEFAULT gen_random_uuid() NOT NULL,
                activated BOOLEAN DEFAULT FALSE,
                created_time TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_time TIMESTAMP NOT NULL DEFAULT NOW(),
                name TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                data JSONB );
            `, `CREATE TABLE sessions (                                -- Sessions are owned by a user and have an id and a csrf token (csrf should be separate). There's also a data JSONB field for your session data.
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                ref uuid NOT NULL DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id),
                created_time TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_time TIMESTAMP NOT NULL DEFAULT NOW(),
                csrf TEXT NOT NULL,
                data JSONB );
            `, `CREATE TABLE items (                                   -- Items are owned by a user and have that data JSONB field for storing the item details.
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                created_time TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_time TIMESTAMP NOT NULL DEFAULT NOW(),
                user_id UUID NOT NULL REFERENCES users(id),
                data JSONB );`
        , 'CREATE INDEX sessions_ref_idx ON sessions (ref)'
        , 'CREATE INDEX sessions_user_id_idx ON sessions (user_id)'
        , 'CREATE INDEX users_activation_token_idx ON users (activation_token)'],
    down: [`DROP TABLE users, items, sessions;`]
},                                                // To roll back the  initial migration, just drop the tables. Perhaps we should also drop the pg_crypto extension.
...(config.migrations || [])];                                                               // Extend the default migrations with config.migrations.

// Items
const items = {                                                                                      // The items tree is mounted to /_/items by default. The items API endpoints are used to CRUD items.
    create: async function (req, res) {                                                               // Create a new item. POST {"data": {"foo":"bar"}} to /_/items/create
        const [error, { user_id }] = await guardPostWithSession(req);                                  // You need to be authenticated to use this. Pass item data as a JSON string in your POST request.
        if (error) return error;
        const json = await bodyAsJson(req);
        if (!isObject(json)) return '400: Parameter not an object.';       // The item data is an arbitrary JSON object.
        await DB.queryTo(res, 'INSERT INTO items (data, user_id) VALUES ($1, $2) RETURNING id, data, created_time, updated_time',
            [JSON.stringify(json), user_id]); // Create an item owned by you with the given data.
    },
    list: async function (req, res) {                                                                 // List your items. GET from /_/items/list
        await DB.queryTo(res, `SELECT c.id, c.data, c.created_time, c.updated_time, u.name AS username
            FROM items c, users u, sessions s 
            WHERE s.id = $1 AND u.id = s.user_id AND c.user_id = s.user_id`,
            [req.cookies.session]); // Get all the items for the logged in user.
    },
    view: async function (req, res, itemId) {                                                         // View a single item. GET /_/items/view/item-id-uuid-string. Doesn't require authentication.
        if (!itemId) return "404: No id provided";                                                    // You need to tell me which item you want to see.
        await DB.queryTo(res, `SELECT c.id, c.data, c.created_time, c.updated_time, u.name AS username
            FROM items c, users u WHERE c.id = $1 AND u.id = c.user_id`,
            [itemId]); // Get the item from the database.
    },
    edit: async function (req, res) {                                                                 // Edit item data. POST {"id": "itemId", "data": {"foo":"bar"}} to /_/items/edit
        var [error, { user_id }] = await guardPostWithSession(req);                                         // You need to be authenticated to use this. And parse the request body JSON too.
        if (error) return error;
        var [error, { id, data }] = assertShape({ id: isStrlen(36, 36), data: isObject }, await bodyAsJson(req));  // Please give me id and data from json.
        if (error) return error;
        await DB.queryTo(res, 'UPDATE items SET data = $1 WHERE id = $2 AND user_id = $3 RETURNING id, data, created_time, updated_time',
            [JSON.stringify(data), id, user_id]); // Update the item row and return the edited item.
    },
    delete: async function (req, res) {                                                               // Delete an item you own. POST {"id": "itemId"} to /_/items/delete
        var [error, { user_id }] = await guardPostWithSession(req);                                         // Authenticated POST endpoint. Parse the request body as JSON.
        if (error) return error;
        var [error, { id }] = assertShape({ id: isStrlen(36, 36) }, await bodyAsJson(req));                     // I only delete a single specific item, identified by the id.
        if (error) return error;
        const { rowCount } = await DB.query('DELETE FROM items WHERE id = $1 AND user_id = $2', [id, user_id]); // Delete items that you own and that have the requested id.
        if (rowCount === 0) return '404: Item not found';                                                 // There should be one row deleted. Or more if our item ids aren't unique.
        res.json({ deleted: rowCount });                                                               // Send how many items we deleted to the client as JSON.
    }
};

// User accounts
const user = {                                                                                       // The user API subtree is mounted to /_/user by default.
    create: async function (req, res) {                                                               // Create a new user. POST {"email":"a", "password":"b", "name":"c"} to /_/user/create
        if (req.method !== 'POST') return "405: Only POST accepted";                                 // Yes, you need to POST this request.
        const [error, { email, password, name }] = assertShape({ email: isEmail, password: isStrlen(8, 72), name: isStrlen(3, 72) }, await bodyAsJson(req)); // The JSON body should have email, password and name.
        if (error) return error;
        const passwordHash = await bcrypt.hash(password, config.saltRounds);                         // Let's not save plaintext passwords in the database. Bcrypt it!
        await DB.queryTo(res, 'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING email, name', [email, passwordHash, name]); // Save the user info in the database and return the new user id.
    },
    authenticate: async function (req, res) {                                                         // Authenticate! Create a session! POST {"email", "password", "rememberme"?: bool} to /_/user/authenticate
        if (req.method !== 'POST') return "405: Only POST accepted";                                 // You need to POST to authenticate.
        const [error, { email, password, rememberme }] = assertShape({ email: isEmail, password: isStrlen(8, 72), rememberme: isMaybe(isBoolean) }, await bodyAsJson(req)); // I need an email, password and rememberme.
        if (error) return error;
        const { rows: [user] } = await DB.query('SELECT * FROM user WHERE email = $1', [email]);    // Get the user from the database.
        if (!user) return "401: Email or password is wrong";                                         // There was no user with that email, but I don't want to tell you that.
        const passwordMatch = await bcrypt.compare(password, user.password);                         // Compare the hashed password from the database with the one in the request.
        if (!passwordMatch) return "401: Email or password is wrong";                                // There was a user, but the password was wrong. But I don't want to tell you that either.
        const session = await sessionCreate(user.id);                                                // Ok, everything's fine. Create a new session for the user.
        res.setHeader('Set-Cookie', `session=${session.id}; Path=/_/; ${rememberme ? 'Max-Age=2600000; ' : ''}${config.secure ? 'Secure; ' : ''}HttpOnly`); // Set the session cookie. The session cookie shouldn't be readable from JavaScript, applies to API endpoints, hangs around for a month if rememberme, and if config.secure is set, is only passed over HTTPS.
        res.json({ csrf: session.csrf });                                                              // Have a CSRF token, client.
    },
    sessions: async function (req, res) {                                                             // List sessions. GET from /_/user/sessions
        const [error, { user_id }] = await guardGetWithSession(req);                                          // You need to be authenticated for this, but you don't need POST here.
        if (error) return error;
        res.json((await sessionList(user_id)).map(s => s.toObject()));                                                        // Get your list of sessions as JSON.
    },
    logout: async function (req, res) {                                                               // Log out. Authenticated POST to /_/user/logout with optional {"session": "sessionId"}.
        var [error, session] = await guardPostWithSession(req);                                    // This should be an POST request with a valid session.
        if (error) return error;
        var [error, json] = assertShape({ session: isMaybe(isStrlen(36, 36)) }, JSON.parse((await bodyAsString(req)) || '{}')); // If the request has a body, parse it as JSON.
        if (error) return error;
        const sessionId = json.session || session.ref;                                               // Either log out the session given in the JSON body or the current session.
        if (!(await sessionDelete(sessionId, session.user_id))) return '404: Session not found';     // The session should exist and we should be able to delete it.
        if (sessionId === session.ref)                                                               // If the session is the current session, clear the session cookie.
            res.setHeader('Set-Cookie', `session=; Path=/_/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ${config.secure ? 'Secure; ' : ''}HttpOnly`); // Expires in the 70s, this makes the browser delete the cookie because ugh 70s.
        res.json({ deleted: 1 });                                                                      // I have deleted a session! Let me tell you all about it!
    },
    logoutAll: async function (req, res) {                                                            // Log out all sessions. Authenticated POST to /_/user/logoutAll
        const [error, session] = await guardPostWithSession(req);                                    // Only allow POST with a valid session.
        if (error) return error;
        res.setHeader('Set-Cookie', `session=; Path=/_/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ${config.secure ? 'Secure; ' : ''}HttpOnly`); // Nuke session cookie.
        res.json({ deleted: await sessionDeleteAll(session.user_id) });                                // Delete all sessions and return the number of sessions deleted, 
    },
    view: async function (req, res) {                                                                 // View user details. Includes email and the JSON data object. GET from /_/user/view
        const [error, { user_id }] = await guardGetWithSession(req);                                          // You need to be logged in to view your details.
        if (error) return error;
        await DB.queryTo(res, 'SELECT email, created_time, updated_time, data FROM users WHERE id = $1', [user_id]); // Read the user details from the database.
    },
    edit: async function (req, res) {                                                                 // Edit user. POST {"name"?, "email"?, "password"?, "data"?} to /_/user/edit
        var [error, { user_id }] = await guardPostWithSession(req);                                         // To edit, you need to be logged in and POST some JSON.
        if (error) return error;
        var [error, { name, email, password, newPassword, data }] = assertShape({ name: isMaybe(isStrlen(3, 72)), email: isMaybe(isEmail), password: isMaybe(isStrlen(8, 72)), newPassword: isMaybe(isStrlen(8, 72)), data: isMaybe(isObject) }, await bodyAsJson(req)); // Pull out the request params from the JSON.
        if (error) return error;
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

// Authorization & CSRF guards
global.guardPostWithSession = async function (req) {                                                  // The request should be POST with a valid session and CSRF token.
    if (req.method !== 'POST') return ["405: Only POST accepted", {}];                               // We only allow POST requests.
    const session = await sessionGet(req);                                                           // Get the session for the request.
    if (!session) return ['401: User session invalid, please re-authenticate', {}];                  // The session should exist.
    if (req.headers.csrf !== session.csrf) return ['401: Invalid CSRF token, please re-authenticate', {}]; // The request csrf header should match the session CSRF token.
    return [null, session];                                                                          // Here's your session, now get on with the rest of the request.
}
global.guardGetWithSession = async function (req) {                                                   // The request should have a valid session.
    const session = await sessionGet(req);                                                           // Get the session for the request.
    if (!session) return ['401: User session invalid, please re-authenticate', {}];                  // The session should exist.
    return [null, session];                                                                          // Here's the session, you're probably gonna need it.
}

// Session management
global.sessionCreate = async (userId) =>                                                              // Create new session for userId and return it.
    (await DB.query('INSERT INTO sessions (user_id, csrf) VALUES ($1, $2) RETURNING *', [userId, uuidv4()])).rows[0]; // Insert session into database with new CSRF.
global.sessionGet = async (req) =>                                                                    // Get session from request.
    req.cookies.session ? (await DB.query('SELECT * FROM sessions WHERE id = $1', [req.cookies.session])).rows[0] : undefined;         // Find session defined in the session cookie and return it.
global.sessionDelete = async (ref, userId) =>                                                          // Delete a session.
    (await DB.query('DELETE FROM sessions WHERE ref = $1 AND user_id = $2', [ref, userId])).rowCount > 0; // Delete the session with the given id and owner.
global.sessionDeleteAll = async (userId) =>                                                           // Delete all sessions of userId.
    (await DB.query('DELETE FROM sessions WHERE user_id = $1', [userId])).rowCount;                  // Delete all sessions where the user is userId.
global.sessionList = async (userId) =>                                                                // List the sessions for the user.
    (await DB.query(`SELECT ref AS sessions, csrf, created_time, updated_time, data FROM sessions WHERE user_id = $1 ORDER BY created_time ASC`, [userId])).rows; // Get the list of sessions for the user, sorted oldest first.

// Migration runner
async function migrate(migrations, migrationTarget) {                                                // Migrate the database to migrationTarget in migrations.
    let targetMigrationIndex = migrations.findIndex(m => m.name === migrationTarget);                // Find the index of the migration named migrationTarget.
    if (targetMigrationIndex === -1) targetMigrationIndex = migrationTarget === 0 ? migrationTarget : (migrationTarget || migrations.length - 1); // If there's no migration to be found, treat migrationTarget as an index, or go to the last migration.
    const client = global.DB;                                                                        // Grab a single connection from the pool for the migration transaction.
    try {                                                                                            // This might not work because I may have made a mistake in writing SQL. In which case we should ROLLBACK.
        console.log(`Migration target`, [client.config.database, targetMigrationIndex, (migrations[targetMigrationIndex] || { name: 'EMPTY' }).name]); // Where are we going?
        await client.query('BEGIN');                                                                 // Start migration transaction!
        await client.query(`CREATE TABLE IF NOT EXISTS migration (db_name TEXT NOT NULL PRIMARY KEY UNIQUE, latest_index INT NOT NULL DEFAULT -1, latest_name TEXT )`); // First time setup, create tables to keep track of current migration.
        await client.query(`CREATE TABLE IF NOT EXISTS migration_log (id SERIAL PRIMARY KEY, db_name TEXT, created_time TIMESTAMP DEFAULT NOW(), name TEXT, direction TEXT, query TEXT, index INT );`); // First time setup, create log of actions taken during migrations.
        var { rows: [migrationStatus] } = await client.query('SELECT * FROM migration WHERE db_name = $1', [client.config.database]); // Get the migration status.
        if (!migrationStatus)                                                                        // No migration status. Try creating one.
            var { rows: [migrationStatus] } = await client.query("INSERT INTO migration (db_name) VALUES ($1) RETURNING *", [client.config.database]); // Create the migration status!
        for (let i = parseInt(migrationStatus.latest_index); i > targetMigrationIndex; i--) {        // If the migration target is below current migration, we need to roll back some migrations.
            await Promise.all(migrations[i].down.map(query => client.query(query)));                 // Take down a migration.
            await client.query('INSERT INTO migration_log (db_name, name, direction, query, index) VALUES ($1, $2, $3, $4, $5)', [client.config.database, migrations[i].name, 'down', migrations[i].down.join(";\n") + ';', i.toString()]); // Log what we've done to the database.
        }                                                                                            // Migrations have been rolled back if needed.
        for (let i = parseInt(migrationStatus.latest_index) + 1; i <= targetMigrationIndex; i++) {               // If the migration target is above current migration, let's up the unapplied migrations.
            await Promise.all(migrations[i].up.map(query => client.query(query)));                   // Bring up a migration.
            await client.query('INSERT INTO migration_log (db_name, name, direction, query, index) VALUES ($1, $2, $3, $4, $5)', [client.config.database, migrations[i].name, 'up', migrations[i].up.join(";\n") + ';', i.toString()]); // Log what we have done to the database.
        }                                                                                            // Migrations have been applied if needed.
        await client.query('UPDATE migration SET latest_index = $1, latest_name = $2', [targetMigrationIndex.toString(), (migrations[targetMigrationIndex] || {}).name]); // Update migration status to match our actions.
        await client.query('COMMIT');                                                                // Commit the migrations. Hooray!
        console.log((parseInt(migrationStatus.latest_index) === targetMigrationIndex) ? 'Migration already on target' : 'Migration COMMIT'); // Here's what I have done (or haven't done, more often.)
    } catch (err) {                                                                                  // I made a mistake in my SQL, please don't leave the database in a broken state.
        await client.query('ROLLBACK');                                                              // Roll back the transaction!
        console.error('Migration ROLLBACK');
        throw err;                                                                                   // Pass the error on, we need to stop the program!
    }
}                                                                                                    // Our migrations have been applied and all is well under the moon.

// File serving
global.serveDirectory = function (baseDirectory, pathFor404) {                                       // I wish to serve you a directory of files.
    const cache = {};                                                                                // But first, let me read all of it into memory.
    chokidar.watch('.', { cwd: baseDirectory, ignored: /(^|[\/\\])\../ }).on('all', (_, filename) => { // And refresh the memory whenever files change.
        try {
            delete cache['/' + filename];                                                            // When a file changes, delete the previously cached version.
            const buffer = fs.readFileSync(path.join(baseDirectory, filename));                      // Then read it into a buffer.
            filename = filename.replace(/\\/g, '/');                                                  // Normalize to HTTP path separators
            cache['/' + filename] = { filename: '/' + filename, buffer, headers: { 'content-type': mime.getType(filename) } }; // And cache it again, along with the mimetype.
        } catch (e) { }                                                                              // I don't care if reading the file fails (maybe it's a directory). It'll just be 404 for you.
    });
    return async function (req, res) {                                                               // Oh right, I need to give you a HTTP request handler.
        const reqPath = req.url.split("?")[0];                                                       // You can use GET parameters for bypassing Expires headers. If your filename has question marks, you're going to get a 404 though.
        const cached = getOwnProperty(cache, reqPath) || getOwnProperty(cache, path.join(reqPath, 'index.html')) || getOwnProperty(cache, pathFor404); // Check if the request path is in cache. Maybe it's a directory and we should test path/index.html as well.
        if (!cached) return;                                                                         // Not in cache, pass the buck to whatever fallback handler there is.
        const encoded = res.targetEncoding && getOwnProperty(cache, cached.filename + '.' + res.targetEncoding.slice(0, 2)); // Try to find a compressed version of the file.
        if (encoded) res.setHeader('content-encoding', res.targetEncoding);                          // If we have a compressed version of the file, let's tell the client that we're using it.
        res.writeHead(200, cached.headers);                                                          // Okay, found the file, you get to taste the sweet 200 of success.
        res.end((encoded && encoded.buffer) || cached.buffer);                                       // Send a compressed version of the file if we can use one. Otherwise send the file uncompressed.
    };                                                                                               // The client has been served with a file if one was found.
}

Client.prototype.queryTo = async function (res, query, values) {
    return await (await this.query(query, values, Client.BINARY, true, new DBPassThrough(res))).end(); // Stream the database query result directly to HTTP response using the Postgres binary protocol.
};
class DBPassThrough {
    constructor(dst) {
        this.dst = dst;
        this.dataPipe = dst;
        this.needToWriteRowParser = true;
        this.needToWriteHeader = true;
        this.buffer = [];
        this.bufferLength = 0;
    }
    write(buf) {
        if (this.needToWriteRowParser) { // The first write is either a RowDescription, or if not, we have a cached rowParser.
            if (this.rowParser) this.buffer.push(this.rowParser.buf);
            this.needToWriteRowParser = false;
        }
        this.buffer.push(buf); // Push writes to output buffer.
        this.bufferLength += buf.byteLength; // Keep track of how much stuff we've got buffered. 
        if (this.bufferLength >= 65536) { // Buffer rows before doing a write.
            this.writeHeadIfNeeded(); // Write the header and create compression data pipes if needed.
            this.dataPipe.write(Buffer.concat(this.buffer.splice(0))); // Concat and empty the buffer array, and write the result buffer to destination stream.
            if (this.dataPipe !== this.dst) this.dataPipe.flush();
            this.bufferLength = 0; // Reset buffer length byte counter.
        }
    }
    writeHeadIfNeeded() {
        if (!this.needToWriteHeader) return;
        if (this.dst.targetEncoding && this.bufferLength > 860) {
            if (this.dst.targetEncoding === 'br') this.dataPipe = zlib.createBrotliCompress({ params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 1 } })
            else this.dataPipe = zlib.createGzip({ level: 1 });
            this.dst.setHeader('content-encoding', this.dst.targetEncoding); // Tell the client what kind of compression we're using.
        }
        this.dst.writeHead(200, { 'content-type': 'application/x-postgres' });
        if (this.dst !== this.dataPipe) this.dataPipe.pipe(this.dst);
        this.needToWriteHeader = false;
    }
    end() {
        this.writeHeadIfNeeded();
        this.dataPipe.write(Buffer.concat(this.buffer.splice(0)));
        return new Promise((resolve, reject) => {
            if (this.dataPipe === this.dst) {
                this.dst.end();
                resolve();
            } else {
                this.dataPipe.flush();
                this.dataPipe.end(() => {
                    this.dst.end();
                    resolve();
                });
            }
        });
    }
}

// Body JSON parsing
HTTP.ServerResponse.prototype.json = HTTP2.Http2ServerResponse.prototype.json = function (obj, statusCode = 200, headers = undefined) { // Let's monkey-patch the HTTP response object for easier JSON responses! Turns obj into JSON and sends that in the response, using the given statusCode and extra headers if any.
    let json = Buffer.from(JSON.stringify(obj));                                                     // Turn obj into a Buffer of JSON.
    if (this.targetEncoding && json.byteLength > 860) {                                              // Compress the response if the JSON is longer than a single IP packet and the client supports compressed responses.
        json = this.targetEncoding === 'br' ? zlib.brotliCompressSync(json, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 1 } }) : zlib.gzipSync(json, { level: 1 }); // Use brotli at quality 5 if supported, otherwise use gzip at quality 8 (brotli is generally smaller at similar encoding speed here.)
        this.setHeader('content-encoding', this.targetEncoding);                                     // Tell the client what kind of compression we're using.
    }                                                                                                // Compression has been dealt with.
    this.writeHead(statusCode, { 'content-type': 'application/json', ...headers });                    // Start the response with the statusCode from parameters (default 200) and whatever extra headers we're given.
    this.end(json);                                                                                  // And write out the (possibly compressed) JSON buffer.
};
global.bodyAsBuffer = (req, maxLen = 10e6) => new Promise(function (resolve, reject) {                 // Reads the body of a request into a buffer. If the body is longer than maxLen, throws a 413: Body too large.
    let totalByteLength = 0, buffers = [];                                                           // Keep track of how many bytes we've received and the actual bytes too.
    req.on('data', function (buffer) {                                                                // When the request gives us some data.
        totalByteLength += buffer.byteLength;                                                        // Add its byteLength to the total received bytes.
        if (totalByteLength > maxLen) reject(Error('413: Body too large'));                          // Too many bytes, Mr. Hacker. Good-bye.
        buffers.push(buffer);
    });                                                                    // Add the new data to our array of received Buffers.
    req.on('end', function () { resolve(buffers.length === 1 ? buffers[0] : Buffer.concat(buffers)) }); // At the end of the request, turn the array of Buffers into a single Buffer. Unless there's only one to begin with. Which is usually the case.
    req.on('error', reject);                                                                         // On error, reject the Promise and let the caller deal with it.
});
global.bodyAsString = async (req, maxLen = 1e6) => (await bodyAsBuffer(req, maxLen)).toString();       // Reads the body of a request into a string. Via a buffer.
global.bodyAsJson = async (req, maxLen = 1e6) => {
    const buf = await bodyAsBuffer(req, maxLen);
    return buf.byteLength > 0 ? JSON.parse(buf) : {};
} // Reads the body of a request as a JSON object. Via a buffer.

// Routing
async function route(routeObj, req, res) {                                                           // Try to route req to the routeObj.
    const path = req.url.split(/[\/\?]/);                                                            // Route path segments are split on / and ?, /foo/bar?baz=qux => [foo, bar, baz=qux]
    for (let i = 1; i < path.length; i++) {                                                          // Skip the first segment. It's always empty because req.url starts with /.
        routeObj = getOwnProperty(routeObj, path[i]);                                                // Descend to the path segment in routeObj. Don't route to __proto__. That'd be ... interesting.
        if (!routeObj) return;                                                                       // Couldn't find path[i] in routeObj, so give up and let the fallback handler deal with it.
        if (typeof routeObj === 'function') return routeObj(req, res, path.slice(i + 1).join("/"));    // Found a function, let it handle the request. The third parameter is the rest of the route, joined back into one string.
    }                                                                                                // Walked the entire route and didn't find a handler function. Pass to the fallback handler, we don't allow directory routes in the API.
}

// Cluster
global.DB.connect(config.pgport, config.pghost).then(() => {
    if (cluster.isMaster) {                                                                              // The cluster master migrates the DB and starts the workers.
        console.error('Cluster starting', new Date().toString());
        migrate(migrations, config.migrationTarget).then(() => {                                         // Migrate the DB to config.migrationTarget.
            for (let i = 0; i < config.workerCount; i++) cluster.fork();
        });                             // Start config.workerCount HTTP server workers.
    } else { // The cluster workers start HTTP servers on config.port and deal with all the hard work.
        // Routes
        const routes = config.routes || { _: { items, user, ...config.api } };                             // Route to either config.routes or the default routes extended with config.api. These are under /_/ for create-react-app service worker compatibility.
        const fallbackRoute = config.fallbackRoute || serveDirectory(config.root, config.pathFor404);                       // If no route is found, pass the request to config.fallbackRoute or the static file server rooted at config.root.

        // HTTP Server
        const encRe = zlib.brotliCompress ? /\b(br|gzip)\b/g : /\bgzip\b/g;                              // Figure out what accept-encoding values to support
        (config.cert || config.pfx ? HTTP2.createSecureServer : HTTP.createServer)(config, async function (req, res) { // Start a HTTP2 server if the config has SSL keys, otherwise start a HTTP server
            const t0 = performance.now();                                                                // Let's time the request!
            if (config.allowCORS(req.headers.origin)) {                                                  // If the browser says a local net page is doing the request.
                res.setHeader('Access-Control-Allow-Origin', req.headers.origin);                        // Allow the local net page to CORS it.
                res.setHeader('Access-Control-Allow-Headers', config.allowCORSHeaders);                  // Need to be able to pass the csrf header for POSTs.
                res.setHeader('Access-Control-Allow-Credentials', 'true');                               // And the cookie for session authentication.
                if (req.method === 'OPTIONS') return res.end();
                req.CORSRequest = true;
            }
            req.cookies = {};                                                                            // Let's monkey-patch the request object with a cookie hashtable!
            let match, cookieRe = /([^\s=;]+)\s*=\s*"?([^;"\s]+)/g;                                      // Cookie parser matches key=token; key="token"; ...
            while (match = cookieRe.exec(req.headers.cookie || '')) req.cookies[match[1]] = match[2];    // Assign parsed cookie values to req.cookies.
            res.targetEncoding = ((req.headers['accept-encoding'] || '').match(encRe) || []).sort()[0];  // Prefer br, followed by gzip.
            let error, trace;
            try {                                                                                        // Try to handle the request, or fall back to an error response.
                error = await route(routes, req, res);                                                   // Try to handle the request with the routes object.
                if (!res.finished && !error) error = await fallbackRoute(req, res);                      // Fall back to static file serving or a configured fallback handler.
                if (!res.finished && !error) error = "404: Route not found";                             // No route matched, you win a 404.
            } catch (e) { error = '500: ' + e.message; trace = e.stack; }                                 // If you throw inside a request handler, it's converted to a HTTP error response.
            if (error) {
                const status = parseInt(error.slice(0, 3));                                               // If the error message starts with a number, use that as the status code.
                config.logError && config.logError(req, status, error, trace, performance.now() - t0);   // Log the error by calling config.logError.
                res.json({ status, error }, status);                                                       // Send the HTTP error message to the client.
            }                                                                                            // The request has been processed, the client has been sent a response.
            config.logAccess && config.logAccess(req, res.statusCode, performance.now() - t0);           // Log the request by calling config.logAccess.
        }).listen(config.port, () => console.log(`[${process.pid}] Server running on ${config.port}`));  // Start the server on config.port.
    }
}); // THIS IS SPARTA
