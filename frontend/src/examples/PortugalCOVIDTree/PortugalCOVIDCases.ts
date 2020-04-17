const rawPortugalCOVIDCases: { [date: string]: string | Map<string, number> } = {
	'2020-3-3': new Map([
		['Porto', 2],
		['Lisboa', 1],
		['Coimbra', 1],
	]),

	'2020-3-4': new Map([
		['Porto', 3],
		['Lisboa', 2],
		['Coimbra', 1],
	]),

	'2020-3-5': new Map([
		['Porto', 5],
		['Lisboa', 3],
		['Coimbra', 1],
	]),

	'2020-3-6': new Map([
		['Porto', 8],
		['Lisboa', 4],
		['Coimbra', 1],
	]),

	'2020-3-7': new Map([
		['Porto', 15],
		['Lisboa', 5],
		['Coimbra', 1],
	]),

	'2020-3-8': new Map([
		['Porto', 22],
		['Lisboa', 6],
		['Coimbra', 1],
		['Algarve', 1],
	]),

	'2020-3-9': new Map([
		['Porto', 27],
		['Lisboa', 9],
		['Coimbra', 1],
		['Algarve', 2],
	]),

	'2020-3-10': new Map([
		['Porto', 27],
		['Lisboa', 10],
		['Coimbra', 2],
		['Algarve', 2],
	]),

	'2020-3-11': new Map([
		['Porto', 36],
		['Lisboa', 17],
		['Coimbra', 3],
		['Algarve', 3],
	]),

	'2020-3-12': new Map([
		['Porto', 44],
		['Lisboa', 23],
		['Coimbra', 5],
		['Algarve', 5],
	]),

	'2020-3-13': new Map([
		['Porto', 53],
		['Lisboa', 46],
		['Coimbra', 6],
		['Algarve', 6],
	]),

	'2020-3-14': new Map([
		['Porto', 77],
		['Lisboa', 73],
		['Coimbra', 8],
		['Algarve', 7],
	]),

	'2020-3-15': new Map([
		['Porto', 103],
		['Lisboa', 116],
		['Coimbra', 10],
		['Algarve', 10],
		['Açores', 1],
	]),

	'2020-3-16': new Map([
		['Porto', 138],
		['Lisboa', 142],
		['Coimbra', 31],
		['Algarve', 13],
		['Açores', 1],
	]),

	'2020-3-17': new Map([
		['Porto', 196],
		['Lisboa', 180],
		['Coimbra', 51],
		['Algarve', 14],
		['Açores', 1],
	]),

	'2020-3-18': new Map([
		['Porto', 289],
		['Lisboa', 243],
		['Coimbra', 74],
		['Algarve', 21],
		['Alentejo', 2],
		['Açores', 3],
		['Madeira', 1],
	]),

	'2020-3-19': new Map([
		['Porto', 381],
		['Coimbra', 86],
		['Lisboa', 278],
		['Alentejo', 2],
		['Algarve', 25],
		['Açores', 3],
		['Madeira', 1],
	]),

	'2020-3-20': new Map([
		['Porto', 506],
		['Coimbra', 106],
		['Lisboa', 364],
		['Alentejo', 2],
		['Algarve', 29],
		['Açores', 3],
		['Madeira', 1],
	]),

	'2020-3-21': new Map([
		['Porto', 644],
		['Coimbra', 137],
		['Lisboa', 448],
		['Alentejo', 3],
		['Algarve', 31],
		['Açores', 3],
		['Madeira', 5],
	]),

	'2020-3-22': new Map([
		['Porto', 825],
		['Coimbra', 180],
		['Lisboa', 534],
		['Alentejo', 5],
		['Algarve', 35],
		['Açores', 4],
		['Madeira', 7],
	]),

	'2020-3-23': new Map([
		['Porto', 1007],
		['Coimbra', 238],
		['Lisboa', 737],
		['Alentejo', 5],
		['Algarve', 42],
		['Açores', 11],
		['Madeira', 9],
	]),

	'2020-3-24': `CONCELHO NÚMERO DE
CASOS
Lisboa 175
Porto 126
Maia 104
Vila Nova de Gaia 68
Valongo 65
Gondomar 56
Ovar 55
Matosinhos 54
Cascais 39
Sintra 39
Coimbra 34
Santa Maria da Feira 33
Almada 31
Lousada 29
Loures 24
Amadora 21
Braga 21
Seixal 21
Felgueiras 17
Oeiras 16
Guimarães 15
Odivelas 14
Vila Nova de Famalicão 12
Oliveira de Azeméis 11
Funchal 10
Santarém 9
Espinho 8
Faro 8
Portimão 8
Vila do Conde 8
Mafra 7
Paredes 7
Santo Tirso 7
Setúbal 7
Viana do Castelo 7
CONCELHO NÚMERO DE
CASOS
Aveiro 6
Penafiel 6
Viseu 6
Albergaria-a-Velha 5
Albufeira 5
Barreiro 5
Montijo 5
Paços de Ferreira 5
Vila Franca de Xira 5
Bragança 4
Cartaxo 4
Coruche 4
Évora 4
Moita 4
Sesimbra 4
Vila Real 4
Águeda 3
Alcochete 3
Arcos de Valdevez 3
Barcelos 3
Câmara de Lobos 3
Chaves 3
Condeixa-a-Nova 3
Guarda 3
Lagoa (Faro) 3
Marco de Canaveses 3
Mirandela 3
Pombal 3
Silves 3
Soure 3
Vale de Cambra 3
`,
	'2020-3-25': `CONCELHO NÚMERO DE CASOS
	Lisboa 187
	Porto 137
	Maia 119
	Vila Nova de Gaia 83
	Valongo 71
	Gondomar 62
	Ovar 58
	Matosinhos 56
	Cascais 43
	Sintra 43
	Coimbra 41
	Santa Maria da Feira 39
	Almada 35
	Seixal 29
	Loures 28
	Lousada 27
	Braga 25
	Amadora 24
	Odivelas 18
	Oliveira de Azeméis 18
	Felgueiras 17
	Guimarães 17
	Oeiras 17
	Vila Nova de Famalicão 14
	Viseu 11
	Funchal 10
	Paços de Ferreira 10
	Espinho 9
	Faro 9
	Santarém 9
	Setúbal 9
	Vila Real 9
	Albufeira 8
	Mafra 8
	Paredes 8
	CONCELHO NÚMERO DE CASOS
	Santo Tirso 8
	Vila do Conde 8
	Penafiel 7
	Portimão 7
	Viana do Castelo 7
	Aveiro 6
	Barreiro 6
	Vila Franca de Xira 6
	Albergaria-a-Velha 5
	Évora 5
	Moita 5
	Bragança 4
	Cartaxo 4
	Coruche 4
	Marco de Canaveses 4
	Montijo 4
	Sesimbra 4
	Vale de Cambra 4
	Águeda 3
	Alcochete 3
	Almeirim 3
	Arcos de Valdevez 3
	Barcelos 3
	Câmara de Lobos 3
	Chaves 3
	Condeixa-a-Nova 3
	Guarda 3
	Lagoa (Faro) 3
	Mirandela 3
	Ourém 3
	Pombal 3
	Silves 3
	Soure 3
	`,

	'2020-3-26': `CONCELHO NÚMERO DE
	CASOS
	Lisboa 284
	Porto 259
	Vila Nova de Gaia 163
	Maia 157
	Ovar 119
	Gondomar 114
	Valongo 100
	Braga 98
	Coimbra 87
	Matosinhos 81
	Aveiro 46
	Santa Maria da Feira 45
	Cascais 44
	Vila Nova de Famalicão 44
	Guimarães 41
	Almada 35
	Lousada 33
	Amadora 31
	Seixal 29
	Loures 28
	Oliveira de Azeméis 26
	Faro 25
	Felgueiras 24
	Albergaria-a-Velha 21
	Ilha da Madeira 20
	Viseu 20
	Bragança 19
	Paços de Ferreira 19
	Viana do Castelo 19
	Albufeira 18
	Odivelas 18
	Oeiras 17
	Paredes 16
	Portimão 16
	Barcelos 15
	CONCELHO NÚMERO DE
	CASOS
	Espinho 13
	Póvoa de Varzim 13
	Santo Tirso 13
	Pombal 12
	Vila do Conde 12
	Penafiel 11
	Águeda 10
	Ílhavo 10
	Santarém 9
	Setúbal 9
	Arcos de Valdevez 8
	Évora 8
	Loulé 8
	Mafra 8
	Sintra 8
	Trofa 8
	Vila Real 8
	Ilha S. Jorge 7
	Leiria 7
	Soure 7
	Amares 6
	Barreiro 6
	Estarreja 6
	Grândola 6
	Ilha Terceira 6
	Marco de Canavezes 6
	Marinha Grande 6
	Oliveira do Bairro 6
	Vila Franca de Xira 6
	Esposende 5
	Fafe 5
	Ilha de S. Miguel 5
	Mirandela 5
	Moita 5
	Ponte de Lima 5
	CONCELHO
NÚMERO DE
CASOS
Silves 5
Cantanhede 4
Cartaxo 4
Condeixa-a-Nova 4
Coruche 4
Lagos 4
Montemor-oVelho 4
Montijo 4
Póvoa de
Lanhoso 4
Sesimbra 4
Alcochete 3
Almeirim 3
Alvaiázere 3
Caminha 3
Chaves 3
Ilha do Faial 3
Ilha do Pico 3
Macedo de
Cavaleiros 3
Nelas 3
Ourém 3
Resende 3
São João da
Madeira 3
Vagos 3
Vale de Cambra 3
Vila Real de
Santo António 3
	`,

	'2020-3-27': `
	CONCELHO NÚMERO DE
CASOS
Porto 317
Lisboa 284
Vila Nova de Gaia 262
Maia 171
Gondomar 149
Ovar 145
Braga 131
Coimbra 109
Valongo 108
Matosinhos 107
Aveiro 55
Santa Maria da Feira 54
Guimarães 51
Vila Nova de Famalicão 48
Cascais 44
Lousada 38
Almada 35
Vila Real 34
Amadora 31
Oliveira de Azeméis 30
Seixal 29
Albergaria-a-Velha 28
Loures 28
Felgueiras 26
Faro 26
Albufeira 22
Paços de Ferreira 22
Viseu 21
Barcelos 20
Bragança 20
Santo Tirso 20
Ilha da Madeira 20
Viana do Castelo 19
Paredes 18
Odivelas 18
CONCELHO NÚMERO DE
CASOS
Espinho 17
Oeiras 17
Portimão 17
Póvoa de Varzim 15
Vila do Conde 15
Loulé 14
Pombal 13
Ílhavo 12
Penafiel 11
Águeda 10
Estarreja 9
Resende 9
São João da Madeira 9
Santarém 9
Setúbal 9
Arcos de Valdevez 8
Montemor-o-Velho 8
Trofa 8
Évora 8
Mafra 8
Sintra 8
Amares 7
Leiria 7
Oliveira do Bairro 7
Póvoa de Lanhoso 7
Soure 7
Ilha S. Jorge 7
Marco de Canavezes 6
Marinha Grande 6
Mirandela 6
Barreiro 6
Grândola 6
Ilha Terceira 6
Vila Franca de Xira 6
Condeixa-a-Nova 5
CONCELHO
NÚMERO DE
CASOS
Esposende 5
Fafe 5
Ponte de Lima 5
Vale de Cambra 5
Vila Verde 5
Ilha de S. Miguel 5
Moita 5
Silves 5
Vila Real S. António 5
Anadia 4
Cantanhede 4
Macedo de
Cavaleiros
4
Murtosa 4
Penacova 4
Vagos 4
Cartaxo 4
Coruche 4
Lagoa 4
Montijo 4
Sesimbra 4
Almeida 3
Alvaiázere 3
Amarante 3
Caminha 3
Chaves 3
Figueira da Foz 3
Nelas 3
Torre de
Moncorvo
3
Vizela 3
Alcochete 3
Almeirim 3
Ilha do Faial 3
Ilha do Pico 3
Ourém 3
	`,

	'2020-3-28': `
	Lisboa 366
Porto 343
Vila Nova de Gaia 262
Maia 219
Matosinhos 189
Gondomar 153
Braga 152
Ovar 145
Valongo 139
Sintra 116
Coimbra 110
Santa Maria da Feira 103
Vila Real 98
Cascais 81
Aveiro 62
Seixal 59
Loures 57
Almada 53
Guimarães 51
Vila Nova de Famalicão 48
Oeiras 47
Odivelas 46
Oliveira de Azeméis 46
Amadora 41
Lousada 38
Resende 32
Albergaria-a-Velha 28
Faro 26
Felgueiras 26
Bragança 25
Mafra 24
Santo Tirso 24
Viana do Castelo 24
Vila do Conde 22
Paços de Ferreira 22
Albufeira 22
Paredes 21
Viseu 21
Santarém 20
Barcelos 20
Espinho 18
Barreiro 18
CONCELHO
NÚMERO DE
CASOS
Portimão 17
Funchal 16
Vila Franca de Xira 16
Estarreja 15
Póvoa de Varzim 15
Setúbal 15
Vale de Cambra 15
Trofa 14
Águeda 13
Cartaxo 13
Loulé 13
Penafiel 13
Pombal 13
São João da Madeira 13
Torres Vedras 13
Évora 12
Ílhavo 12
Chaves 10
Moita 10
Vila Verde 10
Marco de Canaveses 9
Montijo 9
Amares 8
Arouca 8
Caldas da Rainha 8
Mirandela 8
Montemor-o-Velho 8
Almeirim 7
Arcos de Valdevez 7
Cantanhede 7
Esposende 7
Leiria 7
Marinha Grande 7
Oliveira do Bairro 7
Póvoa de Lanhoso 7
Sesimbra 7
Soure 7
Benavente 6
Condeixa-a-Nova 6
Grândola 6
Tomar 6
Fafe 5
Murtosa 5
Palmela 5
Ponte de Lima 5
Silves 5
Vagos 5
Velas 5
Vila Real de Santo António 5
Alvaiázere 4
Amarante 4
Anadia 4
Calheta (Açores) 4
Câmara de Lobos 4
Coruche 4
Horta 4
Macedo de Cavaleiros 4
Nelas 4
Ourém 4
Vizela 4
Almeida 3
Alcochete 3
Alpiarça 3
Caminha 3
Carrazeda de Ansiães 3
Figueira da Foz 3
Lagoa (Faro) 3
Madalena 3
Monção 3
Oliveira de Frades 3
Penacova 3
Torre de Moncorvo 3
Reguengos de Monsaraz 3
Torres Novas 3
Vila Pouca de Aguiar 3
	`,

	'2020-3-29': `
	CONCELHO NÚMERO DE
CASOS
Lisboa 594
Porto 417
Vila Nova de Gaia 351
Maia 296
Matosinhos 254
Gondomar 242
Braga 208
Coimbra 199
Valongo 184
Ovar 159
Sintra 148
Santa Maria da Feira 136
Cascais 110
Vila Real 103
Aveiro 95
Oeiras 74
Guimarães 70
Oliveira de Azeméis 67
Seixal 66
Almada 64
Loures 64
Odivelas 63
Vila Nova de Famalicão 61
Amadora 53
Lousada 42
Santo Tirso 42
Bragança 38
Felgueiras 37
Paredes 34
Viana do Castelo 33
Albergaria-a-Velha 32
Vila do Conde 32
Paços de Ferreira 31
Barcelos 29
Trofa 29
São João da Madeira 28
Espinho 27
Mafra 27
Resende 26
Vale de Cambra 24
Funchal 23
Santarém 22
Vila Franca de Xira 22
CONCELHO NÚMERO DE
CASOS
Penafiel 21
Évora 20
Faro 20
Setúbal 20
Viseu 20
Albufeira 19
Lagos 18
Pombal 18
Portimão 18
Barreiro 17
Estarreja 16
Póvoa de Varzim 16
Águeda 15
Loulé 15
Marco de Canaveses 15
Vila Verde 14
Benavente 13
Condeixa-a-Nova 13
Ílhavo 12
Moita 12
Póvoa de Lanhoso 12
Cartaxo 11
Chaves 11
Montijo 11
Torres Vedras 11
Arouca 10
Leiria 10
Mirandela 10
Montemor-o-Velho 10
Sesimbra 10
Amares 9
Oliveira do Bairro 9
Arcos de Valdevez 9
Cantanhede 8
Esposende 8
Almeirim 7
Marinha Grande 7
Oliveira de Frades 7
Palmela 7
CONCELHO
NÚMERO DE
CASOS
Ponta Delgada 7
Câmara de Lobos 6
Murtosa 6
Soure 6
Velas 6
Amarante 5
Angra do Heroísmo 5
Fafe 5
Macedo de Cavaleiros 5
Ourém 5
Peso da Régua 5
Ponta do Sol 5
Silves 5
Vagos 5
Vila Real de Santo António 5
Vizela 5
Alvaiázere 4
Anadia 4
Baião 4
Calheta 4
Coruche 4
Horta 4
Lamego 4
Mealhada 4
Nelas 4
Santa Cruz 4
Sines 4
Alcochete 3
Alpiarça 3
Caldas da Rainha 3
Caminha 3
Carrazeda de Ansiães 3
Cinfães 3
Figueira da Foz 3
Grândola 3
Lousã 3
CONCELHO
NÚMERO DE
CASOS
Madalena 3
Miranda do Corvo 3
Monção 3
Olhão 3
Penacova 3
Ponte de Lima 3
Reguengos de Monsaraz 3
São Pedro do Sul 3
Sever do Vouga 3
Tomar 3
Valpaços 3
Vila da Praia da Vitória 3
Vila Pouca de Aguiar 3
Vimioso 3
	`,

	'2020-3-30': `
	CONCELHO NÚMERO DE
CASOS
Porto 941
Lisboa 633
Vila Nova de Gaia 344
Maia 313
Matosinhos 295
Gondomar 276
Ovar 241
Coimbra 229
Braga 213
Valongo 202
Sintra 159
Santa Maria da Feira 154
Cascais 119
Vila Real 115
Aveiro 95
Oeiras 79
Guimarães 75
Loures 72
Oliveira de Azeméis 71
Vila Nova de Famalicão 71
Almada 68
Seixal 68
Odivelas 64
Amadora 63
Albergaria-a-Velha 50
Bragança 44
Lousada 44
Santo Tirso 44
Felgueiras 42
Vila do Conde 39
Viana do Castelo 36
Paços de Ferreira 35
Paredes 35
Barcelos 35
São João da Madeira 32
Mafra 31
Trofa 30
Espinho 29
Viseu 28
Resende 27
Santarém 26
Vale de Cambra 25
Póvoa de Varzim 24
CONCELHO NÚMERO DE
CASOS
Setúbal 24
Vila Franca de Xira 24
Funchal 23
Barreiro 23
Estarreja 23
Castro Daire 22
Penafiel 22
Albufeira 21
Évora 21
Faro 21
Pombal 19
Portimão 19
Vila Nova de Foz Côa 19
Lagos 18
Marco de Canaveses 18
Águeda 18
Ílhavo 18
Loulé 17
Condeixa-a-Nova 15
Vila Verde 15
Torres Vedras 13
Cartaxo 13
Arouca 12
Benavente 12
Chaves 12
Moita 12
Montemor-o-Velho 12
Póvoa de Lanhoso 12
Montijo 11
Sesimbra 11
Leiria 10
Mirandela 10
Oliveira do Bairro 10
Amares 9
Almeirim 9
Palmela 9
Tomar 9
Arcos de Valdevez 9
Cantanhede 8
Esposende 8
Soure 8
Caldas da Rainha 8
Marinha Grande 7
Oliveira de Frades 7
Ponta Delgada 7
Figueira da Foz 7
Abrantes 7
Macedo de Cavaleiros 7
Amarante 6
Câmara de Lobos 6
Horta 6
Murtosa 6
Peso da Régua 6
Velas 6
Grândola 6
Santiago do Cacém 6
Almeida 6
Fafe 6
Angra do Heroísmo 5
Cinfães 5
Coruche 5
Nelas 5
Ourém 5
Ponta do Sol 5
Silves 5
Vagos 5
Vila da Praia da Vitória 5
Vila Real de Santo António 5
Vizela 5
Anadia 5
Mealhada 5
Penacova 5
Trancoso 5
Ponte de Lima 5
Dados até dia 29 | MARÇO | 2020 | 24:00
Atualizado a 30 | MARÇO | 2020 | 11:00
CONCELHO NÚMERO DE
CASOS
Alvaiázere 4
Baião 4
Calheta 4
Guarda 4
Lamego 4
Lousã 4
Miranda do Corvo 4
Rio Maior 4
Santa Cruz 4
Sines 4
Reguengos de Monsaraz 4
Alenquer 4
Torres Novas 4
Seia 4
Melgaço 4
Alcochete 3
Alpiarça 3
Caminha 3
Carrazeda de Ansiães 3
Góis 3
Madalena 3
Monção 3
Olhão 3
Porto Santo 3
São Pedro do Sul 3
São Roque do Pico 3
Sever do Vouga 3
Valpaços 3
Vila Pouca de Aguiar 3
Vimioso 3
Peniche 3
Alcanena 3
Azambuja 3
Vieira do Minho 3
Torre de Moncorvo 3
	`,

	'2020-3-31': `
	CONCELHO NÚMERO DE
CASOS
Lisboa 505
Porto 462
Vila Nova de Gaia 338
Gondomar 298
Maia 293
Matosinhos 273
Braga 220
Valongo 210
Sintra 167
Ovar 159
Coimbra 157
Santa Maria da Feira 148
Cascais 133
Vila Real 121
Vila Nova de
Famalicão 93
Loures 84
Guimarães 81
Seixal 71
Almada 71
Aveiro 70
Oeiras 70
Odivelas 66
Amadora 62
Oliveira de Azeméis 59
Lousada 52
Bragança 48
Felgueiras 45
Santo Tirso 43
Paredes 42
Paços de Ferreira 40
Barcelos 39
Barreiro 37
Resende 35
Vila do Conde 34
Mafra 34
Viana do Castelo 33
CONCELHO NÚMERO DE
CASOS
Albergaria-a-Velha 31
Trofa 31
Penafiel 31
Albufeira 30
Santarém 27
Faro 26
São João da Madeira 25
Espinho 25
Vila Verde 25
Setúbal 25
Loulé 23
Vale de Cambra 22
Moita 22
Vila Franca de Xira 22
Pombal 21
Portimão 21
Estarreja 20
Condeixa-a-Nova 19
Viseu 19
Funchal 18
Marco de Canaveses 17
Évora 15
Póvoa de Varzim 15
Póvoa de Lanhoso 14
Ílhavo 14
Águeda 14
Montijo 14
Torres Vedras 13
Arouca 12
Montemor-o-Velho 12
Amares 11
Mirandela 11
Cantanhede 11
Palmela 11
Esposende 10
Chaves 10
CONCELHO NÚMERO DE
CASOS
Sesimbra 10
Vila Real de Santo
António 9
Arcos de Valdevez 9
Cartaxo 9
Oliveira do Bairro 9
Almeirim 8
Vizela 8
Amarante 8
Macedo de
Cavaleiros 7
Soure 7
Coruche 7
Benavente 7
Marinha Grande 7
Fafe 7
Oliveira de Frades 6
Murtosa 6
Horta 6
Santiago do Cacém 6
Câmara de Lobos 6
Silves 6
Leiria 6
Calheta 5
Velas 5
Ponta do Sol 5
Penacova 5
Lousã 5
Monção 5
Vila da Praia da
Vitória 5
Vagos 5
Lamego 5
Anadia 5
Ourém 5
Alvaiázere 4
Melgaço 4
Nelas 4
Alcochete 4
CONCELHO NÚMERO DE
CASOS
Rio Maior 4
Alenquer 4
Santa Cruz 4
São Roque do Pico 3
Góis 3
Vimioso 3
Carrazeda de Ansiães 3
Madalena 3
Vila Nova de Poiares 3
Alpiarça 3
Reguengos de
Monsaraz 3
Vieira do Minho 3
Vila Pouca de Aguiar 3
Miranda do Corvo 3
Sines 3
Grândola 3
Valpaços 3
São Pedro do Sul 3
Peso da Régua 3
Caminha 3
Cinfães 3
Mealhada 3
Lagoa 3
Tavira 3
Tomar 3
Guarda 3
Olhão 3
Figueira da Foz 3
	`,

	'2020-4-1': `
	CONCELHO NÚMERO DE
CASOS
Lisboa 546
Porto 505
Vila Nova de Gaia 387
Gondomar 337
Maia 328
Matosinhos 303
Braga 245
Valongo 233
Ovar 194
Sintra 192
Coimbra 164
Santa Maria da Feira 162
Cascais 134
Vila Real 124
Loures 101
Vila Nova de Famalicão 99
Guimarães 89
Aveiro 87
Seixal 79
Almada 79
Oeiras 78
Odivelas 72
Amadora 68
Oliveira de Azeméis 67
Barcelos 55
Lousada 52
Felgueiras 50
Bragança 49
Santo Tirso 48
Paços de Ferreira 47
Paredes 44
Vila do Conde 39
Barreiro 38
Pombal 36
Resende 36
Mafra 35
Trofa 35
CONCELHO NÚMERO DE
CASOS
Viana do Castelo 34
Albergaria-a-Velha 32
Penafiel 32
Albufeira 31
Setúbal 31
Vila Verde 30
Moita 29
Faro 28
Santarém 28
São João da Madeira 28
Espinho 26
Estarreja 26
Vila Franca de Xira 26
Loulé 25
Vale de Cambra 23
Portimão 22
Póvoa de Varzim 21
Viseu 21
Condeixa-a-Nova 20
Funchal 20
Marco de Canaveses 20
Águeda 19
Montijo 19
Ílhavo 18
Leiria 18
Póvoa de Lanhoso 17
Cantanhede 15
Évora 15
Arouca 14
Montemor-o-Velho 13
Amares 13
Torres Vedras 13
Arcos de Valdevez 11
Chaves 11
Mirandela 11
Palmela 11
Vizela 11
CONCELHO NÚMERO DE
CASOS
Benavente 10
Esposende 10
Oliveira do Bairro 10
Sesimbra 10
Amarante 9
Ourém 9
Vila Real de Santo António 9
Almeirim 8
Fafe 8
Marinha Grande 8
Soure 8
Câmara de Lobos 7
Coruche 7
Macedo de Cavaleiros 7
Murtosa 7
Nelas 7
Horta 6
Lamego 6
Lousã 6
Oliveira de Frades 6
Santiago do Cacém 6
Silves 6
Alcochete 5
Alenquer 5
Alvaiázere 5
Anadia 5
Calheta 5
Mealhada 5
Melgaço 5
Miranda do Corvo 5
Monção 5
Olhão 5
Penacova 5
Peso da Régua 5
Ponta do Sol 5
Reguengos de Monsaraz 5
Vagos 5
CONCELHO NÚMERO DE
CASOS
Velas 5
Vila da Praia da Vitória 5
Baião 4
Castro Daire 4
Cinfães 4
Madalena 4
Porto Santo 4
Rio Maior 4
Santa Cruz 4
Vieira do Minho 4
Vimioso 4
Alcobaça 3
Alpiarça 3
Caminha 3
Carrazeda de Ansiães 3
Celorico de Basto 3
Figueira da Foz 3
Góis 3
Grândola 3
Guarda 3
Lagoa 3
Mortágua 3
Peniche 3
São Pedro do Sul 3
São Roque do Pico 3
Sines 3
Tavira 3
Tomar 3
Trancoso 3
Valença 3
Valpaços 3
Vila Nova de Poiares 3
Vila Pouca de Aguiar 3
	`,

	'2020-4-2': `
	CONCELHO NÚMERO DE
CASOS
Lisboa 594
Porto 556
Vila Nova de Gaia 418
Gondomar 373
Maia 361
Matosinhos 347
Braga 280
Valongo 275
Sintra 224
Ovar 209
Coimbra 178
Santa Maria da Feira 174
Cascais 149
Aveiro 127
Vila Real 124
Loures 109
Vila Nova de Famalicão 107
Guimarães 99
Oeiras 93
Almada 86
Seixal 85
Odivelas 83
Amadora 79
Oliveira de Azeméis 71
Barcelos 65
Felgueiras 56
Lousada 55
Santo Tirso 54
Bragança 52
Barreiro 49
Paços de Ferreira 48
Paredes 46
Trofa 42
Vila do Conde 39
Mafra 37
Penafiel 37
Resende 37
CONCELHO NÚMERO DE
CASOS
Pombal 36
Vila Verde 36
Albergaria-a-Velha 34
Albufeira 34
Viana do Castelo 34
Setúbal 33
Faro 32
Estarreja 31
São João da Madeira 30
Vila Franca de Xira 30
Moita 29
Santarém 29
Espinho 27
Loulé 25
Condeixa-a-Nova 24
Ílhavo 23
Póvoa de Varzim 23
Vale de Cambra 23
Viseu 22
Marco de Canaveses 21
Montijo 21
Portimão 21
Águeda 20
Funchal 20
Leiria 19
Cantanhede 18
Amares 17
Póvoa de Lanhoso 17
Évora 15
Torres Vedras 15
Arouca 14
Montemor-o-Velho 13
Arcos de Valdevez 12
Benavente 12
Amarante 11
Chaves 11
Esposende 11
CONCELHO NÚMERO DE
CASOS
Mirandela 11
Palmela 11
Vila Real de Santo
António 11
Vizela 11
Oliveira do Bairro 10
Cartaxo 9
Marinha Grande 9
Ourém 9
Peso da Régua 9
Sesimbra 9
Almeirim 8
Fafe 8
Lamego 8
Macedo de Cavaleiros 8
Soure 8
Alenquer 7
Câmara de Lobos 7
Coruche 7
Lousã 7
Murtosa 7
Nelas 7
Oliveira de Frades 7
Silves 7
Horta 6
Miranda do Corvo 6
Penacova 6
Santiago do Cacém 6
Vagos 6
Vieira do Minho 6
Alcochete 5
Alvaiázere 5
Anadia 5
Calheta 5
Castro Daire 5
Mealhada 5
Melgaço 5
Monção 5
CONCELHO NÚMERO DE
CASOS
Vila Praia da Vitória 5
Velas 5
Reguengos de
Monsaraz 5
Ponta do Sol 5
Penacova 5
Olhão 5
Baião 4
Cinfães 4
Figueira da Foz 4
Madalena 4
Peniche 4
Porto Santo 4
Rio Maior 4
Santa Cruz 4
São Pedro do Sul 4
Sines 4
Tomar 4
Vimioso 4
Alcobaça 3
Alpiarça 3
Caminha 3
Carrazeda de Ansiães 3
Celorico de Basto 3
Góis 3
Grândola 3
Guarda 3
Lagoa 3
Mortágua 3
Paredes de Coura 3
Salvaterra de Magos 3
São Roque do Pico 3
Serpa 3
Tavira 3
Valença 3
Valpaços 3
Vila Nova de Poiares 3
Vila Pouca de Aguiar 3
	`,

	'2020-4-3': `
	CONCELHO NÚMERO DE
CASOS
Lisboa 634
Porto 606
Vila Nova de Gaia 449
Gondomar 424
Maia 390
Matosinhos 368
Valongo 308
Braga 305
Sintra 242
Ovar 220
Coimbra 201
Santa Maria da Feira 187
Cascais 174
Aveiro 130
Vila Real 124
Loures 117
Vila Nova de Famalicão 110
Guimarães 105
Oeiras 100
Seixal 92
Almada 91
Odivelas 86
Amadora 82
Oliveira de Azeméis 75
Barcelos 70
Felgueiras 66
Paços de Ferreira 64
Lousada 60
Santo Tirso 58
Paredes 56
Barreiro 53
Bragança 53
Albergaria-a-Velha 52
Trofa 45
Vila Verde 41
Vila do Conde 40
Penafiel 39
Albufeira 38
Viana do Castelo 38
Mafra 37
Resende 37
CONCELHO NÚMERO DE
CASOS
Pombal 36
Faro 34
Setúbal 34
Vila Franca de Xira 34
Estarreja 33
São João da Madeira 31
Moita 29
Santarém 29
Condeixa-a-Nova 28
Espinho 28
Póvoa de Varzim 27
Loulé 26
Ílhavo 25
Vale de Cambra 25
Marco de Canaveses 24
Viseu 24
Portimão 23
Águeda 22
Montijo 22
Leiria 21
Funchal 20
Cantanhede 19
Alvaiázere 17
Amares 17
Póvoa de Lanhoso 17
Torres Vedras 16
Évora 15
Arouca 14
Montemor-o-Velho 14
Benavente 13
Amarante 12
Arcos de Valdevez 12
Chaves 11
Esposende 11
Mirandela 11
Palmela 11
Vila Real de Santo António 11
Vizela 11
Oliveira do Bairro 10
CONCELHO NÚMERO DE
CASOS
Ourém 10
Sesimbra 10
Cartaxo 9
Fafe 9
Marinha Grande 9
Peso da Régua 9
Alenquer 8
Almeirim 8
Lamego 8
Macedo de Cavaleiros 8
Nelas 8
Soure 8
Anadia 7
Câmara de Lobos 7
Coruche 7
Figueira da Foz 7
Lousã 7
Mealhada 7
Melgaço 7
Murtosa 7
Olhão 7
Oliveira de Frades 7
Penacova 7
Reguengos de Monsaraz 7
Silves 7
Vagos 7
Vila da Praia da Vitória 7
Horta 6
Miranda do Corvo 6
Santiago do Cacém 6
Vieira do Minho 6
Alcochete 5
Baião 5
Calheta 5
Castro Daire 5
Monção 5
Peniche 5
Ponta do Sol 5
Velas 5
CONCELHO NÚMERO DE
CASOS
Vinhais 5
Batalha 4
Caminha 4
Cinfães 4
Góis 4
Guarda 4
Madalena 4
Porto Santo 4
Rio Maior 4
Santa Cruz 4
São Pedro do Sul 4
Tomar 4
Vimioso 4
Alcobaça 3
Alpiarça 3
Beja 3
Carrazeda de Ansiães 3
Carregal do Sal 3
Castelo de Paiva 3
Celorico de Basto 3
Figueiró dos Vinhos 3
Gouveia 3
Grândola 3
Lagoa 3
Mortágua 3
Paredes de Coura 3
Salvaterra de Magos 3
São Roque do Pico 3
Serpa 3
Sines 3
Tavira 3
Torres Novas 3
Valença 3
Valpaços 3
Vila Nova de Poiares 3
Vila Pouca de Aguiar 3
	`,

	'2020-4-4': `
	CONCELHO NÚMERO DE
CASOS
Lisboa 654
Porto 643
Vila Nova de Gaia 468
Gondomar 447
Maia 404
Matosinhos 386
Braga 333
Valongo 320
Sintra 254
Ovar 222
Coimbra 216
Santa Maria da Feira 212
Cascais 187
Aveiro 140
Vila Real 127
Loures 126
Vila Nova de Famalicão 121
Guimarães 120
Oeiras 116
Almada 111
Seixal 96
Odivelas 93
Amadora 91
Barcelos 83
Oliveira de Azeméis 82
Felgueiras 72
Paços de Ferreira 69
Paredes 66
Lousada 64
Santo Tirso 64
Barreiro 54
Albergaria-a-Velha 53
Bragança 52
Vila do Conde 47
Ílhavo 45
Trofa 43
Penafiel 42
Resende 42
Vila Verde 41
Albufeira 39
Mafra 39
CONCELHO NÚMERO DE
CASOS
Viana do Castelo 39
Santarém 38
Faro 36
Setúbal 36
Pombal 35
Vila Franca de Xira 35
Estarreja 34
São João da Madeira 32
Vale de Cambra 31
Moita 30
Póvoa de Varzim 30
Condeixa-a-Nova 29
Viseu 29
Espinho 28
Loulé 26
Marco de Canaveses 26
Águeda 24
Alvaiázere 22
Benavente 22
Cantanhede 22
Leiria 22
Montijo 22
Portimão 22
Póvoa de Lanhoso 21
Funchal 20
Arcos de Valdevez 19
Torres Vedras 19
Amares 17
Amarante 15
Arouca 15
Évora 15
Vila Real de Santo
António 15
Esposende 14
Montemor-o-Velho 14
Ourém 14
Chaves 13
Mirandela 12
Sesimbra 12
Vizela 12
CONCELHO NÚMERO DE
CASOS
Oliveira do Bairro 11
Palmela 11
Anadia 10
Cartaxo 10
Fafe 10
Silves 10
Alenquer 9
Coruche 9
Figueira da Foz 9
Marinha Grande 9
Nelas 9
Peso da Régua 9
Rio Maior 9
Almeirim 8
Lamego 8
Macedo de Cavaleiros 8
Soure 8
Vieira do Minho 8
Alcochete 7
Câmara de Lobos 7
Lousã 7
Mealhada 7
Melgaço 7
Olhão 7
Oliveira de Frades 7
Penacova 7
Reguengos de Monsaraz 7
Vagos 7
Vila da Praia da Vitória 7
Caminha 6
Castro Daire 6
Horta 6
Miranda do Corvo 6
Monção 6
Murtosa 6
Ponta do Sol 6
Santiago do Cacém 6
São Pedro do Sul 6
Tavira 6
CONCELHO NÚMERO DE
CASOS
Alcobaça 5
Baião 5
Peniche 5
Ponte de Lima 5
Velas 5
Vinhais 5
Batalha 4
Cabeceiras de Basto 4
Calheta 4
Celorico de Basto 4
Góis 4
Guarda 4
Madalena 4
Porto Santo 4
Salvaterra de Magos 4
Santa Cruz 4
Sever do Vouga 4
Sines 4
Tomar 4
Torres Novas 4
Vimioso 4
Alpiarça 3
Ansião 3
Beja 3
Bombarral 3
Carrazeda de Ansiães 3
Castelo de Paiva 3
Cinfães 3
Grândola 3
Paredes de Coura 3
São Roque do Pico 3
Serpa 3
Valença 3
Valpaços 3
Vila Nova de Poiares 3
Vila Pouca de Aguiar 3
	`,

	'2020-4-5': `
	CONCELHO NÚMERO DE
CASOS
Lisboa 681
Porto 660
Vila Nova de Gaia 499
Gondomar 478
Maia 422
Matosinhos 395
Braga 349
Valongo 344
Sintra 269
Ovar 238
Coimbra 216
Santa Maria da Feira 216
Cascais 190
Vila Nova de Famalicão 143
Aveiro 141
Loures 131
Vila Real 129
Guimarães 127
Almada 121
Oeiras 120
Seixal 101
Amadora 99
Odivelas 95
Felgueiras 91
Paredes 91
Barcelos 90
Oliveira de Azeméis 84
Paços de Ferreira 84
Lousada 81
Santo Tirso 73
Bragança 64
Albergaria-a-Velha 54
Barreiro 54
Ílhavo 54
Penafiel 49
Viana do Castelo 49
Trofa 48
Vila do Conde 47
Resende 45
Vila Verde 43
Mafra 42
Albufeira 40
CONCELHO NÚMERO DE
CASOS
Santarém 38
Faro 37
Setúbal 37
Estarreja 36
Vila Franca de Xira 36
Pombal 35
Loulé 33
Vale de Cambra 33
Viseu 33
São João da Madeira 32
Espinho 31
Moita 31
Póvoa de Varzim 30
Condeixa-a-Nova 29
Marco de Canaveses 27
Águeda 24
Benavente 23
Montijo 23
Portimão 23
Alvaiázere 22
Cantanhede 22
Leiria 22
Amarante 21
Arcos de Valdevez 21
Póvoa de Lanhoso 21
Torres Vedras 21
Funchal 20
Amares 18
Chaves 16
Arouca 15
Évora 15
Ourém 15
Vila Real de Santo
António 15
Vizela 15
Esposende 14
Mirandela 14
Montemor-o-Velho 14
Sesimbra 13
Cartaxo 12
Fafe 12
Torre de Moncorvo 12
CONCELHO NÚMERO DE
CASOS
Anadia 11
Oliveira do Bairro 11
Palmela 11
Tavira 11
Macedo de Cavaleiros 10
Marinha Grande 10
Silves 10
Alenquer 9
Coruche 9
Figueira da Foz 9
Lamego 9
Nelas 9
Peso da Régua 9
Rio Maior 9
Vieira do Minho 9
Vinhais 9
Almeirim 8
Castro Daire 8
Mealhada 8
Reguengos de Monsaraz 8
Soure 8
Vagos 8
Alcochete 7
Baião 7
Câmara de Lobos 7
Caminha 7
Lousã 7
Melgaço 7
Olhão 7
Oliveira de Frades 7
Penacova 7
Vila da Praia da Vitória 7
Celorico de Basto 6
Horta 6
Miranda do Corvo 6
Monção 6
Murtosa 6
Ponta do Sol 6
Ponte de Lima 6
Santiago do Cacém 6
São Pedro do Sul 6
CONCELHO NÚMERO DE
CASOS
Vimioso 6
Alcobaça 5
Cabeceiras de Basto 5
Peniche 5
Porto Santo 5
Sever do Vouga 5
Tomar 5
Velas 5
Batalha 4
Calheta (Açores) 4
Castelo de Paiva 4
Góis 4
Guarda 4
Madalena 4
Salvaterra de Magos 4
Santa Cruz 4
Serpa 4
Sines 4
Torres Novas 4
Valença 4
Alpiarça 3
Ansião 3
Beja 3
Bombarral 3
Carrazeda de Ansiães 3
Cinfães 3
Grândola 3
Lagoa (Faro) 3
Lagos 3
Moimenta da Beira 3
Paredes de Coura 3
São Roque do Pico 3
Terras de Bouro 3
Valpaços 3
Vila Flor 3
Vila Nova de Poiares 3
Vila Pouca de Aguiar 3
	`,

	'2020-4-6': `
	CONCELHO NÚMERO DE
CASOS
Lisboa 699
Porto 689
Vila Nova de Gaia 518
Gondomar 489
Maia 444
Matosinhos 400
Valongo 364
Braga 358
Sintra 278
Ovar 224
Santa Maria da Feira 224
Coimbra 222
Cascais 197
Vila Nova de Famalicão 145
Aveiro 142
Guimarães 131
Loures 130
Vila Real 129
Almada 125
Oeiras 125
Amadora 107
Seixal 102
Paredes 96
Odivelas 95
Felgueiras 94
Barcelos 93
Paços de Ferreira 92
Lousada 87
Oliveira de Azeméis 86
Santo Tirso 82
Viana do Castelo 68
Bragança 65
Trofa 56
Albergaria-a-Velha 54
Barreiro 54
Ílhavo 54
Penafiel 53
Vila do Conde 47
Resende 45
Albufeira 44
Vila Verde 44
Mafra 42
Faro 39
CONCELHO NÚMERO DE
CASOS
Loulé 39
Santarém 38
Espinho 37
Setúbal 37
Estarreja 36
Vale de Cambra 36
Vila Franca de Xira 36
Pombal 35
São João da Madeira 35
Viseu 33
Moita 32
Póvoa de Varzim 30
Condeixa-a-Nova 29
Marco de Canaveses 28
Águeda 25
Montijo 24
Portimão 24
Tavira 24
Benavente 23
Alvaiázere 22
Cantanhede 22
Leiria 22
Torres Vedras 22
Amarante 21
Arcos de Valdevez 21
Funchal 21
Póvoa de Lanhoso 21
Amares 18
Arouca 16
Chaves 16
Évora 15
Ourém 15
Vila Real de Santo
António 15
Vizela 15
Cartaxo 14
Esposende 14
Mirandela 14
Montemor-o-Velho 14
Fafe 12
Sesimbra 12
Torre de Moncorvo 12
Anadia 11
CONCELHO NÚMERO DE
CASOS
Oliveira do Bairro 11
Palmela 11
Silves 11
Coruche 10
Macedo de Cavaleiros 10
Marinha Grande 10
Alenquer 9
Figueira da Foz 9
Lamego 9
Nelas 9
Olhão 9
Peso da Régua 9
Vieira do Minho 9
Vinhais 9
Alcochete 8
Almeirim 8
Castro Daire 8
Mealhada 8
Melgaço 8
Reguengos de Monsaraz 8
Rio Maior 8
Soure 8
Vagos 8
Baião 7
Câmara de Lobos 7
Caminha 7
Lousã 7
Oliveira de Frades 7
Penacova 7
Ponte de Lima 7
Santiago do Cacém 7
Vila da Praia da Vitória 7
Vimioso 7
Alcobaça 6
Celorico de Basto 6
Horta 6
Miranda do Corvo 6
Monção 6
Murtosa 6
Peniche 6
Ponta do Sol 6
São Pedro do Sul 6
CONCELHO NÚMERO DE
CASOS
Cabeceiras de Basto 5
Castelo de Paiva 5
Guarda 5
Paredes de Coura 5
Porto Santo 5
Sever do Vouga 5
Tomar 5
Velas 5
Alpiarça 4
Batalha 4
Calheta (Açores) 4
Góis 4
Madalena 4
Salvaterra de Magos 4
Santa Cruz 4
Serpa 4
Torres Novas 4
Valença 4
Ansião 3
Beja 3
Bombarral 3
Cadaval 3
Carrazeda de Ansiães 3
Cinfães 3
Figueiró dos Vinhos 3
Grândola 3
Lagoa (Faro) 3
Lagos 3
Moimenta da Beira 3
Oliveira do Hospital 3
São Roque do Pico 3
Sines 3
Terras de Bouro 3
Valpaços 3
Vila Flor 3
Vila Nova de Poiares 3
Vila Pouca de Aguiar 3
	`,

	'2020-4-7': `
	CONCELHO NÚMERO DE
CASOS
Lisboa 754
Porto 730
Vila Nova de Gaia 551
Gondomar 528
Maia 465
Matosinhos 416
Braga 407
Valongo 387
Sintra 299
Ovar 247
Coimbra 233
Santa Maria da Feira 231
Cascais 203
Aveiro 151
Vila Nova de Famalicão 150
Guimarães 147
Oeiras 142
Loures 134
Vila Real 132
Almada 130
Paços de Ferreira 112
Paredes 110
Seixal 109
Amadora 108
Felgueiras 108
Barcelos 103
Odivelas 99
Santo Tirso 93
Lousada 92
Oliveira de Azeméis 92
Ílhavo 86
Viana do Castelo 75
Bragança 71
Trofa 57
Barreiro 56
Penafiel 56
Albergaria-a-Velha 54
Resende 52
Vila do Conde 49
Vila Verde 48
Albufeira 46
Mafra 45
Santarém 42
CONCELHO NÚMERO DE
CASOS
Vila Franca de Xira 42
Loulé 41
Setúbal 40
Faro 39
Vale de Cambra 39
Espinho 37
Estarreja 37
Condeixa-a-Nova 36
Viseu 36
Moita 35
São João da Madeira 35
Pombal 34
Póvoa de Varzim 33
Marco de Canaveses 30
Amarante 27
Águeda 26
Arcos de Valdevez 26
Montijo 26
Torres Vedras 26
Leiria 25
Portimão 25
Benavente 24
Tavira 24
Póvoa de Lanhoso 23
Alvaiázere 22
Cantanhede 22
Funchal 21
Amares 19
Ourém 19
Torre de Moncorvo 18
Arouca 17
Vizela 17
Chaves 16
Esposende 16
Cartaxo 15
Évora 15
Vila Real de Santo António 15
Mirandela 14
Montemor-o-Velho 14
Fafe 13
Macedo de Cavaleiros 13
Oliveira do Bairro 13
CONCELHO NÚMERO DE
CASOS
Sesimbra 13
Anadia 12
Ponte de Lima 12
Marinha Grande 11
Palmela 11
Silves 11
Alenquer 10
Coruche 10
Lamego 10
Mealhada 10
Figueira da Foz 9
Melgaço 9
Nelas 9
Olhão 9
Peso da Régua 9
Vagos 9
Vieira do Minho 9
Vinhais 9
Almeirim 8
Caminha 8
Castro Daire 8
Penacova 8
Reguengos de Monsaraz 8
Rio Maior 8
Soure 8
Alcobaça 7
Alcochete 7
Baião 7
Câmara de Lobos 7
Celorico de Basto 7
Lousã 7
Miranda do Corvo 7
Monção 7
Oliveira de Frades 7
Peniche 7
Santiago do Cacém 7
Torres Novas 7
Vila da Praia da Vitória 7
Vila Nova de Foz Côa 7
Vimioso 7
Alpiarça 6
Horta 6
Murtosa 6
CONCELHO NÚMERO DE
CASOS
Paredes de Coura 6
Ponta do Sol 6
São Pedro do Sul 6
Serpa 6
Tomar 6
Cabeceiras de Basto 5
Castelo de Paiva 5
Porto Santo 5
Salvaterra de Magos 5
Sever do Vouga 5
Velas 5
Vila Flor 5
Ansião 4
Batalha 4
Bombarral 4
Calheta (Açores) 4
Carrazeda de Ansiães 4
Cinfães 4
Góis 4
Lourinhã 4
Madalena 4
Santa Cruz 4
Sines 4
Terras de Bouro 4
Valença 4
Valpaços 4
Beja 3
Cadaval 3
Carregal do Sal 3
Figueiró dos Vinhos 3
Grândola 3
Guarda 3
Lagoa (Faro) 3
Lagos 3
Moimenta da Beira 3
São Roque do Pico 3
Vila Nova de Poiares 3
Vila Pouca de Aguiar 3
	`,

	'2020-4-8': `
	CONCELHO NÚMERO DE
CASOS
Lisboa 773
Porto 750
Vila Nova de Gaia 576
Gondomar 556
Maia 485
Matosinhos 425
Braga 423
Valongo 397
Sintra 310
Ovar 273
Coimbra 237
Santa Maria da Feira 233
Cascais 218
Vila Nova de Famalicão 154
Aveiro 152
Guimarães 149
Oeiras 146
Loures 138
Almada 134
Vila Real 132
Amadora 113
Paços de Ferreira 113
Paredes 113
Seixal 113
Felgueiras 111
Barcelos 107
Odivelas 100
Oliveira de Azeméis 94
Santo Tirso 94
Lousada 93
Ílhavo 86
Viana do Castelo 79
Bragança 71
Trofa 59
Barreiro 57
Penafiel 56
Albergaria-a-Velha 54
Resende 52
Vila do Conde 50
Vila Verde 49
Mafra 46
Albufeira 45
Vila Franca de Xira 44
Setúbal 43
CONCELHO NÚMERO DE
CASOS
Santarém 42
Loulé 41
Vale de Cambra 40
Estarreja 39
Faro 39
Moita 38
Espinho 37
Viseu 37
Condeixa-a-Nova 36
São João da Madeira 36
Pombal 34
Póvoa de Varzim 34
Marco de Canaveses 30
Torres Vedras 28
Amarante 27
Águeda 26
Arcos de Valdevez 26
Montijo 26
Benavente 25
Leiria 25
Portimão 25
Cantanhede 24
Tavira 24
Póvoa de Lanhoso 23
Alvaiázere 22
Funchal 21
Amares 19
Ourém 19
Castro Daire 18
Torre de Moncorvo 18
Arouca 17
Évora 17
Vizela 17
Cartaxo 16
Chaves 16
Esposende 16
Mirandela 15
Vila Real de Santo António 15
Montemor-o-Velho 14
Anadia 13
Fafe 13
Macedo de Cavaleiros 13
Oliveira do Bairro 13
CONCELHO NÚMERO DE
CASOS
Sesimbra 13
Melgaço 12
Ponte de Lima 12
Coruche 11
Marinha Grande 11
Palmela 11
Vieira do Minho 11
Alenquer 10
Figueira da Foz 10
Lamego 10
Mealhada 10
Nelas 10
Silves 10
Monção 9
Olhão 9
Peso da Régua 9
Vagos 9
Vinhais 9
Almeirim 8
Caminha 8
Oliveira de Frades 8
Penacova 8
Reguengos de Monsaraz 8
Rio Maior 8
Santiago do Cacém 8
Soure 8
Alcobaça 7
Alcochete 7
Baião 7
Câmara de Lobos 7
Celorico de Basto 7
Lousã 7
Miranda do Corvo 7
Peniche 7
Tomar 7
Torres Novas 7
Vila da Praia da Vitória 7
Vila Nova de Foz Côa 7
Vimioso 7
Alpiarça 6
Horta 6
Murtosa 6
Paredes de Coura 6
Ponta do Sol 6
CONCELHO NÚMERO DE
CASOS
São Pedro do Sul 6
Serpa 6
Beja 5
Cabeceiras de Basto 5
Castelo de Paiva 5
Góis 5
Lourinhã 5
Porto Santo 5
Salvaterra de Magos 5
Sever do Vouga 5
Valença 5
Velas 5
Vila Flor 5
Ansião 4
Batalha 4
Bombarral 4
Calheta (Açores) 4
Carrazeda de Ansiães 4
Carregal do Sal 4
Cinfães 4
Madalena 4
Santa Cruz 4
Sines 4
Terras de Bouro 4
Trancoso 4
Valpaços 4
Abrantes 3
Alcanena 3
Cadaval 3
Covilhã 3
Figueiró dos Vinhos 3
Grândola 3
Guarda 3
Lagoa 3
Lagos 3
Moimenta da Beira 3
São Roque do Pico 3
Vila Nova de Poiares 3
Vila Pouca de Aguiar 3
	`,

	'2020-4-9': `
	CONCELHO NÚMERO DE
CASOS
Abrantes 3
Águeda 30
Albergaria-a-Velha 52
Albufeira 50
Alcanena 3
Alcobaça 7
Alcochete 7
Alenquer 11
Almada 138
Almeida 5
Almeirim 9
Alpiarça 6
Alvaiázere 22
Amadora 129
Amarante 30
Amares 21
Anadia 12
Ansião 4
Arcos de Valdevez 32
Arganil 3
Arouca 23
Aveiro 153
Baião 7
Barcelos 122
Barreiro 56
Batalha 4
Beja 5
Benavente 25
Bombarral 3
Braga 521
Bragança 76
Cabeceiras de
Basto 4
Cadaval 3
Caldas da Rainha 4
Calheta (Açores) 4
Câmara de Lobos 7
Caminha 8
Cantanhede 26
Carrazeda de
Ansiães 5
Carregal do Sal 6
CONCELHO NÚMERO DE
CASOS
Cartaxo 18
Cascais 226
Castelo de Paiva 5
Castro Daire 59
Celorico da Beira 6
Celorico de Basto 8
Chaves 15
Cinfães 5
Coimbra 258
Condeixa-a-Nova 38
Coruche 16
Covilhã 5
Espinho 39
Esposende 21
Estarreja 39
Évora 21
Fafe 16
Faro 42
Felgueiras 118
Figueira da Foz 12
Figueira de
Castelo Rodrigo 3
Figueiró dos
Vinhos 4
Funchal 21
Góis 5
Gondomar 587
Gouveia 11
Grândola 3
Guarda 14
Guimarães 161
Horta 6
Ílhavo 83
Lagoa (Faro) 3
Lagos 3
Lamego 10
Leiria 29
Lisboa 797
Loulé 41
Loures 158
Lourinhã 5
CONCELHO NÚMERO DE
CASOS
Lousã 7
Lousada 98
Macedo de
Cavaleiros 16
Madalena 5
Mafra 49
Maia 512
Mangualde 11
Marco de Canaveses 39
Marinha Grande 11
Matosinhos 444
Mealhada 10
Melgaço 14
Miranda do Corvo 8
Miranda do Douro 3
Mirandela 13
Moimenta da Beira 5
Moita 40
Monção 11
Montemor-o-Velho 14
Montijo 27
Murtosa 6
Nelas 12
Odivelas 112
Oeiras 152
Olhão 9
Oliveira de Azeméis 99
Oliveira de Frades 8
Oliveira do Bairro 14
Oliveira do Hospital 3
Ourém 21
Ovar 275
Paços de Ferreira 130
Palmela 14
Paredes 126
Paredes de Coura 6
Penacova 8
Penafiel 72
Peniche 7
Peso da Régua 10
Pinhel 8
CONCELHO NÚMERO DE
CASOS
Pombal 31
Ponta do Sol 6
Ponte da Barca 3
Ponte de Lima 16
Portimão 29
Porto 776
Porto de Mós 3
Porto Santo 5
Póvoa de Lanhoso 25
Póvoa de Varzim 33
Reguengos de
Monsaraz 8
Resende 53
Rio Maior 8
Sabrosa 3
Salvaterra de Magos 5
Santa Cruz 4
Santa Maria da Feira 246
Santarém 46
Santiago do Cacém 8
Santo Tirso 107
São João da Madeira 36
São Pedro do Sul 7
São Roque do Pico 3
Sátão 5
Seia 5
Seixal 116
Serpa 6
Sesimbra 16
Setúbal 44
Sever do Vouga 5
Silves 15
Sines 4
Sintra 334
Soure 10
Tábua 3
CONCELHO NÚMERO DE
CASOS
Tavira 25
Terras de Bouro 6
Tomar 8
Tondela 7
Torre de Moncorvo 19
Torres Novas 7
Torres Vedras 28
Trancoso 10
Trofa 66
Vagos 9
Vale de Cambra 44
Valença 6
Valongo 429
Valpaços 5
Velas 6
Viana do Castelo 82
Vieira do Minho 13
Vila da Praia da
Vitória 8
Vila do Conde 55
Vila Flor 5
Vila Franca de Xira 48
Vila Nova de
Cerveira 3
Vila Nova de
Famalicão 168
Vila Nova de Foz Côa 69
Vila Nova de Gaia 631
Vila Nova de Poiares 3
Vila Pouca de Aguiar 3
Vila Real 131
Vila Real de Santo
António 13
Vila Verde 57
Vimioso 7
Vinhais 10
Viseu 55
Vizela 19
	`,

	'2020-4-10': `
	CONCELHO NÚMERO DE
CASOS
Abrantes 4
Águeda 31
Albergaria-a-Velha 52
Albufeira 54
Alcácer do Sal 5
Alcanena 3
Alcobaça 7
Alcochete 9
Alenquer 14
Almada 140
Almeida 6
Almeirim 9
Alpiarça 6
Alvaiázere 22
Amadora 147
Amarante 32
Amares 24
Anadia 13
Ansião 4
Arcos de Valdevez 34
Arganil 3
Arouca 23
Aveiro 158
Baião 6
Barcelos 126
Barreiro 74
Batalha 4
Beja 5
Benavente 26
Bombarral 3
Braga 546
Bragança 75
Cabeceiras de
Basto 6
Cadaval 3
Caldas da Rainha 4
Calheta (Açores) 4
Câmara de Lobos 7
Caminha 9
Cantanhede 28
Carrazeda Ansiães 5
CONCELHO NÚMERO DE
CASOS
Carregal do Sal 6
Cartaxo 18
Cascais 238
Castelo de Paiva 7
Castro Daire 64
Celorico da Beira 6
Celorico de Basto 8
Chaves 19
Cinfães 6
Coimbra 266
Condeixa-a-Nova 38
Coruche 16
Covilhã 5
Elvas 3
Espinho 39
Esposende 26
Estarreja 42
Évora 21
Fafe 23
Faro 44
Felgueiras 126
Figueira da Foz 13
Figueira de Castelo
Rodrigo 3
Figueiró dos
Vinhos 4
Funchal 26
Góis 5
Gondomar 629
Gouveia 12
Grândola 4
Guarda 14
Guimarães 174
Horta 6
Ílhavo 84
Lagoa (Faro) 3
Lagos 3
Lamego 10
Leiria 32
Lisboa 851
Loulé 42
Loures 179
CONCELHO NÚMERO DE
CASOS
Lourinhã 5
Lousã 7
Lousada 98
Macedo de
Cavaleiros 17
Madalena 5
Mafra 53
Maia 543
Mangualde 12
Marco de Canaveses 42
Marinha Grande 10
Matosinhos 619
Mealhada 11
Melgaço 14
Miranda do Corvo 8
Miranda do Douro 4
Mirandela 15
Moimenta da Beira 7
Moita 51
Monção 11
Montemor-o-Velho 14
Montijo 37
Murtosa 6
Nelas 13
Odivelas 124
Oeiras 161
Olhão 10
Oliveira de Azeméis 106
Oliveira de Frades 8
Oliveira do Bairro 15
Oliveira do Hospital 4
Ourém 25
Ovar 379
Paços de Ferreira 136
Palmela 14
Paredes 132
Paredes de Coura 6
Penacova 9
Penafiel 78
Peniche 7
Peso da Régua 11
Pinhel 9
CONCELHO NÚMERO DE
CASOS
Pombal 31
Ponta do Sol 5
Ponte da Barca 3
Ponte de Lima 17
Portalegre 3
Portimão 30
Porto 840
Porto de Mós 3
Porto Santo 5
Póvoa de Lanhoso 25
Póvoa de Varzim 47
Reg. de Monsaraz 8
Resende 53
Rio Maior 8
Sabrosa 3
Salvaterra de Magos 5
Santa Cruz 6
Santa Maria da Feira 254
Santarém 46
Santiago do Cacém 8
Santo Tirso 114
São João da Madeira 41
São Pedro do Sul 7
São Roque do Pico 3
Sátão 5
Seia 5
Seixal 125
Serpa 17
Sesimbra 17
Setúbal 52
Sever do Vouga 5
Silves 16
Sines 4
Sintra 358
Soure 11
Tábua 4
CONCELHO NÚMERO DE
CASOS
Tavira 25
Terras de Bouro 6
Tomar 8
Tondela 8
Torre de Moncorvo 19
Torres Novas 9
Torres Vedras 29
Trancoso 10
Trofa 72
Vagos 11
Vale de Cambra 48
Valença 6
Valongo 455
Valpaços 5
Velas 6
Viana do Castelo 87
Vieira do Minho 13
Vila Praia da Vitória 8
Vila do Conde 68
Vila Flor 5
Vila Franca de Xira 55
Vila Nova Barquinha 3
Vila Nova Cerveira 3
Vila Nova Famalicão 180
Vila Nova de Foz Côa 70
Vila Nova de Gaia 710
Vila Nova de Poiares 3
Vila Pouca de Aguiar 3
Vila Real 134
Vila Real S. António 13
Vila Verde 57
Vimioso 7
Vinhais 10
Viseu 62
Vizela 20
	`,

	'2020-4-11': `
	CONCELHO NÚMERO DE
CASOS
Abrantes 4
Águeda 32
Albergaria-a-Velha 52
Albufeira 52
Alcácer do Sal 5
Alcanena 3
Alcobaça 7
Alcochete 9
Alenquer 15
Almada 142
Almeida 6
Almeirim 10
Alpiarça 5
Alvaiázere 22
Amadora 153
Amarante 35
Amares 25
Anadia 13
Ansião 4
Arcos de Valdevez 39
Arganil 3
Arouca 25
Aveiro 160
Baião 6
Barcelos 133
Barreiro 74
Batalha 4
Beja 6
Benavente 26
Braga 579
Bragança 82
Cabeceiras de Basto 7
Cadaval 3
Caldas da Rainha 6
Calheta (Açores) 4
Câmara de Lobos 7
Caminha 9
Cantanhede 28
Carraz. de Ansiães 5
Carregal do Sal 7
CONCELHO NÚMERO DE
CASOS
Cartaxo 18
Cascais 251
Castelo de Paiva 7
Castro Daire 81
Celorico da Beira 7
Celorico de Basto 8
Chaves 19
Cinfães 6
Coimbra 265
Condeixa-a-Nova 40
Coruche 16
Covilhã 5
Elvas 4
Espinho 42
Esposende 26
Estarreja 44
Évora 21
Fafe 28
Faro 42
Felgueiras 145
Figueira da Foz 12
Figueira de Castelo Rodrigo 3
Figueiró dos Vinhos 4
Funchal 26
Góis 5
Gondomar 646
Gouveia 12
Grândola 4
Guarda 15
Guimarães 189
Horta 6
Ílhavo 87
Lagoa (Faro) 3
Lagos 3
Lamego 13
Leiria 36
Lisboa 867
Loulé 41
Loures 191
Lourinhã 5
Lousã 7
CONCELHO NÚMERO DE
CASOS
Lousada 107
Mac. de Cavaleiros 17
Madalena 5
Mafra 52
Maia 565
Mangualde 34
Marco de Canaveses 43
Marinha Grande 10
Matosinhos 643
Mealhada 11
Melgaço 14
Miranda do Corvo 8
Miranda do Douro 4
Mirandela 17
Moimenta da Beira 8
Moita 51
Monção 11
Montemor-o-Velho 14
Montijo 38
Moura 22
Murtosa 6
Nelas 13
Óbidos 3
Odivelas 131
Oeiras 163
Olhão 11
Oliveira de Azeméis 114
Oliveira de Frades 8
Oliveira do Bairro 15
Oliveira do Hospital 4
Ourém 25
Ovar 403
Paços de Ferreira 146
Palmela 14
Paredes 141
Paredes de Coura 6
Penacova 9
Penafiel 84
Peniche 6
Peso da Régua 13
Pinhel 9
CONCELHO NÚMERO DE
CASOS
Pombal 31
Ponta do Sol 5
Ponte da Barca 4
Ponte de Lima 19
Portimão 29
Porto 852
Porto de Mós 3
Porto Santo 5
Póvoa de Lanhoso 27
Póvoa de Varzim 56
Reg. de Monsaraz 8
Resende 53
Rio Maior 8
Sabrosa 3
Salvaterra de Magos 5
Santa Comba Dão 3
Santa Cruz 6
Santa Maria da Feira 265
Santarém 45
Santiago do Cacém 11
Santo Tirso 128
São João da Madeira 44
São Pedro do Sul 8
São Roque do Pico 3
Sátão 5
Seia 5
Seixal 127
Serpa 17
Sesimbra 17
Setúbal 52
Sever do Vouga 7
Silves 15
Sines 4
Sintra 374
Soure 12
Tábua 4
CONCELHO NÚMERO DE
CASOS
Tavira 26
Terras de Bouro 6
Tomar 9
Tondela 7
Torre de Moncorvo 21
Torres Novas 9
Torres Vedras 29
Trancoso 11
Trofa 75
Vagos 13
Vale de Cambra 52
Valença 6
Valongo 464
Valpaços 5
Velas 6
Viana do Castelo 95
Vieira do Minho 13
Vila Praia da Vitória 8
Vila do Conde 77
Vila Flor 5
Vila Franca de Xira 60
Vila Nova da Barquinha 3
Vila Nova de Cerveira 4
Vila Nova de Famalicão 193
Vila Nova de Foz Côa 70
Vila Nova de Gaia 758
Vila Nova de Poiares 3
Vila Pouca de Aguiar 3
Vila Real 134
Vila Real Santo António 13
Vila Verde 62
Vimioso 8
Vinhais 10
Viseu 65
Vizela 21
	`,

	'2020-4-12': `
	CONCELHO NÚMERO DE
CASOS
Abrantes 4
Águeda 32
Albergaria-a-Velha 52
Albufeira 52
Alcácer do Sal 5
Alcanena 3
Alcobaça 7
Alcochete 9
Alenquer 15
Almada 144
Almeida 6
Almeirim 10
Alpiarça 6
Alvaiázere 23
Amadora 155
Amarante 38
Amares 26
Anadia 13
Ansião 4
Arcos de Valdevez 42
Arganil 3
Arouca 26
Aveiro 164
Baião 6
Barcelos 137
Barreiro 74
Batalha 4
Beja 6
Benavente 27
Braga 621
Bragança 84
Cabeceiras de
Basto 8
Cadaval 3
Caldas da Rainha 7
Calheta (Açores) 4
Câmara de Lobos 7
Caminha 9
Cantanhede 28
Carrazeda de
Ansiães 5
Carregal do Sal 7
CONCELHO NÚMERO DE
CASOS
Cartaxo 18
Cascais 261
Castelo de Paiva 7
Castro Daire 91
Celorico da Beira 7
Celorico de Basto 9
Chaves 19
Cinfães 7
Coimbra 269
Condeixa-a-Nova 41
Coruche 16
Covilhã 5
Elvas 4
Espinho 42
Esposende 27
Estarreja 44
Évora 21
Fafe 29
Faro 50
Felgueiras 159
Figueira da Foz 12
Figueira de Castelo
Rodrigo 3
Figueiró dos
Vinhos 4
Funchal 26
Góis 5
Gondomar 681
Gouveia 12
Grândola 4
Guarda 16
Guimarães 201
Horta 6
Ílhavo 88
Lagoa (Faro) 3
Lagos 3
Lamego 13
Leiria 38
Lisboa 890
Loulé 42
Loures 196
Lourinhã 5
Lousã 7
CONCELHO NÚMERO DE
CASOS
Lousada 115
Mac. de Cavaleiros 18
Madalena 5
Mafra 53
Maia 588
Mangualde 35
Marco de Canaveses 45
Marinha Grande 12
Matosinhos 682
Mealhada 12
Melgaço 14
Miranda do Corvo 8
Miranda do Douro 4
Mirandela 17
Moimenta da Beira 8
Moita 51
Monção 11
Montemor-o-Velho 14
Montijo 40
Moura 22
Murtosa 6
Nelas 13
Óbidos 3
Odivelas 136
Oeiras 167
Olhão 11
Oliveira de Azeméis 117
Oliveira de Frades 8
Oliveira do Bairro 15
Oliveira do Hospital 5
Ourém 26
Ovar 409
Paços de Ferreira 158
Palmela 14
Paredes 150
Paredes de Coura 6
Penacova 9
Penafiel 91
Peniche 7
Peso da Régua 15
Pinhel 9
CONCELHO NÚMERO DE
CASOS
Pombal 31
Ponta do Sol 5
Ponte da Barca 4
Ponte de Lima 19
Portimão 29
Porto 885
Porto de Mós 4
Porto Santo 5
Póvoa de Lanhoso 28
Póvoa de Varzim 60
Reg. de Monsaraz 8
Resende 53
Rio Maior 8
Sabrosa 3
Salvaterra de Magos 5
Santa Comba Dão 4
Santa Cruz 6
Santa Maria da Feira 269
Santarém 47
Santiago do Cacém 11
Santo Tirso 139
São João da Madeira 44
São Pedro do Sul 8
São Roque do Pico 3
Sátão 5
Seia 5
Seixal 129
Serpa 17
Sesimbra 17
Setúbal 53
Sever do Vouga 7
Silves 15
Sines 4
Sintra 394
Soure 12
Tábua 4
CONCELHO NÚMERO DE
CASOS
Tavira 27
Terras de Bouro 7
Tomar 9
Tondela 8
Torre de Moncorvo 22
Torres Novas 9
Torres Vedras 29
Trancoso 12
Trofa 79
Vagos 13
Vale de Cambra 55
Valença 6
Valongo 479
Valpaços 5
Velas 6
Viana do Castelo 104
Vieira do Minho 14
Vila Praia da Vitória 8
Vila do Conde 86
Vila Flor 5
Vila Franca de Xira 61
Vila Nova da Barquinha 3
Vila Nova de Cerveira 4
Vila Nova de Famalicão 211
Vila Nova de Foz Côa 70
Vila Nova de Gaia 796
Vila Nova de Poiares 3
Vila Pouca de Aguiar 3
Vila Real 137
Vila Real Santo António 13
Vila Verde 70
Vimioso 8
Vinhais 10
Viseu 68
Vizela 23
	`,

	'2020-4-13': `
	CONCELHO NÚMERO DE
CASOS
Abrantes 4
Águeda 32
Albergaria-a-Velha 52
Albufeira 55
Alcácer do Sal 5
Alcanena 3
Alcobaça 7
Alcochete 9
Alenquer 15
Almada 148
Almeida 6
Almeirim 10
Alpiarça 6
Alvaiázere 23
Amadora 159
Amarante 39
Amares 28
Anadia 15
Ansião 4
Arcos de Valdevez 42
Arganil 4
Arouca 26
Aveiro 165
Baião 6
Barcelos 141
Barreiro 75
Batalha 4
Beja 6
Benavente 27
Bombarral 3
Braga 647
Bragança 85
Cabeceiras de Basto 8
Cadaval 3
Caldas da Rainha 7
Calheta (Açores) 5
Câmara de Lobos 7
Caminha 9
Cantanhede 27
Carraz. de Ansiães 5
Carregal do Sal 7
CONCELHO NÚMERO DE
CASOS
Cartaxo 18
Cascais 264
Castelo de Paiva 7
Castro Daire 91
Celorico da Beira 7
Celorico de Basto 9
Chaves 19
Cinfães 7
Coimbra 275
Condeixa-a-Nova 41
Coruche 16
Covilhã 5
Elvas 4
Espinho 45
Esposende 28
Estarreja 46
Évora 21
Fafe 30
Faro 52
Felgueiras 163
Figueira da Foz 13
Figueira de Castelo
Rodrigo 3
Figueiró dos
Vinhos 4
Funchal 26
Góis 6
Gondomar 701
Gouveia 13
Grândola 6
Guarda 16
Guimarães 214
Horta 6
Ílhavo 88
Lagoa (Faro) 3
Lagos 3
Lamego 15
Leiria 38
Lisboa 905
Loulé 42
Loures 201
Lourinhã 4
Lousã 8
CONCELHO NÚMERO DE
CASOS
Lousada 124
Mac. de Cavaleiros 18
Madalena 5
Mafra 55
Maia 600
Mangualde 50
Marco de Canaveses 45
Marinha Grande 12
Matosinhos 715
Mealhada 13
Melgaço 14
Miranda do Corvo 8
Miranda do Douro 4
Mirandela 17
Moimenta da Beira 8
Moita 52
Monção 20
Montemor-o-Velho 14
Montijo 40
Moura 22
Murtosa 6
Nelas 13
Óbidos 3
Odivelas 141
Oeiras 168
Olhão 12
Oliveira de Azeméis 118
Oliveira de Frades 8
Oliveira do Bairro 15
Oliveira do Hospital 6
Ourém 26
Ovar 416
Paços de Ferreira 163
Palmela 15
Paredes 165
Paredes de Coura 6
Penacova 9
Penafiel 98
Peniche 7
Peso da Régua 15
Pinhel 9
CONCELHO NÚMERO DE
CASOS
Pombal 32
Ponta do Sol 5
Ponte da Barca 4
Ponte de Lima 19
Portimão 30
Porto 921
Porto de Mós 4
Porto Santo 5
Póvoa de Lanhoso 29
Póvoa de Varzim 62
Reg. de Monsaraz 8
Resende 53
Rio Maior 9
Sabrosa 4
Salvaterra de Magos 5
Santa Comba Dão 4
Santa Cruz 6
Santa Maria da Feira 279
Santarém 47
Santiago do Cacém 11
Santo Tirso 149
São João da Madeira 45
São Pedro do Sul 8
São Roque do Pico 3
Sátão 5
Seia 5
Seixal 129
Serpa 17
Sesimbra 17
Setúbal 55
Sever do Vouga 7
Silves 19
Sines 4
Sintra 397
Soure 12
Tábua 15
CONCELHO NÚMERO DE
CASOS
Tavira 29
Terras de Bouro 7
Tomar 9
Tondela 8
Torre de Moncorvo 22
Torres Novas 9
Torres Vedras 26
Trancoso 12
Trofa 84
Vagos 13
Vale de Cambra 60
Valença 6
Valongo 491
Valpaços 5
Velas 6
Viana do Castelo 104
Vieira do Minho 15
Vila Praia da Vitória 8
Vila do Conde 130
Vila Flor 5
Vila Franca de Xira 62
Vila Nova da Barquinha 3
Vila Nova de Cerveira 4
Vila Nova de Famalicão 225
Vila Nova de Foz Côa 68
Vila Nova de Gaia 842
Vila Nova de Poiares 3
Vila Pouca de Aguiar 3
Vila Real 138
Vila Real Santo António 14
Vila Verde 87
Vimioso 8
Vinhais 10
Viseu 69
Vizela 26
	`,

	'2020-4-14': `
	CONCELHO NÚMERO DE
	CASOS
	Abrantes 4
	Águeda 34
	Albergaria-a-Velha 54
	Albufeira 55
	Alcácer do Sal 5
	Alcanena 3
	Alcobaça 8
	Alcochete 10
	Alenquer 15
	Almada 148
	Almeida 6
	Almeirim 11
	Alpiarça 6
	Alvaiázere 23
	Amadora 165
	Amarante 41
	Amares 28
	Anadia 18
	Ansião 4
	Arcos de Valdevez 44
	Arganil 4
	Arouca 28
	Aveiro 170
	Azambuja 3
	Baião 6
	Barcelos 141
	Barreiro 76
	Batalha 4
	Beja 8
	Benavente 29
	Bombarral 3
	Braga 647
	Bragança 86
	Cabeceiras de Basto 10
	Cadaval 3
	Caldas da Rainha 7
	Calheta (Açores) 5
	Câmara de Lobos 7
	Caminha 10
	Cantanhede 31
	Carraz. de Ansiães 5
	Carregal do Sal 7
	CONCELHO NÚMERO DE
	CASOS
	Cartaxo 19
	Cascais 269
	Castelo de Paiva 8
	Castro Daire 91
	Celorico da Beira 7
	Celorico de Basto 9
	Chamusca 3
	Chaves 20
	Cinfães 8
	Coimbra 293
	Condeixa-a-Nova 43
	Coruche 18
	Covilhã 5
	Elvas 4
	Espinho 45
	Esposende 28
	Estarreja 48
	Évora 21
	Fafe 30
	Faro 52
	Felgueiras 168
	Figueira da Foz 14
	Figueira de Castelo Rodrigo 3
	Figueiró dos Vinhos 4
	Funchal 27
	Góis 8
	Gondomar 718
	Gouveia 13
	Grândola 7
	Guarda 16
	Guimarães 219
	Horta 6
	Ílhavo 88
	Lagoa (Faro) 3
	Lagos 3
	Lamego 16
	Leiria 43
	Lisboa 946
	Loulé 43
	Loures 212
	Lourinhã 4
	Lousã 8
	CONCELHO NÚMERO DE
	CASOS
	Lousada 124
	Mac. de Cavaleiros 18
	Madalena 5
	Mafra 57
	Maia 645
	Mangualde 50
	Marco de Canaveses 45
	Marinha Grande 12
	Matosinhos 768
	Mealhada 13
	Melgaço 15
	Miranda do Corvo 8
	Miranda do Douro 4
	Mirandela 17
	Moimenta da Beira 8
	Moita 53
	Monção 20
	Montemor-o-Velho 14
	Montijo 40
	Moura 27
	Murtosa 6
	Nelas 13
	Óbidos 3
	Odivelas 142
	Oeiras 180
	Olhão 12
	Oliveira de Azeméis 118
	Oliveira de Frades 8
	Oliveira do Bairro 16
	Oliveira do Hospital 6
	Ourém 26
	Ovar 435
	Paços de Ferreira 167
	Palmela 15
	Paredes 166
	Paredes de Coura 6
	Pedrógão 3
	Penacova 9
	Penafiel 100
	Peniche 7
	Peso da Régua 15
	Pinhel 15
	CONCELHO NÚMERO DE
	CASOS
	Pombal 33
	Ponta do Sol 5
	Ponte da Barca 4
	Ponte de Lima 21
	Portalegre 3
	Portimão 32
	Porto 959
	Porto de Mós 4
	Porto Santo 5
	Póvoa de Lanhoso 29
	Póvoa de Varzim 69
	Reg. de Monsaraz 8
	Resende 53
	Rio Maior 11
	Sabrosa 4
	Salvaterra de
	Magos 5
	Santa Comba Dão 4
	Santa Cruz 6
	Santa Maria da
	Feira 279
	Santarém 50
	Santiago do Cacém 11
	Santo Tirso 160
	São João da
	Madeira 48
	São Pedro do Sul 8
	São Roque do Pico 3
	Sátão 5
	Seia 5
	Seixal 129
	Serpa 17
	Sesimbra 17
	Setúbal 56
	Sever do Vouga 7
	Silves 20
	Sines 4
	Sintra 404
	Soure 13
	Tábua 16
	CONCELHO NÚMERO DE
	CASOS
	Tavira 30
	Terras de Bouro 7
	Tomar 9
	Tondela 8
	Torre de Moncorvo 22
	Torres Novas 9
	Torres Vedras 28
	Trancoso 12
	Trofa 86
	Vagos 13
	Vale de Cambra 63
	Valença 6
	Valongo 507
	Valpaços 5
	Velas 6
	Viana do Castelo 110
	Vieira do Minho 15
	Vila Praia da Vitória 8
	Vila do Conde 137
	Vila Flor 5
	Vila Franca de Xira 67
	Vila Nova da
	Barquinha 3
	Vila Nova de Cerveira 4
	Vila Nova de
	Famalicão 228
	Vila Nova de Foz
	Côa 68
	Vila Nova de Gaia 884
	Vila Nova de
	Poiares 3
	Vila Pouca de
	Aguiar 3
	Vila Real 139
	Vila Real Santo António 14
	Vila Verde 90
	Vimioso 8
	Vinhais 10
	Viseu 69
	Vizela 26
	`,

	'2020-4-15': `
	CONCELHO NÚMERO
	DE CASOS
	Abrantes 4
	Águeda 35
	Albergaria-a-Velha 56
	Albufeira 59
	Alcácer do Sal 5
	Alcanena 4
	Alcobaça 8
	Alcochete 10
	Alenquer 16
	Alfândega da Fé 3
	Almada 145
	Almeida 6
	Almeirim 13
	Almodôvar 3
	Alpiarça 6
	Alvaiázere 23
	Amadora 175
	Amarante 47
	Amares 30
	Anadia 18
	Ansião 4
	Arcos de Valdevez 44
	Arganil 4
	Arouca 27
	Aveiro 203
	Azambuja 4
	Baião 7
	Barcelos 138
	Barreiro 76
	Batalha 4
	Beja 9
	Benavente 29
	Bombarral 3
	Braga 692
	Bragança 87
	Cabeceiras de Basto 11
	Cadaval 4
	Caldas da Rainha 7
	Calheta (Açores) 4
	Câmara de Lobos 8
	Caminha 11
	Cantanhede 34
	Carrazeda de Ansiães 5
	CONCELHO NÚMERO
	DE CASOS
	Carregal do Sal 7
	Cartaxo 20
	Cascais 273
	Castelo de Paiva 8
	Castro Daire 99
	Castro Marim 3
	Celorico da Beira 7
	Celorico de Basto 9
	Chamusca 3
	Chaves 20
	Cinfães 8
	Coimbra 302
	Condeixa-a-Nova 45
	Coruche 21
	Covilhã 5
	Elvas 4
	Espinho 45
	Esposende 26
	Estarreja 48
	Évora 21
	Fafe 29
	Faro 53
	Felgueiras 186
	Figueira da Foz 14
	Figueira de Castelo Rodrigo 3
	Figueiró dos Vinhos 4
	Funchal 27
	Góis 8
	Gondomar 738
	Gouveia 14
	Grândola 7
	Guarda 16
	Guimarães 236
	Horta 6
	Ílhavo 89
	Lagoa (Faro) 3
	Lagos 3
	Lamego 25
	Leiria 44
	Lisboa 962
	Loulé 48
	Loures 221
	Lourinhã 4
	CONCELHO NÚMERO
	DE CASOS
	Lousã 8
	Lousada 128
	Macedo de Cavaleiros 19
	Madalena 5
	Mafra 59
	Maia 672
	Mangualde 50
	Marco de Canaveses 47
	Marinha Grande 12
	Matosinhos 798
	Mealhada 14
	Melgaço 23
	Miranda do Corvo 9
	Miranda do Douro 4
	Mirandela 17
	Moimenta da Beira 7
	Moita 54
	Monção 27
	Montemor-o-Velho 14
	Montijo 39
	Moura 27
	Murça 3
	Murtosa 6
	Nelas 12
	Óbidos 3
	Odivelas 146
	Oeiras 180
	Olhão 12
	Oliveira de Azeméis 130
	Oliveira de Frades 8
	Oliveira do Bairro 16
	Oliveira do Hospital 7
	Ourém 26
	Ovar 455
	Paços de Ferreira 178
	Palmela 16
	Paredes 174
	Paredes de Coura 6
	Pedrógão Grande 3
	Penacova 10
	Penafiel 104
	Peniche 7
	Peso da Régua 24
	CONCELHO NÚMERO
	DE CASOS
	Pinhel 20
	Pombal 31
	Ponta Delgada 3
	Ponta do Sol 5
	Ponte da Barca 4
	Ponte de Lima 22
	Portalegre 3
	Portimão 32
	Porto 980
	Porto de Mós 4
	Porto Santo 5
	Póvoa de Lanhoso 25
	Póvoa de Varzim 71
	Reguengos Monsaraz 8
	Resende 54
	Rio Maior 11
	Sabrosa 4
	Salvaterra Magos 5
	Santa Comba Dão 4
	Santa Cruz 6
	Santa Maria Feira 292
	Santarém 53
	Santiago do Cacém 11
	Santo Tirso 173
	São João da Madeira 51
	São Pedro do Sul 7
	São Roque do Pico 3
	Sátão 5
	Seia 5
	Seixal 129
	Serpa 18
	Sesimbra 16
	Setúbal 59
	Sever do Vouga 21
	Silves 21
	Sines 4
	Sintra 421
	Soure 13
	CONCELHO NÚMERO
	DE CASOS
	Tábua 20
	Tavira 30
	Terras de Bouro 6
	Tomar 10
	Tondela 8
	Torre de Moncorvo 23
	Torres Novas 10
	Torres Vedras 32
	Trancoso 15
	Trofa 91
	Vagos 13
	Vale de Cambra 66
	Valença 6
	Valongo 529
	Valpaços 5
	Velas 6
	Viana do Castelo 120
	Vieira do Minho 19
	Vila Praia da Vitória 7
	Vila do Conde 174
	Vila Flor 5
	Vila Franca de Xira 71
	Vila Nova da Barquinha 3
	Vila Nova de Cerveira 4
	Vila Nova de Famalicão 235
	Vila Nova de Foz Côa 72
	Vila Nova de Gaia 923
	Vila Nova de Poiares 3
	Vila Pouca de Aguiar 3
	Vila Real 143
	Vila Real de Santo António 14
	Vila Verde 92
	Vimioso 8
	Vinhais 10
	Viseu 61
	Vizela 25
	`,

	'2020-4-16': `
	CONCELHO NÚMERO
DE CASOS
Abrantes 5
Águeda 38
Albergaria-a-Velha 56
Albufeira 62
Alcácer do Sal 5
Alcanena 6
Alcobaça 9
Alcochete 11
Alenquer 16
Alfândega da Fé 3
Almada 149
Almeida 6
Almeirim 13
Almodôvar 3
Alpiarça 6
Alvaiázere 23
Amadora 205
Amarante 50
Amares 33
Anadia 19
Ansião 5
Arcos de Valdevez 45
Arganil 6
Arouca 26
Aveiro 227
Azambuja 4
Baião 8
Barcelos 156
Barreiro 80
Batalha 4
Beja 9
Benavente 27
Bombarral 3
Braga 775
Bragança 88
Cabeceiras de Basto 10
Cadaval 4
Caldas da Rainha 7
Calheta (Açores) 5
Câmara de Lobos 8
Caminha 11
Cantanhede 38
Carrazeda de Ansiães 5
CONCELHO NÚMERO
DE CASOS
Carregal do Sal 7
Cartaxo 20
Cascais 275
Castelo Branco 3
Castelo de Paiva 8
Castro Daire 99
Castro Marim 3
Celorico da Beira 7
Celorico de Basto 11
Chamusca 4
Chaves 20
Cinfães 8
Coimbra 325
Condeixa-a-Nova 49
Coruche 22
Covilhã 5
Elvas 4
Espinho 51
Esposende 31
Estarreja 48
Évora 20
Fafe 35
Faro 54
Felgueiras 198
Figueira da Foz 17
Figueira de Castelo Rodrigo 3
Figueiró dos Vinhos 4
Funchal 27
Góis 8
Gondomar 777
Gouveia 14
Grândola 7
Guarda 17
Guimarães 262
Horta 6
Ílhavo 90
Lagoa (Faro) 3
Lagos 3
Lamego 25
Leiria 47
Lisboa 996
Loulé 52
Loures 231
Lourinhã 4
CONCELHO NÚMERO
DE CASOS
Lousã 8
Lousada 139
Macedo de Cavaleiros 19
Madalena 5
Mafra 59
Maia 686
Mangualde 50
Marco de Canaveses 51
Marinha Grande 13
Matosinhos 824
Mealhada 15
Melgaço 31
Miranda do Corvo 11
Miranda do Douro 4
Mirandela 17
Moimenta da Beira 9
Moita 56
Monção 31
Montemor-o-Velho 15
Montijo 40
Mortágua 3
Moura 28
Murça 4
Murtosa 7
Nelas 13
Óbidos 3
Odivelas 152
Oeiras 182
Olhão 13
Oliveira de Azeméis 143
Oliveira de Frades 6
Oliveira do Bairro 16
Oliveira do Hospital 7
Ourém 26
Ovar 487
Paços de Ferreira 177
Palmela 18
Paredes 184
Paredes de Coura 6
Pedrógão Grande 3
Penacova 10
Penafiel 110
Peniche 7
Peso da Régua 44
CONCELHO NÚMERO
DE CASOS
Pinhel 21
Pombal 31
Ponta Delgada 3
Ponta do Sol 5
Ponte da Barca 4
Ponte de Lima 22
Portalegre 3
Portimão 32
Porto 988
Porto de Mós 4
Porto Santo 5
Póvoa de Lanhoso 31
Póvoa de Varzim 77
Reguengos Monsaraz 8
Resende 57
Rio Maior 12
Sabrosa 4
Salvaterra Magos 5
Santa Comba Dão 5
Santa Cruz 6
Santa Maria Feira 306
Santa Marta de
Penaguião 3
Santarém 53
Santiago do Cacém 12
Santo Tirso 199
São João da Madeira 52
São Pedro do Sul 8
São Roque do Pico 3
Sátão 5
Seia 5
Seixal 134
Serpa 18
Sesimbra 19
Setúbal 60
Sever do Vouga 28
Silves 21
Sines 4
Sintra 437
Soure 17
CONCELHO NÚMERO
DE CASOS
Tábua 22
Tavira 30
Terras de Bouro 8
Tomar 10
Tondela 8
Torre de Moncorvo 23
Torres Novas 10
Torres Vedras 32
Trancoso 16
Trofa 97
Vagos 15
Vale de Cambra 71
Valença 7
Valongo 552
Valpaços 5
Velas 6
Viana do Castelo 125
Vieira do Minho 24
Vila Praia da Vitória 7
Vila do Conde 182
Vila Flor 5
Vila Franca de Xira 72
Vila Nova da Barquinha 3
Vila Nova de Cerveira 6
Vila Nova de Famalicão 246
Vila Nova de Foz Côa 72
Vila Nova de Gaia 956
Vila Nova de Poiares 3
Vila Pouca de Aguiar 3
Vila Real 144
Vila Real de Santo António 14
Vila Verde 106
Vimioso 8
Vinhais 10
Viseu 67
Vizela 32
Vouzela 3
`,

	'2020-4-17': `
	CONCELHO NÚMERO
DE CASOS
Abrantes 7
Águeda 40
Albergaria-a-Velha 57
Albufeira 63
Alcácer do Sal 5
Alcanena 6
Alcobaça 10
Alcochete 12
Alenquer 16
Alfândega da Fé 3
Almada 152
Almeida 6
Almeirim 13
Almodôvar 3
Alpiarça 6
Alvaiázere 23
Amadora 220
Amarante 50
Amares 33
Anadia 20
Ansião 5
Arcos de Valdevez 47
Arganil 6
Arouca 26
Aveiro 232
Azambuja 4
Baião 8
Barcelos 156
Barreiro 81
Batalha 4
Beja 9
Benavente 27
Bombarral 3
Braga 798
Bragança 89
Cabeceiras de Basto 10
Cadaval 4
Caldas da Rainha 8
Calheta (Açores) 4
Câmara de Lobos 8
Caminha 12
Cantanhede 38
Carrazeda de Ansiães 5
CONCELHO NÚMERO
DE CASOS
Carregal do Sal 10
Cartaxo 20
Cascais 280
Castelo Branco 3
Castelo de Paiva 8
Castro Daire 100
Castro Marim 3
Celorico da Beira 8
Celorico de Basto 12
Chamusca 4
Chaves 21
Cinfães 8
Coimbra 345
Condeixa-a-Nova 53
Coruche 22
Covilhã 5
Elvas 4
Espinho 52
Esposende 31
Estarreja 48
Évora 20
Fafe 35
Faro 58
Felgueiras 201
Figueira da Foz 17
Figueira de Castelo
Rodrigo 3
Figueiró dos Vinhos 4
Funchal 27
Góis 8
Gondomar 797
Gouveia 16
Grândola 7
Guarda 18
Guimarães 277
Horta 6
Ílhavo 90
Lagoa (Faro) 4
Lagos 3
Lamego 27
Leiria 51
Lisboa 1020
Loulé 52
Loures 240
Lourinhã 4
Lousã 8
CONCELHO NÚMERO
DE CASOS
Lousada 139
Macedo de Cavaleiros 19
Madalena 5
Mafra 64
Maia 714
Mangualde 51
Manteigas 3
Marco de Canaveses 52
Marinha Grande 14
Matosinhos 845
Mealhada 15
Melgaço 32
Miranda do Corvo 11
Miranda do Douro 4
Mirandela 17
Moimenta da Beira 10
Moita 58
Monção 54
Montemor-o-Velho 15
Montijo 40
Mortágua 3
Moura 28
Murça 4
Murtosa 7
Nelas 13
Óbidos 3
Odivelas 154
Oeiras 186
Olhão 13
Oliveira de Azeméis 145
Oliveira de Frades 6
Oliveira do Bairro 16
Oliveira do Hospital 8
Ourém 27
Ovar 498
Paços de Ferreira 183
Palmela 19
Paredes 186
Paredes de Coura 6
Pedrógão Grande 3
Penacova 11
Penafiel 110
Penela 3
Peniche 8
Peso da Régua 45
CONCELHO NÚMERO
DE CASOS
Pinhel 21
Pombal 37
Ponta Delgada 3
Ponta do Sol 5
Ponte da Barca 4
Ponte de Lima 22
Portalegre 3
Portimão 32
Porto 1017
Porto de Mós 6
Porto Santo 5
Póvoa de Lanhoso 32
Póvoa de Varzim 79
Reguengos de
Monsaraz 8
Resende 57
Rio Maior 12
Sabrosa 4
Salvaterra de Magos 5
Santa Comba Dão 6
Santa Cruz 6
Santa Maria da Feira 311
Santa Marta de
Penaguião 3
Santarém 54
Santiago do Cacém 13
Santo Tirso 215
São João da Madeira 52
São Pedro do Sul 8
São Roque do Pico 3
Sátão 5
Seia 7
Seixal 139
Serpa 18
Sertã 3
Sesimbra 19
Setúbal 60
Sever do Vouga 28
Silves 21
Sines 4
Sintra 463
CONCELHO NÚMERO
DE CASOS
Soure 18
Tábua 22
Tavira 35
Terras de Bouro 8
Tomar 10
Tondela 9
Torre de Moncorvo 23
Torres Novas 10
Torres Vedras 32
Trancoso 16
Trofa 101
Vagos 15
Vale de Cambra 72
Valença 7
Valongo 562
Valpaços 5
Velas 6
Viana do Castelo 126
Vieira do Minho 24
Vila da Praia da Vitória 7
Vila do Conde 186
Vila Flor 5
Vila Franca de Xira 75
Vila Nova da Barquinha 3
Vila Nova de Cerveira 6
Vila Nova de Famalicão 250
Vila Nova de Foz Côa 76
Vila Nova de Gaia 972
Vila Nova de Poiares 3
Vila Pouca de Aguiar 3
Vila Real 145
Vila Real de Santo
António 14
Vila Verde 107
Vimioso 8
Vinhais 10
Viseu 71
Vizela 34
Vouzela 4
`,
};

function parseCases(cases: Map<string, number> | string): Map<string, number> {
	if (typeof cases !== 'string') return cases;
	const caseMap = new Map<string, number>();
	const lines = cases.split('\n');
	let name = '';
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();
		if (line.length === 0) continue;
		if (/^(DE|NÚMERO|CASOS|CONCELHO)/.test(line)) continue;
		const match = line.match(/\d+$/);
		if (match) {
			const number = parseInt(match[0]);
			caseMap.set(name + line.slice(0, -match[0].length - 1), number);
			name = '';
		} else {
			name += line + ' ';
		}
	}
	return caseMap;
}

export const PortugalCOVIDCases = new Map();

for (let date in rawPortugalCOVIDCases) {
	PortugalCOVIDCases.set(date, parseCases(rawPortugalCOVIDCases[date as any]));
}
