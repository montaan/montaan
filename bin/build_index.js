const lunr = require('../js/lunr.js');
const fs = require('fs');
const readline = require('readline');
const mime = require('mime-types');
const path = require('path');

const fileList = process.argv.pop();

var idx = lunr(function() {
    this.field('name');
    this.field('type');
    this.field('body');
    this.ref('id');
});

const readInterface = readline.createInterface(fs.createReadStream(fileList));

readInterface.on('line', function(filename) {
    console.error(filename);
    const stat = fs.statSync(filename);
    var type, name, body = '';
    name = path.basename(filename);
    if (stat.isDirectory()) {
        type = 'directory';
        body = '';
    } else {
        type = mime.lookup(name);
        if (stat.size < 3e5 && (!type || /^(text|application\/(json|javascript))/.test(type))) {
            body = fs.readFileSync(filename).toString();
        }
    }
    idx.add({id:filename, name, type, body});
    if (body.length > 0) {
        lines = body.split(/[\r\n]+/g);
        for (var i = 0; i < lines.length; i++) {
            idx.add({id: filename+":"+(i+1)+"/"+lines.length, name:'', type:'', body: lines[i]});
        }
    }
});

readInterface.on('close', function() {
    process.stdout.write(JSON.stringify(idx.toPackedJSON(32)));
    process.stdout.end();
});
