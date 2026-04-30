import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import guitarData from '@tombatossals/chords-db/lib/guitar.json';
import { ChordDiagram, ChordPosition } from '../components/ChordDiagram';
import { colors } from '../constants/colors';

const { width: SCREEN_W } = Dimensions.get('window');
const DIAGRAM_W = Math.floor((SCREEN_W - 64) / 2);

const NOTE_KEYS = [
  { key: 'C',      label: 'C'  },
  { key: 'Csharp', label: 'C#' },
  { key: 'D',      label: 'D'  },
  { key: 'Eb',     label: 'Eb' },
  { key: 'E',      label: 'E'  },
  { key: 'F',      label: 'F'  },
  { key: 'Fsharp', label: 'F#' },
  { key: 'G',      label: 'G'  },
  { key: 'Ab',     label: 'Ab' },
  { key: 'A',      label: 'A'  },
  { key: 'Bb',     label: 'Bb' },
  { key: 'B',      label: 'B'  },
];

const SUFFIXES = [
  { key: 'major', label: 'Maior'  },
  { key: 'minor', label: 'Menor'  },
  { key: '7',     label: 'Dom.7'  },
  { key: 'm7',    label: 'm7'     },
  { key: 'maj7',  label: 'Maj7'   },
  { key: 'sus2',  label: 'sus2'   },
  { key: 'sus4',  label: 'sus4'   },
  { key: 'dim',   label: 'dim'    },
  { key: 'dim7',  label: 'dim7'   },
  { key: 'aug',   label: 'aug'    },
  { key: '6',     label: '6'      },
  { key: '9',     label: '9'      },
  { key: 'm9',    label: 'm9'     },
  { key: 'm6',    label: 'm6'     },
  { key: 'add9',  label: 'add9'   },
];

interface PositionItem {
  id: string;
  index: number;
  position: ChordPosition;
}

export function ChordsScreen() {
  const [noteIdx, setNoteIdx] = useState(0);
  const [suffixIdx, setSuffixIdx] = useState(0);

  const selectedNote = NOTE_KEYS[noteIdx];
  const selectedSuffix = SUFFIXES[suffixIdx];

  const positions = useMemo<PositionItem[]>(() => {
    const chords = (guitarData as any).chords[selectedNote.key] as any[];
    if (!chords) return [];
    const match = chords.find((c: any) => c.suffix === selectedSuffix.key);
    if (!match) return [];
    return (match.positions as ChordPosition[]).map((p, i) => ({
      id: `${selectedNote.key}-${selectedSuffix.key}-${i}`,
      index: i,
      position: p,
    }));
  }, [noteIdx, suffixIdx]);

  const chordName = `${selectedNote.label} ${selectedSuffix.label}`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Acordes</Text>

      {/* Note selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.selectorRow}
        contentContainerStyle={styles.selectorContent}
      >
        {NOTE_KEYS.map((n, i) => (
          <TouchableOpacity
            key={n.key}
            style={[styles.chip, i === noteIdx && styles.chipActive]}
            onPress={() => setNoteIdx(i)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, i === noteIdx && styles.chipTextActive]}>
              {n.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Suffix selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.selectorRow}
        contentContainerStyle={styles.selectorContent}
      >
        {SUFFIXES.map((s, i) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.chip, i === suffixIdx && styles.chipActive]}
            onPress={() => setSuffixIdx(i)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, i === suffixIdx && styles.chipTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Chord name */}
      <Text style={styles.chordName}>{chordName}</Text>

      {/* Chord grid */}
      {positions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Acorde não disponível</Text>
        </View>
      ) : (
        <FlatList
          data={positions}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <ChordDiagram position={item.position} width={DIAGRAM_W} />
              <Text style={styles.posLabel}>Posição {item.index + 1}</Text>
            </View>
          )}
        />
      )}
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
  chordName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary.orange,
    textAlign: 'center',
    marginVertical: 12,
  },
  row: {
    justifyContent: 'center',
    gap: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  posLabel: {
    marginTop: 6,
    fontSize: 11,
    color: colors.neutral.mediumGray,
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: colors.neutral.mediumGray,
  },
});
