export interface AudioAnalysisResult {
  frequency: number;
  volume: number;
  confidence: number;
}

export class AudioProcessor {
  private sampleRate: number;
  private bufferSize: number;
  private minFrequency: number;
  private maxFrequency: number;

  constructor(
    sampleRate = 44100,
    bufferSize = 2048,
    minFrequency = 60,
    maxFrequency = 1200,
  ) {
    this.sampleRate = sampleRate;
    this.bufferSize = bufferSize;
    this.minFrequency = minFrequency;
    this.maxFrequency = maxFrequency;
  }

  public processAudioBuffer(audioData: Float32Array): AudioAnalysisResult | null {
    try {
      const volume = this.calculateRMS(audioData);
      if (volume < 0.01) return null;

      const { frequency, confidence } = this.detectPitchYIN(audioData);
      if (!this.isValidMusicalFrequency(frequency)) return null;

      return { frequency, volume, confidence };
    } catch {
      return null;
    }
  }

  // Algoritmo YIN — de Cheveigne & Kawahara 2002
  private detectPitchYIN(buffer: Float32Array): { frequency: number; confidence: number } {
    const bufferSize = Math.min(this.bufferSize, buffer.length);
    const yinBuffer = new Float32Array(bufferSize);

    let sum = 0;
    for (let tau = 1; tau < bufferSize; tau++) {
      let dfn = 0;
      for (let i = 0; i < bufferSize - tau; i++) {
        dfn += Math.pow(buffer[i] - buffer[i + tau], 2);
      }
      sum += dfn;
      yinBuffer[tau] = sum > 0 ? (dfn * tau) / sum : 0;
    }

    const threshold = 0.15;
    let tau = 2;

    while (tau < bufferSize) {
      if (yinBuffer[tau] < threshold) {
        while (tau + 1 < bufferSize && yinBuffer[tau + 1] < yinBuffer[tau]) {
          tau++;
        }
        const period = this.interpolateParabolic(yinBuffer, tau);
        return {
          frequency: this.sampleRate / period,
          confidence: 1 - yinBuffer[tau],
        };
      }
      tau++;
    }

    return { frequency: 0, confidence: 0 };
  }

  private interpolateParabolic(array: Float32Array, index: number): number {
    if (index <= 0 || index >= array.length - 1) return index;
    const y0 = array[index - 1];
    const y1 = array[index];
    const y2 = array[index + 1];
    const denominator = 2 * y1 - y0 - y2;
    if (denominator === 0) return index;
    return index + 0.5 * (y2 - y0) / denominator;
  }

  private calculateRMS(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  public isValidMusicalFrequency(frequency: number): boolean {
    return frequency >= this.minFrequency && frequency <= this.maxFrequency;
  }
}
