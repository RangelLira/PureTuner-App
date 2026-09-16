import { CHORD_SHAPES_C, transposeChordShape } from '../../src/data/chordShapesC';

// Classe de altura (pitch class) de cada corda solta, C=0.
const STRING_PC: Record<string, number> = { e: 4, B: 11, G: 7, D: 2, A: 9, E: 4 };

// Intervalos (em semitons a partir da tônica) que cada qualidade de acorde
// deve conter — é exatamente a garantia que o comentário em chordShapesC.ts
// afirma ter sido "verificada por script", só que sem nenhum script no
// repo. Este teste é essa verificação, permanente e automatizada.
const QUALITY_INTERVALS: Record<string, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  '7': [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
};

function pitchClassesOf(shape: Record<string, number[]>): Set<number> {
  const pcs = new Set<number>();
  for (const [str, frets] of Object.entries(shape)) {
    for (const fret of frets) {
      pcs.add(((STRING_PC[str] + fret) % 12 + 12) % 12);
    }
  }
  return pcs;
}

describe('CHORD_SHAPES_C / transposeChordShape', () => {
  test('todas as 5 qualidades verificadas têm exatamente 5 shapes', () => {
    Object.values(CHORD_SHAPES_C).forEach(shapes => expect(shapes).toHaveLength(5));
  });

  describe.each(Object.entries(QUALITY_INTERVALS))('qualidade "%s"', (suffix, intervals) => {
    test('todas as 12 tônicas × 5 shapes produzem só as classes de altura esperadas (sem nota estranha) e sempre incluem a tônica', () => {
      const templates = CHORD_SHAPES_C[suffix];
      for (let tonicPC = 0; tonicPC < 12; tonicPC++) {
        const expected = new Set(intervals.map(i => (tonicPC + i) % 12));
        templates.forEach(template => {
          const { shape } = transposeChordShape(template, tonicPC);
          const pcs = pitchClassesOf(shape);
          expect(pcs.has(tonicPC)).toBe(true);
          pcs.forEach(pc => expect(expected.has(pc)).toBe(true));
        });
      }
    });

    test('nenhum shape transposto produz traste negativo', () => {
      const templates = CHORD_SHAPES_C[suffix];
      for (let tonicPC = 0; tonicPC < 12; tonicPC++) {
        templates.forEach(template => {
          const { shape } = transposeChordShape(template, tonicPC);
          const allFrets = Object.values(shape).flat();
          expect(Math.min(...allFrets)).toBeGreaterThanOrEqual(0);
        });
      }
    });
  });

  test('a pestana só aparece quando 2+ cordas compartilham o traste mínimo', () => {
    // Shape de Dó maior (aberto): A[3] D[2] G[0] B[1] e[0] — traste mínimo é
    // 0, compartilhado por G e e, mas fret=0 nunca deve virar pestana.
    const openC = CHORD_SHAPES_C.major[0];
    const { barres } = transposeChordShape(openC, 0);
    expect(barres).toEqual([]);
  });

  test('tônica Sol (G, tonicPC=7) cai no próprio acorde aberto de Sol no shape G do CAGED', () => {
    // shape[2] do array 'major' é o G-shape (baseado no acorde aberto de Sol).
    const gShapeTemplate = CHORD_SHAPES_C.major[2];
    const { shape, barres } = transposeChordShape(gShapeTemplate, 7); // G = pc 7
    const allFrets = Object.values(shape).flat();
    expect(Math.min(...allFrets)).toBe(0); // acorde aberto, sem pestana
    expect(barres).toEqual([]);
  });
});
