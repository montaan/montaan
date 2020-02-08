#!/usr/bin/env node

const fs = require('fs');

const target = process.argv[3] || 'components';
const name = process.argv[2];

const source = fs.readFileSync(`src/${target}/${name}/${name}.tsx`).toString();
const propsRe = new RegExp(`^(export )?interface ${name}Props (.|\n[^\\}])+\n\\}`, 'm');
const interfaceRe = new RegExp(`^(export )?interface (.|\n[^\\}])+\n\\}`, 'mg');
const typeRe = new RegExp(`^(export )?type [a-zA-Z0-9_-] = .+$`, 'g');
const declareRe = new RegExp(`^declare (.|\n[^\\}])+\n\\}`, 'mg');
const props = source.match(propsRe)[0];
const interfaces = source.match(interfaceRe);
const types = source.match(typeRe);
const declares = source.match(declareRe);
console.log(props);
console.log(interfaces);
console.log(types);
console.log(declares);
