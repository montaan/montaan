export function getPathEntry(fileTree, path) {
    path = path.replace(/\/+$/, '');
    var segments = path.split("/");
    while (segments[0] === "") {
        segments.shift();
    }
    var branch = fileTree;
    var parent;
    for (var i=0; i<segments.length; i++) {
        var segment = segments[i];
        branch = branch.entries[segment];
        if (!branch) {
            return null;
        }
    }
    return branch;
};

export function getFullPath(fsEntry) {
    if (!fsEntry.parent) return '';
    return getFullPath(fsEntry.parent) + '/' + fsEntry.name;
};

export function getSiblings(fileTree, path) {
    path = path.replace(/\/[^\/]+\/*$/, '');
    var fsEntry = getPathEntry(fileTree, path);
    return Object.keys(fsEntry.entries).map(n => path +'/'+ n);
};

