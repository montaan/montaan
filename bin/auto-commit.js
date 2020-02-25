#!/usr/bin/env node

const childProcess = require('child_process');
const spawn = childProcess.spawn;

const tagPatterns = [
	['docker', /^\.?docker/i],
	['qframe', /^frontend\/src\/qframe\//],
];

const actionStrings = {
	M: 'Edited',
	A: 'Created',
	R: 'Renamed',
	C: 'Copied',
	D: 'Deleted',
};

function actionToString(action) {
	return actionStrings[action[0]] || action;
}

function getStatusMessage() {
	var bash = spawn('bash');
	bash.stdin.end('git add -u && git status --porcelain');

	return new Promise(function(resolve) {
		bash.stdout.on('data', function(data) {
			resolve(data.toString());
		});
	});
}

const tick = () =>
	getStatusMessage().then(function(statusMessage) {
		const lines = statusMessage.split('\n').filter((l) => !/^\?\?/.test(l));
		const tags = {};
		const addTag = (tag, path) => (tags[tag] = tags[tag] || []).push(path);
		const paths = [];
		lines.forEach((l) => {
			if (!l) return;
			let [_, action, path] = l.match(/^\s*(\S+)\s+(.*)/);
			if (path.startsWith('"')) path = JSON.parse(path);
			tagPatterns.forEach(([tag, pattern]) => pattern.test(path) && addTag(tag, path));
			const dir = path.split('/')[0];
			if (dir) {
				const name = dir.split('.')[0].toLowerCase() || dir.split('.')[1].toLowerCase();
				if (name) addTag(name, path);
			}
			paths.push([action, path]);
		});
		if (paths.length === 0) {
			console.log('No changes');
			return;
		}
		console.log(
			Object.keys(tags)
				.sort()
				.map((t) => `[${t}]`),
			paths
		);

		const messageLine =
			Object.keys(tags)
				.sort()
				.map((t) => `[${t}]`)
				.join('') +
			' ' +
			(process.argv[2] ||
				paths.map(([action, path]) => actionToString(action) + ' ' + path).join(', '));
		const messageBody = paths
			.map(([action, path]) => actionToString(action) + ' ' + path)
			.join('\n');
		const commitMessage = messageLine + '\n\n' + messageBody;
		var bash = spawn('bash');
		bash.stdin.end('git commit -m "' + commitMessage.replace(/"/g, '\\"') + '"');
		bash.stdout.on('data', function(data) {
			console.log(data.toString());
		});
		bash.stderr.on('data', function(data) {
			console.log(data.toString());
		});
	});
tick();
if (!process.argv[2]) setInterval(tick, 60000);
