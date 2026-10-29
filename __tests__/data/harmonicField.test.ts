import { Key, Note } from '@tonaljs/tonal';
import {
  FieldChord,
  harmonicField,
  keySignature,
  sectorMajorKey,
  tonicOf,
  wheelLabels,
  windowChords,
} from '../../src/data/harmonicField';

// Converte para a mesma notação de tríade do tonaljs ('F#', 'G#m', 'E#dim').
const toTonal = (c: FieldChord) =>
  c.root + (c.quality === 'minor' ? 'm' : c.quality === 'dim' ? 'dim' : '');

const toTonalSeventh = (c: FieldChord) => c.root + c.seventh;

// Todos os 12 setores.
const CASES = Array.from({ length: 12 }, (_, s) => s);

describe('harmonicField', () => {
  test.each(CASES)('setor %i, maior: igual às tríades do tonaljs', sector => {
    const key = sectorMajorKey(sector);
    expect(harmonicField(sector, 'major').map(toTonal)).toEqual(Key.majorKey(key).triads);
  });

  test.each(CASES)('setor %i, menor natural: igual às tríades do tonaljs', sector => {
    const tonic = tonicOf(sector, 'minor');
    expect(harmonicField(sector, 'minor').map(toTonal))
      .toEqual(Key.minorKey(tonic).natural.triads);
  });

  test.each(CASES)('setor %i, maior com sétima: igual às tétrades do tonaljs', sector => {
    const key = sectorMajorKey(sector);
    expect(harmonicField(sector, 'major').map(toTonalSeventh)).toEqual(Key.majorKey(key).chords);
  });

  test.each(CASES)('setor %i, menor com sétima: igual às tétrades do tonaljs', sector => {
    const tonic = tonicOf(sector, 'minor');
    expect(harmonicField(sector, 'minor').map(toTonalSeventh))
      .toEqual(Key.minorKey(tonic).natural.chords);
  });

  test('funções harmônicas: maior', () => {
    const f = harmonicField(0, 'major').map(c => `${c.degree}:${c.func}${c.primary ? '*' : ''}`);
    expect(f).toEqual(['I:T*', 'ii:SD', 'iii:T', 'IV:SD*', 'V:D*', 'vi:T', 'viiº:D']);
  });

  test('funções harmônicas: menor', () => {
    const f = harmonicField(0, 'minor').map(c => `${c.degree}:${c.func}${c.primary ? '*' : ''}`);
    expect(f).toEqual(['i:T*', 'iiº:SD', 'III:T', 'iv:SD*', 'v:D*', 'VI:SD', 'VII:D']);
  });

  test('menor usa os mesmos 7 acordes da relativa maior (mesma janela)', () => {
    const major = harmonicField(0, 'major').map(toTonal).sort();
    const minor = harmonicField(0, 'minor').map(toTonal).sort();
    expect(minor).toEqual(major);
    expect(tonicOf(0, 'minor')).toBe('A');
  });

  test('Dó maior: graus na ordem I..viiº', () => {
    expect(harmonicField(0, 'major').map(c => c.degree))
      .toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'viiº']);
    expect(harmonicField(0, 'minor').map(c => c.degree))
      .toEqual(['i', 'iiº', 'III', 'iv', 'v', 'VI', 'VII']);
  });
});

describe('janela do círculo', () => {
  test.each(CASES)('setor %i: vizinhos da janela batem com os setores vizinhos do círculo', sector => {
    const w = windowChords(sector, 'major');
    [-1, 0, 1].forEach((offset, i) => {
      const neighbor = sectorMajorKey(sector + offset);
      expect(Note.chroma(w.outer[i].root)).toBe(Note.chroma(neighbor));
    });
  });

  test('setor 6 é sempre Sol♭: diminuto Fº e relativa Mi♭m, nunca Mi♯/Ré♯', () => {
    expect(sectorMajorKey(6)).toBe('Gb');
    expect(tonicOf(6, 'minor')).toBe('Eb');
    const labels = wheelLabels(6);
    expect(labels.outer[6]).toBe('Gb');
    expect(labels.middle[6]).toBe('Eb');
    expect(labels.inner[6]).toBe('F');
    expect(harmonicField(6, 'major').map(toTonal))
      .toEqual(['Gb', 'Abm', 'Bbm', 'Cb', 'Db', 'Ebm', 'Fdim']);
  });

  test('grafia segue o tom: em Si maior o vizinho da 5ª é Fá♯ (não Sol♭)', () => {
    const labels = wheelLabels(5);
    expect(labels.outer[6]).toBe('F#');
    expect(labels.middle[6]).toBe('D#');
    // fora da janela continua a grafia padrão
    expect(wheelLabels(0).outer[6]).toBe('Gb');
  });
});

describe('keySignature', () => {
  test.each(CASES)('setor %i: mesma quantidade de acidentes do tonaljs', sector => {
    const alteration = Key.majorKey(sectorMajorKey(sector)).alteration;
    const sig = keySignature(sector);
    expect(sig.count).toBe(Math.abs(alteration));
    expect(sig.type).toBe(alteration > 0 ? 'sharp' : alteration < 0 ? 'flat' : null);
  });
});
