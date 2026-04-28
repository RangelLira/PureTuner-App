import { useCallback, useEffect, useRef, useState } from 'react';
import { TUNER_CONFIG } from '../constants/tunings';
import { AudioProcessor } from '../services/AudioProcessor';
import { PitchDetector } from '../services/PitchDetector';
import { AudioBuffer, RealAudioCapture } from '../services/RealAudioCapture';
import { TunerState } from '../types';

const INITIAL_STATE: TunerState = {
  isListening: false,
  currentNote: '',
  frequency: 0,
  cents: 0,
  isInTune: false,
};

const UPDATE_THROTTLE_MS = 100;

export function useTuner() {
  const [tunerState, setTunerState] = useState<TunerState>(INITIAL_STATE);

  const audioCapture = useRef<RealAudioCapture | null>(null);
  const audioProcessor = useRef<AudioProcessor | null>(null);
  const pitchDetector = useRef<PitchDetector | null>(null);
  const lastUpdateTime = useRef(0);

  useEffect(() => {
    audioProcessor.current = new AudioProcessor(TUNER_CONFIG.sampleRate, TUNER_CONFIG.bufferSize);
    pitchDetector.current = new PitchDetector(TUNER_CONFIG.centTolerance);
    audioCapture.current = new RealAudioCapture({
      sampleRate: TUNER_CONFIG.sampleRate,
      bufferSize: TUNER_CONFIG.bufferSize,
      channels: 1,
    });

    return () => {
      audioCapture.current?.stopCapture();
    };
  }, []);

  const processAudioBuffer = useCallback((audioBuffer: AudioBuffer) => {
    const now = Date.now();
    if (now - lastUpdateTime.current < UPDATE_THROTTLE_MS) return;
    if (!audioProcessor.current || !pitchDetector.current) return;

    const analysisResult = audioProcessor.current.processAudioBuffer(audioBuffer.data);
    if (!analysisResult || analysisResult.frequency <= 0) return;

    const pitchResult = pitchDetector.current.detectPitch(
      analysisResult.frequency,
      analysisResult.confidence,
    );

    if ((pitchResult.confidence ?? 1) < 0.3) return;

    lastUpdateTime.current = now;

    setTunerState({
      isListening: true,
      currentNote: pitchResult.note,
      frequency: pitchResult.frequency,
      cents: pitchResult.cents,
      isInTune: pitchResult.isInTune,
    });
  }, []);

  const startListening = useCallback(async () => {
    if (tunerState.isListening || !audioCapture.current) return;

    const started = await audioCapture.current.startCapture(processAudioBuffer);
    if (started) {
      setTunerState(prev => ({ ...prev, isListening: true }));
    }
  }, [tunerState.isListening, processAudioBuffer]);

  const stopListening = useCallback(async () => {
    if (!tunerState.isListening || !audioCapture.current) return;

    await audioCapture.current.stopCapture();
    pitchDetector.current?.clearHistory();

    setTunerState(INITIAL_STATE);
  }, [tunerState.isListening]);

  return {
    isListening: tunerState.isListening,
    currentNote: tunerState.currentNote,
    frequency: tunerState.frequency,
    cents: tunerState.cents,
    isInTune: tunerState.isInTune,
    startListening,
    stopListening,
  };
}
