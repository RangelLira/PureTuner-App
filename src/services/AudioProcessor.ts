export interface AudioAnalysisResult {
  frequency: number;
  volume: number;
  confidence: number;
}

export class AudioProcessor {
  private sampleRate: number;
  private minFrequency: number;
  private maxFrequency: number;
  private accumulatedBuffer: Float32Array;
  private accumulatedSize: number;
  private readonly targetBufferSize = 1024;
  private readonly downsampleFactor = 4;

  // Silence gate com histerese
  private isSilent = true;
  private readonly silenceThreshold = 0.0015;
  private readonly soundThreshold = 0.003;

  constructor(sampleRate = 22050, minFrequency = 60, maxFrequency = 1200) {
    this.sampleRate = sampleRate;
    this.minFrequency = minFrequency;
    this.maxFrequency = maxFrequency;
    this.accumulatedBuffer = new Float32Array(this.targetBufferSize * 4);
    this.accumulatedSize = 0;
  }

  public processAudioBuffer(audioData: Float32Array): AudioAnalysisResult | null {
    const available = this.accumulatedBuffer.length - this.accumulatedSize;
    const toCopy = Math.min(audioData.length, available);
    this.accumulatedBuffer.set(audioData.subarray(0, toCopy), this.accumulatedSize);
    this.accumulatedSize += toCopy;

    if (this.accumulatedSize < this.targetBufferSize) return null;

    const buffer = this.accumulatedBuffer.subarray(0, this.targetBufferSize);
    const volume = this.calculateRMS(buffer);

    // Slide de metade — mais atualizações por segundo
    const slide = Math.floor(this.targetBufferSize / 2);
    this.accumulatedBuffer.copyWithin(0, slide, this.accumulatedSize);
    this.accumulatedSize -= slide;

    // Silence gate com histerese — evita piscar entre nota e silêncio
    if (this.isSilent) {
      if (volume < this.soundThreshold) {
        return { frequency: 0, volume, confidence: 0 };
      }
      this.isSilent = false;
    } else {
      if (volume < this.silenceThreshold) {
        this.isSilent = true;
        return { frequency: 0, volume, confidence: 0 };
      }
    }

    const downsampled = this.downsample(buffer, this.downsampleFactor);
    const downsampledRate = this.sampleRate / this.downsampleFactor;

    return this.detectPitchAutocorrelation(downsampled, downsampledRate, volume);
  }

  public resetBuffer(): void {
    this.accumulatedSize = 0;
    this.isSilent = true;
  }

  private downsample(buffer: Float32Array, factor: number): Float32Array {
    const outLen = Math.floor(buffer.length / factor);
    const out = new Float32Array(outLen);
    for (let i = 0; i < outLen; i++) {
      let sum = 0;
      for (let j = 0; j < factor; j++) {
        sum += buffer[i * factor + j];
      }
      out[i] = sum / factor;
    }
    return out;
  }

  private detectPitchAutocorrelation(
    buffer: Float32Array,
    sampleRate: number,
    volume: number,
  ): AudioAnalysisResult | null {
    const minPeriod = Math.floor(sampleRate / this.maxFrequency);
    const maxPeriod = Math.floor(sampleRate / this.minFrequency);
    const n = buffer.length;

    let bestPeriod = -1;
    let bestCorr = -Infinity;

    for (let period = minPeriod; period <= maxPeriod; period++) {
      let corr = 0;
      for (let i = 0; i < n - period; i++) {
        corr += buffer[i] * buffer[i + period];
      }
      corr = corr / (n - period);
      if (corr > bestCorr) {
        bestCorr = corr;
        bestPeriod = period;
      }
    }

    if (bestPeriod <= 0) return null;

    const rmsSquared = volume * volume;
    const confidence = rmsSquared > 0 ? Math.min(bestCorr / rmsSquared, 1.0) : 0;
    if (confidence < 0.35) return null;

    // Correção de oitava: verifica se metade do período tem correlação boa
    // Se sim, a nota real está uma oitava acima
    const halfPeriod = Math.floor(bestPeriod / 2);
    if (halfPeriod >= minPeriod) {
      const halfCorr = this.autocorrAt(buffer, halfPeriod, n);
      if (halfCorr > bestCorr * 0.85) {
        bestPeriod = halfPeriod;
        bestCorr = halfCorr;
      }
    }

    // Refinamento parabólico
    let refinedPeriod = bestPeriod;
    if (bestPeriod > minPeriod && bestPeriod < maxPeriod) {
      const c0 = this.autocorrAt(buffer, bestPeriod - 1, n);
      const c1 = bestCorr;
      const c2 = this.autocorrAt(buffer, bestPeriod + 1, n);
      const denom = 2 * c1 - c0 - c2;
      if (denom > 0) {
        refinedPeriod = bestPeriod + 0.5 * (c2 - c0) / denom;
      }
    }

    const frequency = sampleRate / refinedPeriod;
    if (!this.isValidMusicalFrequency(frequency)) return null;

    return { frequency, volume, confidence };
  }

  private autocorrAt(buffer: Float32Array, period: number, n: number): number {
    let corr = 0;
    for (let i = 0; i < n - period; i++) {
      corr += buffer[i] * buffer[i + period];
    }
    return corr / (n - period);
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
