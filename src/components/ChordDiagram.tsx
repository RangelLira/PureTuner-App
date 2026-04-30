import React from 'react';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';

export interface ChordPosition {
  frets: number[];
  fingers: number[];
  baseFret: number;
  barres: number[];
}

interface Props {
  position: ChordPosition;
  width?: number;
}

// Layout constants (viewBox units)
const GX = [20, 48, 76, 104, 132, 160] as const; // x per string (low E → high e)
const GRID_TOP = 36;
const FRET_H = 28;
const FRETS = 5;
const DOT_R = 10;
const MARKER_Y = 18;
const SVG_W = 192;
const SVG_H = 188;

function fretCY(fret: number) {
  return GRID_TOP + (fret - 0.5) * FRET_H;
}

export function ChordDiagram({ position, width = SVG_W }: Props) {
  const { frets, fingers, baseFret, barres } = position;
  const height = (SVG_H * width) / SVG_W;
  const barreSet = new Set(barres);

  const barreRects = barres
    .map(bf => {
      const indices = frets.reduce<number[]>((acc, f, i) => {
        if (f === bf) acc.push(i);
        return acc;
      }, []);
      if (indices.length < 2) return null;
      return { bf, from: indices[0], to: indices[indices.length - 1] };
    })
    .filter(Boolean) as { bf: number; from: number; to: number }[];

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
      {/* Nut */}
      {baseFret === 1 && (
        <Rect
          x={GX[0]}
          y={GRID_TOP - 5}
          width={GX[5] - GX[0]}
          height={5}
          fill="#2C3E50"
        />
      )}

      {/* Fret lines */}
      {Array.from({ length: FRETS + 1 }, (_, i) => (
        <Line
          key={`fl${i}`}
          x1={GX[0]}
          y1={GRID_TOP + i * FRET_H}
          x2={GX[5]}
          y2={GRID_TOP + i * FRET_H}
          stroke={i === 0 ? '#9E9E9E' : '#C8C8C8'}
          strokeWidth={1.5}
        />
      ))}

      {/* String lines */}
      {GX.map((x, i) => (
        <Line
          key={`sl${i}`}
          x1={x}
          y1={GRID_TOP}
          x2={x}
          y2={GRID_TOP + FRETS * FRET_H}
          stroke="#B0B0B0"
          strokeWidth={i === 0 || i === 5 ? 1.5 : 1}
        />
      ))}

      {/* baseFret label */}
      {baseFret > 1 && (
        <SvgText
          x={GX[5] + 8}
          y={fretCY(1) + 4}
          fontSize={10}
          fill="#7F8C8D"
        >
          {baseFret}fr
        </SvgText>
      )}

      {/* Barre bars */}
      {barreRects.map(({ bf, from, to }, idx) => {
        const cy = fretCY(bf);
        return (
          <Rect
            key={`br${idx}`}
            x={GX[from] - DOT_R}
            y={cy - DOT_R}
            width={GX[to] - GX[from] + DOT_R * 2}
            height={DOT_R * 2}
            rx={DOT_R}
            fill="#2C3E50"
          />
        );
      })}

      {/* Individual finger dots */}
      {frets.map((fret, i) => {
        if (fret <= 0 || barreSet.has(fret)) return null;
        const cx = GX[i];
        const cy = fretCY(fret);
        return (
          <React.Fragment key={`dt${i}`}>
            <Circle cx={cx} cy={cy} r={DOT_R} fill="#FF6B35" />
            {fingers[i] > 0 && (
              <SvgText
                x={cx}
                y={cy + 4}
                textAnchor="middle"
                fontSize={11}
                fontWeight="bold"
                fill="white"
              >
                {fingers[i]}
              </SvgText>
            )}
          </React.Fragment>
        );
      })}

      {/* X / O above strings */}
      {frets.map((fret, i) => {
        if (fret === -1) {
          return (
            <SvgText
              key={`xm${i}`}
              x={GX[i]}
              y={MARKER_Y + 5}
              textAnchor="middle"
              fontSize={13}
              fontWeight="bold"
              fill="#E74C3C"
            >
              ×
            </SvgText>
          );
        }
        if (fret === 0) {
          return (
            <Circle
              key={`om${i}`}
              cx={GX[i]}
              cy={MARKER_Y}
              r={6}
              stroke="#2C3E50"
              strokeWidth={1.5}
              fill="none"
            />
          );
        }
        return null;
      })}
    </Svg>
  );
}
