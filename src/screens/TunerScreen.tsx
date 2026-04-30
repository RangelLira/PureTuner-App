import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TunerIndicator } from '../components/TunerIndicator';
import { colors } from '../constants/colors';
import { useTuner } from '../hooks/useTuner';

export function TunerScreen() {
  const { isListening, currentNote, frequency, cents, isInTune, error, startListening, stopListening } =
    useTuner();

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Afinador</Text>
        <Text style={styles.subtitle}>
          {isListening ? 'Toque uma corda para afinar' : 'Pressione Iniciar para começar'}
        </Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <View style={styles.tunerContainer}>
          <TunerIndicator
            note={currentNote}
            frequency={frequency}
            cents={cents}
            isInTune={isInTune}
          />
        </View>
      )}

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.button, isListening ? styles.buttonStop : styles.buttonStart]}
          onPress={handleToggle}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{isListening ? 'Parar' : 'Iniciar'}</Text>
        </TouchableOpacity>
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
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.secondary.darkBlue,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.neutral.mediumGray,
  },
  tunerContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 15,
    color: colors.status.error,
    textAlign: 'center',
    lineHeight: 22,
  },
  controlsContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  button: {
    paddingHorizontal: 56,
    paddingVertical: 18,
    borderRadius: 32,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonStart: {
    backgroundColor: colors.primary.orange,
  },
  buttonStop: {
    backgroundColor: colors.status.error,
  },
  buttonText: {
    color: colors.neutral.white,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
