export function getNUTSName(nutsCode: string, level: number) {
	return NUTSNames.get(nutsCode.slice(0, level + 2)) || nutsCode.slice(0, level + 2);
}

export const NUTSNames = new Map([
	// Countries
	['PT', 'Portugal'],
	// NUTS1
	['PT1', 'Continente'],
	['PT2', 'Região Autónoma dos Açores'],
	['PT3', 'Região Autónoma da Madeira'],
	// NUTS2
	['PT11', 'Norte'],
	['PT15', 'Algarve'],
	['PT16', 'Centro'],
	['PT17', 'Área Metropolitana de Lisboa'],
	['PT18', 'Alentejo'],
	['PT20', 'Região Autónoma dos Açores'],
	['PT30', 'Região Autónoma da Madeira'],
	// NUTS3
	['PT111', 'Alto Minho'],
	['PT112', 'Cávado'],
	['PT119', 'Ave'],
	['PT11A', 'Área Metropolitana do Porto'],
	['PT11B', 'Alto Tâmega'],
	['PT11C', 'Tâmega e Sousa'],
	['PT11D', 'Douro'],
	['PT11E', 'Terras de Trás-os-Montes'],
	['PT150', 'Algarve'],
	['PT16B', 'Oeste'],
	['PT16D', 'Região de Aveiro'],
	['PT16E', 'Região de Coimbra'],
	['PT16F', 'Região de Leiria'],
	['PT16G', 'Viseu Dão-Lafões'],
	['PT16H', 'Beira Baixa'],
	['PT16I', 'Médio Tejo'],
	['PT16J', 'Beiras e Serra da Estrela'],
	['PT170', 'Área Metropolitana de Lisboa'],
	['PT181', 'Alentejo Litoral'],
	['PT184', 'Baixo Alentejo'],
	['PT185', 'Lezíria do Tejo'],
	['PT186', 'Alto Alentejo'],
	['PT187', 'Alentejo Central'],
	['PT200', 'Região Autónoma dos Açores'],
	['PT300', 'Região Autónoma da Madeira'],
]);
