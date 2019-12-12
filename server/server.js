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


const http = require('http');
const fs = require('fs');
const URL = require('url');
const ChildProcess = require('child_process');
const exec = ChildProcess.exec;
const execFile = ChildProcess.execFile;


//Lets define a port we want to listen to
const PORT = 8080;


function handleProcessRequest(request, response) {
	response.statusCode = 200;
	var procTree = {};
	// procs = `ps Ao ppid,pid,%cpu,%mem,comm`.split("\n");
	exec("ps Ao ppid,pid,%cpu,%mem,comm", function(error, stdout, stderr) {
		let procs = stdout.split("\n"); 
		procs.shift();
		procs = procs.map( pr => pr.replace(/^\s+|\s+$/g, '').split(/\s+/, 5) )
		procs.forEach((procInfo) => {
			let ppid = procInfo[0],
				pid = procInfo[1],
				cpu = procInfo[2],
				mem = procInfo[3],
				name = procInfo[4];
			let parent = procTree[ppid];
			let proc = { parent: parent, pid: pid, cpu: cpu, mem: mem, name: name, children: [], files: [] };
			if (parent) {
				parent.children.push(proc);
			}
			procTree[pid] = proc;
		});

		exec("lsof -Fpn0 /", function(error, stdout, stderr) {
			let procFiles = stdout.split("\0");
			let pid = 0;
			procFiles.forEach(pf => {
				pf = pf.replace(/^\s+|\s+$/g, '');
				if (pf.charAt(0) === 'p') {
					pid = pf.substring(1);
				} else {
					let proc = procTree[pid];
					if (proc) {
						proc.files.push(pf.substring(1));
					}
				}
			});
			for (var i in procTree) {
				traverseProcTree(procTree[i], "/", response);
			}
			response.end();
		});
	});
}

function traverseProcTree(proc, path, response) {
	var procPath = path + proc.pid + '/';
	response.write(procPath);
	response.write("\n");

	var filesPath = procPath + 'files/';
	response.write(filesPath);
	response.write("\n");
	proc.files.forEach(f => response.write(filesPath + f.substring(1).replace(/\//g, ":") + '\n'));

	var childPath = procPath + 'children/';
	response.write(childPath);
	response.write("\n");
	proc.children.forEach(c => response.write(childPath + c.pid + '\n'));
		// traverseProcTree(c, childPath, response));
}


var period = '.'.charCodeAt(0);

var responseCache = {};

function traverseFS(dir, depth, maxDepth, response, cache) {
	if (depth > maxDepth) {
		return;
	}
	var list = [];
	try { list = fs.readdirSync(dir); } catch (e) {}
	list.forEach(filename => {
		let path = dir + '/' + filename;
		//if (filename.charCodeAt(0) !== period) {
			var isDir = false;
			try { isDir = fs.lstatSync(path).isDirectory(); } catch(e) {}
			if (isDir) {
				var s = path + '/\n';
				response.write(s);
				cache.push(s);
				traverseFS(path, depth+1, maxDepth, response, cache);
			} else {
				var s = path + '\n';
				response.write(s);
				cache.push(s);
			}
		//}
	});
	return;
}

var thumbnailCache = {};

function handleThumbnailRequest(request, response, thumbnail) {
	response.setHeader("Access-Control-Allow-Origin", "http://localhost:9009");
	response.setHeader("Expires", new Date(Date.now() + 86400*1000*360).toUTCString());
	if (thumbnailCache[thumbnail]) {
		response.end(thumbnailCache[thumbnail]);
	} else {
		http.request(thumbnail, {encoding: null}, function(err, res, body) {
			thumbnailCache[thumbnail] = body;
			response.end(body);
		});
	}
}

function handleGitRequest(request, response, git) {
	var segs = git.split("/");
	var repoIdx = segs.length-1;
	if (segs[repoIdx] === '.git') {
		repoIdx--;
	}
	var repoName = segs[repoIdx];
	execFile('/usr/bin/git', ['clone', '--depth', '1', git, 'repos/'+repoName], function(err, stdout, stderr) {
		if (!err) {
			sendDirTree('repos/'+repoName, 12, response);
		}
	});
}

function sendDirTree(dir, depth, response) {

	try {
		var isDir = fs.lstatSync(dir).isDirectory();
	} catch (err) {
		response.statusCode = 404;
		response.end("File not found.");
		return;
	}
	response.statusCode = 200;
	if (isDir) {
		if (responseCache[dir]) {
			response.end(responseCache[dir]);
			return;
		}
		var cache = [];
		var s = dir + '/\n';
		response.write(s);
		cache.push(s);
		traverseFS(dir, 1, depth, response, cache);
		responseCache[dir] = cache.join("");
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

	if (url.query.processes) {
		handleProcessRequest(request, response);
		return;
	} else if (url.query.thumbnail) {
		handleThumbnailRequest(request, response, url.query.thumbnail);
		return;
	} else if (url.query.git) {
		handleGitRequest(request, response, url.query.git);
		return;
	}

	sendDirTree(dir, depth, response);
}

//Create a server
var server = http.createServer(handleRequest);

//Lets start our server
server.listen(PORT, function(){
	//Callback triggered when server is successfully listening. Hurray!
	console.log("Server listening on: http://localhost:%s", PORT);
});

