import { ChordType, Interval, Scale } from '@tonaljs/tonal';
import { chordSuffixSymbol } from './chordSuffixes';

// Graus e nomes de acorde — camada pura usada pelas telas Acordes (inclusive
// o "Montar acorde") e Escalas.

// Nome das notas por classe de altura, com sustenido — mesma grafia dos tons
// da tela Acordes.
export const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const QUALITY_PT: Record<string, string> = { P: 'J', M: 'M', m: 'm', A: 'A', d: 'd' };

// Intervalo da tonal ("3m", "5P", "9M") → grau na notação brasileira
// ("3m", "5J", "9M"). Tônica e oitava viram "T".
export function degreeLabel(interval: string): string {
  const m = /^(\d+)([PMmAd]+)$/.exec(interval);
  if (!m) return interval;
  const num = Number(m[1]);
  if ((num === 1 || num === 8) && m[2] === 'P') return 'T';
  return `${num}${m[2].split('').map(q => QUALITY_PT[q] ?? q).join('')}`;
}

// Grau "neutro" por distância em semitons — usado quando a nota não faz parte
// de uma fórmula conhecida (ex.: o baixo de "C/D", ou um cacho de notas sem
// nome).
const SEMITONE_DEGREES = ['T', '2m', '2M', '3m', '3M', '4J', '5d', '5J', '6m', '6M', '7m', '7M'];

const mod12 = (n: number) => ((n % 12) + 12) % 12;

// Intervalos de cada sufixo do dicionário, em notação da tonal. A maioria vem
// do tipo equivalente da tonal; os 4 que ela não conhece estão à mão.
const SUFFIX_TO_TONAL: Record<string, string> = {
  major: 'M', minor: 'm', dim: 'dim', dim7: 'dim7', sus2: 'sus2', sus4: 'sus4',
  '7sus4': '7sus4', alt: '7alt', aug: 'aug', '6': '6', '69': '69', '7': '7',
  '7b5': '7b5', '7sg': '7', aug7: '7#5', '9': '9', '9b5': '9b5', aug9: '9#5',
  '7b9': '7b9', '7#9': '7#9', '11': '11', '9#11': '9#11', '13': '13',
  maj7: 'maj7', 'maj7#5': 'maj7#5', maj9: 'maj9', maj13: 'maj13', m6: 'm6',
  m69: 'm69', m7: 'm7', m7b5: 'm7b5', m9: 'm9', m11: 'm11', mmaj7: 'mMaj7',
  mmaj9: 'mMaj9', add9: 'add9', madd9: 'madd9',
};
const MANUAL_INTERVALS: Record<string, string[]> = {
  maj7b5: ['1P', '3M', '5d', '7M'],
  maj11: ['1P', '3M', '5P', '7M', '9M', '11P'],
  mmaj7b5: ['1P', '3m', '5d', '7M'],
  mmaj11: ['1P', '3m', '5P', '7M', '9M', '11P'],
};

export function suffixIntervals(suffix: string): string[] {
  // Acordes com baixo do dicionário ("/E" = maior com baixo, "m/B" = menor
  // com baixo): a fórmula é a da tríade; o baixo cai no grau neutro.
  if (suffix.startsWith('/')) return ChordType.get('M').intervals;
  if (suffix.startsWith('m/')) return ChordType.get('m').intervals;
  if (MANUAL_INTERVALS[suffix]) return MANUAL_INTERVALS[suffix];
  const tonal = SUFFIX_TO_TONAL[suffix];
  return tonal !== undefined ? ChordType.get(tonal).intervals : [];
}

// Grau de cada classe de altura em relação à tônica, segundo a fórmula
// (lista de intervalos). Nota fora da fórmula recebe o grau neutro.
export function degreesFor(tonicPC: number, pcs: number[], intervals: string[]): string[] {
  const byChroma = new Map<number, string>();
  for (const iv of intervals) {
    const chroma = mod12(Interval.semitones(iv) ?? 0);
    if (!byChroma.has(chroma)) byChroma.set(chroma, degreeLabel(iv));
  }
  return pcs.map(pc => {
    const rel = mod12(pc - tonicPC);
    return byChroma.get(rel) ?? SEMITONE_DEGREES[rel];
  });
}

// Graus das notas de uma escala (mesma ordem de Scale.get().notes).
export function scaleDegrees(scaleName: string): string[] {
  return Scale.get(`C ${scaleName}`).intervals.map(degreeLabel);
}

// ---------------------------------------------------------------------------
// Nome de um conjunto de notas, com a tônica fixada (a do "Montar acorde").
// Só nomeia o que é acorde de verdade pro app: as fórmulas do dicionário
// (mesma grafia da busca) e o power chord. Qualquer outro conjunto fica sem
// nome — senão o leigo acha que qualquer cacho de notas é acorde.

interface ChordFormula {
  suffix?: string; // sufixo do dicionário do app (o power chord não tem)
  symbol: string;  // símbolo exibido depois da tônica ("m7", "maj7", "5")
  intervals: string[];
  chroma: string;  // conjunto de classes relativo à tônica, 12 chars "1"/"0"
}

