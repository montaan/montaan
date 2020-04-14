import { PortugalLAUs } from './PortugalLAUs';
import { PortugalCOVIDTree, PortugalCOVIDCaseLinks } from './PortugalCOVIDTree';
import { PortugalCOVIDCases } from './PortugalCOVIDCases';
import { NUTSNames, getNUTSName } from './NUTS';

test('Load Portugal population example', () => {
	const tree = PortugalCOVIDTree;
	const caseLinks = PortugalCOVIDCaseLinks;
	const cases = PortugalCOVIDCases;
	const laus = PortugalLAUs;
	const nuts = NUTSNames;
	expect(getNUTSName('PT111', 0)).toEqual('Portugal');
	expect(getNUTSName('PT111', 1)).toEqual('Continente');
	expect(getNUTSName('PT111', 2)).toEqual('Norte');
	expect(getNUTSName('PT111', 3)).toEqual('Alto Minho');
	const lau = laus.find((lau) => lau[2] === 'Fermentelos');
	expect(lau).not.toBeUndefined();
	expect(tree).not.toBeUndefined();
	expect(nuts).not.toBeUndefined();
	if (lau) {
		expect(lau[0]).toEqual('PT16D');
		expect(lau[1]).toEqual('010109');
	}
	expect(nuts.get('PT111')).toEqual('Alto Minho');
});
