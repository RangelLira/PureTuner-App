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
  // 2048 (não 1024): com 1024 o Mi grave (82.41 Hz) cabia menos de 4 ciclos
  // completos na janela pós-downsample, deixando o pico de autocorrelação
  // pouco definido e a nota "afinada" com erro real de dezenas de cents.
  private readonly targetBufferSize = 2048;
  private readonly downsampleFactor = 4;

  // Buffer pré-alocado — evita new Float32Array() a cada frame (~22×/seg)
  private readonly downsampleBuffer: Float32Array;

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
    this.downsampleBuffer = new Float32Array(
      Math.ceil(this.targetBufferSize / this.downsampleFactor),
    );
  }

  public processAudioBuffer(audioData: Float32Array): AudioAnalysisResult | null {
    // Se o chunk recebido não couber no espaço livre, abre espaço descartando
    // as amostras mais antigas (não as novas) — nunca deve perder o sinal
    // mais recente por causa de jitter no agendamento do módulo nativo.
    const available = this.accumulatedBuffer.length - this.accumulatedSize;
    if (audioData.length > available) {
      const shift = Math.min(this.accumulatedSize, audioData.length - available);
      this.accumulatedBuffer.copyWithin(0, shift, this.accumulatedSize);
      this.accumulatedSize -= shift;
    }
    const toCopy = Math.min(audioData.length, this.accumulatedBuffer.length - this.accumulatedSize);
    this.accumulatedBuffer.set(audioData.subarray(audioData.length - toCopy), this.accumulatedSize);
    this.accumulatedSize += toCopy;

    if (this.accumulatedSize < this.targetBufferSize) return null;

    // `buffer` é uma VIEW sobre accumulatedBuffer (subarray não copia). Por
    // isso o slide abaixo — que muta accumulatedBuffer via copyWithin — só
    // pode rodar depois que RMS e downsample já leram `buffer`; do
    // contrário a autocorrelação processa memória parcialmente sobrescrita
    // (a primeira metade da janela duplicada por cima da segunda), gerando
    // erro sistemático de dezenas de cents nas notas mais graves.
    const buffer = this.accumulatedBuffer.subarray(0, this.targetBufferSize);
    const volume = this.calculateRMS(buffer);

    // Silence gate com histerese — evita piscar entre nota e silêncio
    let result: AudioAnalysisResult | null;
    if (this.isSilent) {
      if (volume < this.soundThreshold) {
        result = { frequency: 0, volume, confidence: 0 };
      } else {
        this.isSilent = false;
        result = this.detectPitch(buffer, volume);
      }
    } else if (volume < this.silenceThreshold) {
      this.isSilent = true;
      result = { frequency: 0, volume, confidence: 0 };
    } else {
      result = this.detectPitch(buffer, volume);
    }

    // Slide de metade — mais atualizações por segundo
    const slide = Math.floor(this.targetBufferSize / 2);
    this.accumulatedBuffer.copyWithin(0, slide, this.accumulatedSize);
    this.accumulatedSize -= slide;

    return result;
  }

  private detectPitch(buffer: Float32Array, volume: number): AudioAnalysisResult | null {
    const downsampledLen = this.downsampleInto(buffer, this.downsampleFactor);
    const downsampledView = this.downsampleBuffer.subarray(0, downsampledLen);
    const downsampledRate = this.sampleRate / this.downsampleFactor;

    return this.detectPitchAutocorrelation(downsampledView, downsampledRate, volume);
  }

  public resetBuffer(): void {
    this.accumulatedSize = 0;
    this.isSilent = true;
  }

  private downsampleInto(buffer: Float32Array, factor: number): number {
    const outLen = Math.floor(buffer.length / factor);
    for (let i = 0; i < outLen; i++) {
      let sum = 0;
      for (let j = 0; j < factor; j++) {
        sum += buffer[i * factor + j];
      }
      this.downsampleBuffer[i] = sum / factor;
    }
    return outLen;
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
      const corr = this.autocorrAt(buffer, period, n);
      if (corr > bestCorr) {
        bestCorr = corr;
        bestPeriod = period;
      }
    }

    if (bestPeriod <= 0) return null;

    const rmsSquared = volume * volume;
    const confidence = rmsSquared > 0 ? Math.min(bestCorr / rmsSquared, 1.0) : 0;
    if (confidence < 0.35) return null;

    // Correção de período: a autocorrelação de um tom periódico tem picos
    // em cada múltiplo inteiro do período real, não só no fundamental — a
    // busca exaustiva acima pode ter escolhido um múltiplo maior (comum em
    // notas agudas, onde vários múltiplos cabem dentro do intervalo de
    // busca; ex.: travar no 3º harmônico, o que uma correção fixa de "só
    // divide por 2" não resolve). Testa submúltiplos específicos
    // (bestPeriod/2, /3, /4) e adota o menor cuja correlação já seja quase
    // tão boa quanto o máximo global — sem varrer a partir do período
    // mínimo, pois lags muito curtos têm correlação alta só por inércia do
    // sinal (amostras vizinhas de um tom grave mudam pouco entre si), o que
    // geraria falsos positivos nas cordas mais graves.
    for (let divisor = 4; divisor >= 2; divisor--) {
      const candidate = Math.round(bestPeriod / divisor);
      if (candidate < minPeriod) continue;
      const candidateCorr = this.autocorrAt(buffer, candidate, n);
      if (candidateCorr > bestCorr * 0.85) {
        bestPeriod = candidate;
        bestCorr = candidateCorr;
        break;
      }
    }

    // Refinamento parabólico para precisão sub-sample
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
    const len = n - period;
    if (len <= 0) return 0;
    let corr = 0;
    for (let i = 0; i < len; i++) {
      corr += buffer[i] * buffer[i + period];
    }
    return corr / len;
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
