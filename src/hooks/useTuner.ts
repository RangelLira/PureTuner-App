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

export function useTuner() {
  const [tunerState, setTunerState] = useState<TunerState>(INITIAL_STATE);

  const audioCapture = useRef<RealAudioCapture | null>(null);
  const audioProcessor = useRef<AudioProcessor | null>(null);
  const pitchDetector = useRef<PitchDetector | null>(null);
  const isListeningRef = useRef(false);

  useEffect(() => {
    audioProcessor.current = new AudioProcessor(TUNER_CONFIG.sampleRate);
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
    if (!isListeningRef.current) return;
    if (!audioProcessor.current || !pitchDetector.current) return;

    const analysisResult = audioProcessor.current.processAudioBuffer(audioBuffer.data);
    if (!analysisResult) return;

    // Silêncio — limpa imediatamente
    if (analysisResult.frequency <= 0) {
      setTunerState(prev => ({
        ...prev,
        currentNote: '',
        frequency: 0,
        cents: 0,
        isInTune: false,
      }));
      return;
    }

    const pitchResult = pitchDetector.current.detectPitch(
      analysisResult.frequency,
      analysisResult.confidence,
    );

    setTunerState({
      isListening: true,
      currentNote: pitchResult.note,
      frequency: pitchResult.frequency,
      cents: pitchResult.cents,
      isInTune: pitchResult.isInTune,
    });
  }, []);

  const startListening = useCallback(async () => {
    if (isListeningRef.current || !audioCapture.current) return;

    const started = await audioCapture.current.startCapture(processAudioBuffer);
    if (started) {
      isListeningRef.current = true;
      setTunerState(prev => ({ ...prev, isListening: true }));
    }
  }, [processAudioBuffer]);

  const stopListening = useCallback(async () => {
    if (!isListeningRef.current || !audioCapture.current) return;

    isListeningRef.current = false;
    await audioCapture.current.stopCapture();
    audioProcessor.current?.resetBuffer();
    setTunerState(INITIAL_STATE);
  }, []);

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
