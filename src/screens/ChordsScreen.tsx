import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import guitarData from '@tombatossals/chords-db/lib/guitar.json';
import { FretboardBarre, ShapeFretboard } from '../components/ShapeFretboard';
import { colors } from '../constants/colors';
import { CHORD_SHAPES_C, FretboardData, transposeChordShape } from '../data/chordShapesC';
import { chordDescription, chordSuffixSymbol } from '../data/chordSuffixes';
import type { ShapeData } from '../data/scaleShapesC';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export type ChordsNoteKey = typeof NOTES[number];
type NoteKey = ChordsNoteKey;

export interface ChordsState {
  tonic: ChordsNoteKey;
  suffixIdx: number;
  posIdx: number;
}

export const DEFAULT_CHORDS_STATE: ChordsState = { tonic: 'C', suffixIdx: 0, posIdx: 0 };

interface ChordsScreenProps {
  state: ChordsState;
  onStateChange: (patch: Partial<ChordsState>) => void;
  leftHanded: boolean;
  onToggleLeftHanded: () => void;
}

// Chave usada pelo dicionário @tombatossals/chords-db para cada tom.
const CHORD_DB_KEY: Record<NoteKey, string> = {
  'C': 'C', 'C#': 'Csharp', 'D': 'D', 'D#': 'Eb', 'E': 'E', 'F': 'F',
  'F#': 'Fsharp', 'G': 'G', 'G#': 'Ab', 'A': 'A', 'A#': 'Bb', 'B': 'B',
};

const STRINGS_LOW_TO_HIGH = ['E', 'A', 'D', 'G', 'B', 'e'] as const;
const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

interface ChordPosition {
  frets: number[];
  fingers: number[];
  baseFret: number;
  barres: number[];
  midi: number[];
}

interface ChordEntry {
  key: string;
  suffix: string;
  positions: ChordPosition[];
}

interface SearchResult {
  tonic: NoteKey;
  suffix: string;
  symbol: string;
}

// Lista achatada de todo tom × qualidade do dicionário, usada pela busca.
// Calculada uma única vez a partir do JSON estático.
const ALL_CHORDS: SearchResult[] = NOTES.flatMap(note => {
  const dbKey = CHORD_DB_KEY[note];
  const entries = ((guitarData as any).chords[dbKey] ?? []) as ChordEntry[];
  return entries.map(entry => ({
    tonic: note,
    suffix: entry.suffix,
    symbol: `${note}${chordSuffixSymbol(entry.suffix)}`,
  }));
});

function normalizeQuery(text: string) {
  return text.toLowerCase().replace(/[\s()]+/g, '');
}

// Converte uma posição do dicionário (frets relativos ao baseFret, -1 = mudo)
// para o mesmo formato de ShapeData usado pelas escalas, mais a lista de
// cordas mudas e os grupos de pestana (mesmo traste em 2+ cordas). Usado como
// fallback para qualidades de acorde sem os 5 shapes CAGED cadastrados.
function positionToFretboardData(position: ChordPosition): FretboardData {
  const shape: ShapeData = {};
  const muted: string[] = [];
  const barreGroups = new Map<number, string[]>();

  position.frets.forEach((relFret, i) => {
    const stringKey = STRINGS_LOW_TO_HIGH[i];
    if (relFret === -1) {
      muted.push(stringKey);
      return;
    }
    if (relFret === 0) {
      shape[stringKey] = [0];
      return;
    }
    const abs = position.baseFret + relFret - 1;
    shape[stringKey] = [abs];
    if (position.barres.includes(relFret)) {
      const arr = barreGroups.get(relFret) ?? [];
      arr.push(stringKey);
      barreGroups.set(relFret, arr);
    }
  });

  const barres: FretboardBarre[] = Array.from(barreGroups.entries())
    .filter(([, strings]) => strings.length >= 2)
    .map(([relFret, strings]) => ({
      fret: position.baseFret + relFret - 1,
      strings,
    }));

  return { shape, muted, barres };
}

function circleFontSize(text: string) {
  if (text.length <= 2) return 28;
  if (text.length <= 4) return 22;
  if (text.length <= 7) return 17;
  return 13;
}

function shapeMinFret(shape: ShapeData) {
  const all = Object.values(shape).flat();
  return all.length > 0 ? Math.min(...all) : 0;
}

