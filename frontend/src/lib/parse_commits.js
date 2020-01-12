import * as THREE from 'three';
import utils from './utils';
import { getPathEntry } from './filetree';

export function parseCommits(commitLog, commitChanges, fileTree, repoPrefix) {
    console.time("commits");

    var commits = commitLog.split(/^commit /m);
    var authors = {};
    var commitIndex = {};
    commits.shift();
    console.log(commits.length, 'commits');
    // commits.splice(MAX_COMMITS);
    commits = commits.map(function(c) {
        var lines = c.split("\n");
        var hash = lines[0];
        var idx = 0;
        while (lines[idx] && !/^Author:/.test(lines[idx])) {
            idx++;
        }
        var author = lines[idx++].substring(8);
        var email = (author.match(/<([^>]+)>/) || [null,''])[1];
        var authorName = author.substring(0, author.length - email.length - 3);
        var date = lines[idx++].substring(6);
        var message = lines.slice(idx+1).map(function(line) {
            return line.replace(/^    /, '');
        }).join("\n");
        var commit = {
            sha: hash,
            author: {
                name: authorName,
                email: email
            },
            message: message,
            date: new Date(date),
            files: []
        };
        var authorObj = authors[authorName];
        if (!authorObj) {
            authors[authorName] = authorObj = [];
        }
        authorObj.push(commit);
        commitIndex[commit.sha] = commit;
        return commit;
    });
    console.timeLog("commits", "commits preparse");

    {
        let lineStart = 0, hash = null, setHash = false;
        for (let i = 0; i < commitChanges.length; i++) {
            let c = commitChanges.charCodeAt(i);
            if (c === 10) { // new line
                if (lineStart !== i) {
                    if (setHash) hash = commitChanges.substring(lineStart, i);
                    else if (commitIndex[hash]) {
                        let [action, path, renamed] = commitChanges.substring(lineStart, i).split("\t");
                        commitIndex[hash].files.push({action, path, renamed});
                    }
                }
                lineStart = i+1;
            } else if (lineStart === i) setHash = ((c >= 97 && c <= 102) || (c >= 48 && c <= 57));
        }
    }

    var commitsFSEntry = {name: "Commits", title: "Commits", index: 0, entries: {}};
    var commitsRoot = {name:"", title: "", index:0, entries:{"Commits": commitsFSEntry}};

    console.timeLog("commits", "changes preparse");

    var mkfile = function(filename) {
        return {
            name: filename, title: filename, index: 0, entries: null
        };
    };

    var mkdir = function(dirname, files) {
        var entries = {};
        files.forEach(function(f) { entries[f] = mkfile(f) });
        return {
            name: dirname, title: dirname, index: 0, entries: entries
        };
    };

    var commitsFSCount = 2;
    var commitToFile;
    var commitIndex;
    commits.forEach(function(c) {
        var entries = {
            Author: mkfile(c.author.name),
            SHA: mkfile(c.sha),
            Date: mkfile(c.date.toString()),
            Message: mkfile(c.message)
        }
        if (c.files.length > 0 && c.files[0]) {
            var fileTree = utils.parseFileList_(c.files.map(function(f) { return f.path }).join("\n")+'\n', true);
            fileTree.tree.title = fileTree.tree.name = 'Files';
            entries.Files = fileTree.tree;
            commitsFSCount += 1 + fileTree.count;
        }
        commitsFSEntry.entries[c.sha] = {
            name: c.sha, title: (c.message.match(/^\S+.*/) || [''])[0], index: 0, entries: entries
        };
        c.fsEntry = commitsFSEntry.entries[c.sha];
        commitsFSCount += 5;
    });
    console.timeLog("commits", "done with commits");

    var authorsFSEntry = {name: "Authors", title: "Authors", index: 0, entries: {}};
    var authorsRoot = {name:"", title: "", index:0, entries:{"Authors": authorsFSEntry}};
    var authorsFSCount = 2;

    for (var authorName in authors) {
        var author = authors[authorName];
        author.fsEntry = mkdir(authorName, []);
        authorsFSEntry.entries[authorName] = author.fsEntry;
        authorsFSCount++;
        for (var i=0; i<author.length; i++) {
            var c = author[i];
            if (!c ||!c.fsEntry) continue;
            var cEntry = mkfile(c.fsEntry.title);
            author.fsEntry.entries[c.sha] = cEntry;
            authorsFSCount++;
        }
    }
    console.timeLog("commits", "done with authors");

    var lineGeo = new THREE.Geometry();

    var h = 4;
    for (var authorName in authors) {
        var author = authors[authorName];
        var authorEntry = author.fsEntry;
        var color = new THREE.Color();
        color.setHSL((h%7)/7, 1, 0.5);
        h+=2;
        author.color = color;
        // for (var i=0; i<author.length; i++) {
            // var commit = author[i];
            // if (commit && commit.fsEntry && author.fsEntry && author.fsEntry.entries[commit.sha]) {
            // 	addLineBetweenEntries(lineGeo, color, window.processModel, commit.fsEntry, window.authorModel, author.fsEntry.entries[commit.sha]);
            // }
        // }
    }

    var touchedFilesIndex = {};

    for (var i in commitsRoot.entries.Commits.entries) {
        var commitFSEntry = commitsRoot.entries.Commits.entries[i];
        utils.traverseFSEntry(commitFSEntry, function(fsEntry, fullPath) {
            if (/^\/Commits\/.{40}\/Files\//.test(fullPath) && fsEntry.entries === null) {
                var sha = fullPath.substring(9, 49);
                var path = fullPath.substring(55);
                var filePath = repoPrefix + path;
                var fileEntry = getPathEntry(fileTree, filePath);
                if (fileEntry) {
                    if (!touchedFilesIndex[filePath]) touchedFilesIndex[filePath] = fileEntry;
                    var author = authors[commitIndex[sha].author.name];
                    // addLineBetweenEntries(lineGeo, author.color, window.processModel, commitFSEntry, window.model, fileEntry);
                }
            }
        }, commitsRoot.name+"/Commits/");
    }
    var touchedFiles = Object.keys(touchedFilesIndex).sort().map(k => touchedFilesIndex[k]);
    console.timeLog("commits", "done with touchedFiles");

    lineGeo.vertices.push(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
    lineGeo.colors.push(new THREE.Color(0,0,0), new THREE.Color(0,0,0));

    console.timeEnd("commits");

    return {
        commits, commitIndex, authors, commitsFSEntry, authorsFSEntry, lineGeo, touchedFiles,
        commitTree: {tree: commitsRoot, count: commitsFSCount},
        authorTree: {tree: authorsRoot, count: authorsFSCount}
    };
}