function chromaOf(intervals: string[]): string {
  const bits = Array(12).fill('0');
  for (const iv of intervals) bits[mod12(Interval.semitones(iv) ?? 0)] = '1';
  return bits.join('');
}

const FORMULAS: ChordFormula[] = (() => {
  const list: ChordFormula[] = [];
  const seen = new Set<string>();
  const suffixes = [...Object.keys(SUFFIX_TO_TONAL), ...Object.keys(MANUAL_INTERVALS)]
    .filter(s => s !== '7sg');
  for (const suffix of suffixes) {
    const intervals = suffixIntervals(suffix);
    const chroma = chromaOf(intervals);
    if (seen.has(chroma)) continue;
    seen.add(chroma);
    list.push({ suffix, symbol: chordSuffixSymbol(suffix), intervals, chroma });
  }
  // Power chord (tônica + quinta): fora do dicionário, mas de uso corrente.
  const power = ['1P', '5P'];
  list.push({ symbol: '5', intervals: power, chroma: chromaOf(power) });
  return list;
})();

function formulaFor(rootPC: number, pcs: Set<number>): ChordFormula | undefined {
  const bits = Array(12).fill('0');
  pcs.forEach(pc => { bits[mod12(pc - rootPC)] = '1'; });
  const chroma = bits.join('');
  return FORMULAS.find(f => f.chroma === chroma);
}

const INTERVAL_NAMES = [
  'Uníssono', 'Segunda menor', 'Segunda maior', 'Terça menor', 'Terça maior',
  'Quarta justa', 'Trítono', 'Quinta justa', 'Sexta menor', 'Sexta maior',
  'Sétima menor', 'Sétima maior',
];

export interface ChordAnalysis {
  name: string | null;       // ex.: "Cmaj7/E"; null = não é acorde (ainda)
  suffix?: string;           // sufixo do dicionário (o power chord não tem)
  tonicPC: number | null;
  bassPC: number | null;     // nota mais grave
  notes: string[];           // notas distintas, ordenadas a partir da tônica
  degrees: string[];         // grau de cada nota em `notes`
  alternative?: string;      // acorde que essas notas formam com outra tônica
  hint: string;              // texto curto pro leigo
}

// `pitches`: notas MIDI soando (qualquer ordem, repetições permitidas).
export function analyzeChord(pitches: number[], tonicPC: number | null): ChordAnalysis {
  if (pitches.length === 0 || tonicPC === null) {
    return { name: null, tonicPC: null, bassPC: null, notes: [], degrees: [], hint: '' };
  }
  const pcSet = new Set(pitches.map(mod12));
  const ordered = [...pcSet].sort((a, b) => mod12(a - tonicPC) - mod12(b - tonicPC));
  const bassPC = mod12(Math.min(...pitches));
  const slash = (rootPC: number) => (bassPC !== rootPC ? `/${SHARP_NAMES[bassPC]}` : '');

  const formula = formulaFor(tonicPC, pcSet);
  const named = !!formula && (pcSet.size >= 3 || formula.intervals.length === 2);
  const name = named ? `${SHARP_NAMES[tonicPC]}${formula!.symbol}${slash(tonicPC)}` : null;
  const degrees = degreesFor(tonicPC, ordered, named ? formula!.intervals : []);

  // Sem nome com a tônica escolhida, as mesmas notas podem formar um acorde
  // com outra tônica (ex.: E G C com tônica E não é acorde; com C, é "C/E").
  let alternative: { root: number; name: string } | undefined;
  if (pcSet.size >= 3 && !named) {
    alternative = ordered
      .filter(pc => pc !== tonicPC)
      .map(pc => ({ root: pc, f: formulaFor(pc, pcSet) }))
      .filter(c => c.f)
      .map(c => ({ root: c.root, name: `${SHARP_NAMES[c.root]}${c.f!.symbol}${slash(c.root)}` }))
      .sort((a, b) => a.name.length - b.name.length)[0];
  }

  let hint: string;
  if (pcSet.size === 1) {
    hint = 'Marque mais notas para formar o acorde.';
  } else if (pcSet.size === 2) {
    const rel = mod12(ordered[1] - tonicPC);
    hint = named
      ? `${INTERVAL_NAMES[rel]}: o power chord, tônica e quinta sem a terça.`
      : `Intervalo de ${INTERVAL_NAMES[rel].toLowerCase()}. Marque mais uma nota para formar a tríade.`;
  } else if (alternative) {
    hint = `Com ${SHARP_NAMES[tonicPC]} como tônica, essas notas não formam um acorde. `
      + `Segure a nota ${SHARP_NAMES[alternative.root]} para ler como ${alternative.name}.`;
  } else if (!name) {
    hint = 'Essas notas não formam um acorde — veja o grau de cada uma.';
  } else if (bassPC !== tonicPC) {
    // O nome usa todas as notas, então o baixo é sempre nota do acorde.
    hint = `Inversão: o baixo é ${SHARP_NAMES[bassPC]}, não a tônica.`;
  } else {
    hint = '';
  }

  return {
    name,
    suffix: named ? formula!.suffix : undefined,
    tonicPC,
    bassPC,
    notes: ordered.map(pc => SHARP_NAMES[pc]),
    degrees,
    alternative: alternative?.name,
    hint,
  };
}
