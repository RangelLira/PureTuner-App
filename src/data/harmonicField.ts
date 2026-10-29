import { Note } from '@tonaljs/tonal';

// Modelo do círculo das quintas usado pela Tela Campo Harmônico.
//
// O círculo tem 12 setores (0 = Dó no topo, sentido horário sobe uma 5ª) e
// 3 aros: externo = tons maiores, do meio = relativas menores, interno =
// diminuto (viiº do tom maior do setor). O campo harmônico de qualquer tom
// cabe sempre numa "janela" de 3 setores vizinhos: tom no centro, 4ª à
// esquerda, 5ª à direita — nos aros externo e do meio — mais o diminuto só
// no setor central do aro interno.

export type HarmonicMode = 'major' | 'minor';
export type ChordQuality = 'major' | 'minor' | 'dim';
// Qualidade da tétrade, com o nome de sufixo do @tombatossals/chords-db.
export type SeventhQuality = 'maj7' | 'm7' | '7' | 'm7b5';
// Função harmônica: tônica (repouso), subdominante (afastamento),
// dominante (tensão que pede resolução na tônica).
export type HarmonicFunction = 'T' | 'SD' | 'D';

export interface FieldChord {
  root: string;          // grafia do tonaljs: 'F#', 'Bb', 'E#'...
  quality: ChordQuality;
  seventh: SeventhQuality;
  degree: string;        // grau em algarismo romano: 'I', 'ii', 'viiº'...
  func: HarmonicFunction;
  primary: boolean;      // acorde principal da função (I/IV/V; i/iv/v no menor)
}

export const SECTOR_COUNT = 12;

// Setor 6 (base do círculo) é sempre Sol♭ (6 bemóis), nunca Fá♯: em Fá♯
// maior o 7º grau seria Mi♯ e a relativa Ré♯m — grafias que o app não usa.
// Com Sol♭ ficam Fº e Mi♭m.
const MAJOR_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F'];

export function mod12(n: number) {
  return ((n % SECTOR_COUNT) + SECTOR_COUNT) % SECTOR_COUNT;
}

export function sectorMajorKey(sector: number): string {
  return MAJOR_KEYS[mod12(sector)];
}

const relativeMinor = (major: string) => Note.transpose(major, '6M');
const leadingTone = (major: string) => Note.transpose(major, '7M');

// Cada célula da janela por coluna (-1 = 4ª, 0 = tom, +1 = 5ª): grau e
// função dependem do modo; a tétrade não — é sempre a mesma posição dentro
// da escala maior (o V é o único maior com sétima menor; o viiº é meio
// diminuto).
interface CellInfo { degree: string; func: HarmonicFunction; primary: boolean }
const cell = (degree: string, func: HarmonicFunction, primary = false): CellInfo => ({ degree, func, primary });

const WINDOW_CELLS: Record<HarmonicMode, { outer: CellInfo[]; middle: CellInfo[]; inner: CellInfo }> = {
  major: {
    outer: [cell('IV', 'SD', true), cell('I', 'T', true), cell('V', 'D', true)],
    middle: [cell('ii', 'SD'), cell('vi', 'T'), cell('iii', 'T')],
    inner: cell('viiº', 'D'),
  },
  minor: {
    outer: [cell('VI', 'SD'), cell('III', 'T'), cell('VII', 'D')],
    middle: [cell('iv', 'SD', true), cell('i', 'T', true), cell('v', 'D', true)],
    inner: cell('iiº', 'SD'),
  },
};

const OUTER_SEVENTHS: SeventhQuality[] = ['maj7', 'maj7', '7'];

