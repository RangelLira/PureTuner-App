import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../constants/colors';
import {
  HarmonicMode,
  SECTOR_COUNT,
  chordSymbol,
  mod12,
  solfege,
  tonicOf,
  wheelLabels,
  windowChords,
} from '../data/harmonicField';

// Círculo das quintas giratório. O disco (setores + rótulos) gira; a janela
// do campo harmônico fica fixa no topo, como no produto físico. Arrastar gira
// o disco e, ao soltar, ele encaixa no setor mais próximo; um toque num setor
// gira até ele (aro externo = tom maior, aro do meio = tom menor).

interface FifthsWheelProps {
  size: number;
  sector: number;
  mode: HarmonicMode;
  sevenths: boolean;
  onSelect: (sector: number, mode?: HarmonicMode) => void;
}

const STEP = 360 / SECTOR_COUNT;
const TAP_SLOP = 8;

// Raios de cada aro, em fração do raio total.
const RING = {
  outer: [0.75, 1.0],
  middle: [0.52, 0.75],
  inner: [0.29, 0.52],
} as const;

// Ângulo em graus, sentido horário a partir do topo.
function point(c: number, r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return { x: c + r * Math.sin(a), y: c - r * Math.cos(a) };
}

function annularSector(c: number, r1: number, r2: number, a0: number, a1: number) {
  const p0 = point(c, r2, a0);
  const p1 = point(c, r2, a1);
  const p2 = point(c, r1, a1);
  const p3 = point(c, r1, a0);
  return `M${p0.x} ${p0.y} A${r2} ${r2} 0 0 1 ${p1.x} ${p1.y} L${p2.x} ${p2.y} A${r1} ${r1} 0 0 0 ${p3.x} ${p3.y} Z`;
}

// Contorno da janela: 3 setores nos aros externo e do meio, 1 no interno.
function windowPath(c: number, R: number) {
  const rOut = R * RING.outer[1];
  const rMid = R * RING.middle[0];
  const rIn = R * RING.inner[0];
  const w = STEP * 1.5;
  const h = STEP / 2;
  const pts = [
    point(c, rOut, -w), point(c, rOut, w), point(c, rMid, w), point(c, rMid, h),
    point(c, rIn, h), point(c, rIn, -h), point(c, rMid, -h), point(c, rMid, -w),
  ];
  return [
    `M${pts[0].x} ${pts[0].y}`,
    `A${rOut} ${rOut} 0 0 1 ${pts[1].x} ${pts[1].y}`,
    `L${pts[2].x} ${pts[2].y}`,
    `A${rMid} ${rMid} 0 0 0 ${pts[3].x} ${pts[3].y}`,
    `L${pts[4].x} ${pts[4].y}`,
    `A${rIn} ${rIn} 0 0 0 ${pts[5].x} ${pts[5].y}`,
    `L${pts[6].x} ${pts[6].y}`,
    `A${rMid} ${rMid} 0 0 0 ${pts[7].x} ${pts[7].y}`,
    'Z',
  ].join(' ');
}

function fullCircle(c: number, r: number) {
  return `M${c - r} ${c} A${r} ${r} 0 1 1 ${c + r} ${c} A${r} ${r} 0 1 1 ${c - r} ${c} Z`;
}

// Diferença angular normalizada para (-180, 180].
function shortest(delta: number) {
  return delta - 360 * Math.round(delta / 360);
}

