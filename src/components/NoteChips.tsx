import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';

// Chips das notas de um acorde/escala com o grau de cada uma logo acima
// (T, 3m, 5J…), no mesmo padrão da lista do Campo Harmônico: o grau na cor
// do chip. A primeira nota é a tônica (laranja). Altura fixa mesmo sem
// notas, pra tela não "pular" quando a linha aparece/some.

interface Props {
  notes: string[];
  degrees: string[];
}

export function NoteChips({ notes, degrees }: Props) {
  return (
    <View style={styles.row}>
      {notes.map((n, i) => {
        const color = i === 0 ? colors.primary.orange : colors.secondary.darkBlue;
        return (
          <View key={`${n}${i}`} style={styles.cell}>
            <Text style={[styles.degree, { color }]}>{degrees[i] ?? ''}</Text>
            <View style={[styles.chip, { backgroundColor: color }]}>
              <Text style={styles.chipText}>{n}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 6,
    minHeight: 50,
  },
  cell: {
    alignItems: 'center',
  },
  degree: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 14,
    minWidth: 40,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral.white,
  },
});
