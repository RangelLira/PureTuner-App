import { Note, Scale } from '@tonaljs/tonal';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '../constants/colors';

const NOTES = ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'] as const;
type NoteKey = typeof NOTES[number];

const SCALES = [
  { name: 'major pentatonic',  label: 'Pentatônica Maior'   },
  { name: 'minor pentatonic',  label: 'Pentatônica Menor'   },
  { name: 'major',             label: 'Maior (Jônia)'       },
  { name: 'minor',             label: 'Menor Natural'       },
  { name: 'major blues',       label: 'Blues Maior'         },
  { name: 'minor blues',       label: 'Blues Menor'         },
  { name: 'harmonic minor',    label: 'Menor Harmônica'     },
  { name: 'melodic minor',     label: 'Menor Melódica'      },
  { name: 'dorian',            label: 'Dórica'              },
  { name: 'mixolydian',        label: 'Mixolídia'           },
  { name: 'phrygian',          label: 'Frígia'              },
  { name: 'lydian',            label: 'Lídia'               },
  { name: 'diminished',        label: 'Diminuta'            },
  { name: 'whole tone',        label: 'Tons Inteiros'       },
];

// Standard tuning pitch classes (low E → high e)
const TUNING = [4, 9, 2, 7, 11, 4] as const;
const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];
const FRET_MARKERS = new Set([3, 5, 7, 9]);
const DOUBLE_MARKERS = new Set([12]);
const SHOW_FRETS = 12;

// Fretboard SVG constants
const FRET_W = 46;
const STRING_H = 24;
const SVG_PAD_T = 20;
const SVG_PAD_B = 24;
const NUT_W = 36;
const DOT_R = 9;
const SVG_W = NUT_W + SHOW_FRETS * FRET_W + 4;
const SVG_H = SVG_PAD_T + 5 * STRING_H + SVG_PAD_B;

function strY(s: number) {
  return SVG_PAD_T + s * STRING_H;
}
function fretCX(f: number) {
  if (f === 0) return NUT_W / 2;
  return NUT_W + (f - 0.5) * FRET_W;
}

interface FretboardProps {
  scalePCs: Set<number>;
  tonicPC: number;
  pcToName: Map<number, string>;
}

