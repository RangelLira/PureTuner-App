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
      <View style={styles.header}>
        <Text style={styles.title}>{moduleName}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Em Desenvolvimento</Text>
        </View>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.lightGray,
    paddingHorizontal: 24,
    paddingTop: 64,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.secondary.darkBlue,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 60,
  },
  badge: {
    backgroundColor: colors.secondary.darkBlue,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
  },
  badgeText: {
    color: colors.neutral.white,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 15,
    color: colors.neutral.mediumGray,
    textAlign: 'center',
    lineHeight: 23,
    maxWidth: 280,
  },
});
