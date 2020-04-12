import Colors from './Colors';
import { FSDirEntry, FSEntry } from '../Filesystems';

test('Colors sundry tests', () => {
	Colors.getFileColor(new FSEntry('README.md'));
	Colors.getDirectoryColor(new FSDirEntry('docs'));
});
