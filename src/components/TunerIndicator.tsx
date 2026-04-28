import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';

interface TunerIndicatorProps {
  note: string;
  frequency: number;
  cents: number;
  isInTune: boolean;
}

export function TunerIndicator({ note, frequency, cents, isInTune }: TunerIndicatorProps) {
  const getIndicatorColor = () => {
    if (!note) return colors.neutral.mediumGray;
    if (isInTune) return colors.status.success;
    if (Math.abs(cents) < 20) return colors.status.warning;
    return colors.status.error;
  };

  const getCentsDisplay = () => {
    if (cents === 0) return '0';
    const sign = cents > 0 ? '+' : '';
    return `${sign}${cents.toFixed(0)}`;
  };

  const getNeedlePosition = () => {
    const normalizedCents = Math.max(-50, Math.min(50, cents));
    return (normalizedCents / 50) * 40;
  };

  const getStatusText = () => {
    if (!note) return 'Aguardando sinal...';
    if (isInTune) return 'Afinado!';
    if (Math.abs(cents) < 20) return 'Quase lá...';
    return cents > 0 ? 'Muito agudo' : 'Muito grave';
  };

  const indicatorColor = getIndicatorColor();

  return (
    <View style={styles.container}>
      <View style={styles.noteContainer}>
        <Text style={[styles.noteText, { color: indicatorColor }]}>
          {note || '-'}
        </Text>
        <Text style={styles.frequencyText}>
          {frequency > 0 ? `${frequency.toFixed(1)} Hz` : '-- Hz'}
        </Text>
      </View>

      <View style={styles.meterContainer}>
        <View style={styles.meterBackground}>
          <View style={styles.centerLine} />
          <View
            style={[
              styles.needle,
              {
                backgroundColor: indicatorColor,
                left: `${50 + getNeedlePosition()}%` as any,
              },
            ]}
          />
        </View>
        <View style={styles.scaleRow}>
          <Text style={styles.scaleText}>-50</Text>
          <Text style={styles.scaleText}>0</Text>
          <Text style={styles.scaleText}>+50</Text>
        </View>
      </View>

      <View style={styles.centsContainer}>
        <Text style={[styles.centsText, { color: indicatorColor }]}>
          {note ? `${getCentsDisplay()} cents` : '--'}
        </Text>
        <Text style={[styles.statusText, { color: indicatorColor }]}>
          {getStatusText()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    gap: 24,
  },
  noteContainer: {
    alignItems: 'center',
  },
  noteText: {
    fontSize: 80,
    fontWeight: '700',
    lineHeight: 88,
  },
  frequencyText: {
    fontSize: 16,
    color: colors.neutral.mediumGray,
    marginTop: 4,
  },
  meterContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  meterBackground: {
    height: 48,
    backgroundColor: colors.neutral.lightGray,
    borderRadius: 24,
    position: 'relative',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  centerLine: {
    position: 'absolute',
    left: '50%',
    width: 2,
    height: '60%',
    backgroundColor: colors.neutral.mediumGray,
    marginLeft: -1,
  },
  needle: {
    position: 'absolute',
    width: 4,
    height: '80%',
    borderRadius: 2,
    marginLeft: -2,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  scaleText: {
    fontSize: 12,
    color: colors.neutral.mediumGray,
  },
  centsContainer: {
    alignItems: 'center',
    gap: 4,
  },
  centsText: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
