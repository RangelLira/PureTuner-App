import type { ShapeData } from './scaleShapesC';
import type { FretboardBarre } from '../components/ShapeFretboard';

// Estado do braço no modo "Montar acorde" — camada pura (sem React), testada
// em __tests__/data/chordBuilder.test.ts. Regras do violão real: uma nota
// soando por corda, uma pestana por vez; digitação que a mão não alcança é
// aceita (o modo é pra aprender como o acorde se forma, não pra validar).

export const BUILDER_STRINGS = ['E', 'A', 'D', 'G', 'B', 'e'] as const; // grave → aguda
export type StringKey = typeof BUILDER_STRINGS[number];

const OPEN_MIDI: Record<StringKey, number> = { E: 40, A: 45, D: 50, G: 55, B: 59, e: 64 };

export const MAX_FRET = 15;
export const WINDOW_SLOTS = 7; // casas visíveis de uma vez (igual ao ShapeFretboard)
export const MAX_WINDOW_START = MAX_FRET - WINDOW_SLOTS + 1;

export interface ChordBuilderState {
  // Casa marcada por corda (0 = solta). Corda ausente = não tocada (abafada).
  frets: Partial<Record<StringKey, number>>;
  barre: { fret: number; strings: StringKey[] } | null;
  // Ordem em que as cordas passaram a soar — define a tônica quando a atual
  // deixa de soar (passa pra nota marcada mais antiga).
  order: StringKey[];
  tonicPC: number | null;
  windowStart: number; // primeira casa visível (1 a MAX_WINDOW_START)
}

export const EMPTY_BUILDER: ChordBuilderState = {
  frets: {}, barre: null, order: [], tonicPC: null, windowStart: 1,
};

// Casa que soa em cada corda: a mais aguda entre a nota marcada e a pestana.
export function soundingFret(state: ChordBuilderState, s: StringKey): number | null {
  const own = state.frets[s];
  const barre = state.barre && state.barre.strings.includes(s) ? state.barre.fret : undefined;
  if (own === undefined && barre === undefined) return null;
  return Math.max(own ?? -1, barre ?? -1);
}

export function soundingPitches(state: ChordBuilderState): number[] {
  return BUILDER_STRINGS
    .map(s => ({ s, f: soundingFret(state, s) }))
    .filter(x => x.f !== null)
    .map(x => OPEN_MIDI[x.s] + (x.f as number));
}

function pcOn(state: ChordBuilderState, s: StringKey): number | null {
  const f = soundingFret(state, s);
  return f === null ? null : (OPEN_MIDI[s] + f) % 12;
}

// Atualiza `order` e `tonicPC` depois de qualquer mudança: cordas que pararam
// de soar saem da ordem, as que começaram entram no fim (na ordem `added`).
// A tônica é a da 1ª nota marcada; se nenhuma nota com ela soa mais, passa
// pra corda mais antiga que ainda soa.
function settle(state: ChordBuilderState, added: StringKey[]): ChordBuilderState {
  const sounding = (s: StringKey) => soundingFret(state, s) !== null;
  const order = state.order.filter(sounding);
  for (const s of added) if (sounding(s) && !order.includes(s)) order.push(s);
  for (const s of BUILDER_STRINGS) if (sounding(s) && !order.includes(s)) order.push(s);

  let tonicPC = state.tonicPC;
  const pcs = order.map(s => pcOn(state, s));
  if (tonicPC === null || !pcs.includes(tonicPC)) tonicPC = pcs[0] ?? null;
  return { ...state, order, tonicPC };
}

function withoutBarreString(state: ChordBuilderState, s: StringKey): ChordBuilderState {
  if (!state.barre || !state.barre.strings.includes(s)) return state;
  const strings = state.barre.strings.filter(x => x !== s);
  if (strings.length >= 2) return { ...state, barre: { ...state.barre, strings } };
  // Pestana de 1 corda só não é pestana: vira nota comum.
  const frets = { ...state.frets };
  for (const x of strings) if ((frets[x] ?? -1) < state.barre.fret) frets[x] = state.barre.fret;
  return { ...state, frets, barre: null };
}

// Toque numa casa: marca; de novo na mesma, desmarca; outra casa na mesma
// corda substitui (só uma soa). Na casa da pestana, remove a pestana.
export function tapFret(state: ChordBuilderState, s: StringKey, fret: number): ChordBuilderState {
  if (fret < 1 || fret > MAX_FRET) return state;
  const barre = state.barre;
  if (barre && barre.strings.includes(s)) {
    if (fret === barre.fret) return settle({ ...state, barre: null }, []);
    // Atrás da pestana a nota não soaria — ignora.
    if (fret < barre.fret) return state;
  }
  const frets = { ...state.frets };
  if (frets[s] === fret) delete frets[s];
  else frets[s] = fret;
  return settle({ ...state, frets }, [s]);
}

