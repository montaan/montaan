#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

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

const name = process.argv[2];
const target = process.argv[3] || 'Montaan';

if (!name) {
	console.error(USAGE);
	process.exit(1);
}

const author = execSync('git config --get user.name');
const email = execSync('git config --get user.email');

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

/*
#!/bin/bash

# FIXME Port this to JS to benefit from JS tooling.

NAME=$1
TARGET=Montaan
AUTHOR=$(echo `git config --get user.name` '<'`git config --get user.email`'>')

if [ -z $1 ]
then
	echo "USAGE: makeComponent COMPONENT_NAME [TARGET_DIR]"
	echo ""
	echo "Creates pre-populated component directories based on templates/component"
	echo ""
	echo "Examples:"
	echo ""
	echo "Create component MyComponent in src/Montaan/"
	echo ""
	echo "    makeComponent MyComponent"
	echo "    OR"
	echo "    makeComponent MyComponent Montaan"
	echo ""
	echo "Create component Footer in src/containers/"
	echo ""
	echo "    makeComponent Footer containers"
	echo ""
	echo "Create component Home in src/screens/"
	echo ""
	echo "    makeComponent Home screens"
	echo ""
	exit 1
fi

if [ ! -z $2 ]
then
	TARGET=$2
fi

if [ ! -e src/"$TARGET"/"$NAME" ]
then
	echo "Creating $TARGET/$NAME with author $AUTHOR"
	echo
	echo "Documentation time! Fill in the blanks, hitting enter after each blank."
	echo "$NAME component is ____ <WHAT DOES IT DO?> for ____ <WHY DOES IT EXIST?>"
	echo
	read -e WHAT_IS_IT
	echo
	echo "Thanks! And now the why-part:"
	echo
	read -e WHY_IS_IT
	echo
	echo "Great job, one more question:"
	echo
	echo "$NAME component is used by ____ <WHAT USES IT?>"
	echo
	read -e USED_BY
	echo
	echo "Superior job old bean! Almost there now!"
	echo
	echo "Enter an initial prop interface, e.g. foo:string; bar:boolean;"
	echo
	read -e PROPS
	echo
	echo "Enter a props use example, e.g. foo='fizzle' bar={false}"
	echo
	read -e PROPS_USE
	echo
	echo "Thank you so much, your component is going to be awesome!"
	echo
	mkdir -p src/"$TARGET" &&
	cp -r templates/component src/"$TARGET"/"$NAME"/ &&
	sed -i '' -e s/PROPS_USE/"$PROPS_USE"/g src/"$TARGET"/"$NAME"/*.*
	sed -i '' -e s/PROPS/"$PROPS"/g src/"$TARGET"/"$NAME"/*.*
	sed -i '' -e s/WHAT_IS_IT/"$WHAT_IS_IT"/g src/"$TARGET"/"$NAME"/*.*
	sed -i '' -e s/WHY_IS_IT/"$WHY_IS_IT"/g src/"$TARGET"/"$NAME"/*.*
	sed -i '' -e s/USED_BY/"$USED_BY"/g src/"$TARGET"/"$NAME"/*.*
	sed -i '' -e s/TARGET/"$TARGET"/g src/"$TARGET"/"$NAME"/*.*
	sed -i '' -e s/NAME/"$NAME"/g src/"$TARGET"/"$NAME"/*.*
	sed -i '' -e s/AUTHOR/"$AUTHOR"/g src/"$TARGET"/"$NAME"/*.*
	sed -i '' -e 's/;;/;/g' src/"$TARGET"/"$NAME"/*.*
	(cd src/"$TARGET"/"$NAME"/ &&
		for f in `find . | fgrep NAME`
		do
			mv "$f" "$(echo $f | sed -e s/NAME/"$NAME"/g)"
		done &&
		yarn prettier --write *.*)
	echo "Everything done!"
else
	echo Component "$NAME" already exists in "$TARGET";
	exit 1
fi
*/
