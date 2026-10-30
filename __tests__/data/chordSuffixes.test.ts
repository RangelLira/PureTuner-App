import guitarData from '@tombatossals/chords-db/lib/guitar.json';
import {
  CHORD_SUFFIX_ALIASES,
  chordSearchKeys,
  matchChordSearch,
  normalizeChordQuery,
} from '../../src/data/chordSuffixes';

const SHARP_TONICS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SUFFIXES: string[] = (guitarData as any).suffixes;

// Mesma regra da busca em ChordsScreen: prefixo de alguma chave do acorde.
function search(query: string): string[] {
  const q = normalizeChordQuery(query);
  return SHARP_TONICS.flatMap(t =>
    SUFFIXES.filter(s => matchChordSearch(chordSearchKeys(t, s), q).length > 0).map(s => `${t}|${s}`),
  );
}

// Busca exata: o acorde cuja chave é igual à consulta inteira.
function exact(query: string): string[] {
  const q = normalizeChordQuery(query);
  return SHARP_TONICS.flatMap(t =>
    SUFFIXES.filter(s => matchChordSearch(chordSearchKeys(t, s), q).some(m => m.exact)).map(s => `${t}|${s}`),
  );
}

describe('busca de acordes — grafias alternativas', () => {
  it.each([
    ['Cmaj7', 'C|maj7'],
    ['C7M', 'C|maj7'],
    ['C7+', 'C|maj7'],
    ['CMaj7', 'C|maj7'],
    ['Cm7m', 'C|m7'],
    ['Cm7', 'C|m7'],
    ['C7M(9)', 'C|maj9'],
    ['Cm7M', 'C|mmaj7'],
    ['Cm(maj7)', 'C|mmaj7'],
    ['Bm7(b5)', 'B|m7b5'],
    ['Bø', 'B|m7b5'],
    ['Bm7(5-)', 'B|m7b5'],
    ['B°', 'B|dim'],
    ['Bº', 'B|dim'],
    ['B°7', 'B|dim7'],
    ['C+', 'C|aug'],
    ['C7(#5)', 'C|aug7'],
    ['C7(9-)', 'C|7b9'],
    ['C4', 'C|sus4'],
    ['C7(4)', 'C|7sus4'],
    ['Db7M', 'C#|maj7'],
    ['E♭m7', 'D#|m7'],
    ['Bb', 'A#|major'],
    ['C/E', 'C|/E'],
  ])('"%s" encontra exatamente %s', (query, expected) => {
    expect(exact(query)).toEqual([expected]);
  });

  it('nenhuma grafia aponta para dois acordes diferentes do mesmo tom', () => {
    for (const t of SHARP_TONICS) {
      const owner = new Map<string, string>();
      for (const s of SUFFIXES) {
        for (const { key: k } of chordSearchKeys(t, s)) {
          expect([s, undefined]).toContain(owner.get(k));
          owner.set(k, s);
        }
      }
    }
  });

  it('todo sufixo com alias existe no dicionário', () => {
    for (const s of Object.keys(CHORD_SUFFIX_ALIASES)) expect(SUFFIXES).toContain(s);
  });

  it.each([
    ['C7+', 'C', 'maj7', 'C7+'],
    ['c7M', 'C', 'maj7', 'C7M'],
    ['Cm7m', 'C', 'm7', 'Cm7m'],
    ['Db7M', 'C#', 'maj7', 'Db7M'],
    ['Bø', 'B', 'm7b5', 'Bø'],
    ['Cmaj7', 'C', 'maj7', 'Cmaj7'],
  ])('"%s" mostra o acorde com a grafia digitada', (query, tonic, suffix, label) => {
    expect(matchChordSearch(chordSearchKeys(tonic, suffix), normalizeChordQuery(query)))
      .toContainEqual({ label, exact: true });
  });

  it('a primeira grafia é sempre o símbolo padrão do app', () => {
    expect(chordSearchKeys('C', 'maj7')[0].label).toBe('Cmaj7');
    expect(chordSearchKeys('C', 'major')[0].label).toBe('C');
  });

  it('"M" maiúsculo é sétima maior; "m" minúsculo é menor', () => {
    expect(exact('Cm7M')).toEqual(['C|mmaj7']);
    expect(exact('Cm7m')).toEqual(['C|m7']);
    expect(exact('C7m')).not.toContain('C|maj7');
  });

  it('cada grafia que casa vira uma opção própria na lista', () => {
    const labels = matchChordSearch(chordSearchKeys('C', 'maj7'), normalizeChordQuery('C7'))
      .map(m => m.label);
    expect(labels).toEqual(['C7M', 'C7+']);
  });

  it('busca por prefixo continua funcionando com as novas grafias', () => {
    expect(search('C7')).toEqual(expect.arrayContaining(['C|7', 'C|maj7', 'C|7b5']));
    expect(search('C7')).not.toContain('C|m7');
  });
});
