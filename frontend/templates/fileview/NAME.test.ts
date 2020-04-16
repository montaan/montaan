// src/TARGET/NAME/NAME.test.ts

import NAME from './';
import { BBox } from '../../Geometry/Geometry';
import NavTarget from '../../NavTarget/NavTarget';
import { FSEntry } from '../../Filesystems';
import QFrameAPI from '../../../lib/api';
import { Mesh, Vector3, Object3D } from 'three';

const getAsync = async (x: any) => {
	return x;
};

test('NAME constructs without crashing', async () => {
	const fileView = new NAME(new FSEntry(), new Mesh(), '', QFrameAPI.mock, () => {});
});

test('NAME public API smoke test', async () => {
	const fileView = new NAME(new FSEntry(), new Mesh(), '', QFrameAPI.mock, () => {});
	await fileView.goToCoords([0]);
	await fileView.goToSearch('');
	fileView.getHighlightRegion([0]);
	await fileView.load(getAsync(new ArrayBuffer(0)));
	await fileView.load(getAsync(undefined));
	fileView.onclick(
		new MouseEvent('click'),
		{ distance: 0, point: new Vector3(), object: new Object3D() },
		new BBox(),
		new NavTarget(new FSEntry())
	);
});
