import { NativeEventEmitter, NativeModules, PermissionsAndroid, Platform } from 'react-native';
import AudioRecord from 'react-native-audio-record';

// Hermes (motor JS do RN) não expõe atob/btoa globalmente — decodificador
// manual em vez de depender de um polyfill.
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_LOOKUP: Record<string, number> = {};
for (let i = 0; i < BASE64_CHARS.length; i++) BASE64_LOOKUP[BASE64_CHARS[i]] = i;

/* eslint-disable no-bitwise -- manipulação de bits inerente à decodificação base64 */
function decodeBase64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/[=\s]+$/, '');
  const bytes = new Uint8Array(Math.floor((clean.length * 6) / 8));
  let bitBuffer = 0;
  let bitCount = 0;
  let byteIndex = 0;
  for (let i = 0; i < clean.length; i++) {
    const value = BASE64_LOOKUP[clean[i]];
    if (value === undefined) continue;
    bitBuffer = (bitBuffer << 6) | value;
    bitCount += 6;
    if (bitCount >= 8) {
      bitCount -= 8;
      bytes[byteIndex++] = (bitBuffer >> bitCount) & 0xff;
    }
  }
  return bytes;
}
/* eslint-enable no-bitwise */

export interface AudioBuffer {
  data: Float32Array;
  sampleRate: number;
  timestamp: number;
}

export interface AudioCaptureConfig {
  sampleRate: number;
  channels: number;
}

export class RealAudioCapture {
  private config: AudioCaptureConfig;
  private isCapturing = false;
  private onAudioData: ((buffer: AudioBuffer) => void) | null = null;
  private subscription: ReturnType<NativeEventEmitter['addListener']> | null = null;

  constructor(config: AudioCaptureConfig) {
    this.config = config;
  }

  public async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Permissão de Microfone',
          message: 'O Pure Tuner precisa do microfone para detectar as notas do seu instrumento.',
          buttonPositive: 'Permitir',
          buttonNegative: 'Cancelar',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }

  public async startCapture(onAudioData: (buffer: AudioBuffer) => void): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) return false;

      this.onAudioData = onAudioData;

      AudioRecord.init({
        sampleRate: this.config.sampleRate,
        channels: this.config.channels,
        bitsPerSample: 16,
        audioSource: 1, // MIC padrão sem processamento de voz
        wavFile: 'tuner_temp.wav',
      });

      const emitter = new NativeEventEmitter(NativeModules.AudioRecord);
      this.subscription = emitter.addListener('data', (data: string) => {
        if (!this.isCapturing || !this.onAudioData) return;
        const audioBuffer = this.decodeBase64PCM(data);
        if (audioBuffer) {
          this.onAudioData(audioBuffer);
        }
      });

      this.isCapturing = true;
      await AudioRecord.start();
      return true;
    } catch {
      this.isCapturing = false;
      return false;
    }
  }

  public async stopCapture(): Promise<void> {
    this.isCapturing = false;
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    try {
      await AudioRecord.stop();
    } catch {
      // ignora erros ao parar
    }
    this.onAudioData = null;
  }

  public get capturing(): boolean {
    return this.isCapturing;
  }

  private decodeBase64PCM(base64: string): AudioBuffer | null {
    try {
      const bytes = decodeBase64ToBytes(base64);
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      return {
        data: float32,
        sampleRate: this.config.sampleRate,
        timestamp: Date.now(),
      };
    } catch {
      return null;
    }
  }
}
