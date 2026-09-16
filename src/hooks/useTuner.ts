import { useCallback, useEffect, useRef, useState } from 'react';
import KeepAwake from 'react-native-keep-awake';
import { TUNER_CONFIG } from '../constants/tunings';
import { AudioProcessor } from '../services/AudioProcessor';
import { PitchDetector } from '../services/PitchDetector';
import { AudioBuffer, RealAudioCapture } from '../services/RealAudioCapture';
import { TunerState } from '../types';

const SILENCE_CLEAR_DELAY_MS = 1000;

const INITIAL_STATE: TunerState = {
  isListening: false,
  currentNote: '',
  frequency: 0,
  cents: 0,
  isInTune: false,
};

export function useTuner() {
  const [tunerState, setTunerState] = useState<TunerState>(INITIAL_STATE);
  const [error, setError] = useState<string | null>(null);

  const audioCapture = useRef<RealAudioCapture | null>(null);
  const audioProcessor = useRef<AudioProcessor | null>(null);
  const pitchDetector = useRef<PitchDetector | null>(null);
  const isListeningRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    audioProcessor.current = new AudioProcessor(TUNER_CONFIG.sampleRate);
    pitchDetector.current = new PitchDetector(TUNER_CONFIG.centTolerance);
    audioCapture.current = new RealAudioCapture({
      sampleRate: TUNER_CONFIG.sampleRate,
      channels: 1,
    });

    return () => {
      clearSilenceTimer();
      try { KeepAwake.deactivate(); } catch {}
      audioCapture.current?.stopCapture();
    };
  }, []);

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const processAudioBuffer = useCallback((audioBuffer: AudioBuffer) => {
    if (!isListeningRef.current) return;
    if (!audioProcessor.current || !pitchDetector.current) return;

    const analysisResult = audioProcessor.current.processAudioBuffer(audioBuffer.data);
    if (!analysisResult) return;

    if (analysisResult.frequency <= 0) {
      // Aguarda 1 segundo antes de apagar — lida com decaimento natural das cordas
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          silenceTimerRef.current = null;
          setTunerState(prev => ({
            ...prev,
            currentNote: '',
            frequency: 0,
            cents: 0,
            isInTune: false,
          }));
        }, SILENCE_CLEAR_DELAY_MS);
      }
      return;
    }

    // Nota detectada — cancela timer de silêncio
    clearSilenceTimer();

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

    setError(null);

    const started = await audioCapture.current.startCapture(processAudioBuffer);
    if (!started) {
      setError('Não foi possível acessar o microfone. Verifique as permissões do app.');
      return;
    }

    isListeningRef.current = true;
    try { KeepAwake.activate(); } catch {}
    setTunerState(prev => ({ ...prev, isListening: true }));
  }, [processAudioBuffer]);

  const stopListening = useCallback(async () => {
    if (!isListeningRef.current || !audioCapture.current) return;

    isListeningRef.current = false;
    clearSilenceTimer();
    try { KeepAwake.deactivate(); } catch {}

    try {
      await audioCapture.current.stopCapture();
    } catch {
      // ignora erros ao parar captura
    }

    audioProcessor.current?.resetBuffer();
    setTunerState(INITIAL_STATE);
  }, []);

  return {
    isListening: tunerState.isListening,
    currentNote: tunerState.currentNote,
    frequency: tunerState.frequency,
    cents: tunerState.cents,
    isInTune: tunerState.isInTune,
    error,
    startListening,
    stopListening,
  };
}
