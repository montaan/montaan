#!/usr/bin/env yarn ts-node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline-sync';
import glob from 'glob';

const rl = readline;

export function copyFolderSync(from: string, to: string): void {
	fs.mkdirSync(to);
	fs.readdirSync(from).forEach((element) => {
		if (fs.lstatSync(path.join(from, element)).isFile()) {
			fs.copyFileSync(path.join(from, element), path.join(to, element));
		} else {
			copyFolderSync(path.join(from, element), path.join(to, element));
		}
	});
}

export interface TemplateParameters {
	whatIsIt: string;
	whyIsIt: string;
	usedBy: string;
	props: string;
	propsUse: string;
	target: string;
	name: string;
	author: string;
}

if (!module.parent) {
	const USAGE = `USAGE: makeComponent [-t TEMPLATE] TARGET_DIR [COMPONENT_NAME]

	Creates pre-populated component directories based on templates/component or templates/TEMPLATE
	
	Examples:
	
	Create component MyComponent in src/Montaan/
	
		makeComponent Montaan MyComponent
	
	Create component Footer in src/containers/
	
		makeComponent containers Footer
	
	Create component Home in src/screens/
	
		makeComponent screens Home
	`;

	const args = process.argv.slice(2);
	const template = args[0] === '-t' ? args.splice(0, 2)[1] : 'component';
	const target = args.shift();
	let name = args.shift();

	if (!target) {
		console.error(USAGE);
		process.exit(1);
	}
	if (!name) {
		console.log(``);
		console.log(`Let's do it! What's the name of your component?`);
		name = rl.prompt();
		if (!name) {
			console.error(USAGE);
			process.exit(1);
		}
	}

	const targetPath = path.join('src', target, name);
	if (fs.existsSync(targetPath)) {
		console.error(`Error: ${targetPath} already exists`);
		process.exit(2);
	}

	copyFolderSync(path.join('templates', template), targetPath);

	const authorString = getGitAuthor();
	const templateParams = readTemplateParameters(target, name, authorString);
	const files = glob.sync(path.join(targetPath, '**/*.*'));
	files.forEach((file) => applyTemplate(file, templateParams));

	const entryPoint = files.find((file) => /\/NAME\.([tj]sx?)$/.test(file));
	if (entryPoint) {
		console.log(
			`Your component is at: ${entryPoint.replace(/(\/[^/]*)NAME([^/]*)$/, `$1${name}$2`)}`
		);
		console.log(``);
	}
}

export function getGitAuthor() {
	const author = execSync('git config --get user.name')
		.toString()
		.replace(/\s+$/, '');
	const email = execSync('git config --get user.email')
		.toString()
		.replace(/\s+$/, '');
	const authorString = `${author} <${email}>`;
	return authorString;
}

export function readTemplateParameters(
	target: string,
	name: string,
	authorString: string
): TemplateParameters {
	console.log(``);
	console.log(`Creating ${target}/${name} with author ${authorString}`);
	console.log(``);
	console.log('Documentation time! Fill in the blanks, hitting enter after each blank.');
	console.log(`${name} component is ____ <WHAT DOES IT DO?> for ____ <WHY DOES IT EXIST?>`);
	console.log(``);
	console.log('First, what does this component do?');
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
	console.log(
		'Enter an initial props or constructor interface, e.g. foo:string; bar:boolean; OR count:number, array:boolean[]'
	);
	console.log(``);
	const props = rl.prompt();

	console.log(``);
	console.log(
		"Enter a props or constructor use example, e.g. foo='fizzle' bar={false} OR 3, [true, true, false]"
	);
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

export function applyTemplate(file: string, template: TemplateParameters) {
	const { whatIsIt, whyIsIt, usedBy, props, propsUse, target, name, author } = template;
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
