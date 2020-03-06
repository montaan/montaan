#!yarn ts-node

import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline-sync';
import glob from 'glob';

const rl = readline;

const USAGE = `USAGE: makeComponent COMPONENT_NAME [TARGET_DIR]

Creates pre-populated component directories based on templates/component

Examples:

Create component MyComponent in src/Montaan/

    makeComponent MyComponent
    OR
    makeComponent MyComponent Montaan

Create component Footer in src/containers/

    makeComponent Footer containers

Create component Home in src/screens/

    makeComponent Home screens
`;

interface ComponentSketch {
	whatIsIt: string;
	whyIsIt: string;
	usedBy: string;
	props: string;
	propsUse: string;
	target: string;
	name: string;
	author: string;
}

const name = process.argv[2];
const target = process.argv[3] || 'Montaan';

if (!name) {
	console.error(USAGE);
	process.exit(1);
}

const targetPath = path.join('src', target, name);
if (fs.existsSync(targetPath)) {
	console.error(`Error: ${targetPath} already exists`);
	process.exit(2);
}

const author = execSync('git config --get user.name');
const email = execSync('git config --get user.email');

const authorString = `${author} <${email}>`;

function sketchComponent(target: string, name: string, authorString: string): ComponentSketch {
	console.log(`Creating ${target}/${name} with author ${authorString}`);
	console.log(``);
	console.log('Documentation time! Fill in the blanks, hitting enter after each blank.');
	console.log(`${name} component is ____ <WHAT DOES IT DO?> for ____ <WHY DOES IT EXIST?>`);
	console.log(``);
	const whatIsIt = rl.prompt();

	console.log(``);
	console.log('Thanks! And now the why-part:');
	console.log(``);
	const whyIsIt = rl.prompt();

	console.log(``);
	console.log('Great job, one more question:');
	console.log(``);
	console.log(`${name} component is used by ____ <WHAT USES IT?>`);
	console.log(``);
	const usedBy = rl.prompt();

	console.log(``);
	console.log('Superior job old bean! Almost there now!');
	console.log(``);
	console.log('Enter an initial prop interface, e.g. foo:string; bar:boolean;');
	console.log(``);
	const props = rl.prompt();

	console.log(``);
	console.log("Enter a props use example, e.g. foo='fizzle' bar={false}");
	console.log(``);
	const propsUse = rl.prompt();

	console.log(``);
	console.log('Thank you so much, your component is going to be awesome!');
	console.log(``);

	return {
		whatIsIt,
		whyIsIt,
		usedBy,
		props,
		propsUse,
		target,
		name,
		author: authorString,
	};
}

function applySketch(file: string, sketch: ComponentSketch) {
	const { whatIsIt, whyIsIt, usedBy, props, propsUse, target, name, author } = sketch;
	let s = fs.readFileSync(file).toString();
	const keys = [
		['PROPS_USE', propsUse],
		['PROPS', props],
		['WHAT_IS_IT', whatIsIt],
		['WHY_IS_IT', whyIsIt],
		['USED_BY', usedBy],
		['TARGET', target],
		['NAME', name],
		['AUTHOR', author],
		[';;', ';'],
	];
	keys.forEach(([key, value]) => (s = s.replace(new RegExp(key, 'g'), value)));
	fs.writeFileSync(file, s);
	if (/(\/[^/]*)NAME([^/]*)$/.test(file)) {
		fs.renameSync(file, file.replace(/(\/[^/]*)NAME([^/]*)$/, `$1${name}$2`));
	}
}

const sketch = sketchComponent(target, name, authorString);

fs.mkdirpSync(path.join('src', target));
fs.copyFileSync(path.join('templates', 'component'), targetPath);

const files = glob.sync(path.join(targetPath, '**/*.*'));
console.log(files);
files.forEach((file) => applySketch(file, sketch));
