import type { FretboardBarre } from '../components/ShapeFretboard';
import type { ShapeData } from './scaleShapesC';

export interface ChordShapeTemplate {
  shape: ShapeData;
  muted: string[];
}

export interface FretboardData {
  shape: ShapeData;
  muted: string[];
  barres: FretboardBarre[];
}

// 5 shapes por qualidade de acorde, na ordem C-A-G-E-D (CAGED), com os trastes
// já expressos "como se a tônica fosse Dó" (tonicPC = 0). Para transpor para
// outra tônica soma-se tonicPC a cada traste, exatamente como as escalas.
//
// Cada shape é a digitação real do acorde aberto correspondente à letra do
// CAGED (C = acorde de Dó aberto, A = Lá aberto, G = Sol aberto, E = Mi
// aberto, D = Ré aberto), já deslocada para tônica Dó. Verificado por script:
// todas as 12 tônicas × 5 shapes × 5 qualidades produzem exatamente as classes
// de altura esperadas para cada qualidade (nenhuma nota estranha, fundamental
// e terça sempre presentes).
export const CHORD_SHAPES_C: Record<string, ChordShapeTemplate[]> = {
  major: [
    { shape: { A: [3], D: [2], G: [0], B: [1], e: [0] }, muted: ['E'] },
    { shape: { A: [3], D: [5], G: [5], B: [5], e: [3] }, muted: ['E'] },
    { shape: { E: [8], A: [7], D: [5], G: [5], B: [5], e: [8] }, muted: [] },
    { shape: { E: [8], A: [10], D: [10], G: [9], B: [8], e: [8] }, muted: [] },
    { shape: { D: [10], G: [12], B: [13], e: [12] }, muted: ['E', 'A'] },
  ],
  minor: [
    { shape: { A: [3], D: [1], G: [0], B: [1] }, muted: ['E', 'e'] },
    { shape: { A: [3], D: [5], G: [5], B: [4], e: [3] }, muted: ['E'] },
    { shape: { E: [8], A: [6], D: [5], G: [5], e: [8] }, muted: ['B'] },
    { shape: { E: [8], A: [10], D: [10], G: [8], B: [8], e: [8] }, muted: [] },
    { shape: { D: [10], G: [12], B: [13], e: [11] }, muted: ['E', 'A'] },
  ],
  '7': [
    { shape: { A: [3], D: [2], G: [3], B: [1], e: [0] }, muted: ['E'] },
    { shape: { A: [3], D: [5], G: [3], B: [5], e: [3] }, muted: ['E'] },
    { shape: { E: [8], A: [7], D: [5], G: [5], B: [5], e: [6] }, muted: [] },
    { shape: { E: [8], A: [10], D: [8], G: [9], B: [8], e: [8] }, muted: [] },
    { shape: { D: [10], G: [12], B: [11], e: [12] }, muted: ['E', 'A'] },
  ],
  maj7: [
    { shape: { A: [3], D: [2], G: [0], B: [0], e: [0] }, muted: ['E'] },
    { shape: { A: [3], D: [5], G: [4], B: [5], e: [3] }, muted: ['E'] },
    { shape: { E: [8], A: [7], D: [5], G: [5], B: [5], e: [7] }, muted: [] },
    { shape: { E: [8], A: [10], D: [9], G: [9], B: [8], e: [8] }, muted: [] },
    { shape: { D: [10], G: [12], B: [12], e: [12] }, muted: ['E', 'A'] },
  ],
  m7: [
    { shape: { A: [3], D: [1], G: [3], B: [1] }, muted: ['E', 'e'] },
    { shape: { A: [3], D: [5], G: [3], B: [4], e: [3] }, muted: ['E'] },
    { shape: { E: [8], A: [6], D: [5], G: [5], e: [6] }, muted: ['B'] },
    { shape: { E: [8], A: [10], D: [8], G: [8], B: [8], e: [8] }, muted: [] },
    { shape: { D: [10], G: [12], B: [11], e: [11] }, muted: ['E', 'A'] },
  ],
};

export const CAGED_LETTERS = ['C', 'A', 'G', 'E', 'D'] as const;

// Traste onde a pestana apareceria — sempre o menor traste do shape quando
// compartilhado por 2+ cordas (as cordas que eram soltas no acorde aberto
// original viram a pestana ao subir o braço). Calculado, não hardcoded, para
// não depender de anotação manual propensa a erro.
function computeBarre(shape: ShapeData): FretboardBarre | null {
  const entries = Object.entries(shape).map(([str, frets]) => [str, frets[0]] as [string, number]);
  if (entries.length === 0) return null;
  const minFret = Math.min(...entries.map(([, f]) => f));
  if (minFret <= 0) return null;
  const strings = entries.filter(([, f]) => f === minFret).map(([s]) => s);
  return strings.length >= 2 ? { fret: minFret, strings } : null;
}

// Cada shape carrega seu próprio "traste mínimo" na base (root = Dó). Ao
// transpor, reduzimos o deslocamento pela oitava de forma independente por
// shape (módulo 12) para que cada um caia sempre na posição mais baixa e
// mais tocável possível — é isso que faz, por exemplo, o G-shape virar o
// próprio acorde de Sol aberto quando a tônica escolhida é Sol, em vez de
// aparecer preso lá em cima do braço.
export function transposeChordShape(template: ChordShapeTemplate, tonicPC: number): FretboardData {
  const allFrets = Object.values(template.shape).flat();
  const minBase = allFrets.length > 0 ? Math.min(...allFrets) : 0;
  const target = (((minBase + tonicPC) % 12) + 12) % 12;
  const offset = target - minBase;

  const shape: ShapeData = {};
  for (const [str, frets] of Object.entries(template.shape)) {
    shape[str] = frets.map(f => f + offset);
  }

  const barre = computeBarre(shape);
  return { shape, muted: template.muted, barres: barre ? [barre] : [] };
}
