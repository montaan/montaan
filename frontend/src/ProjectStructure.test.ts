import fs from 'fs';

test('Project directories have README.md', () => {
	const dirs = ['src'];

	while (dirs.length > 0) {
		const currentDir = dirs.shift()!;
		const files = fs.readdirSync(currentDir);
		// if (!files.includes('README.md')) {
		//     fs.writeFileSync(currentDir + '/' + 'README.md', '# ' + currentDir);
		// }
		expect(files).toContain('README.md');
		files.forEach((f) => {
			const fn = currentDir + '/' + f;
			if (fs.statSync(fn).isDirectory()) dirs.push(fn);
		});
	}
});