export function ChordsScreen({ state, onStateChange, leftHanded, onToggleLeftHanded }: ChordsScreenProps) {
  const { tonic, suffixIdx, posIdx } = state;
  const [tonicModalVisible, setTonicModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const tonicPC = NOTES.indexOf(tonic);

  const chordEntries = useMemo<ChordEntry[]>(() => {
    const dbKey = CHORD_DB_KEY[tonic];
    return ((guitarData as any).chords[dbKey] ?? []) as ChordEntry[];
  }, [tonic]);

  const selectedEntry = chordEntries[suffixIdx];
  const dbPositions = selectedEntry?.positions ?? [];

  // Para as qualidades com os 5 shapes CAGED verificados, usamos esses shapes
  // transpostos, ordenados do mais acessível (traste mais baixo — geralmente
  // o mais usado/convencional) para o menos acessível. As demais qualidades
  // caem no fallback com as posições do dicionário @tombatossals/chords-db.
  const cagedShapes = selectedEntry ? CHORD_SHAPES_C[selectedEntry.suffix] : undefined;
  const usesCaged = !!cagedShapes;
  const currentDbPosition = dbPositions[posIdx];

  const orderedCagedShapes = useMemo<FretboardData[]>(() => {
    if (!cagedShapes) return [];
    return cagedShapes
      .map(template => transposeChordShape(template, tonicPC))
      .sort((a, b) => shapeMinFret(a.shape) - shapeMinFret(b.shape));
  }, [cagedShapes, tonicPC]);

  const totalPositions = usesCaged ? orderedCagedShapes.length : dbPositions.length;

  const chordName = selectedEntry ? `${tonic}${chordSuffixSymbol(selectedEntry.suffix)}` : tonic;
  const description = selectedEntry ? chordDescription(selectedEntry.suffix) : '';

  // Notas que compõem o acorde: união das classes de altura de todas as
  // posições cadastradas para essa qualidade, ordenadas a partir da tônica.
  const chordNotes = useMemo(() => {
    if (!selectedEntry) return [];
    const pcs = new Set<number>();
    selectedEntry.positions.forEach(pos => pos.midi.forEach(m => pcs.add(m % 12)));
    const order = Array.from({ length: 12 }, (_, i) => (tonicPC + i) % 12);
    return order.filter(pc => pcs.has(pc)).map(pc => NOTE_NAMES[pc]);
  }, [selectedEntry, tonicPC]);

  const fretboardData = useMemo<FretboardData | null>(() => {
    if (usesCaged) {
      return orderedCagedShapes[posIdx] ?? null;
    }
    return currentDbPosition ? positionToFretboardData(currentDbPosition) : null;
  }, [usesCaged, orderedCagedShapes, posIdx, currentDbPosition]);

  const searchResults = useMemo(() => {
    const query = normalizeQuery(searchQuery);
    if (!query) return [];
    return ALL_CHORDS.filter(c => normalizeQuery(c.symbol).startsWith(query)).slice(0, 60);
  }, [searchQuery]);

  const handleTonicSelect = (note: NoteKey) => {
    // Mantém a mesma qualidade ao trocar só o tom (ex.: Dm -> B continua Bm),
    // em vez de sempre voltar para a qualidade maior.
    let newSuffixIdx = 0;
    if (selectedEntry) {
      const dbKey = CHORD_DB_KEY[note];
      const entries = ((guitarData as any).chords[dbKey] ?? []) as ChordEntry[];
      const idx = entries.findIndex(e => e.suffix === selectedEntry.suffix);
      if (idx >= 0) newSuffixIdx = idx;
    }
    onStateChange({ tonic: note, suffixIdx: newSuffixIdx, posIdx: 0 });
    setTonicModalVisible(false);
  };

  const openSearchModal = () => {
    setSearchQuery('');
    setSearchModalVisible(true);
  };

  const handleSearchSelect = (result: SearchResult) => {
    const dbKey = CHORD_DB_KEY[result.tonic];
    const entries = ((guitarData as any).chords[dbKey] ?? []) as ChordEntry[];
    const idx = entries.findIndex(e => e.suffix === result.suffix);
    onStateChange({ tonic: result.tonic, suffixIdx: idx >= 0 ? idx : 0, posIdx: 0 });
    setSearchModalVisible(false);
    setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Acordes</Text>

      {/* Tonic circle button — mostra o acorde completo (ex.: "Em7(b5)") */}
      <TouchableOpacity
        style={styles.tonicButton}
        onPress={() => setTonicModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={[styles.tonicButtonText, { fontSize: circleFontSize(chordName) }]}>
          {chordName}
        </Text>
      </TouchableOpacity>

      {/* Search chip — abre a busca de acordes do dicionário */}
      <TouchableOpacity
        style={styles.searchChip}
        onPress={openSearchModal}
        activeOpacity={0.8}
      >
        <Text style={styles.searchChipText}>Buscar acorde</Text>
      </TouchableOpacity>

      {/* Chord notes chips */}
      <View style={styles.notesRow}>
        {chordNotes.map((n, i) => (
          <View key={`${n}${i}`} style={[styles.noteChip, i === 0 && styles.noteChipTonic]}>
            <Text style={styles.noteChipText}>{n}</Text>
          </View>
        ))}
      </View>

      {/* Description */}
      <Text style={styles.description} numberOfLines={4}>{description}</Text>

      {/* Chord fretboard */}
      {fretboardData ? (
        <>
          <View style={styles.fretboardContainer}>
            <ShapeFretboard
              shape={fretboardData.shape}
              tonicPC={tonicPC}
              barres={fretboardData.barres}
              mutedStrings={fretboardData.muted}
              leftHanded={leftHanded}
            />
          </View>
          <View style={styles.indicatorRow}>
            <Text style={styles.shapeIndicator}>{posIdx + 1} / {totalPositions}</Text>
            <TouchableOpacity
              style={styles.handChip}
              onPress={onToggleLeftHanded}
              activeOpacity={0.8}
            >
              <Text style={styles.handChipText}>{leftHanded ? 'Canhoto' : 'Destro'}</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Acorde não disponível</Text>
        </View>
      )}

      {/* Push nav buttons to same vertical position as TunerScreen's Iniciar */}
      <View style={styles.spacer} />

      {/* Navigation buttons */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navButton, posIdx === 0 && styles.navButtonDisabled]}
          onPress={() => onStateChange({ posIdx: Math.max(0, posIdx - 1) })}
          activeOpacity={0.8}
          disabled={posIdx === 0}
        >
          <Text style={styles.navButtonText}>Anterior</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, posIdx >= totalPositions - 1 && styles.navButtonDisabled]}
          onPress={() => onStateChange({ posIdx: Math.min(totalPositions - 1, posIdx + 1) })}
          activeOpacity={0.8}
          disabled={posIdx >= totalPositions - 1}
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
                    {n}
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

      {/* Chord search modal */}
      <Modal
        visible={searchModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSearchModalVisible(false)}
        >
          <TouchableOpacity style={styles.scaleModalCard} activeOpacity={1}>
            <Text style={styles.modalTitle}>Buscar Acorde</Text>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Ex.: C, Em7(b5), F#m..."
              placeholderTextColor={colors.neutral.mediumGray}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
            <ScrollView style={styles.scaleList} showsVerticalScrollIndicator={false}>
              {searchQuery.trim().length === 0 ? (
                <Text style={styles.searchHint}>Digite o nome de um acorde para buscar.</Text>
              ) : searchResults.length === 0 ? (
                <Text style={styles.searchHint}>Acorde não encontrado.</Text>
              ) : (
                searchResults.map((result, i) => (
                  <TouchableOpacity
                    key={`${result.tonic}-${result.suffix}-${i}`}
                    style={styles.scaleListItem}
                    onPress={() => handleSearchSelect(result)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.scaleListText}>{result.symbol}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setSearchModalVisible(false)}
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
    textAlign: 'center',
  },
  searchChip: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: colors.secondary.darkBlue,
    marginBottom: 16,
    minWidth: '60%',
    alignItems: 'center',
  },
  searchChipText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.neutral.white,
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
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  shapeIndicator: {
    fontSize: 14,
    color: colors.neutral.mediumGray,
    fontWeight: '500',
  },
  handChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.secondary.darkBlue,
  },
  handChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral.white,
  },
  spacer: {
    flex: 1,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: colors.neutral.mediumGray,
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
  searchInput: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.secondary.darkBlue,
    marginBottom: 14,
  },
  searchHint: {
    fontSize: 14,
    color: colors.neutral.mediumGray,
    textAlign: 'center',
    paddingVertical: 20,
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
