react-component-benchmark
https://buildtracker.dev/
https://sentry.io/welcome/
componentDidCatch
https://astexplorer.net/
Use TypeScript compiler to automate coding & docs & tests:

-   Pull type defs to top of file
-   Grab all exports
-   Use function parameters type to generate tests
-   Make generators for native types & use interface declarations to auto-generate generators for interfaces

Via @RReverser

```bash
git config --global diff.wasm.textconv 'wasm2wat --enable-all --generate-names'

# And add this to your global .gitattributes:

*.wasm diff=wasm

# Congrats, now you have readable `git diff` on *.wasm binaries!

```

Bar graph of commits per day

```js
const cp = require('child_process');
const out = cp.execSync('git log --numstat').toString();
const commits = out.split('\ncommit ');
const cds = commits.map((commit) => ({
	date: new Date((commit.match(/^Date:\s+(.+)$/m) || [])[1]),
	changes: (commit.match(/^(\d+)\t(\d+)/gm) || []).map((c) =>
		c.split('\t').map((s) => parseInt(s))
	),
}));
cds.sort((a, b) => a.date - b.date);
function getDay(d) {
	return [d.getFullYear(), d.getMonth() + 1, d.getDate()].join('-');
}
const dates = new Map();
cds.forEach((cd) => {
	const key = getDay(cd.date);
	let d = dates.get(key);
	if (!d) {
		d = [];
		dates.set(key, d);
	}
	d.push(cd);
});
const changesPerDay = Array.from(dates.entries()).map((dcd) => [
	dcd[0],
	dcd[1].reduce(
		(s, i) => {
			const sum = i.changes.reduce((s, i) => [s[0] + i[0], s[1] + i[1]], [0, 0]);
			return [s[0] + sum[0], s[1] + sum[1]];
		},
		[0, 0]
	),
]);
console.log(
	changesPerDay
		.map(([d, [add, remove]]) => `${d}\t${''.padEnd((add - remove) / 10, '#')}`)
		.join('\n')
);
```
