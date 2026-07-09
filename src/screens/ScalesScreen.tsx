import { Note, Scale } from '@tonaljs/tonal';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ShapeFretboard } from '../components/ShapeFretboard';
import { colors } from '../constants/colors';
import { SCALE_DESCRIPTIONS } from '../data/scaleDescriptions';
import { SCALE_SHAPES_C, ShapeData } from '../data/scaleShapesC';

const NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const;
export type ScalesNoteKey = typeof NOTES[number];

export interface ScalesState {
  tonic: ScalesNoteKey;
  scaleIdx: number;
  shapeIdx: number;
}

export const DEFAULT_SCALES_STATE: ScalesState = { tonic: 'C', scaleIdx: 0, shapeIdx: 0 };

interface ScalesScreenProps {
  state: ScalesState;
  onStateChange: (patch: Partial<ScalesState>) => void;
}

const SOLFEGE: Record<ScalesNoteKey, string> = {
  'C':  'Dó',
  'C#': 'Dó#',
  'D':  'Ré',
  'Eb': 'Réb',
  'E':  'Mi',
  'F':  'Fá',
  'F#': 'Fá#',
  'G':  'Sol',
  'Ab': 'Láb',
  'A':  'Lá',
  'Bb': 'Sib',
  'B':  'Si',
};

const SCALES = [
  { name: 'major',            label: 'Maior'             },
  { name: 'minor',            label: 'Menor Natural'     },
  { name: 'melodic minor',    label: 'Menor Melódica'    },
  { name: 'harmonic minor',   label: 'Menor Harmônica'   },
  { name: 'major pentatonic', label: 'Pentatônica Maior' },
  { name: 'minor pentatonic', label: 'Pentatônica Menor' },
  { name: 'major blues',      label: 'Blues Maior'       },
  { name: 'minor blues',      label: 'Blues Menor'       },
  { name: 'ionian',           label: 'Jônio'             },
  { name: 'dorian',           label: 'Dórico'            },
  { name: 'phrygian',         label: 'Frígio'            },
  { name: 'lydian',           label: 'Lídio'             },
  { name: 'mixolydian',       label: 'Mixolídio'         },
  { name: 'aeolian',          label: 'Eólio'             },
  { name: 'locrian',             label: 'Lócrio'            },
  { name: 'double harmonic major', label: 'Árabe'          },
] as const;

// Transpose shape from key C (tonicPC=0) to any key.
// Each fret shifts by tonicPC. If the result would exceed fret 22, shift down one octave.
function transposeShape(shape: ShapeData, tonicPC: number): ShapeData {
  if (tonicPC === 0) { return shape; }
  const allFrets = Object.values(shape).flat();
  const maxFret = allFrets.length > 0 ? Math.max(...allFrets) : 0;
  const offset = maxFret + tonicPC > 22 ? tonicPC - 12 : tonicPC;
  const result: ShapeData = {};
  for (const [str, frets] of Object.entries(shape)) {
    result[str] = frets.map(f => f + offset);
  }
  return result;
}

