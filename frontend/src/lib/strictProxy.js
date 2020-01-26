// Proxy that throws if trying to access undefined properties.

import Proxy from './proxy';

export default function strictProxy(obj, objName) {
	return new Proxy(obj, {
		get: function(receiver, name) {
			if (name in receiver) {
				return receiver[name];
			} else {
				throw new Error(`Property ${name} not defined in ${objName || receiver}`);
			}
		},
	});
}

export function warnProxy(obj, objName) {
	return new Proxy(obj, {
		get: function(receiver, name) {
			if (name in receiver) {
				return receiver[name];
			} else {
				console.error(`Property ${name} not defined in ${receiver}`);
			}
		},
	});
}
