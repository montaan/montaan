const numCPUs = require('os').cpus().length;
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
require('dotenv').config();

const config = {
	port: 8008,
	// fallbackRoute: () => {},
	pg: {
		user: process.env.PGUSER,
		database: process.env.PGDATABASE,
		password: process.env.PGPASSWORD,
	},
	root: path.join(process.cwd(), '../frontend/build'),
	pathFor404: '/index.html',
	saltRounds: 10,
	allowCORSHeaders: 'csrf,scantoken',
	logAccess: (req, status, elapsed) => {
		console.log(status, req.method, req.url);
	},
	logError: (req, status, error, trace, elapsed) => {
		console.error(status, error, trace);
	},
	workerCount: numCPUs,
};

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

config.api = {
	user: require('./src/user'),
	repo: require('./src/repo'),
	items: {},
};

config.replaceMigrations = require('./src/migrations');

function fetchTick() {
	child_process.exec('bin/update_all_trees', function() {
		setTimeout(fetchTick, 30 * 60 * 1000);
	});
}

setTimeout(fetchTick, 10000);

module.exports = config;
