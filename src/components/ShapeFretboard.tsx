import React from 'react';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '../constants/colors';
import type { ShapeData } from '../data/scaleShapesC';

// String order: high e at top → low E at bottom (standard guitar diagram)
const STRING_ORDER = ['e', 'B', 'G', 'D', 'A', 'E'] as const;
const STRING_PC: Record<string, number> = { e: 4, B: 11, G: 7, D: 2, A: 9, E: 4 };
const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

const N_SLOTS = 7;
const PAD_LEFT = 22;
const PAD_TOP = 30;
const PAD_RIGHT = 18;
const PAD_BOT = 16;
const FRET_W = 40;
const STR_H = 32;
const DOT_R = 11;

export const SVG_W = PAD_LEFT + N_SLOTS * FRET_W + PAD_RIGHT;
export const SVG_H = PAD_TOP + 5 * STR_H + PAD_BOT;

export function ShapeFretboard({ shape, tonicPC }: { shape: ShapeData; tonicPC: number }) {
  const allFrets = Object.values(shape).flat();
  const nonOpenFrets = allFrets.filter(f => f > 0);
  const hasOpen = allFrets.some(f => f === 0);
  const minF = nonOpenFrets.length > 0 ? Math.min(...nonOpenFrets) : 1;

  // Show nut when shape touches the lower neck (fret ≤ 3) or has open strings
  const isNutVisible = hasOpen || minF <= 3;
  // windowBase = the fret that maps to slot 0
  const windowBase = isNutVisible ? 1 : minF;

  function slotCX(slot: number) {
    return PAD_LEFT + slot * FRET_W + FRET_W / 2;
  }
  function strY(idx: number) {
    return PAD_TOP + idx * STR_H;
  }

  return (
    <Svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
      <Rect x={0} y={0} width={SVG_W} height={SVG_H} fill={colors.neutral.lightGray} />

      {/* Fret number labels above each slot */}
      {Array.from({ length: N_SLOTS }, (_, i) => (
        <SvgText
          key={`fn${i}`}
          x={slotCX(i)}
          y={PAD_TOP - DOT_R - 3}
          textAnchor="middle"
          fontSize={9}
          fill={colors.neutral.mediumGray}
          fontWeight="500"
        >
          {windowBase + i}
        </SvgText>
      ))}

      {/* Fret wires — leftmost is the nut when isNutVisible */}
      {Array.from({ length: N_SLOTS + 1 }, (_, i) => {
        const x = PAD_LEFT + i * FRET_W;
        const isNut = isNutVisible && i === 0;
        return (
          <Line
            key={`fw${i}`}
            x1={x} y1={PAD_TOP}
            x2={x} y2={PAD_TOP + 5 * STR_H}
            stroke={isNut ? colors.secondary.darkBlue : '#C0C0C0'}
            strokeWidth={isNut ? 4 : 1.5}
          />
        );
      })}

      {/* String lines + labels (high e at top, low E at bottom) */}
      {STRING_ORDER.map((s, si) => {
        const y = strY(si);
        const isThick = s === 'E' || s === 'A' || s === 'D';
        // Extend line left of nut when visible so open-string circles sit on the string
        const x1 = isNutVisible ? PAD_LEFT - 18 : PAD_LEFT;
        const labelX = isNutVisible ? 2 : PAD_LEFT - 4;
        const labelAnchor = isNutVisible ? 'start' : 'end';
        return (
          <React.Fragment key={`str${s}`}>
            <Line
              x1={x1} y1={y}
              x2={SVG_W - PAD_RIGHT} y2={y}
              stroke="#B8B8B8"
              strokeWidth={isThick ? 2 : 1}
            />
            <SvgText
              x={labelX} y={y + 4}
              textAnchor={labelAnchor}
              fontSize={9}
              fill={colors.neutral.mediumGray}
              fontWeight="500"
            >
              {s}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Note dots from shape data */}
      {STRING_ORDER.map((s, si) =>
        (shape[s] ?? []).map(fret => {
          if (fret === 0) return null; // open strings rendered separately
          const slot = fret - windowBase;
          if (slot < 0 || slot >= N_SLOTS) return null;
          const cx = slotCX(slot);
          const cy = strY(si);
          const pc = (STRING_PC[s] + fret) % 12;
          const isTonic = pc === tonicPC;
          return (
            <React.Fragment key={`d${s}${fret}`}>
              <Circle
                cx={cx} cy={cy} r={DOT_R}
                fill={isTonic ? colors.primary.orange : colors.secondary.darkBlue}
              />
              <SvgText
                x={cx} y={cy + 4}
                textAnchor="middle"
                fontSize={9}
                fontWeight="bold"
                fill="white"
              >
                {NOTE_NAMES[pc]}
              </SvgText>
            </React.Fragment>
          );
        })
      )}

      {/* Open string indicators (circles left of nut) */}
      {isNutVisible && STRING_ORDER.map((s, si) => {
        if (!(shape[s] ?? []).includes(0)) return null;
        const pc = STRING_PC[s];
        const isTonic = pc === tonicPC;
        return (
          <Circle
            key={`o${s}`}
            cx={PAD_LEFT - 10} cy={strY(si)} r={5}
            fill="none"
            stroke={isTonic ? colors.primary.orange : colors.secondary.darkBlue}
            strokeWidth={2}
          />
        );
      })}
    </Svg>
  );
}
