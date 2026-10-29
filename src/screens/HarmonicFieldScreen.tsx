import { Note } from '@tonaljs/tonal';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { FifthsWheel } from '../components/FifthsWheel';
import { colors } from '../constants/colors';
import {
  FieldChord,
  HarmonicMode,
  chordSymbol,
  harmonicField,
  keySignature,
} from '../data/harmonicField';

export interface HarmonicFieldState {
  sector: number;     // 0 = Dó, sentido horário sobe uma 5ª
  mode: HarmonicMode;
  sevenths: boolean;  // tétrades (Cmaj7, Dm7…) em vez de tríades
}

export const DEFAULT_HARMONIC_FIELD_STATE: HarmonicFieldState = {
  sector: 0,
  mode: 'major',
  sevenths: false,
};

interface HarmonicFieldScreenProps {
  state: HarmonicFieldState;
  onStateChange: (patch: Partial<HarmonicFieldState>) => void;
  onOpenChord: (chord: FieldChord, sevenths: boolean) => void;
}

const FIELD_TYPES: Array<{ mode: HarmonicMode; sevenths: boolean; label: string }> = [
  { mode: 'major', sevenths: false, label: 'Campo Maior' },
  { mode: 'major', sevenths: true, label: 'Campo Maior com Sétima' },
  { mode: 'minor', sevenths: false, label: 'Campo Menor Natural' },
  { mode: 'minor', sevenths: true, label: 'Campo Menor Natural com Sétima' },
];

// Cor do chip (texto sempre branco): tônica = laranja, como em Acordes e
// Escalas; todos os demais acordes = azul-escuro, sem diferenciar função.
function chipColor(chord: FieldChord) {
  return chord.func === 'T' && chord.primary ? colors.primary.orange : colors.secondary.darkBlue;
}

// Linhas da lista de acordes, na ordem dos graus: 3 - 2 - 2.
const FIELD_ROWS: Array<[number, number]> = [[0, 3], [3, 5], [5, 7]];

// Papel de cada grau, escrito abaixo do acorde.
const DEGREE_ROLE: Record<string, string> = {
  // maior
  I: 'Tônica',
  ii: 'Subdominante fraca',
  iii: 'Variante tônica',
  IV: 'Subdominante',
  V: 'Dominante',
  vi: 'Relativa menor',
  'viiº': 'Dominante fraca',
  // menor natural
  i: 'Tônica',
  'iiº': 'Subdominante fraca',
  III: 'Relativa maior',
  iv: 'Subdominante',
  v: 'Dominante',
  VI: 'Subdominante fraca',
  VII: 'Dominante fraca',
};

// Só a quantidade — as notas já aparecem no círculo e nos acordes.
function signatureText(sector: number) {
  const { type, count } = keySignature(sector);
  if (!type) return 'Sem acidentes';
  const word = type === 'sharp' ? (count === 1 ? 'sustenido' : 'sustenidos') : count === 1 ? 'bemol' : 'bemóis';
  return `${count} ${word}`;
}

export function HarmonicFieldScreen({ state, onStateChange, onOpenChord }: HarmonicFieldScreenProps) {
  const { sector, mode, sevenths } = state;
  const { width, height } = useWindowDimensions();
  const [modeModalVisible, setModeModalVisible] = useState(false);
  const wheelSize = Math.min(width - 24, height * 0.35, 400);

  const field = useMemo(() => harmonicField(sector, mode), [sector, mode]);
  const fieldLabel = FIELD_TYPES.find(f => f.mode === mode && f.sevenths === sevenths)?.label;

  const handleSelect = (newSector: number, newMode?: HarmonicMode) => {
    onStateChange({ sector: newSector, ...(newMode ? { mode: newMode } : {}) });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Campo Harmônico</Text>

      <FifthsWheel
        size={wheelSize}
        sector={sector}
        mode={mode}
        sevenths={sevenths}
        onSelect={handleSelect}
      />

      <Text style={styles.signature}>{signatureText(sector)}</Text>

      {/* Os 7 acordes na ordem dos graus, em 3 linhas (3 - 2 - 2) — toque
          abre o acorde na aba Acordes */}
      {FIELD_ROWS.map(([start, end]) => field.slice(start, end)).map((row, rowIdx) => (
        <View key={rowIdx} style={styles.fieldRow}>
          {row.map(chord => {
            const bg = chipColor(chord);
            return (
              <TouchableOpacity
                key={chord.degree}
                style={styles.fieldCell}
                onPress={() => onOpenChord(chord, sevenths)}
                activeOpacity={0.7}
              >
                <Text style={[styles.degreeText, { color: bg }]}>{chord.degree}</Text>
                <View style={[styles.chordChip, { backgroundColor: bg }]}>
                  <Text style={styles.chordChipText} numberOfLines={1} adjustsFontSizeToFit>
                    {chordSymbol(chord, sevenths)}
                  </Text>
                </View>
                <Text style={styles.roleText} numberOfLines={1} adjustsFontSizeToFit>
                  {DEGREE_ROLE[chord.degree]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      <View style={styles.spacer} />

      {/* Tipo de campo — mesma posição e padrão do botão Iniciar do Afinador */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setModeModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText} numberOfLines={1} adjustsFontSizeToFit>
            {fieldLabel}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModeModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModeModalVisible(false)}
        >
          <TouchableOpacity style={styles.modalCard} activeOpacity={1}>
            <Text style={styles.modalTitle}>Tipo de Campo</Text>
            {FIELD_TYPES.map(f => {
              const active = f.mode === mode && f.sevenths === sevenths;
              return (
                <TouchableOpacity
                  key={f.label}
                  style={[styles.modeListItem, active && styles.modeListItemActive]}
                  onPress={() => {
                    onStateChange({ mode: f.mode, sevenths: f.sevenths });
                    setModeModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modeListText, active && styles.modeListTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModeModalVisible(false)}
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

// Classe de altura do acorde (0 = Dó) — para abrir na aba Acordes, que usa
// sua própria grafia de tons.
export function chordPitchClass(chord: FieldChord) {
  return Note.chroma(chord.root) ?? 0;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.lightGray,
    paddingTop: 56,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.secondary.darkBlue,
    textAlign: 'center',
    marginBottom: 16,
  },
  signature: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '700',
    color: colors.secondary.darkBlue,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    marginBottom: 4,
  },
  fieldCell: {
    // 3 por linha; as linhas de 2 acordes ficam centralizadas com a mesma largura
    width: '31%',
    alignItems: 'center',
  },
  degreeText: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 3,
  },
  chordChip: {
    alignSelf: 'stretch',
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chordChipText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.neutral.white,
  },
  roleText: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.secondary.darkBlue,
  },
  spacer: {
    flex: 1,
  },
  controlsContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  button: {
    paddingHorizontal: 56,
    paddingVertical: 18,
    borderRadius: 32,
    maxWidth: '100%',
    backgroundColor: colors.primary.orange,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    color: colors.neutral.white,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.52)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
    width: '86%',
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.secondary.darkBlue,
    marginBottom: 18,
    textAlign: 'center',
  },
  modeListItem: {
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 2,
  },
  modeListItemActive: {
    backgroundColor: colors.secondary.darkBlue,
  },
  modeListText: {
    fontSize: 16,
    color: colors.secondary.darkBlue,
    fontWeight: '500',
    textAlign: 'center',
  },
  modeListTextActive: {
    color: colors.neutral.white,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    color: colors.neutral.mediumGray,
    fontWeight: '600',
  },
});