function Fretboard({ scalePCs, tonicPC, pcToName }: FretboardProps) {
  return (
    <Svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
      {/* Fret lines */}
      {Array.from({ length: SHOW_FRETS + 1 }, (_, f) => {
        const x = NUT_W + f * FRET_W;
        return (
          <Line
            key={`fl${f}`}
            x1={x} y1={SVG_PAD_T}
            x2={x} y2={SVG_PAD_T + 5 * STRING_H}
            stroke={f === 0 ? '#2C3E50' : '#C0C0C0'}
            strokeWidth={f === 0 ? 4 : 1.5}
          />
        );
      })}

      {/* String lines */}
      {Array.from({ length: 6 }, (_, s) => {
        const y = strY(s);
        return (
          <React.Fragment key={`str${s}`}>
            <Line
              x1={0} y1={y}
              x2={SVG_W} y2={y}
              stroke="#B0B0B0"
              strokeWidth={s === 0 || s === 5 ? 2 : 1}
            />
            <SvgText
              x={NUT_W / 2}
              y={y + 5}
              textAnchor="middle"
              fontSize={10}
              fill="#7F8C8D"
            >
              {STRING_NAMES[s]}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Fret position markers */}
      {Array.from({ length: SHOW_FRETS }, (_, i) => {
        const f = i + 1;
        const cx = NUT_W + (f - 0.5) * FRET_W;
        const by = SVG_PAD_T + 5 * STRING_H + 12;
        if (DOUBLE_MARKERS.has(f)) {
          return (
            <React.Fragment key={`mk${f}`}>
              <Circle cx={cx - 5} cy={by} r={3} fill="#C0C0C0" />
              <Circle cx={cx + 5} cy={by} r={3} fill="#C0C0C0" />
            </React.Fragment>
          );
        }
        if (FRET_MARKERS.has(f)) {
          return <Circle key={`mk${f}`} cx={cx} cy={by} r={3} fill="#C0C0C0" />;
        }
        return null;
      })}

      {/* Note dots */}
      {Array.from({ length: 6 }, (_, s) =>
        Array.from({ length: SHOW_FRETS + 1 }, (_, f) => {
          const pc = (TUNING[s] + f) % 12;
          if (!scalePCs.has(pc)) return null;
          const cx = fretCX(f);
          const cy = strY(s);
          const isTonic = pc === tonicPC;
          const noteName = pcToName.get(pc) ?? '';
          return (
            <React.Fragment key={`n${s}-${f}`}>
              <Circle
                cx={cx}
                cy={cy}
                r={DOT_R}
                fill={isTonic ? colors.primary.orange : colors.secondary.darkBlue}
              />
              <SvgText
                x={cx}
                y={cy + 4}
                textAnchor="middle"
                fontSize={9}
                fontWeight="bold"
                fill="white"
              >
                {noteName}
              </SvgText>
            </React.Fragment>
          );
        })
      )}
    </Svg>
  );
}

export function ScalesScreen() {
  const [tonic, setTonic] = useState<NoteKey>('A');
  const [scaleIdx, setScaleIdx] = useState(0);

  const { scalePCs, tonicPC, pcToName, scaleNotes } = useMemo(() => {
    const sel = SCALES[scaleIdx];
    const result = Scale.get(`${tonic} ${sel.name}`);
    const tp = Note.chroma(tonic) ?? 0;
    const pcs = new Set<number>();
    const nameMap = new Map<number, string>();
    result.notes.forEach(n => {
      const pc = Note.chroma(n);
      if (pc !== undefined) {
        pcs.add(pc);
        nameMap.set(pc, n);
      }
    });
    return { scalePCs: pcs, tonicPC: tp, pcToName: nameMap, scaleNotes: result.notes };
  }, [tonic, scaleIdx]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Escalas</Text>

      {/* Tonic selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.selectorRow}
        contentContainerStyle={styles.selectorContent}
      >
        {NOTES.map(n => (
          <TouchableOpacity
            key={n}
            style={[styles.chip, tonic === n && styles.chipActive]}
            onPress={() => setTonic(n)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, tonic === n && styles.chipTextActive]}>
              {n}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Scale selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.selectorRow}
        contentContainerStyle={styles.selectorContent}
      >
        {SCALES.map((s, i) => (
          <TouchableOpacity
            key={s.name}
            style={[styles.chip, i === scaleIdx && styles.chipActive]}
            onPress={() => setScaleIdx(i)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, i === scaleIdx && styles.chipTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Scale name */}
      <Text style={styles.scaleName}>
        {tonic} {SCALES[scaleIdx].label}
      </Text>

      {/* Scale notes chips */}
      <View style={styles.notesRow}>
        {scaleNotes.map((n, i) => (
          <View key={`${n}${i}`} style={[styles.noteChip, i === 0 && styles.noteChipTonic]}>
            <Text style={[styles.noteChipText, i === 0 && styles.noteChipTextTonic]}>
              {n}
            </Text>
          </View>
        ))}
      </View>

      {/* Fretboard (scrollable horizontally) */}
      <Text style={styles.fretboardLabel}>Braço — corda 6 (baixo) ao topo</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.fretboardScroll}
        contentContainerStyle={styles.fretboardContent}
      >
        <Fretboard
          scalePCs={scalePCs}
          tonicPC={tonicPC}
          pcToName={pcToName}
        />
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary.orange }]} />
          <Text style={styles.legendText}>Tônica</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.secondary.darkBlue }]} />
          <Text style={styles.legendText}>Nota da escala</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.lightGray,
    paddingTop: 64,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.secondary.darkBlue,
    textAlign: 'center',
    marginBottom: 16,
  },
  selectorRow: {
    flexGrow: 0,
    marginBottom: 8,
  },
  selectorContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.neutral.white,
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
  },
  chipActive: {
    backgroundColor: colors.secondary.darkBlue,
    borderColor: colors.secondary.darkBlue,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondary.darkBlue,
  },
  chipTextActive: {
    color: colors.neutral.white,
  },
  scaleName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary.orange,
    textAlign: 'center',
    marginVertical: 10,
  },
  notesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  noteChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: colors.secondary.darkBlue,
  },
  noteChipTonic: {
    backgroundColor: colors.primary.orange,
  },
  noteChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutral.white,
  },
  noteChipTextTonic: {
    color: colors.neutral.white,
  },
  fretboardLabel: {
    fontSize: 11,
    color: colors.neutral.mediumGray,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 6,
  },
  fretboardScroll: {
    flexGrow: 0,
    marginHorizontal: 0,
  },
  fretboardContent: {
    paddingHorizontal: 16,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 10,
    paddingBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: colors.neutral.mediumGray,
    fontWeight: '500',
  },
});
