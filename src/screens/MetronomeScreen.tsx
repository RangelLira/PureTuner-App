import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Sound from 'react-native-sound';
import { colors } from '../constants/colors';
import { MetronomeEngine } from '../services/MetronomeEngine';

Sound.setCategory('Playback');

const TIME_SIGNATURES = [2, 3, 4] as const;
const SUBDIVISIONS = [
  { value: 1, label: 'Semínima'     },
  { value: 2, label: 'Colcheia'     },
  { value: 3, label: 'Tercina'      },
  { value: 4, label: 'Semicolcheia' },
] as const;

const BPM_CIRCLE = 152;
const BPM_BTN    = 62;
const MOL_SPACER = BPM_CIRCLE - 20;
const CONFIG_W   = BPM_BTN * 2 + MOL_SPACER; // aligns chips with ± buttons

function buildDots(beats: number, subs: number) {
  const dots: Array<{ type: 'beat' | 'sub'; beatNum: number; subBeat: number }> = [];
  for (let b = 1; b <= beats; b++) {
    dots.push({ type: 'beat', beatNum: b, subBeat: 1 });
    for (let s = 2; s <= subs; s++) dots.push({ type: 'sub', beatNum: b, subBeat: s });
  }
  return dots;
}

// Plays next available instance from a 2-sound pool (no stop needed)
function poolPlay(
  pool: Sound[],
  idx: { n: number },
) {
  if (!pool.length) return;
  const s = pool[idx.n % pool.length];
  idx.n++;
  if (s?.isLoaded()) {
    s.setCurrentTime(0);
    s.play();
  }
}

