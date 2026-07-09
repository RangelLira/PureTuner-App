// Nomes em solfejo por classe de altura (0=Dó .. 11=Si), mesma convenção usada
// na Tela Escalas.
export const SOLFEGE_BY_PC = [
  'Dó', 'Dó#', 'Ré', 'Réb', 'Mi', 'Fá', 'Fá#', 'Sol', 'Láb', 'Lá', 'Sib', 'Si',
];

const LETTER_PC: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

// Símbolo compacto exibido no círculo de tom (ex.: "C" + "m7" = "Cm7").
export const CHORD_SUFFIX_SYMBOLS: Record<string, string> = {
  major: '',
  minor: 'm',
  dim: 'dim',
  dim7: 'dim7',
  sus2: 'sus2',
  sus4: 'sus4',
  '7sus4': '7sus4',
  alt: '7alt',
  aug: 'aug',
  '6': '6',
  '69': '6/9',
  '7': '7',
  '7b5': '7(b5)',
  '7sg': '7(sg)',
  aug7: 'aug7',
  '9': '9',
  '9b5': '9(b5)',
  aug9: 'aug9',
  '7b9': '7(b9)',
  '7#9': '7(#9)',
  '11': '11',
  '9#11': '9(#11)',
  '13': '13',
  maj7: 'maj7',
  maj7b5: 'maj7(b5)',
  'maj7#5': 'maj7(#5)',
  maj9: 'maj9',
  maj11: 'maj11',
  maj13: 'maj13',
  m6: 'm6',
  m7: 'm7',
  m7b5: 'm7(b5)',
  m9: 'm9',
  m69: 'm6/9',
  m11: 'm11',
  mmaj7: 'm(maj7)',
  mmaj7b5: 'm(maj7)(b5)',
  mmaj9: 'm(maj9)',
  mmaj11: 'm(maj11)',
  add9: 'add9',
  madd9: 'm(add9)',
};

// Frase "por extenso" usada no chip, encaixada depois do nome em solfejo da
// tônica (ex.: "Mi" + "menor com sétima e quinta bemol").
export const CHORD_QUALITY_PHRASES: Record<string, string> = {
  major: 'maior',
  minor: 'menor',
  dim: 'diminuto',
  dim7: 'diminuto com sétima diminuta',
  sus2: 'suspenso de segunda',
  sus4: 'suspenso de quarta',
  '7sus4': 'com sétima e suspensão de quarta',
  alt: 'dominante alterado',
  aug: 'aumentado',
  '6': 'com sexta',
  '69': 'com sexta e nona',
  '7': 'com sétima',
  '7b5': 'com sétima e quinta bemol',
  '7sg': 'com sétima (voz. alternativa)',
  aug7: 'aumentado com sétima',
  '9': 'com nona',
  '9b5': 'com nona e quinta bemol',
  aug9: 'aumentado com nona',
  '7b9': 'com sétima e nona bemol',
  '7#9': 'com sétima e nona sustenida',
  '11': 'com décima primeira',
  '9#11': 'com nona e décima primeira sustenida',
  '13': 'com décima terceira',
  maj7: 'maior com sétima maior',
  maj7b5: 'maior com sétima maior e quinta bemol',
  'maj7#5': 'maior com sétima maior e quinta sustenida',
  maj9: 'maior com nona',
  maj11: 'maior com décima primeira',
  maj13: 'maior com décima terceira',
  m6: 'menor com sexta',
  m7: 'menor com sétima',
  m7b5: 'menor com sétima e quinta bemol',
  m9: 'menor com nona',
  m69: 'menor com sexta e nona',
  m11: 'menor com décima primeira',
  mmaj7: 'menor com sétima maior',
  mmaj7b5: 'menor com sétima maior e quinta bemol',
  mmaj9: 'menor com sétima maior e nona',
  mmaj11: 'menor com sétima maior e décima primeira',
  add9: 'maior com nona acrescentada',
  madd9: 'menor com nona acrescentada',
};

