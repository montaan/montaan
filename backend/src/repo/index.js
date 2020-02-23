// Repos
module.exports = {};
require('fs')
	.readdirSync(__dirname)
	.forEach((file) => {
		if (file !== 'index.js' && file !== 'lib') {
			module.exports[file.replace(/\.js$/, '')] = require('./' + file);
		}
	});
