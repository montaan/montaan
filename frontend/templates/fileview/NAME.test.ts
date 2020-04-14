// src/TARGET/NAME/NAME.test.ts

import NAME from './';
import { BBox } from '../../Geometry/Geometry';
import NavTarget from '../../NavTarget/NavTarget';
import { FSEntry } from '../../Filesystems';

const getAsync = async (x) => {
	return x;
};

test('NAME constructs without crashing', async () => {
	const fileView = new NAME(PROPS_USE);
});

test('NAME public API smoke test', async () => {
	const fileView = new NAME(PROPS_USE);
	await fileView.goToCoords([0]);
	await fileView.goToSearch('');
	fileView.getHighlightRegion([0]);
	await fileView.load(getAsync(new ArrayBuffer(0)));
	await fileView.load(getAsync(undefined));
	fileView.onclick(new MouseEvent('click'), {}, new BBox(), new NavTarget(new FSEntry()));
});