export function MetronomeScreen() {
  const [bpm, setBpm]                         = useState(120);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState<2 | 3 | 4>(4);
  const [subdivisions, setSubdivisions]       = useState(1);
  const [isPlaying, setIsPlaying]             = useState(false);
  const [activeBeat, setActiveBeat]           = useState(0);
  const [activeSubBeat, setActiveSubBeat]     = useState(0);
  const [showSubModal, setShowSubModal]       = useState(false);
  const [showBpmInput, setShowBpmInput]       = useState(false);
  const [bpmInputText, setBpmInputText]       = useState('120');

  const engineRef  = useRef(new MetronomeEngine());
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const bpmHoldRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sound pools — 2 instances each to allow overlap-free retriggering
  const accentPool = useRef<Sound[]>([]);
  const clickPool  = useRef<Sound[]>([]);
  const hiPool     = useRef<Sound[]>([]);
  const accentIdx  = useRef({ n: 0 });
  const clickIdx   = useRef({ n: 0 });
  const hiIdx      = useRef({ n: 0 });

  // Ref-based beat state: updated in the engine callback WITHOUT setState.
  // This is critical — setState calls inside a setTimeout callback block the
  // JS thread and cause the next timeout to fire late (cascading drift).
  const currentTickRef  = useRef({ beat: 0, subBeat: 0 });
  const lastRenderedRef = useRef({ beat: -1, subBeat: -1 });
  const rafIdRef        = useRef(0);

  // Load sound pools on mount
  useEffect(() => {
    const load = (f: string) =>
      new Sound(f, Sound.MAIN_BUNDLE, err => {
        if (err) console.warn('[metro] load', f, err);
      });
    accentPool.current = [load('metro_accent.wav'), load('metro_accent.wav')];
    clickPool.current  = [load('metro_click.wav'),  load('metro_click.wav')];
    hiPool.current     = [load('metro_hi.wav'),     load('metro_hi.wav')];
    return () => {
      [...accentPool.current, ...clickPool.current, ...hiPool.current].forEach(s => s.release());
      engineRef.current.stop();
    };
  }, []);

  // RAF visual sync — decoupled from engine callback.
  // Polls currentTickRef at display framerate and calls setState only when beat changes.
  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(rafIdRef.current);
      setActiveBeat(0);
      setActiveSubBeat(0);
      return;
    }
    const sync = () => {
      const curr = currentTickRef.current;
      const last = lastRenderedRef.current;
      if (curr.beat !== last.beat || curr.subBeat !== last.subBeat) {
        lastRenderedRef.current = { beat: curr.beat, subBeat: curr.subBeat };
        setActiveBeat(curr.beat);
        setActiveSubBeat(curr.subBeat);
      }
      rafIdRef.current = requestAnimationFrame(sync);
    };
    rafIdRef.current = requestAnimationFrame(sync);
    return () => cancelAnimationFrame(rafIdRef.current);
  }, [isPlaying]);

  // BPM circle pulses only on downbeat (beat 1), not on every quarter note
  const pulseBpm = useCallback(() => {
    pulseAnim.setValue(1.16);
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [pulseAnim]);

  const updateBpm = useCallback((next: number) => {
    const v = Math.max(40, Math.min(220, next));
    setBpm(v);
    engineRef.current.setBpm(v);
  }, []);

  const startHold = useCallback((delta: number) => {
    bpmHoldRef.current = setInterval(() => {
      setBpm(prev => {
        const v = Math.max(40, Math.min(220, prev + delta));
        engineRef.current.setBpm(v);
        return v;
      });
    }, 100);
  }, []);

  const stopHold = useCallback(() => {
    if (bpmHoldRef.current) {
      clearInterval(bpmHoldRef.current);
      bpmHoldRef.current = null;
    }
  }, []);

  const confirmBpmInput = useCallback(() => {
    const v = parseInt(bpmInputText, 10);
    if (!isNaN(v)) updateBpm(v);
    setShowBpmInput(false);
  }, [bpmInputText, updateBpm]);

  const startEngine = useCallback(
    (beats: number, subs: number, currentBpm: number) => {
      const eng = engineRef.current;
      eng.stop();
      // Reset refs so RAF loop doesn't show stale beat after restart
      currentTickRef.current  = { beat: 0, subBeat: 0 };
      lastRenderedRef.current = { beat: -1, subBeat: -1 };
      eng.setBpm(currentBpm);
      eng.setTimeSignature(beats);
      eng.setSubdivisions(subs);
      eng.start((beat, subBeat, isDownbeat) => {
        // ─────────────────────────────────────────────────────────────
        // CRITICAL: no setState here. Only ref updates + sound + Animated.
        // setState inside a setTimeout callback delays the JS thread and
        // makes the next setTimeout fire late → cascading drift.
        // ─────────────────────────────────────────────────────────────
        currentTickRef.current = { beat, subBeat };
        if (subBeat === 1) {
          if (isDownbeat) {
            pulseBpm(); // pulse only once per measure
            poolPlay(accentPool.current, accentIdx.current);
          } else {
            poolPlay(clickPool.current, clickIdx.current);
          }
        } else {
          poolPlay(hiPool.current, hiIdx.current);
        }
      });
    },
    [pulseBpm],
  );

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      engineRef.current.stop();
      setIsPlaying(false);
      pulseAnim.setValue(1);
    } else {
      startEngine(beatsPerMeasure, subdivisions, bpm);
      setIsPlaying(true);
    }
  }, [isPlaying, beatsPerMeasure, subdivisions, bpm, pulseAnim, startEngine]);

  const changeSignature = useCallback(
    (beats: 2 | 3 | 4) => {
      setBeatsPerMeasure(beats);
      if (isPlaying) startEngine(beats, subdivisions, bpm);
    },
    [isPlaying, subdivisions, bpm, startEngine],
  );

  const changeSubdivision = useCallback(
    (subs: number) => {
      setSubdivisions(subs);
      setShowSubModal(false);
      if (isPlaying) startEngine(beatsPerMeasure, subs, bpm);
    },
    [isPlaying, beatsPerMeasure, bpm, startEngine],
  );

  useEffect(() => () => stopHold(), [stopHold]);

  const dots     = buildDots(beatsPerMeasure, subdivisions);
  const subLabel = SUBDIVISIONS.find(s => s.value === subdivisions)?.label ?? 'Semínima';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Metrônomo</Text>
      <Text style={styles.subtitle}>
        {isPlaying ? 'Toque com o metrônomo' : 'Pressione Iniciar para começar'}
      </Text>

      {/* Beat + subdivision dots */}
      <View style={styles.dotsRow}>
        {dots.map((dot, i) => {
          const isBig    = dot.type === 'beat';
          const isActive = isPlaying && activeBeat === dot.beatNum && activeSubBeat === dot.subBeat;
          const isDown   = dot.beatNum === 1 && dot.subBeat === 1;
          return (
            <View
              key={i}
              style={[
                isBig ? styles.bigDot : styles.smallDot,
                isActive && isBig && (isDown ? styles.bigDotDown : styles.bigDotActive),
                isActive && !isBig && styles.smallDotActive,
              ]}
            />
          );
        })}
      </View>

      {/* BPM Molecule */}
      <View style={styles.molecule}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={styles.bpmCircle}
            onPress={() => { setBpmInputText(String(bpm)); setShowBpmInput(true); }}
            activeOpacity={0.85}
          >
            <Text style={styles.bpmValue}>{bpm}</Text>
            <Text style={styles.bpmUnit}>BPM</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.bpmBtnsRow}>
          <TouchableOpacity
            style={styles.bpmBtn}
            onPress={() => updateBpm(bpm - 1)}
            onPressIn={() => startHold(-1)}
            onPressOut={stopHold}
            activeOpacity={0.75}
          >
            <Text style={styles.bpmBtnText}>−</Text>
          </TouchableOpacity>
          <View style={styles.molSpacer} />
          <TouchableOpacity
            style={styles.bpmBtn}
            onPress={() => updateBpm(bpm + 1)}
            onPressIn={() => startHold(1)}
            onPressOut={stopHold}
            activeOpacity={0.75}
          >
            <Text style={styles.bpmBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Config — same width as ± buttons row */}
      <View style={styles.configArea}>
        <View style={styles.sigRow}>
          {TIME_SIGNATURES.map(beats => (
            <TouchableOpacity
              key={beats}
              style={[styles.sigChip, beatsPerMeasure === beats && styles.sigChipActive]}
              onPress={() => changeSignature(beats)}
              activeOpacity={0.75}
            >
              <Text style={[styles.sigChipText, beatsPerMeasure === beats && styles.sigChipTextActive]}>
                {beats}/4
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={styles.subChip}
          onPress={() => setShowSubModal(true)}
          activeOpacity={0.75}
        >
          <Text style={styles.subChipText}>{subLabel}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }} />

      {/* Iniciar / Parar — identical to TunerScreen */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.button, isPlaying ? styles.buttonStop : styles.buttonStart]}
          onPress={togglePlay}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{isPlaying ? 'Parar' : 'Iniciar'}</Text>
        </TouchableOpacity>
      </View>

      {/* Subdivision modal */}
      <Modal visible={showSubModal} transparent animationType="fade" onRequestClose={() => setShowSubModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowSubModal(false)} activeOpacity={1}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Subdivisão</Text>
            {SUBDIVISIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.modalOption, subdivisions === opt.value && styles.modalOptionActive]}
                onPress={() => changeSubdivision(opt.value)}
                activeOpacity={0.75}
              >
                <Text style={[styles.modalOptionText, subdivisions === opt.value && styles.modalOptionTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* BPM input modal */}
      <Modal visible={showBpmInput} transparent animationType="fade" onRequestClose={() => setShowBpmInput(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowBpmInput(false)} activeOpacity={1}>
          <TouchableOpacity style={styles.bpmInputBox} activeOpacity={1} onPress={() => {}}>
            <Text style={styles.bpmInputTitle}>Informe o BPM</Text>
            <TextInput
              style={styles.bpmTextInput}
              value={bpmInputText}
              onChangeText={setBpmInputText}
              keyboardType="number-pad"
              maxLength={3}
              autoFocus
              selectTextOnFocus
              onSubmitEditing={confirmBpmInput}
            />
            <Text style={styles.bpmInputHint}>40 – 220</Text>
            <View style={styles.bpmInputBtns}>
              <TouchableOpacity style={styles.bpmInputCancel} onPress={() => setShowBpmInput(false)} activeOpacity={0.75}>
                <Text style={styles.bpmInputCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bpmInputOk} onPress={confirmBpmInput} activeOpacity={0.8}>
                <Text style={styles.bpmInputOkText}>OK</Text>
              </TouchableOpacity>
            </View>
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
    paddingTop: 64,
    paddingHorizontal: 24,
    alignItems: 'center',
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
    marginBottom: 24,
  },

  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 28,
  },
  bigDot: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#C8C8C8',
  },
  bigDotActive: { backgroundColor: colors.secondary.lightBlue },
  bigDotDown:   { backgroundColor: colors.primary.orange },
  smallDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#DCDCDC',
  },
  smallDotActive: { backgroundColor: colors.primary.lightOrange },

  molecule: {
    alignItems: 'center',
    marginBottom: 28,
  },
  bpmCircle: {
    width: BPM_CIRCLE,
    height: BPM_CIRCLE,
    borderRadius: BPM_CIRCLE / 2,
    borderWidth: 3,
    borderColor: colors.secondary.darkBlue,
    backgroundColor: colors.neutral.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
  },
  bpmValue: {
    fontSize: 52,
    fontWeight: '700',
    color: colors.secondary.darkBlue,
    lineHeight: 56,
    includeFontPadding: false,
  },
  bpmUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral.mediumGray,
    letterSpacing: 2,
  },
  bpmBtnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -10,
  },
  bpmBtn: {
    width: BPM_BTN,
    height: BPM_BTN,
    borderRadius: BPM_BTN / 2,
    backgroundColor: colors.secondary.darkBlue,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  bpmBtnText: {
    fontSize: 30,
    color: colors.neutral.white,
    fontWeight: '300',
    lineHeight: 34,
    includeFontPadding: false,
  },
  molSpacer: { width: MOL_SPACER },

  configArea: { width: CONFIG_W, gap: 10 },
  sigRow: { flexDirection: 'row', gap: 10 },
  sigChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: colors.neutral.white,
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
  },
  sigChipActive: {
    backgroundColor: colors.secondary.darkBlue,
    borderColor: colors.secondary.darkBlue,
  },
  sigChipText: { fontSize: 15, fontWeight: '700', color: colors.secondary.darkBlue },
  sigChipTextActive: { color: colors.neutral.white },
  subChip: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 24,
    backgroundColor: colors.neutral.white,
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
  },
  subChipText: { fontSize: 15, fontWeight: '600', color: colors.secondary.darkBlue },

  controlsContainer: { alignItems: 'center', paddingBottom: 40 },
  button: {
    paddingHorizontal: 56,
    paddingVertical: 18,
    borderRadius: 32,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonStart: { backgroundColor: colors.primary.orange },
  buttonStop:  { backgroundColor: colors.status.error },
  buttonText: {
    color: colors.neutral.white,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    width: 260,
    backgroundColor: colors.neutral.white,
    borderRadius: 20,
    paddingVertical: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral.mediumGray,
    textAlign: 'center',
    paddingVertical: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  modalOption: { paddingVertical: 14, paddingHorizontal: 24 },
  modalOptionActive: { backgroundColor: colors.neutral.lightGray },
  modalOptionText: { fontSize: 16, color: colors.secondary.darkBlue, fontWeight: '500' },
  modalOptionTextActive: { fontWeight: '700', color: colors.primary.orange },

  bpmInputBox: {
    width: 260,
    backgroundColor: colors.neutral.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
  },
  bpmInputTitle: {
    fontSize: 16, fontWeight: '700',
    color: colors.secondary.darkBlue,
    marginBottom: 14,
  },
  bpmTextInput: {
    width: '100%',
    fontSize: 42, fontWeight: '700',
    color: colors.secondary.darkBlue,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary.orange,
    paddingBottom: 4,
    marginBottom: 6,
  },
  bpmInputHint: {
    fontSize: 12, color: colors.neutral.mediumGray, marginBottom: 20,
  },
  bpmInputBtns: { flexDirection: 'row', gap: 12 },
  bpmInputCancel: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderRadius: 12, backgroundColor: colors.neutral.lightGray,
  },
  bpmInputCancelText: { fontSize: 15, color: colors.neutral.mediumGray, fontWeight: '600' },
  bpmInputOk: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderRadius: 12, backgroundColor: colors.primary.orange,
  },
  bpmInputOkText: { fontSize: 15, color: colors.neutral.white, fontWeight: '700' },
});
