import { FSEntry } from './filesystem';

export default class NavTarget {
	static mock: NavTarget = new NavTarget(new FSEntry(), [], '');

	fsEntry: FSEntry;
	coords: number[];
	search: string;

	constructor(fsEntry: FSEntry, coords: number[] = [], search: string = '') {
		this.fsEntry = fsEntry;
		this.coords = coords;
		this.search = search;
	}
}
