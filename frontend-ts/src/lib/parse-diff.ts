export function authorCmp(a:string, b:string):number {
	return a.localeCompare(b);
}

export function span(className:string = '', content:string = ''):HTMLElement {
	var el = document.createElement('span');
	el.className = className;
	el.textContent = content;
	return el;
}

interface DiffFilePosition {
	line: number;
	lineCount: number;
}

interface DiffPosition {
	previous: DiffFilePosition;
	current: DiffFilePosition;
}

interface DiffChange {
	pos: DiffPosition;
	lines: string[];
}

interface DiffChangeSet {
	cmd: string;
	newMode: string;
	index: string;
	similarity: string;
	srcPath: string;
	dstPath: string;
	changes: DiffChange[];
}

export function parseDiff(diff:string):DiffChangeSet[] {
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
	const lines = diff.split('\n');
	const changes = [];
	var currentChange:DiffChangeSet = { cmd: '', similarity: '', newMode: '', index: '', srcPath: '', dstPath: '', changes: [] };
	var pos:DiffPosition|null = null;
	var parsePos = function(posMatch:RegExpMatchArray, line:string) {
		if (!posMatch) console.log(line, lines);
		pos = {
			previous: { line: parseInt(posMatch[1]), lineCount: parseInt(posMatch[3]) },
			current: { line: parseInt(posMatch[4]), lineCount: parseInt(posMatch[6]) }
		};
		currentChange.changes.push({ pos, lines: [line.substring(posMatch[0].length)] });
	};
	var parseCmd = function(line:string) {
		currentChange = { cmd: '', similarity: '', newMode: '', index: '', srcPath: '', dstPath: '', changes: [] };
		pos = null;
		currentChange.cmd = line;
	};
	lines.forEach((line) => {
		if (/^diff/.test(line)) {
			if (currentChange.cmd) changes.push(currentChange);
			parseCmd(line);
		} else if (line.charCodeAt(0) === 64) {
			var posMatch = line.match(/^@@ -(\d+)(,(\d+))? \+(\d+)(,(\d+))? @@/);
			if (!posMatch) posMatch = ['', '0', '0', '0', '0', '0', '0'];
			parsePos(posMatch, line);
		} else if (/^(dis)?similarity index /.test(line)) currentChange.similarity = line;
		else if (/^(new|deleted|old) /.test(line)) currentChange.newMode = line;
		else if (/^copy from /.test(line)) currentChange.srcPath = '/' + line.substring(10);
		else if (/^copy to /.test(line)) currentChange.dstPath = '/' + line.substring(8);
		else if (/^rename from /.test(line)) currentChange.srcPath = '/' + line.substring(12);
		else if (/^rename to /.test(line)) currentChange.dstPath = '/' + line.substring(10);
		else if (/^index /.test(line)) currentChange.index = line;
		else if (/^Binary /.test(line)) parsePos(['', '0', '0', '0', '0', '0', '0'], line);
		else if (!pos && /^--- /.test(line)) currentChange.srcPath = line.substring(5);
		else if (!pos && /^\+\+\+ /.test(line)) currentChange.dstPath = line.substring(5);
		else if (pos) currentChange.changes[currentChange.changes.length - 1].lines.push(line);
	});
	if (currentChange.cmd) changes.push(currentChange);
	return changes;
}

interface ShowFileHandler { (sha:string, previousSha:string, path:string, el:FileToggleElement) : void; }

interface FileToggleElement extends HTMLElement {
	sha: string;
	previousSha: string;
	path: string;
	showFile: ShowFileHandler;
	onmousedown(this:GlobalEventHandlers, ev:MouseEvent):any;
}

function showFileToggleOnClick(this:FileToggleElement, ev:MouseEvent) {
	ev.preventDefault();
	this.showFile(this.sha, this.previousSha, this.path, this);
}

