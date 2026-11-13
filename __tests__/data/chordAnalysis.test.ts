import { Interval } from '@tonaljs/tonal';
import guitarData from '@tombatossals/chords-db/lib/guitar.json';
import {
  analyzeChord,
  degreeLabel,
  degreesFor,
  scaleDegrees,
  suffixIntervals,
} from '../../src/data/chordAnalysis';

// MIDI das cordas soltas (grave → aguda) e ajudante pra montar acordes por casa.
const OPEN = [40, 45, 50, 55, 59, 64];
const voicing = (frets: (number | null)[]) =>
  frets.flatMap((f, i) => (f === null ? [] : [OPEN[i] + f]));

describe('degreeLabel — notação brasileira', () => {
  it.each([
    ['1P', 'T'], ['8P', 'T'], ['3m', '3m'], ['3M', '3M'], ['5P', '5J'],
    ['5d', '5d'], ['5A', '5A'], ['7m', '7m'], ['7M', '7M'], ['9M', '9M'],
    ['11P', '11J'], ['13M', '13M'], ['4P', '4J'], ['7d', '7d'],
  ])('%s → %s', (iv, label) => expect(degreeLabel(iv)).toBe(label));
});

describe('graus dos acordes do dicionário', () => {
  it('todo sufixo do dicionário tem fórmula', () => {
    for (const s of (guitarData as any).suffixes as string[]) {
      expect(suffixIntervals(s).length).toBeGreaterThanOrEqual(3);
    }
  });

  it('Cmaj7 = T 3M 5J 7M; Cm7(b5) = T 3m 5d 7m', () => {
    expect(degreesFor(0, [0, 4, 7, 11], suffixIntervals('maj7'))).toEqual(['T', '3M', '5J', '7M']);
    expect(degreesFor(0, [0, 3, 6, 10], suffixIntervals('m7b5'))).toEqual(['T', '3m', '5d', '7m']);
  });

  it('nona é 9M (não 2M) quando o acorde tem nona', () => {
    expect(degreesFor(0, [0, 4, 7, 10, 2], suffixIntervals('9'))).toEqual(['T', '3M', '5J', '7m', '9M']);
  });

  it('baixo fora da tríade (C/D) cai no grau neutro', () => {
    expect(degreesFor(0, [0, 2, 4, 7], suffixIntervals('/D'))).toEqual(['T', '2M', '3M', '5J']);
  });
});

describe('graus das escalas', () => {
  it('maior = T 2M 3M 4J 5J 6M 7M', () => {
    expect(scaleDegrees('major')).toEqual(['T', '2M', '3M', '4J', '5J', '6M', '7M']);
  });
  it('blues menor tem a quinta diminuta', () => {
    expect(scaleDegrees('minor blues')).toEqual(['T', '3m', '4J', '5d', '5J', '7m']);
  });
});

describe('analyzeChord — nome com a tônica escolhida', () => {
  it('sem notas, sem nome', () => {
    expect(analyzeChord([], null).name).toBeNull();
  });

  it('1 ou 2 notas não nomeiam, exceto o power chord', () => {
    expect(analyzeChord([48], 0).name).toBeNull();
    expect(analyzeChord([48, 52], 0).name).toBeNull();
    expect(analyzeChord([48, 52], 0).hint).toContain('terça maior');
    expect(analyzeChord([48, 55], 0).name).toBe('C5');
  });

  it.each([
    // [cordas E A D G B e, tônica, nome]
    [[null, 3, 2, 0, 1, 0], 0, 'C'],
    [[null, 3, 2, 0, 0, 0], 0, 'Cmaj7'],
    [[null, 0, 2, 2, 1, 0], 9, 'Am'],
    [[null, 0, 2, 0, 1, 0], 9, 'Am7'],
    [[3, 2, 0, 0, 0, 1], 7, 'G7'],
    [[null, 3, 4, 3, 4, null], 0, 'Cm7(b5)'],
    [[null, 3, 4, 2, 4, 2], 0, 'Cdim7'],
  ])('%j com tônica %i = %s', (frets, tonic, name) => {
    expect(analyzeChord(voicing(frets), tonic).name).toBe(name);
  });

  it('todo acorde do dicionário, montado pela fórmula, é reconhecido pelo próprio sufixo', () => {
    for (const suffix of (guitarData as any).suffixes as string[]) {
      if (suffix.includes('/') || suffix === '7sg') continue; // 7sg = mesma fórmula do 7
      const pitches = suffixIntervals(suffix).map(iv => 48 + (Interval.semitones(iv) ?? 0));
      expect([suffix, analyzeChord(pitches, 0).suffix]).toEqual([suffix, suffix]);
    }
  });

  it('baixo diferente da tônica vira barra (inversão)', () => {
    const cE = analyzeChord([52, 55, 60], 0); // E G C, tônica C
    expect(cE.name).toBe('C/E');
    expect(cE.hint).toContain('Inversão');
    // D no baixo entra no acorde: é Cadd9 com a nona no baixo.
    expect(analyzeChord([50, 55, 60, 64], 0).name).toBe('Cadd9/D');
  });

  it('tônica "estranha" sugere a leitura do dicionário', () => {
    const r = analyzeChord([52, 55, 60], 4); // E G C, tônica E
    expect(r.alternative).toBe('C/E');
  });

  it('notas sem nome mostram os graus mesmo assim', () => {
    const r = analyzeChord([48, 49, 50], 0);
    expect(r.name).toBeNull();
    expect(r.degrees).toEqual(['T', '2m', '2M']);
  });

  it('notas e graus vêm ordenados a partir da tônica, sem repetição', () => {
    const r = analyzeChord(voicing([null, 3, 2, 0, 1, 0]), 0);
    expect(r.notes).toEqual(['C', 'E', 'G']);
    expect(r.degrees).toEqual(['T', '3M', '5J']);
  });
});

describe('só nomeia o que é acorde pro app', () => {
  it('conjunto que só existe como tipo exótico fica sem nome', () => {
    // E G C com tônica E seria "Em#5" pra tonal — pro leigo, não é acorde.
    expect(analyzeChord([52, 55, 60], 4).name).toBeNull();
    expect(analyzeChord([48, 52, 55], 4).name).toBeNull();
  });

  it('sem nome, sugere a nota a segurar pra ler como acorde', () => {
    const r = analyzeChord([52, 55, 60], 4);
    expect(r.alternative).toBe('C/E');
    expect(r.hint).toContain('Segure a nota C');
  });

  it('expõe tônica e baixo (pra achar as variações no banco)', () => {
    const r = analyzeChord([52, 55, 60], 0);
    expect([r.tonicPC, r.bassPC]).toEqual([0, 4]);
  });
});