// Toque no círculo da corda (à esquerda do braço): alterna solta ↔ abafada.
// Corda com nota presa vira solta.
export function tapOpenString(state: ChordBuilderState, s: StringKey): ChordBuilderState {
  const frets = { ...state.frets };
  if (soundingFret(state, s) === 0) delete frets[s];
  else frets[s] = 0;
  return settle(withoutBarreString({ ...state, frets }, s), [s]);
}

// Arraste vertical: pestana na casa, cobrindo as cordas entre o início e o fim
// do arraste. Substitui a pestana anterior. Notas marcadas nessas cordas
// abaixo ou na casa da pestana saem (a pestana é que soa).
export function setBarre(state: ChordBuilderState, fret: number, strings: StringKey[]): ChordBuilderState {
  if (fret < 1 || fret > MAX_FRET || strings.length < 2) return state;
  const sorted = BUILDER_STRINGS.filter(s => strings.includes(s));
  const frets = { ...state.frets };
  for (const s of sorted) if ((frets[s] ?? -1) <= fret) delete frets[s];
  return settle({ ...state, frets, barre: { fret, strings: sorted } }, sorted);
}

// Toque longo numa nota: ela vira a tônica.
export function setTonicString(state: ChordBuilderState, s: StringKey): ChordBuilderState {
  const pc = pcOn(state, s);
  return pc === null ? state : { ...state, tonicPC: pc };
}

export function setWindowStart(state: ChordBuilderState, start: number): ChordBuilderState {
  const windowStart = Math.max(1, Math.min(MAX_WINDOW_START, Math.round(start)));
  return windowStart === state.windowStart ? state : { ...state, windowStart };
}

// Janela que enquadra todas as notas presas (pro acorde concluído, que não
// tem arraste): a partir da casa 1 se couber, senão a partir da mais grave.
export function fittingWindowStart(state: ChordBuilderState): number {
  const frets = BUILDER_STRINGS.map(s => soundingFret(state, s)).filter((f): f is number => !!f);
  if (frets.length === 0) return 1;
  const hi = Math.max(...frets);
  if (hi <= WINDOW_SLOTS) return 1;
  return Math.min(MAX_WINDOW_START, Math.max(Math.min(...frets), hi - WINDOW_SLOTS + 1));
}

// Transpõe o acorde montado (troca de tom pelo círculo): todas as notas andam
// o mesmo número de casas; cordas soltas viram notas presas. Prefere a versão
// mais grave que caiba no braço (casa 0 a MAX_FRET). null se nenhuma couber.
export function transposeBuilder(state: ChordBuilderState, semitones: number): ChordBuilderState | null {
  const up = ((semitones % 12) + 12) % 12;
  if (up === 0) return state;
  for (const d of [up - 12, up]) {
    const frets: Partial<Record<StringKey, number>> = {};
    let fits = true;
    for (const s of BUILDER_STRINGS) {
      const own = state.frets[s];
      if (own === undefined) continue;
      frets[s] = own + d;
      if (own + d < 0 || own + d > MAX_FRET) fits = false;
    }
    const barre = state.barre ? { ...state.barre, fret: state.barre.fret + d } : null;
    if (barre && (barre.fret < 1 || barre.fret > MAX_FRET)) fits = false;
    if (!fits) continue;
    const next: ChordBuilderState = {
      ...state,
      frets,
      barre,
      tonicPC: state.tonicPC === null ? null : (state.tonicPC + up) % 12,
    };
    return { ...next, windowStart: fittingWindowStart(next) };
  }
  return null;
}

export function clearBuilder(state: ChordBuilderState): ChordBuilderState {
  return { ...EMPTY_BUILDER, windowStart: state.windowStart };
}

// Converte pro formato de desenho do ShapeFretboard. As cordas da pestana
// aparecem com a casa da pestana (a barra é desenhada por baixo).
export function builderToFretboard(state: ChordBuilderState): {
  shape: ShapeData;
  barres: FretboardBarre[];
  muted: string[];
} {
  const shape: ShapeData = {};
  const muted: string[] = [];
  for (const s of BUILDER_STRINGS) {
    const f = soundingFret(state, s);
    if (f === null) muted.push(s);
    else shape[s] = [f];
  }
  const barres = state.barre ? [{ fret: state.barre.fret, strings: [...state.barre.strings] }] : [];
  return { shape, barres, muted };
}