export function formatDiff(sha:string, diff:string, trackedPaths:string[], previousSha:string, showFile:ShowFileHandler) {
	const container = span();
	const changes = parseDiff(diff);
	changes.forEach((change) => {
		const inPath =
			change.dstPath !== 'dev/null' &&
			trackedPaths.some((path) => change.dstPath.startsWith(path));
		const changeEl = span(inPath ? '' : 'collapsed');
		container.append(changeEl);
		const showFileToggle = <FileToggleElement>span('commit-show-file', 'Show file');
		showFileToggle.path = change.dstPath;
		showFileToggle.sha = sha;
		showFileToggle.previousSha = previousSha;
		showFileToggle.showFile = showFile;
		showFileToggle.onmousedown = showFileToggleOnClick;
		changeEl.append(showFileToggle, span('prev', change.srcPath), span('cur', change.dstPath));
		change.changes.forEach(({ pos, lines }) => {
			changeEl.append(
				span(
					'pos',
					`-${pos.previous.line},${pos.previous.lineCount} +${pos.current.line},${pos.current.lineCount}`
				)
			);
			if (change.dstPath !== 'dev/null') {
				lines.forEach((line) => {
					var lineClass = '';
					if (line.startsWith('+')) lineClass = 'add';
					else if (line.startsWith('-')) lineClass = 'sub';
					changeEl.appendChild(span(lineClass, line));
				});
			}
		});
	});
	return container;
}

export interface CalendarMouseEventHandler{ (this:GlobalEventHandlers, ev:MouseEvent):any }

export interface CalendarElement extends HTMLElement {
	authors: AuthorIndex;
	commitCount: number;
	authorCount: number;
}

export interface CommitFile {
	action: string;
	path: string;
	renamed?: string;
}

export interface Commit {
	sha: string;
	date: Date;
	author: string;
	message: string;
	files: CommitFile[];
	diff?: string;
}

interface AuthorIndex {
	[propType:string]:boolean;
}

export function createCalendar(commits:Commit[], yearOnClick:CalendarMouseEventHandler, monthOnClick:CalendarMouseEventHandler, dayOnClick:CalendarMouseEventHandler) {
	var createYear = function(year:number) {
		const el = <CalendarElement><unknown>document.createElement('div');
		el.className = 'calendar-year';
		el.authors = {};
		el.dataset.year = year.toString();
		el.commitCount = 0;
		el.authorCount = 0;
		el.onclick = yearOnClick;
		for (var i = 0; i < 12; i++) {
			var monthEl = <CalendarElement><unknown>span('calendar-month');
			monthEl.authors = {};
			monthEl.dataset.month = (i + 1).toString();
			monthEl.commitCount = 0;
			monthEl.authorCount = 0;
			monthEl.onclick = monthOnClick;
			var week = 0;
			for (var j = 0; j < 31; j++) {
				var dateString = `${year}-${i < 9 ? '0' : ''}${i + 1}-${j < 9 ? '0' : ''}${j + 1}`;
				var date = new Date(Date.parse(dateString));
				if (date.getUTCMonth() === i) {
					var day = date.getUTCDay();
					var dayEl = <CalendarElement><unknown>span('calendar-day');
					dayEl.onclick = dayOnClick;
					dayEl.dataset.date = (j + 1).toString();
					dayEl.dataset.day = day.toString();
					dayEl.dataset.week = week.toString();
					dayEl.commitCount = 0;
					dayEl.authorCount = 0;
					dayEl.dataset.fullDate = dateString;
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
	var years:{[propName:number]:CalendarElement} = {};
	var yearsArr = [];
	for (var i = 0; i < commits.length; i++) {
		const c = commits[i];
		const d = c.date;
		if (!d) {
			console.log(c);
			continue;
		}
		const year:number = d.getUTCFullYear();
		const month:number = d.getUTCMonth();
		const date:number = d.getUTCDate();
		if (!years[year]) {
			years[year] = createYear(year);
			yearsArr.push(year);
		}
		const yearEl = years[year];
		const monthEl = <CalendarElement>yearEl.childNodes[month];
		const dateEl = <CalendarElement>monthEl.childNodes[date - 1];
		dateEl.commitCount++;
		monthEl.commitCount++;
		yearEl.commitCount++;
		if (!yearEl.authors[c.author]) {
			yearEl.authors[c.author] = true;
			yearEl.authorCount++;
		}
		if (!monthEl.authors[c.author]) {
			monthEl.authors[c.author] = true;
			monthEl.authorCount++;
		}
		if (!dateEl.authors[c.author]) {
			dateEl.authors[c.author] = true;
			dateEl.authorCount++;
		}
	}
	yearsArr
		.sort((a, b) => b - a)
		.forEach((year) => {
			years[year].querySelectorAll('span').forEach(el => {
				const cel = <CalendarElement>el;
				cel.dataset.commitCount = cel.commitCount.toString();
				cel.dataset.authorCount = cel.authorCount.toString();
			});
			years[year].dataset.commitCount = years[year].commitCount.toString();
			years[year].dataset.authorCount = years[year].authorCount.toString();
			el.appendChild(years[year]);
		});
	return el;
}
