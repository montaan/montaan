import * as THREE from 'three';
import utils from './utils';
import { getPathEntry } from './filetree';
import { KeyCode } from 'monaco-editor';

class Commit {
    constructor(sha, author, message, date, files) {
        this.sha = sha;
        this.author = author;
        this.message = message;
        this.date = date;
        this.files = files;
        this.diff = '';
    }
}

export function parseCommits(commits, fileTree, repoPrefix) {

    const touchedFilesIndex = {};
    const touchedFiles = [];
    const commitIndex = {};
    const authors = {};

    for (var i = 0; i < commits.length; i++) {
        const commit = commits[i];
        commit.date = new Date(commit.date);
        commitIndex[commit.sha] = commit;
        if (!authors[commit.author]) authors[commit.author] = [];
        authors[commit.author].push(commit);
    }

    // {
    //     let filePath = repoPrefix + path;
    //     if (touchedFilesIndex[filePath] === undefined) {
    //         let fileEntry = getPathEntry(fileTree, filePath);
    //         if (fileEntry) {
    //             touchedFilesIndex[filePath] = fileEntry;
    //         }
    //         else touchedFilesIndex[filePath] = false;
    //     }
    // }
    // if (renamed) {
    //     let filePath = repoPrefix + renamed;
    //     if (touchedFilesIndex[filePath] === undefined) {
    //         let fileEntry = getPathEntry(fileTree, filePath);
    //         if (fileEntry) touchedFilesIndex[filePath] = fileEntry;
    //         else touchedFilesIndex[filePath] = false;
    //     }
    // }

    // var commitsFSEntry = {name: "Commits", title: "Commits", index: 0, entries: {}};
    // var commitsRoot = {name:"", title: "", index:0, entries:{"Commits": commitsFSEntry}};

    // console.timeLog("commits", "changes preparse");

    // var mkfile = function(filename) {
    //     return {
    //         name: filename, title: filename, index: 0, entries: null
    //     };
    // };

    // var mkdir = function(dirname, files) {
    //     var entries = {};
    //     files.forEach(function(f) { entries[f] = mkfile(f) });
    //     return {
    //         name: dirname, title: dirname, index: 0, entries: entries
    //     };
    // };

    // var commitsFSCount = 2;
    // var commitToFile;
    // var commitIndex;
    // commits.forEach(function(c) {
    //     var entries = {
    //         Author: mkfile(c.author.name),
    //         SHA: mkfile(c.sha),
    //         Date: mkfile(c.date.toString()),
    //         Message: mkfile(c.message)
    //     }
    //     if (c.files.length > 0 && c.files[0]) {
    //         var fileTree = utils.parseFileList_(c.files.map(function(f) { return f.path }).join("\n")+'\n', true);
    //         fileTree.tree.title = fileTree.tree.name = 'Files';
    //         entries.Files = fileTree.tree;
    //         commitsFSCount += 1 + fileTree.count;
    //     }
    //     commitsFSEntry.entries[c.sha] = {
    //         name: c.sha, title: (c.message.match(/^\S+.*/) || [''])[0], index: 0, entries: entries
    //     };
    //     c.fsEntry = commitsFSEntry.entries[c.sha];
    //     commitsFSCount += 5;
    // });
    // console.timeLog("commits", "done with commits");

    // var authorsFSEntry = {name: "Authors", title: "Authors", index: 0, entries: {}};
    // var authorsRoot = {name:"", title: "", index:0, entries:{"Authors": authorsFSEntry}};
    // var authorsFSCount = 2;

    // for (var authorName in authors) {
    //     var author = authors[authorName];
    //     author.fsEntry = mkdir(authorName, []);
    //     authorsFSEntry.entries[authorName] = author.fsEntry;
    //     authorsFSCount++;
    //     for (var i=0; i<author.length; i++) {
    //         var c = author[i];
    //         if (!c ||!c.fsEntry) continue;
    //         var cEntry = mkfile(c.fsEntry.title);
    //         author.fsEntry.entries[c.sha] = cEntry;
    //         authorsFSCount++;
    //     }
    // }
    // console.timeLog("commits", "done with authors");

    var lineGeo = new THREE.Geometry();

    // var h = 4;
    // for (var authorName in authors) {
    //     var author = authors[authorName];
    //     var authorEntry = author.fsEntry;
    //     var color = new THREE.Color();
    //     color.setHSL((h%7)/7, 1, 0.5);
    //     h+=2;
    //     author.color = color;
    //     // for (var i=0; i<author.length; i++) {
    //         // var commit = author[i];
    //         // if (commit && commit.fsEntry && author.fsEntry && author.fsEntry.entries[commit.sha]) {
    //         // 	addLineBetweenEntries(lineGeo, color, window.processModel, commit.fsEntry, window.authorModel, author.fsEntry.entries[commit.sha]);
    //         // }
    //     // }
    // }

    // var touchedFilesIndex = {};

    // for (var i in commitsRoot.entries.Commits.entries) {
    //     var commitFSEntry = commitsRoot.entries.Commits.entries[i];
    //     utils.traverseFSEntry(commitFSEntry, function(fsEntry, fullPath) {
    //         if (/^\/Commits\/.{40}\/Files\//.test(fullPath) && fsEntry.entries === null) {
    //             var sha = fullPath.substring(9, 49);
    //             var path = fullPath.substring(55);
    //             var filePath = repoPrefix + path;
    //             var fileEntry = getPathEntry(fileTree, filePath);
    //             if (fileEntry) {
    //                 if (!touchedFilesIndex[filePath]) touchedFilesIndex[filePath] = fileEntry;
    //                 var author = authors[commitIndex[sha].author.name];
    //                 // addLineBetweenEntries(lineGeo, author.color, window.processModel, commitFSEntry, window.model, fileEntry);
    //             }
    //         }
    //     }, commitsRoot.name+"/Commits/");
    // }
    // var touchedFiles = Object.keys(touchedFilesIndex).sort().map(k => touchedFilesIndex[k]);

    lineGeo.vertices.push(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
    lineGeo.colors.push(new THREE.Color(0,0,0), new THREE.Color(0,0,0));

    return {commits, commitIndex, authors, lineGeo, touchedFiles};
}
