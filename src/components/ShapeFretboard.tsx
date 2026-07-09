import React from 'react';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '../constants/colors';
import type { ShapeData } from '../data/scaleShapesC';

// String order: high e at top → low E at bottom (standard guitar diagram)
const STRING_ORDER = ['e', 'B', 'G', 'D', 'A', 'E'] as const;
const STRING_PC: Record<string, number> = { e: 4, B: 11, G: 7, D: 2, A: 9, E: 4 };
const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

const N_SLOTS = 7;
const PAD_LEFT = 30;
const PAD_TOP = 30;
const PAD_RIGHT = 10;
const PAD_BOT = 16;
const FRET_W = 46;
const STR_H = 34;
const DOT_R = 11;
// Open-string circle sits left of the nut with a small gap (floating indicator, no string line through it)
const OPEN_CX = PAD_LEFT - DOT_R - 5;

export const SVG_W = PAD_LEFT + N_SLOTS * FRET_W + PAD_RIGHT;
export const SVG_H = PAD_TOP + 5 * STR_H + PAD_BOT;

export interface FretboardBarre {
  fret: number;
  strings: string[];
}

interface Props {
  shape: ShapeData;
  tonicPC: number;
  barres?: FretboardBarre[];
  mutedStrings?: string[];
}

export function ShapeFretboard({ shape, tonicPC, barres, mutedStrings }: Props) {
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
        // String always starts at the nut; open circles are floating indicators to the left
        const x1 = PAD_LEFT;
        return (
          <React.Fragment key={`str${s}`}>
            <Line
              x1={x1} y1={y}
              x2={SVG_W - PAD_RIGHT} y2={y}
              stroke="#B8B8B8"
              strokeWidth={isThick ? 2 : 1}
            />
            {!isNutVisible && (
              mutedStrings?.includes(s) ? (
                <SvgText
                  x={PAD_LEFT - 4} y={y + 4}
                  textAnchor="end"
                  fontSize={11}
                  fontWeight="bold"
                  fill={colors.status.error}
                >
                  ×
                </SvgText>
              ) : (
                <SvgText
                  x={PAD_LEFT - 4} y={y + 4}
                  textAnchor="end"
                  fontSize={9}
                  fill={colors.neutral.mediumGray}
                  fontWeight="500"
                >
                  {s}
                </SvgText>
              )
            )}
          </React.Fragment>
        );
      })}

      {/* Barre bars — drawn beneath the note dots so finger dots layer on top */}
      {barres?.map((b, bi) => {
        const sis = b.strings
          .map(s => STRING_ORDER.indexOf(s as typeof STRING_ORDER[number]))
          .filter(i => i >= 0);
        if (sis.length < 2) return null;
        const slot = b.fret - windowBase;
        if (slot < 0 || slot >= N_SLOTS) return null;
        const cx = slotCX(slot);
        const yFrom = strY(Math.min(...sis));
        const yTo = strY(Math.max(...sis));
        return (
          <Rect
            key={`barre${bi}`}
            x={cx - DOT_R}
            y={yFrom - DOT_R}
            width={DOT_R * 2}
            height={yTo - yFrom + DOT_R * 2}
            rx={DOT_R}
            fill={colors.secondary.darkBlue}
          />
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
                x={cx} y={cy + 3}
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

      {/* Open string circles — same size as note dots, left of nut.
          All 6 strings shown: gray + string name when not in scale,
          blue/orange + note name when the scale uses that open string. */}
      {isNutVisible && STRING_ORDER.map((s, si) => {
        const isMuted = mutedStrings?.includes(s) ?? false;
        const inShape = (shape[s] ?? []).includes(0);
        const pc = STRING_PC[s];
        const isTonic = pc === tonicPC;
        const fill = isMuted
          ? colors.neutral.white
          : inShape
          ? (isTonic ? colors.primary.orange : colors.secondary.darkBlue)
          : '#C4C4C4';
        const label = isMuted ? '×' : inShape ? NOTE_NAMES[pc] : s;
        const textFill = isMuted ? colors.status.error : inShape ? 'white' : '#777777';
        return (
          <React.Fragment key={`o${s}`}>
            <Circle
              cx={OPEN_CX} cy={strY(si)} r={DOT_R}
              fill={fill}
              stroke={isMuted ? colors.status.error : 'none'}
              strokeWidth={isMuted ? 1.5 : 0}
            />
            <SvgText
              x={OPEN_CX} y={strY(si) + 3}
              textAnchor="middle"
              fontSize={9}
              fontWeight="bold"
              fill={textFill}
            >
              {label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}
