#!/usr/bin/env yarn ts-node

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

if (!module.parent) {
	const target = process.argv[3] || 'Montaan';
	const name = process.argv[2];
	updateComponent(target, name);
}

export function updateComponent(target: string, name: string) {
	let componentPath = path.join('src', target, name, name + '.tsx');
	if (!fs.existsSync(componentPath)) {
		componentPath = path.join('src', target, name, name + '.ts');
	}
	if (!fs.existsSync(componentPath)) {
		return;
	}
	console.log(`Parsing ${componentPath}`);
	const source = fs.readFileSync(componentPath).toString();

	const propsRe = new RegExp(`^(export )?interface ${name}Props (.|\n[^\\}])+\n\\}`, 'mg');
	const exportsRe = new RegExp(
		`^export( default)? (((class|function|interface) \\S+)|((const|type|var|let) \\S+ = .*$))`,
		'mg'
	);
	const interfaceRe = new RegExp(`^(export )?interface (.|\n[^\\}])+\n\\}`, 'mg');
	const typeRe = new RegExp(`^(export )?type [a-zA-Z0-9_-] = .+$`, 'mg');
	const declareRe = new RegExp(`^declare (.|\n[^\\}])+\n\\}`, 'mg');
	const exports = source.match(exportsRe);
	const props = source.match(propsRe);
	const interfaces = source.match(interfaceRe);
	const types = source.match(typeRe);
	const declares = source.match(declareRe);

	function fillExport(statement: string) {
		if (/class|function|interface/.test(statement)) {
			return statement + ' {...}';
		} else {
			return statement
				.replace(/\{$/, '{...}')
				.replace(/\($/, '(...)')
				.replace(/\[$/, '[...]');
		}
	}

	const apiHTML = `
	${
		exports
			? `<h5>Exports</h5><pre><code>{\`${exports.map(fillExport).join('\n')}\`}</code></pre>`
			: ''
	}
	${props ? `<h5>Props</h5><pre><code>{\`${props.join('\n')}\`}</code></pre>` : ''}
	${interfaces ? `<h5>Interfaces</h5><pre><code>{\`${interfaces.join('\n')}\`}</code></pre>` : ''}
	${types ? `<h5>Types</h5><pre><code>{\`${types.join('\n')}\`}</code></pre>` : ''}
	${declares ? `<h5>Declares</h5><pre><code>{\`${declares.join('\n')}\`}</code></pre>` : ''}
	`;

	const apiCode = `
${exports ? `### Exports\n\`\`\`tsx\n${exports.join('\n')}\n\`\`\`` : ''}
${props ? `### Props\n\`\`\`tsx\n${props.join('\n')}\n\`\`\`` : ''}
${interfaces ? `### Interfaces\n\`\`\`tsx\n${interfaces.join('\n')}\n\`\`\`` : ''}
${types ? `### Types\n\`\`\`tsx\n${types.join('\n')}\n\`\`\`` : ''}
${declares ? `### Declares\n\`\`\`tsx\n${declares.join('\n')}\n\`\`\`` : ''}
	`;

	const storiesPath = path.join('src', target, name, name + '.stories.tsx');
	if (fs.existsSync(storiesPath)) {
		console.log(`Updating ${storiesPath}`);
		const storiesSource = fs.readFileSync(storiesPath).toString();
		const newStories = storiesSource.replace(
			/<h4>API<\/h4>(.|\n)*^\t\t<\/div>/m,
			'<h4>API</h4>' + apiHTML + '\n\t\t</div>'
		);
		fs.writeFileSync(storiesPath, newStories);
		execSync(`yarn prettier --write "${storiesPath}" && git add "${storiesPath}"`);
	}

	const readmePath = path.join('src', target, name, 'README.md');
	if (fs.existsSync(readmePath)) {
		console.log(`Updating ${readmePath}`);
		const readme = fs.readFileSync(readmePath).toString();
		const newReadme = readme.replace(/^## API\s*$(.|\n)*/m, '## API\n\n' + apiCode);
		fs.writeFileSync(readmePath, newReadme);
		execSync(`yarn prettier --write "${readmePath}" && git add "${readmePath}"`);
	}

	console.log('Component updated');
}