export function ScalesScreen({ state, onStateChange }: ScalesScreenProps) {
  const { tonic, scaleIdx, shapeIdx } = state;
  const [tonicModalVisible, setTonicModalVisible] = useState(false);
  const [scaleModalVisible, setScaleModalVisible] = useState(false);

  const { tonicPC, scaleNotes } = useMemo(() => {
    const sel = SCALES[scaleIdx];
    const result = Scale.get(`${tonic} ${sel.name}`);
    const tp = Note.chroma(tonic) ?? 0;
    return { tonicPC: tp, scaleNotes: result.notes };
  }, [tonic, scaleIdx]);

  const totalShapes = 5;

  const currentShape = useMemo(() => {
    const allShapes = SCALE_SHAPES_C[SCALES[scaleIdx].name] ?? [];
    const base = allShapes[shapeIdx] ?? {};
    return transposeShape(base, tonicPC);
  }, [scaleIdx, shapeIdx, tonicPC]);

  const handleTonicSelect = (note: ScalesNoteKey) => {
    onStateChange({ tonic: note, shapeIdx: 0 });
    setTonicModalVisible(false);
  };

  const handleScaleSelect = (idx: number) => {
    onStateChange({ scaleIdx: idx, shapeIdx: 0 });
    setScaleModalVisible(false);
  };

  const description = SCALE_DESCRIPTIONS[SCALES[scaleIdx].name] ?? '';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Escalas</Text>

      {/* Tonic circle button */}
      <TouchableOpacity
        style={styles.tonicButton}
        onPress={() => setTonicModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.tonicButtonText}>{SOLFEGE[tonic]}</Text>
      </TouchableOpacity>

      {/* Scale type chip */}
      <TouchableOpacity
        style={styles.scaleChip}
        onPress={() => setScaleModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.scaleChipText}>{SCALES[scaleIdx].label}</Text>
      </TouchableOpacity>

      {/* Scale notes chips */}
      <View style={styles.notesRow}>
        {scaleNotes.map((n, i) => (
          <View key={`${n}${i}`} style={[styles.noteChip, i === 0 && styles.noteChipTonic]}>
            <Text style={styles.noteChipText}>{n}</Text>
          </View>
        ))}
      </View>

      {/* Description */}
      <Text style={styles.description} numberOfLines={4}>{description}</Text>

      {/* Shape fretboard */}
      <View style={styles.fretboardContainer}>
        <ShapeFretboard shape={currentShape} tonicPC={tonicPC} />
      </View>

      {/* Shape indicator */}
      <Text style={styles.shapeIndicator}>{shapeIdx + 1} / {totalShapes}</Text>

      {/* Push nav buttons to same vertical position as TunerScreen's Iniciar */}
      <View style={{ flex: 1 }} />

      {/* Navigation buttons */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navButton, shapeIdx === 0 && styles.navButtonDisabled]}
          onPress={() => onStateChange({ shapeIdx: Math.max(0, shapeIdx - 1) })}
          activeOpacity={0.8}
          disabled={shapeIdx === 0}
        >
          <Text style={styles.navButtonText}>Anterior</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, shapeIdx === totalShapes - 1 && styles.navButtonDisabled]}
          onPress={() => onStateChange({ shapeIdx: Math.min(totalShapes - 1, shapeIdx + 1) })}
          activeOpacity={0.8}
          disabled={shapeIdx === totalShapes - 1}
        >
          <Text style={styles.navButtonText}>Próxima</Text>
        </TouchableOpacity>
      </View>

      {/* Tonic selector modal */}
      <Modal
        visible={tonicModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTonicModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setTonicModalVisible(false)}
        >
          <TouchableOpacity style={styles.tonicModalCard} activeOpacity={1}>
            <Text style={styles.modalTitle}>Escolha o Tom</Text>
            <View style={styles.notesGrid}>
              {NOTES.map(n => (
                <TouchableOpacity
                  key={n}
                  style={[styles.noteGridChip, tonic === n && styles.noteGridChipActive]}
                  onPress={() => handleTonicSelect(n)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.noteGridText, tonic === n && styles.noteGridTextActive]}>
                    {SOLFEGE[n]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setTonicModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Scale type selector modal */}
      <Modal
        visible={scaleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setScaleModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setScaleModalVisible(false)}
        >
          <TouchableOpacity style={styles.scaleModalCard} activeOpacity={1}>
            <Text style={styles.modalTitle}>Tipo de Escala</Text>
            <ScrollView style={styles.scaleList} showsVerticalScrollIndicator={false}>
              {SCALES.map((s, i) => (
                <TouchableOpacity
                  key={s.name}
                  style={[styles.scaleListItem, i === scaleIdx && styles.scaleListItemActive]}
                  onPress={() => handleScaleSelect(i)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.scaleListText, i === scaleIdx && styles.scaleListTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setScaleModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.lightGray,
    paddingTop: 56,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.secondary.darkBlue,
    textAlign: 'center',
    marginBottom: 16,
  },
  tonicButton: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: colors.neutral.white,
    borderWidth: 3,
    borderColor: colors.secondary.darkBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  tonicButtonText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.secondary.darkBlue,
  },
  scaleChip: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: colors.secondary.darkBlue,
    marginBottom: 16,
    minWidth: '60%',
    alignItems: 'center',
  },
  scaleChipText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.neutral.white,
  },
  scaleName: {
    fontSize: 21,
    fontWeight: '700',
    color: colors.primary.orange,
    textAlign: 'center',
    marginBottom: 8,
  },
  notesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  noteChip: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.secondary.darkBlue,
  },
  noteChipTonic: {
    backgroundColor: colors.primary.orange,
  },
  noteChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral.white,
  },
  description: {
    fontSize: 13,
    color: colors.secondary.mediumBlue,
    textAlign: 'center',
    lineHeight: 19,
    height: 76,
    marginBottom: 14,
  },
  fretboardContainer: {
    alignItems: 'center',
    marginBottom: 8,
    marginHorizontal: -24,
  },
  shapeIndicator: {
    fontSize: 14,
    color: colors.neutral.mediumGray,
    fontWeight: '500',
    marginBottom: 8,
  },
  navRow: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 40,
    width: '100%',
  },
  navButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 32,
    backgroundColor: colors.primary.orange,
    alignItems: 'center',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  navButtonDisabled: {
    backgroundColor: colors.neutral.mediumGray,
    elevation: 0,
    shadowOpacity: 0,
  },
  navButtonText: {
    color: colors.neutral.white,
    fontSize: 18,
    fontWeight: '600',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.52)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tonicModalCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    width: '86%',
    alignItems: 'center',
  },
  scaleModalCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
    width: '86%',
    maxHeight: '68%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.secondary.darkBlue,
    marginBottom: 18,
  },
  notesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 20,
  },
  noteGridChip: {
    width: 56,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.neutral.lightGray,
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteGridChipActive: {
    backgroundColor: colors.secondary.darkBlue,
    borderColor: colors.secondary.darkBlue,
  },
  noteGridText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary.darkBlue,
  },
  noteGridTextActive: {
    color: colors.neutral.white,
  },
  scaleList: {
    width: '100%',
  },
  scaleListItem: {
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 2,
  },
  scaleListItemActive: {
    backgroundColor: colors.secondary.darkBlue,
  },
  scaleListText: {
    fontSize: 16,
    color: colors.secondary.darkBlue,
    fontWeight: '500',
  },
  scaleListTextActive: {
    color: colors.neutral.white,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  cancelText: {
    fontSize: 14,
    color: colors.neutral.mediumGray,
    fontWeight: '600',
  },
});
