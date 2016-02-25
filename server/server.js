// Node server
// Firewall to start with, throw in some auth later.

/*
	GET fs/path?depth=n -> filesystem subtree at path, n levels down.
	Returns a JSON array of paths in breadth-first order. Directory names are suffixed by a slash (/).

		/path/other.file
		/path/1/
		/path/4/
		/path/5/
		/path/1/2/
		/path/1/file
		/path/1/2/3/
*/

/*
	GET fs/path/to/file -> file contents
	Returns the raw binary file contents.

	Mostly useful for dealing in formats that the browser understands.
*/

/*
	GET thumbnail/path/to/file -> file thumbnail image.
	Returns a JPG / PNG thumbnail of the file.
*/

/*
	GET thumbnail/path/to/dir/ -> directory thumbnail image.
	Returns a JPG / PNG thumbnail of the directory.
*/

'use strict';

(() => {
	const http = require('http');
	const fs = require('fs');
	const URL = require('url');

	//Lets define a port we want to listen to
	const PORT = 8080;

	var period = '.'.charCodeAt(0);


	function traverseFS(dir, depth, maxDepth, response) {
		if (depth > maxDepth) {
			return;
		}
		var list = [];
		try { list = fs.readdirSync(dir); } catch (e) {}
		list.forEach(filename => {
			let path = dir + '/' + filename;
			if (filename.charCodeAt(0) !== period) {
				var isDir = false;
				try { isDir = fs.lstatSync(path).isDirectory(); } catch(e) {}
				if (isDir) {
					response.write(path + '/\n');
					traverseFS(path, depth+1, maxDepth, response);
				} else {
		 			response.write(path + '\n');
				}
			}
		});
		return;
	}

	//We need a function which handles requests and send response
	function handleRequest(request, response){
		response.setHeader("Access-Control-Allow-Origin", "http://localhost:9009")

		var url = URL.parse(request.url, true);

		var dir = decodeURIComponent(url.pathname).replace(/\/$/, '');
		if (dir === '') {
			dir = '/';
		}

		var depth = url.query.depth || 1;

		try {
			var isDir = fs.lstatSync(dir).isDirectory();
		} catch (err) {
			response.statusCode = 404;
			response.end("File not found.");
			return;
		}
		response.statusCode = 200;
		if (isDir) {
			response.write(dir + '/\n');
			traverseFS(dir, 1, depth, response);
			response.end();
		} else {
			try {
			    var readStream = fs.createReadStream(dir);
			    readStream.pipe(response);
			} catch (e) {
				response.statusCode = 404;
				response.end("File not found.");
				return;
			}
		}

		// console.log('It Works!! Path Hit: ' + dir);
	}

	//Create a server
	var server = http.createServer(handleRequest);

	//Lets start our server
	server.listen(PORT, function(){
		//Callback triggered when server is successfully listening. Hurray!
		console.log("Server listening on: http://localhost:%s", PORT);
	});

})();