export function FifthsWheel({ size, sector, mode, sevenths, onSelect }: FifthsWheelProps) {
  const c = size / 2;
  const R = size / 2 - 2;

  // Ângulo acumulado (não reduzido a 0–360) para o giro nunca "voltar
  // a volta inteira" ao passar de Fá para Dó.
  const angleRef = useRef(-sector * STEP);
  const rotation = useRef(new Animated.Value(angleRef.current)).current;

  // Enquanto o disco é arrastado, nenhum rótulo fica branco: o destaque
  // laranja é fixo na janela e os acordes passam por baixo dele.
  const [dragging, setDragging] = useState(false);

  // Callbacks lidos pelo PanResponder (criado uma vez só).
  const propsRef = useRef({ onSelect, R, c });
  propsRef.current = { onSelect, R, c };

  // Mudança de setor vinda de fora (ex.: estado restaurado) — gira até ele.
  useEffect(() => {
    const target = angleRef.current + shortest(-sector * STEP - angleRef.current);
    if (target !== angleRef.current) {
      angleRef.current = target;
      Animated.spring(rotation, { toValue: target, useNativeDriver: true, friction: 7, tension: 50 }).start();
    }
  }, [sector, rotation]);

  const panResponder = useMemo(() => {
    let startX = 0;
    let startY = 0;
    let lastTouchAngle = 0;
    let current = 0;

    const touchAngle = (x: number, y: number) => {
      const { c: cc } = propsRef.current;
      return (Math.atan2(x - cc, cc - y) * 180) / Math.PI;
    };
    const touchRadius = (x: number, y: number) => {
      const { c: cc } = propsRef.current;
      return Math.hypot(x - cc, y - cc);
    };

    const settle = (target: number, newMode?: HarmonicMode) => {
      setDragging(false);
      angleRef.current = target;
      Animated.spring(rotation, { toValue: target, useNativeDriver: true, friction: 7, tension: 50 }).start();
      propsRef.current.onSelect(mod12(Math.round(-target / STEP)), newMode);
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: evt => {
        rotation.stopAnimation();
        startX = evt.nativeEvent.locationX;
        startY = evt.nativeEvent.locationY;
        lastTouchAngle = touchAngle(startX, startY);
        current = angleRef.current;
      },
      onPanResponderMove: (_, g) => {
        const x = startX + g.dx;
        const y = startY + g.dy;
        // Perto do centro o ângulo fica instável — ignora.
        if (touchRadius(x, y) < propsRef.current.R * 0.15) return;
        if (Math.abs(g.dx) >= TAP_SLOP || Math.abs(g.dy) >= TAP_SLOP) setDragging(true);
        const a = touchAngle(x, y);
        current += shortest(a - lastTouchAngle);
        lastTouchAngle = a;
        rotation.setValue(current);
      },
      onPanResponderRelease: (_, g) => {
        const { R: RR } = propsRef.current;
        if (Math.abs(g.dx) < TAP_SLOP && Math.abs(g.dy) < TAP_SLOP) {
          const r = touchRadius(startX, startY);
          if (r > RR || r < RR * RING.inner[0]) {
            settle(angleRef.current);
            return;
          }
          // Setor tocado, em coordenadas do disco (descontando a rotação).
          const tapped = mod12(Math.round((touchAngle(startX, startY) - angleRef.current) / STEP));
          const newMode: HarmonicMode | undefined =
            r >= RR * RING.outer[0] ? 'major' : r >= RR * RING.middle[0] ? 'minor' : undefined;
          settle(angleRef.current + shortest(-tapped * STEP - angleRef.current), newMode);
          return;
        }
        settle(Math.round(current / STEP) * STEP);
      },
      onPanResponderTerminate: () => settle(Math.round(current / STEP) * STEP),
    });
  }, [rotation]);

  const labels = useMemo(() => wheelLabels(sector), [sector]);
  // Tétrades só dentro da janela: a sétima depende da posição do acorde no
  // tom (o V é o único "7"), então fora dela o círculo fica em tríades.
  const windowCells = useMemo(() => windowChords(sector, 'major'), [sector]);

  const spin = rotation.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });
  // Contra-rotação: mantém os rótulos sempre de pé enquanto o disco gira.
  const counterSpin = rotation.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '-360deg'] });

  const sectors = Array.from({ length: SECTOR_COUNT }, (_, s) => s);
  const ringMid = (ring: readonly [number, number]) => (R * (ring[0] + ring[1])) / 2;

  const renderLabel = (s: number, ring: 'outer' | 'middle' | 'inner') => {
    const quality = ring === 'outer' ? 'major' : ring === 'middle' ? 'minor' : 'dim';
    const d = mod12(s - sector);
    const offset = d === 0 ? 0 : d === 1 ? 1 : d === SECTOR_COUNT - 1 ? -1 : null;
    const inWindow = offset !== null && (ring !== 'inner' || offset === 0);
    let text = chordSymbol({ root: labels[ring][s], quality });
    if (sevenths && inWindow) {
      const cellChord = ring === 'inner' ? windowCells.inner : windowCells[ring][offset + 1];
      text = chordSymbol(cellChord, true);
      // "Bm7(♭5)" não cabe na largura do aro interno: quebra em 2 linhas.
      if (ring === 'inner') text = text.replace('(', '\n(');
    }
    const r = ringMid(RING[ring]);
    const w = LABEL_W[ring];
    const p = point(c, r, s * STEP);
    const isTonic =
      !dragging &&
      s === sector &&
      ((ring === 'outer' && mode === 'major') || (ring === 'middle' && mode === 'minor'));
    return (
      <Animated.View
        key={`${ring}${s}`}
        style={[
          styles.label,
          { left: p.x - w / 2, top: p.y - LABEL_H / 2, width: w, transform: [{ rotate: counterSpin }] },
        ]}
      >
        <Text
          style={[
            ring === 'outer' ? styles.outerText : ring === 'middle' ? styles.middleText : styles.innerText,
            isTonic && styles.tonicText,
            fontSizeFor(ring, text),
          ]}
          numberOfLines={ring === 'inner' ? 2 : 1}
        >
          {text}
        </Text>
      </Animated.View>
    );
  };

  return (
    <View style={{ width: size, height: size }} {...panResponder.panHandlers}>
      {/* Disco giratório: setores */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { transform: [{ rotate: spin }] }]}>
        <Svg width={size} height={size}>
          {sectors.map(s => {
            const a0 = s * STEP - STEP / 2;
            const a1 = s * STEP + STEP / 2;
            return (
              <React.Fragment key={s}>
                <Path
                  d={annularSector(c, R * RING.outer[0], R * RING.outer[1], a0, a1)}
                  fill="#FFD3BF"
                  stroke={colors.neutral.white}
                  strokeWidth={2}
                />
                <Path
                  d={annularSector(c, R * RING.middle[0], R * RING.middle[1], a0, a1)}
                  fill="#FFEADF"
                  stroke={colors.neutral.white}
                  strokeWidth={2}
                />
                <Path
                  d={annularSector(c, R * RING.inner[0], R * RING.inner[1], a0, a1)}
                  fill="#DCE3E8"
                  stroke={colors.neutral.white}
                  strokeWidth={2}
                />
              </React.Fragment>
            );
          })}
        </Svg>
      </Animated.View>

      {/* Destaque da tônica: fixo no centro da janela (não gira com o disco) */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width={size} height={size}>
          <Path
            d={annularSector(
              c,
              R * (mode === 'major' ? RING.outer : RING.middle)[0],
              R * (mode === 'major' ? RING.outer : RING.middle)[1],
              -STEP / 2,
              STEP / 2,
            )}
            fill={colors.primary.orange}
            stroke={colors.neutral.white}
            strokeWidth={2}
          />
        </Svg>
      </View>

      {/* Disco giratório: rótulos */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { transform: [{ rotate: spin }] }]}>
        {sectors.map(s => renderLabel(s, 'outer'))}
        {sectors.map(s => renderLabel(s, 'middle'))}
        {sectors.map(s => renderLabel(s, 'inner'))}
      </Animated.View>

      {/* Janela fixa: escurece o que está fora dela */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={size} height={size}>
        <Path
          d={`${fullCircle(c, R + 1)} ${windowPath(c, R)}`}
          fillRule="evenodd"
          fill={colors.neutral.lightGray}
          fillOpacity={0.62}
        />
        <Path
          d={windowPath(c, R)}
          fill="none"
          stroke={colors.secondary.darkBlue}
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <Circle
          cx={c}
          cy={c}
          r={R * RING.inner[0] - 2}
          fill={colors.neutral.white}
          stroke={colors.secondary.darkBlue}
          strokeWidth={3}
        />
      </Svg>
      </View>

      {/* Centro fixo: nome do tom */}
      <View pointerEvents="none" style={[styles.center, { left: c - R * 0.26, top: c - R * 0.26, width: R * 0.52, height: R * 0.52 }]}>
        <Text style={styles.centerKey} numberOfLines={1} adjustsFontSizeToFit>
          {solfege(tonicOf(sector, mode))}
        </Text>
        <Text style={styles.centerMode}>{mode === 'major' ? 'maior' : 'menor'}</Text>
      </View>
    </View>
  );
}

