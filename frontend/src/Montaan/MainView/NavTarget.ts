import { FSEntry, createFSTree } from '../lib/filesystem';

export default class NavTarget {
	static mock: NavTarget = new NavTarget(createFSTree('', ''), [], '');

	fsEntry: FSEntry;
	coords: number[];
	search: string;

	constructor(fsEntry: FSEntry, coords: number[] = [], search: string = '') {
		this.fsEntry = fsEntry;
		this.coords = coords;
		this.search = search;
	}
}
