#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

const target = process.argv[3] || 'components';
const name = process.argv[2];

console.log(`Parsing src/${target}/${name}/${name}.tsx`);
const source = fs.readFileSync(`src/${target}/${name}/${name}.tsx`).toString();

const propsRe = new RegExp(`^(export )?interface ${name}Props (.|\n[^\\}])+\n\\}`, 'mg');
const interfaceRe = new RegExp(`^(export )?interface (.|\n[^\\}])+\n\\}`, 'mg');
const typeRe = new RegExp(`^(export )?type [a-zA-Z0-9_-] = .+$`, 'g');
const declareRe = new RegExp(`^declare (.|\n[^\\}])+\n\\}`, 'mg');
const props = source.match(propsRe);
const interfaces = source.match(interfaceRe);
const types = source.match(typeRe);
const declares = source.match(declareRe);

const apiHTML = `
${props ? `<h5>Props</h5><pre><code>{\`${props.join('\n')}\`}</code></pre>` : ''}
${interfaces ? `<h5>Interfaces</h5><pre><code>{\`${interfaces.join('\n')}\`}</code></pre>` : ''}
${types ? `<h5>Types</h5><pre><code>{\`${types.join('\n')}\`}</code></pre>` : ''}
${declares ? `<h5>Declares</h5><pre><code>{\`${declares.join('\n')}\`}</code></pre>` : ''}
`;

const apiCode = `
${props ? `### Props\n\`\`\`tsx\n${props.join('\n')}\n\`\`\`` : ''}
${interfaces ? `### Interfaces\n\`\`\`tsx\n${interfaces.join('\n')}\n\`\`\`` : ''}
${types ? `### Types\n\`\`\`tsx\n${types.join('\n')}\n\`\`\`` : ''}
${declares ? `### Declares\n\`\`\`tsx\n${declares.join('\n')}\n\`\`\`` : ''}
`;

console.log(`Updating src/${target}/${name}/${name}.stories.tsx`);
const storiesSource = fs.readFileSync(`src/${target}/${name}/${name}.stories.tsx`).toString();
const newStories = storiesSource.replace(
	/<h4>API<\/h4>[.|\n]+^\t\t<\/div>/m,
	'<h4>API</h4>' + apiHTML + '\n\t\t</div>'
);
fs.writeFileSync(`src/${target}/${name}/${name}.stories.tsx`, newStories);
execSync(`yarn prettier --write "src/${target}/${name}/${name}.stories.tsx"`);

console.log(`Updating src/${target}/${name}/README.md`);
const readme = fs.readFileSync(`src/${target}/${name}/README.md`).toString();
const newReadme = readme.replace(/^## API\s*$[.|\n]*/m, '## API\n\n' + apiCode);
fs.writeFileSync(`src/${target}/${name}/README.md`, newReadme);
execSync(`yarn prettier --write "src/${target}/${name}/README.md"`);

console.log('Component updated');
