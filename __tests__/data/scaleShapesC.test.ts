import { Note, Scale } from '@tonaljs/tonal';
import { SCALE_SHAPES_C } from '../../src/data/scaleShapesC';
import { transposeShape } from '../../src/screens/ScalesScreen';

// Classe de altura (pitch class) de cada corda solta, C=0 — mesma convenção
// usada em ShapeFretboard e chordShapesC.
const STRING_PC: Record<string, number> = { e: 4, B: 11, G: 7, D: 2, A: 9, E: 4 };

const TONICS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

describe('SCALE_SHAPES_C / transposeShape', () => {
  test('todas as 16 escalas têm exatamente 5 shapes', () => {
    Object.values(SCALE_SHAPES_C).forEach(shapes => expect(shapes).toHaveLength(5));
  });

  describe.each(Object.keys(SCALE_SHAPES_C))('escala "%s"', scaleName => {
    test('todo shape, em toda tônica, só contém notas pertencentes à escala (comparado ao @tonaljs/tonal)', () => {
      const shapes = SCALE_SHAPES_C[scaleName];
      TONICS.forEach(tonic => {
        const tonicPC = Note.chroma(tonic) as number;
        const scaleResult = Scale.get(`${tonic} ${scaleName}`);
        expect(scaleResult.empty).toBe(false); // nome de escala precisa existir no tonaljs
        const allowedPCs = new Set(scaleResult.notes.map(n => Note.chroma(n)));

        shapes.forEach((shape, shapeIdx) => {
          const transposed = transposeShape(shape, tonicPC);
          for (const [str, frets] of Object.entries(transposed)) {
            for (const fret of frets) {
              const pc = ((STRING_PC[str] + fret) % 12 + 12) % 12;
              expect({ scaleName, tonic, shapeIdx, str, fret, pc, allowed: allowedPCs.has(pc) })
                .toEqual(expect.objectContaining({ allowed: true }));
            }
          }
        });
      });
    });

    test('nenhum shape transposto produz traste negativo em nenhuma das 12 tônicas', () => {
      const shapes = SCALE_SHAPES_C[scaleName];
      for (let tonicPC = 0; tonicPC < 12; tonicPC++) {
        shapes.forEach(shape => {
          const transposed = transposeShape(shape, tonicPC);
          const allFrets = Object.values(transposed).flat();
          expect(Math.min(...allFrets)).toBeGreaterThanOrEqual(0);
        });
      }
    });
  });

  test('transposeShape com tonicPC=0 retorna o shape original sem cópia (mesma referência)', () => {
    const shape = SCALE_SHAPES_C.major[0];
    expect(transposeShape(shape, 0)).toBe(shape);
  });
});