// Células da janela, com a grafia correta do tom selecionado (ex.: em Si
// maior o vizinho da 5ª é Fá♯, não Sol♭).
// Os vizinhos são obtidos andando uma 4ª/5ª justa a partir do tom, que é
// exatamente o passo de um setor no círculo.
export function windowChords(sector: number, mode: HarmonicMode) {
  const key = sectorMajorKey(sector);
  const majors = [Note.transpose(key, '4P'), key, Note.transpose(key, '5P')];
  const cells = WINDOW_CELLS[mode];
  return {
    outer: majors.map((root, i): FieldChord => ({
      root,
      quality: 'major',
      seventh: OUTER_SEVENTHS[i],
      ...cells.outer[i],
    })),
    middle: majors.map((m, i): FieldChord => ({
      root: relativeMinor(m),
      quality: 'minor',
      seventh: 'm7',
      ...cells.middle[i],
    })),
    inner: { root: leadingTone(key), quality: 'dim', seventh: 'm7b5', ...cells.inner } as FieldChord,
  };
}

// Os 7 acordes na ordem dos graus da escala (I..viiº no maior, i..VII no
// menor natural) — montados a partir da janela do círculo.
export function harmonicField(sector: number, mode: HarmonicMode): FieldChord[] {
  const w = windowChords(sector, mode);
  const [IV, I, V] = w.outer;
  const [ii, vi, iii] = w.middle;
  const vii = w.inner;
  return mode === 'major'
    ? [I, ii, iii, IV, V, vi, vii]
    : [vi, vii, I, ii, iii, IV, V];
}

export function tonicOf(sector: number, mode: HarmonicMode): string {
  const key = sectorMajorKey(sector);
  return mode === 'major' ? key : relativeMinor(key);
}

// Rótulos de todos os setores do círculo. Fora da janela usa a grafia padrão
// de cada setor; dentro da janela, a grafia do tom selecionado — assim o
// círculo nunca mostra, por exemplo, Sol♭ ao lado de Si.
export function wheelLabels(selected: number) {
  const outer: string[] = [];
  const middle: string[] = [];
  const inner: string[] = [];
  for (let s = 0; s < SECTOR_COUNT; s++) {
    const key = sectorMajorKey(s);
    outer.push(key);
    middle.push(relativeMinor(key));
    inner.push(leadingTone(key));
  }
  const w = windowChords(selected, 'major');
  [-1, 0, 1].forEach((offset, i) => {
    const s = mod12(selected + offset);
    outer[s] = w.outer[i].root;
    middle[s] = w.middle[i].root;
    inner[s] = leadingTone(w.outer[i].root);
  });
  return { outer, middle, inner };
}

// Armadura de clave: quantidade de sustenidos (setores 1–5, sentido
// horário) ou bemóis (setores 6–11, sentido anti-horário a partir de Dó).
export function keySignature(sector: number) {
  const s = mod12(sector);
  if (s === 0) return { type: null, count: 0 };
  return s > 5
    ? { type: 'flat' as const, count: SECTOR_COUNT - s }
    : { type: 'sharp' as const, count: s };
}

// ---- Formatação para exibição ----

export function displayNote(note: string) {
  return note[0] + note.slice(1).replace(/#/g, '♯').replace(/b/g, '♭');
}

const SEVENTH_SYMBOLS: Record<SeventhQuality, string> = {
  maj7: 'maj7',
  m7: 'm7',
  '7': '7',
  m7b5: 'm7(♭5)',
};

// Mesma notação da aba Acordes (maj7, m7(b5)), com ♯/♭ tipográficos.
export function chordSymbol(chord: Pick<FieldChord, 'root' | 'quality'> & { seventh?: SeventhQuality }, withSeventh = false) {
  const suffix = withSeventh && chord.seventh
    ? SEVENTH_SYMBOLS[chord.seventh]
    : chord.quality === 'minor' ? 'm' : chord.quality === 'dim' ? 'º' : '';
  return displayNote(chord.root) + suffix;
}

const SOLFEGE_LETTER: Record<string, string> = {
  C: 'Dó', D: 'Ré', E: 'Mi', F: 'Fá', G: 'Sol', A: 'Lá', B: 'Si',
};

export function solfege(note: string) {
  return SOLFEGE_LETTER[note[0]] + note.slice(1).replace(/#/g, '♯').replace(/b/g, '♭');
}
