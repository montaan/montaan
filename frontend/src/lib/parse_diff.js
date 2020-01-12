
export function authorCmp(a, b) {
    return a.name.localeCompare(b.name) || a.email.localeCompare(b.email);
}

export function span(className='', content='') {
    var el = document.createElement('span');
    el.className = className;
    el.textContent = content;
    return el;
}

export function parseDiff(diff) {
    /*
    1. It is preceded with a "git diff" header that looks like this:

        diff --git a/file1 b/file2

    The a/ and b/ filenames are the same unless rename/copy is involved. Especially, even for a
    creation or a deletion, /dev/null is not used in place of the a/ or b/ filenames.

    When rename/copy is involved, file1 and file2 show the name of the source file of the rename/copy
    and the name of the file that rename/copy produces, respectively.

    2. It is followed by one or more extended header lines:

        old mode <mode>
        new mode <mode>
        deleted file mode <mode>
        new file mode <mode>
        copy from <path>
        copy to <path>
        rename from <path>
        rename to <path>
        similarity index <number>
        dissimilarity index <number>
        index <hash>..<hash> <mode>

    File modes are printed as 6-digit octal numbers including the file type and file permission bits.

    Path names in extended headers do not include the a/ and b/ prefixes.

    The similarity index is the percentage of unchanged lines, and the dissimilarity index is the
    percentage of changed lines. It is a rounded down integer, followed by a percent sign. The
    similarity index value of 100% is thus reserved for two equal files, while 100% dissimilarity
    means that no line from the old file made it into the new one.

    The index line includes the SHA-1 checksum before and after the change. The <mode> is included if
    the file mode does not change; otherwise, separate lines indicate the old and the new mode.

    */
    const lines = diff.split("\n");
    const changes = [];
    var currentChange = { cmd: '', newMode: '', index: '', srcPath: '', dstPath: '', changes: [] };
    var pos = null;
    var parsePos = function(posMatch, line) {
        if (!posMatch) console.log(line, lines);
        pos = {
            previous: {line: parseInt(posMatch[1]), lineCount: parseInt(posMatch[3])},
            current: {line: parseInt(posMatch[4]), lineCount: parseInt(posMatch[6])},
        };
        currentChange.changes.push({pos, lines: [line.substring(posMatch[0].length)]});
    };
    var parseCmd = function(line) {
        currentChange = { cmd: '', newMode: '', index: '', srcPath: '', dstPath: '', changes: [] };
        pos = null;
        currentChange.cmd = line;
    };
    lines.forEach(line => {
        if (/^diff/.test(line)) {
            if (currentChange.cmd) changes.push(currentChange);
            parseCmd(line);
        }
        else if (line.charCodeAt(0) === 64) {
            var posMatch = line.match(/^@@ -(\d+)(,(\d+))? \+(\d+)(,(\d+))? @@/);
            if (!posMatch) posMatch = ['', 0, 0, 0, 0, 0, 0];
            parsePos(posMatch, line);
        }
        else if (/^(dis)?similarity index /.test(line)) currentChange.similarity = line;
        else if (/^(new|deleted|old) /.test(line)) currentChange.newMode = line;
        else if (/^copy from /.test(line)) currentChange.srcPath = '/'+line.substring(10);
        else if (/^copy to /.test(line)) currentChange.dstPath = '/'+line.substring(8);
        else if (/^rename from /.test(line)) currentChange.srcPath = '/'+line.substring(12);
        else if (/^rename to /.test(line)) currentChange.dstPath = '/'+line.substring(10);
        else if (/^index /.test(line)) currentChange.index = line;
        else if (/^Binary /.test(line)) parsePos(['', 0, 0, 0, 0, 0, 0], line);
        else if (!pos && /^\-\-\- /.test(line)) currentChange.srcPath = line.substring(5);
        else if (!pos && /^\+\+\+ /.test(line)) currentChange.dstPath = line.substring(5);
        else if (pos) currentChange.changes[currentChange.changes.length-1].lines.push(line);
    });
    if (currentChange.cmd) changes.push(currentChange);
    return changes;
}

function showFileToggleOnClick(ev) {
    ev.preventDefault();
    this.showFile(this.sha, this.path, this);
}

export function formatDiff(sha, diff, trackedPaths, trackedIndex, showFile) {
    const container = span();
    const changes = parseDiff(diff);
    changes.forEach(change => {
        const inPath = (change.dstPath !== 'dev/null') && trackedPaths.some(path => change.dstPath.startsWith(path));
        if (inPath) {
            var path = change.dstPath;
            if (!trackedIndex[path]) {
                trackedPaths.push(path);
                trackedIndex[path] = true;
            }
            if (change.srcPath !== 'dev/null') {
                path = change.srcPath;
                if (!trackedIndex[path]) {
                    trackedPaths.push(path);
                    trackedIndex[path] = true;
                }
            }
        }
        const changeEl = span(inPath ? '' : 'collapsed');
        container.append(changeEl);
        const showFileToggle = span('commit-show-file', 'Show file');
        showFileToggle.path = change.dstPath;
        showFileToggle.sha = sha;
        showFileToggle.showFile = showFile;
        showFileToggle.onmousedown = showFileToggleOnClick;
        changeEl.append(
            showFileToggle,
            span('prev', change.srcPath),
            span('cur', change.dstPath)
        );
        change.changes.forEach(({pos, lines}) => {
            changeEl.append(span('pos', `-${pos.previous.line},${pos.previous.lineCount} +${pos.current.line},${pos.current.lineCount}`));
            if (change.dstPath !== 'dev/null') {
                lines.forEach(line => {
                    var lineClass = '';
                    if (line.startsWith("+")) lineClass = 'add';
                    else if (line.startsWith("-")) lineClass = 'sub';
                    changeEl.appendChild(span(lineClass, line));
                });
            }
        });
    });
    return container;
}

export function createCalendar(dates) {
    var createYear = function(year) {
        const el = document.createElement('div');
        el.className = 'calendar-year';
        el.dataset.year = year;
        for (var i = 0; i < 12; i++) {
            var monthEl = span('calendar-month');
            var week = 0;
            for (var j = 0; j < 31; j++) {
                var dateString = `${year}-${i<9?'0':''}${i+1}-${j<9?'0':''}${j+1}`;
                var date = new Date(Date.parse(dateString));
                if (date.getUTCMonth() === i) {
                    var day = date.getUTCDay();
                    var dayEl = span('calendar-day');
                    dayEl.dataset.day = day;
                    dayEl.dataset.week = week;
                    dayEl.dataset.commitCount = 0;
                    dayEl.dataset.date = dateString;
                    monthEl.appendChild(dayEl);
                    if (day === 0) week++;
                }
            }
            el.appendChild(monthEl);
        }
        return el;
    };
    const el = document.createElement('div');
    el.className = 'calendar';
    var years = {};
    dates.forEach(d => {
        const year = d.getUTCFullYear();
        const month = d.getUTCMonth();
        const date = d.getUTCDate();
        if (!years[year]) {
            years[year] = createYear(year);
            el.appendChild(years[year]);
        }
        years[year].childNodes[month].childNodes[date-1].dataset.commitCount++;
    });
    return el;
}
