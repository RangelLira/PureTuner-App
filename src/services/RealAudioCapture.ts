import { PermissionsAndroid, Platform } from 'react-native';

export interface AudioBuffer {
  data: Float32Array;
  sampleRate: number;
  timestamp: number;
}

export interface AudioCaptureConfig {
  sampleRate: number;
  bufferSize: number;
  channels: number;
}

// Stub temporário - biblioteca de áudio será integrada em etapa posterior
export class RealAudioCapture {
  private config: AudioCaptureConfig;
  private isCapturing = false;
  private onAudioData: ((buffer: AudioBuffer) => void) | null = null;

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
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return false;

    this.onAudioData = onAudioData;
    this.isCapturing = true;
    return true;
  }

  public async stopCapture(): Promise<void> {
    this.isCapturing = false;
    this.onAudioData = null;
  }

  public get capturing(): boolean {
    return this.isCapturing;
  }
}