// Texto curto explicando a formação/uso de cada qualidade — mesma função do
// SCALE_DESCRIPTIONS na Tela Escalas.
export const CHORD_DESCRIPTIONS: Record<string, string> = {
  major: 'Tríade com terça maior e quinta justa. Som brilhante e resolvido — a base da harmonia tonal ocidental.',
  minor: 'Tríade com terça menor e quinta justa. Som mais escuro e introspectivo que o maior, muito usado em baladas e rock.',
  dim: 'Terça menor e quinta diminuta. Acorde tenso e instável, usado como passagem para resolver em outro acorde.',
  dim7: 'Empilha terças menores. Simétrico e altamente tenso, clássico em jazz e trilhas de suspense.',
  sus2: 'Substitui a terça pela segunda. Som aberto e ambíguo, nem maior nem menor.',
  sus4: 'Substitui a terça pela quarta, criando tensão que pede resolução para a tríade maior.',
  '7sus4': 'Sétima dominante com a terça substituída pela quarta. Muito usado em introduções e levadas de rock e gospel.',
  alt: 'Dominante com tensões alteradas (b9, #9, #5). Típico do jazz para criar máxima tensão antes da resolução.',
  aug: 'Terça maior e quinta aumentada. Som tenso e ambíguo, comum em passagens cromáticas e jazz.',
  '6': 'Tríade maior acrescida da sexta. Som suave e nostálgico, comum em jazz e swing.',
  '69': 'Acorde com sexta e nona sobre a tríade maior. Sonoridade rica, típica de finais de música e jazz.',
  '7': 'Tríade maior com sétima menor. O acorde dominante clássico do blues, funk e rock.',
  '7b5': 'Dominante com a quinta abaixada. Som tenso, comum em jazz e substituições tritônicas.',
  '7sg': 'Variação de voicing do acorde de sétima dominante.',
  aug7: 'Sétima dominante com quinta aumentada. Cria forte tensão antes de resolver, comum no jazz.',
  '9': 'Sétima dominante acrescida da nona. Som mais colorido, muito usado em funk e R&B.',
  '9b5': 'Nona dominante com a quinta abaixada. Sonoridade tensa, usada em harmonias de jazz mais elaboradas.',
  aug9: 'Nona dominante com quinta aumentada. Combina a tensão da quinta alterada com o colorido da nona.',
  '7b9': 'Dominante com nona abaixada. Som tenso e dissonante, clássico em cadências de jazz.',
  '7#9': 'Dominante com nona aumentada — o acorde usado por Jimi Hendrix. Mistura maior e menor no mesmo acorde.',
  '11': 'Empilha até a décima primeira sobre o dominante. Sonoridade densa, comum em jazz modal.',
  '9#11': 'Nona dominante com a décima primeira aumentada. Cor lídio-dominante, comum no jazz fusion.',
  '13': 'Empilha até a décima terceira sobre o dominante. O acorde de tensão mais completo da harmonia funcional.',
  maj7: 'Tríade maior com sétima maior. Som suave e sonhador, marca registrada da bossa nova e do jazz.',
  maj7b5: 'Sétima maior com a quinta abaixada. Cor incomum, usada em harmonias mais ousadas do jazz.',
  'maj7#5': 'Sétima maior com quinta aumentada. Som etéreo e tenso ao mesmo tempo, comum em jazz moderno.',
  maj9: 'Sétima maior acrescida da nona. Sonoridade aberta e sofisticada, típica da bossa nova.',
  maj11: 'Sétima maior estendida até a décima primeira. Textura densa e moderna, comum no jazz contemporâneo.',
  maj13: 'Sétima maior estendida até a décima terceira. O acorde maior mais completo da harmonia funcional.',
  m6: 'Tríade menor acrescida da sexta. Som nostálgico, muito usado em jazz e valsas.',
  m7: 'Tríade menor com sétima menor. O acorde menor mais comum do jazz, funk e MPB.',
  m7b5: 'Menor com sétima e quinta abaixadas — o acorde meio-diminuto. Típico do 2º grau em progressões menores de jazz.',
  m9: 'Menor com sétima acrescida da nona. Sonoridade suave e sofisticada, comum em jazz e neo-soul.',
  m69: 'Menor com sexta e nona. Cor suave e jazzística, usada como acorde de repouso em tons menores.',
  m11: 'Menor estendido até a décima primeira. Textura aberta e modal, comum em jazz e fusion.',
  mmaj7: 'Menor com sétima maior. Som dramático e cinematográfico, clássico em trilhas sonoras.',
  mmaj7b5: 'Menor com sétima maior e quinta abaixada. Sonoridade rara e altamente tensa.',
  mmaj9: 'Menor com sétima maior e nona. Combina o drama da sétima maior com um colorido extra.',
  mmaj11: 'Menor com sétima maior estendido até a décima primeira. Harmonia densa e pouco comum.',
  add9: 'Tríade maior com a nona adicionada, sem a sétima. Som aberto e moderno, muito usado no pop.',
  madd9: 'Tríade menor com a nona adicionada, sem a sétima. Sonoridade suave e contemporânea.',
};

// Acordes de baixo invertido (ex.: "/E") não têm um sufixo fixo — o próprio
// texto já é o baixo (nota após a barra), então símbolo, frase e descrição
// são gerados dinamicamente a partir dele.
export function chordSuffixSymbol(suffix: string): string {
  if (suffix.startsWith('/')) return suffix;
  return CHORD_SUFFIX_SYMBOLS[suffix] ?? suffix;
}

function slashBassSolfege(suffix: string): string {
  const letter = suffix.slice(1);
  const pc = LETTER_PC[letter];
  return pc !== undefined ? SOLFEGE_BY_PC[pc] : letter;
}

export function chordQualityPhrase(suffix: string): string {
  if (suffix.startsWith('/')) return `maior com baixo em ${slashBassSolfege(suffix)}`;
  return CHORD_QUALITY_PHRASES[suffix] ?? suffix;
}

export function chordDescription(suffix: string): string {
  if (suffix.startsWith('/')) {
    return `Tríade maior tocada com o baixo em ${slashBassSolfege(suffix)} em vez da fundamental. Cria uma linha de baixo melódica ou uma inversão do acorde.`;
  }
  return CHORD_DESCRIPTIONS[suffix] ?? '';
}
