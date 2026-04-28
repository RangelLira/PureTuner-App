import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';

interface ComingSoonScreenProps {
  moduleName: string;
  description: string;
}

function ComingSoonScreen({ moduleName, description }: ComingSoonScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Em Desenvolvimento</Text>
      </View>
      <Text style={styles.title}>{moduleName}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

export function MetronomeScreen() {
  return (
    <ComingSoonScreen
      moduleName="Metrônomo"
      description="Configure o tempo, compasso e subdivisions para seus estudos musicais."
    />
  );
}

export function ChordsScreen() {
  return (
    <ComingSoonScreen
      moduleName="Acordes"
      description="Biblioteca completa de acordes com diagrama de pestana e construção harmônica."
    />
  );
}

export function ScalesScreen() {
  return (
    <ComingSoonScreen
      moduleName="Escalas"
      description="Shapes e formas de escalas com notas, modos e aplicações práticas."
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  badge: {
    backgroundColor: colors.secondary.darkBlue,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  badgeText: {
    color: colors.neutral.white,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.secondary.darkBlue,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: colors.neutral.mediumGray,
    textAlign: 'center',
    lineHeight: 22,
  },
});
