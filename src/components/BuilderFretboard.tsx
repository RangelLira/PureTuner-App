import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';
import {
  FRET_W,
  N_SLOTS,
  PAD_LEFT,
  PAD_TOP,
  STR_H,
  STRING_ORDER,
  SVG_W,
  ShapeFretboard,
} from './ShapeFretboard';
import {
  ChordBuilderState,
  StringKey,
  builderToFretboard,
  setBarre,
  setTonicString,
  setWindowStart,
  soundingFret,
  tapFret,
  tapOpenString,
} from '../data/chordBuilder';

// Braço interativo do "Montar acorde". Desenha com o mesmo ShapeFretboard
// das telas e traduz os gestos pras regras puras de chordBuilder.ts:
//   toque numa casa        → marca/desmarca (tapFret)
//   toque no círculo à esquerda → corda solta ↔ abafada (tapOpenString)
//   toque longo numa nota  → vira a tônica (setTonicString)
//   arraste vertical       → pestana na casa onde começou (setBarre)
//   arraste horizontal     → sobe/desce pelo braço até a casa 15

const MOVE_THRESHOLD = 10; // px antes de decidir entre toque e arraste
const LONG_PRESS_MS = 450;

type Cell = { string: StringKey; fret: number | null }; // fret null = coluna da corda solta

interface Props {
  state: ChordBuilderState;
  onChange: (next: ChordBuilderState) => void;
  leftHanded: boolean;
}

export function BuilderFretboard({ state, onChange, leftHanded }: Props) {
  // Pestana em andamento (durante o arraste), desenhada antes de confirmar.
  const [preview, setPreview] = useState<{ fret: number; strings: StringKey[] } | null>(null);

  // O PanResponder é criado uma vez; refs dão a ele o estado/props atuais.
  const live = useRef({ state, onChange, leftHanded });
  live.current = { state, onChange, leftHanded };

  const responder = useMemo(() => {
    let start = { x: 0, y: 0 };
    let mode: 'pending' | 'barre' | 'scroll' | 'done' = 'pending';
    let startWindow = 1;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const stringAt = (y: number) =>
      STRING_ORDER[Math.max(0, Math.min(5, Math.round((y - PAD_TOP) / STR_H)))] as StringKey;

    const cellAt = (x: number, y: number): Cell => {
      const sx = live.current.leftHanded ? SVG_W - x : x; // desfaz o espelho do canhoto
      const string = stringAt(y);
      if (sx < PAD_LEFT - 2) return { string, fret: null };
      const slot = Math.max(0, Math.min(N_SLOTS - 1, Math.floor((sx - PAD_LEFT) / FRET_W)));
      return { string, fret: live.current.state.windowStart + slot };
    };

    // Pestana do arraste: casa onde começou, cordas entre o início e o dedo.
    const barreFrom = (dy: number) => {
      const first = cellAt(start.x, start.y);
      const a = STRING_ORDER.indexOf(first.string);
      const b = STRING_ORDER.indexOf(stringAt(start.y + dy));
      const strings = STRING_ORDER.slice(Math.min(a, b), Math.max(a, b) + 1) as StringKey[];
      return { fret: first.fret as number, strings };
    };

    const cancelTimer = () => {
      if (timer) clearTimeout(timer);
      timer = null;
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: evt => {
        start = { x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY };
        mode = 'pending';
        startWindow = live.current.state.windowStart;
        cancelTimer();
        timer = setTimeout(() => {
          const { state: st, onChange: change } = live.current;
          const cell = cellAt(start.x, start.y);
          if (mode === 'pending' && soundingFret(st, cell.string) !== null) {
            mode = 'done';
            change(setTonicString(st, cell.string));
          }
        }, LONG_PRESS_MS);
      },
      onPanResponderMove: (_evt, g) => {
        if (mode === 'done') return;
        if (mode === 'pending') {
          if (Math.abs(g.dx) < MOVE_THRESHOLD && Math.abs(g.dy) < MOVE_THRESHOLD) return;
          cancelTimer();
          const startsOnFret = cellAt(start.x, start.y).fret !== null;
          mode = Math.abs(g.dy) > Math.abs(g.dx) && startsOnFret ? 'barre' : 'scroll';
        }
        if (mode === 'barre') {
          setPreview(barreFrom(g.dy));
        } else {
          // Arrastar o braço pra esquerda revela casas mais agudas (no
          // canhoto o braço é espelhado, então o sentido inverte).
          const dx = live.current.leftHanded ? -g.dx : g.dx;
          const next = setWindowStart(live.current.state, startWindow - dx / FRET_W);
          if (next !== live.current.state) live.current.onChange(next);
        }
      },
      onPanResponderRelease: (_evt, g) => {
        cancelTimer();
        const { state: st, onChange: change } = live.current;
        if (mode === 'pending') {
          const cell = cellAt(start.x, start.y);
          change(cell.fret === null ? tapOpenString(st, cell.string) : tapFret(st, cell.string, cell.fret));
        } else if (mode === 'barre') {
          const b = barreFrom(g.dy);
          change(setBarre(st, b.fret, b.strings));
        }
        mode = 'done';
        setPreview(null);
      },
      onPanResponderTerminate: () => {
        cancelTimer();
        mode = 'done';
        setPreview(null);
      },
    });
  }, []);

  const drawing = builderToFretboard(state);
  const barres = preview ? [preview] : drawing.barres;

  return (
    <View {...responder.panHandlers}>
      {/* pointerEvents none: o toque cai sempre na View de fora, então
          locationX/Y são relativos ao braço inteiro, não a um círculo do SVG */}
      <View pointerEvents="none">
        <ShapeFretboard
          shape={drawing.shape}
          tonicPC={state.tonicPC ?? -1}
          barres={barres}
          mutedStrings={drawing.muted}
          leftHanded={leftHanded}
          windowStart={state.windowStart}
        />
      </View>
    </View>
  );
}