// Nomes de tétrade ("Fmaj7", "F♯m7") não cabem no setor com a fonte cheia.
// adjustsFontSizeToFit não funciona dentro do Animated.View contra-rotacionado,
// então a fonte é reduzida pelo comprimento do nome.
function fontSizeFor(ring: 'outer' | 'middle' | 'inner', text: string) {
  const len = text.length;
  if (ring === 'outer') return { fontSize: len <= 3 ? 22 : len <= 5 ? 17 : 15 };
  if (ring === 'middle') return { fontSize: len <= 3 ? 17 : 15 };
  return text.includes('\n') ? { fontSize: 13, lineHeight: 14 } : null;
}

// Largura de cada rótulo ~ largura do setor no seu aro (acima disso o
// adjustsFontSizeToFit reduz a fonte, ex.: "F♯maj7").
const LABEL_W = { outer: 84, middle: 64, inner: 46 } as const;
const LABEL_H = 40;

const styles = StyleSheet.create({
  label: {
    position: 'absolute',
    height: LABEL_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerText: {
    fontSize: 22,
    includeFontPadding: false,
    fontWeight: '800',
    color: colors.secondary.darkBlue,
  },
  middleText: {
    fontSize: 17,
    includeFontPadding: false,
    fontWeight: '700',
    color: colors.secondary.darkBlue,
  },
  innerText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '700',
    includeFontPadding: false,
    color: colors.secondary.darkBlue,
  },
  tonicText: {
    color: colors.neutral.white,
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerKey: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.secondary.darkBlue,
  },
  centerMode: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary.darkBlue,
    marginTop: -7,
  },
});
