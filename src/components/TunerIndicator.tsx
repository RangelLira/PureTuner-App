import React, { useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';

interface TunerIndicatorProps {
  note: string;
  frequency: number;
  cents: number;
  isInTune: boolean;
}

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.8,
  overshootClamping: false as const,
  useNativeDriver: true,
};

export function TunerIndicator({ note, frequency, cents, isInTune }: TunerIndicatorProps) {
  const [meterWidth, setMeterWidth] = useState(0);

  const needleOffset = useRef(new Animated.Value(0)).current;
  const noteOpacity = useRef(new Animated.Value(0)).current;
  const noteScale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (!note || meterWidth === 0) {
      Animated.parallel([
        Animated.spring(needleOffset, { toValue: 0, ...SPRING_CONFIG }),
        Animated.timing(noteOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(noteScale, { toValue: 0.85, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      const normalized = Math.max(-50, Math.min(50, cents));
      const targetOffset = (normalized / 50) * (meterWidth * 0.42);

      Animated.parallel([
        Animated.spring(needleOffset, { toValue: targetOffset, ...SPRING_CONFIG }),
        Animated.timing(noteOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(noteScale, { toValue: 1, damping: 14, stiffness: 280, useNativeDriver: true }),
      ]).start();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cents, note, meterWidth]);

  const onMeterLayout = (e: LayoutChangeEvent) => {
    setMeterWidth(e.nativeEvent.layout.width);
  };

  const noteColor = !note
    ? colors.neutral.mediumGray
    : isInTune
    ? colors.status.success
    : Math.abs(cents) < 20
    ? colors.status.warning
    : colors.status.error;

  const needleColor = !note
    ? '#7F8C8D'
    : isInTune
    ? '#27AE60'
    : Math.abs(cents) < 20
    ? '#F39C12'
    : '#E74C3C';

  const getCentsDisplay = () => {
    if (cents === 0) return '0';
    return `${cents > 0 ? '+' : ''}${cents.toFixed(0)}`;
  };

  const getStatusText = () => {
    if (!note) return 'Aguardando sinal...';
    if (isInTune) return 'Afinado!';
    if (Math.abs(cents) < 20) return 'Quase lá...';
    return cents > 0 ? 'Muito agudo' : 'Muito grave';
  };

  return (
    <View style={styles.container}>
      {/* Nota e frequência */}
      <Animated.View
        style={[
          styles.noteContainer,
          { opacity: noteOpacity, transform: [{ scale: noteScale }] },
        ]}
      >
        <Text style={[styles.noteText, { color: noteColor }]}>
          {note || '-'}
        </Text>
        <Text style={styles.frequencyText}>
          {frequency > 0 ? `${frequency.toFixed(1)} Hz` : '-- Hz'}
        </Text>
      </Animated.View>

      {/* Medidor */}
      <View style={styles.meterWrapper}>
        <View style={styles.meterBackground} onLayout={onMeterLayout}>
          {/* Zona verde central (±10 cents) */}
          <View style={styles.inTuneZone} />

          {/* Marcas em ±25 cents */}
          <View style={[styles.tick, styles.tickLeft]} />
          <View style={[styles.tick, styles.tickRight]} />

          {/* Linha central */}
          <View style={styles.centerLine} />

          {/* Agulha animada com spring physics */}
          <Animated.View
            style={[
              styles.needle,
              {
                backgroundColor: needleColor,
                transform: [{ translateX: needleOffset }],
              },
            ]}
          />
        </View>

        <View style={styles.scaleRow}>
          <Text style={styles.scaleText}>-50</Text>
          <Text style={styles.scaleText}>-25</Text>
          <Text style={styles.scaleText}>0</Text>
          <Text style={styles.scaleText}>+25</Text>
          <Text style={styles.scaleText}>+50</Text>
        </View>
      </View>

      {/* Cents e status */}
      <View style={styles.statusContainer}>
        <Text style={[styles.centsText, { color: noteColor }]}>
          {note ? `${getCentsDisplay()} cents` : '--'}
        </Text>
        <Text style={[styles.statusText, { color: noteColor }]}>
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
    gap: 28,
  },
  noteContainer: {
    alignItems: 'center',
  },
  noteText: {
    fontSize: 88,
    fontWeight: '700',
    lineHeight: 96,
  },
  frequencyText: {
    fontSize: 15,
    color: colors.neutral.mediumGray,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  meterWrapper: {
    width: '100%',
    paddingHorizontal: 8,
  },
  meterBackground: {
    height: 56,
    backgroundColor: '#E8EAED',
    borderRadius: 28,
    position: 'relative',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  inTuneZone: {
    position: 'absolute',
    left: '42%',
    width: '16%',
    height: '100%',
    backgroundColor: 'rgba(39, 174, 96, 0.13)',
  },
  tick: {
    position: 'absolute',
    width: 1,
    height: '35%',
    backgroundColor: colors.neutral.mediumGray,
    opacity: 0.35,
  },
  tickLeft: {
    left: '25%',
  },
  tickRight: {
    left: '75%',
  },
  centerLine: {
    position: 'absolute',
    left: '50%',
    marginLeft: -1,
    width: 2,
    height: '55%',
    backgroundColor: colors.neutral.mediumGray,
    opacity: 0.6,
  },
  needle: {
    position: 'absolute',
    left: '50%',
    marginLeft: -3,
    width: 6,
    height: '85%',
    borderRadius: 3,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  scaleText: {
    fontSize: 11,
    color: colors.neutral.mediumGray,
  },
  statusContainer: {
    alignItems: 'center',
    gap: 4,
  },
  centsText: {
    fontSize: 20,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
