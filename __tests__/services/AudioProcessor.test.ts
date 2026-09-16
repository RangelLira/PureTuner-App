import { AudioProcessor } from '../../src/services/AudioProcessor';

const SAMPLE_RATE = 22050;

function makeSine(freq: number, sampleRate: number, length: number, amplitude = 0.3): Float32Array {
  const buf = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    buf[i] = amplitude * Math.sin((2 * Math.PI * freq * i) / sampleRate);
  }
  return buf;
}

function feed(processor: AudioProcessor, signal: Float32Array, chunkSize = 1024) {
  const results: Array<{ frequency: number; volume: number; confidence: number }> = [];
  for (let offset = 0; offset + chunkSize <= signal.length; offset += chunkSize) {
    const result = processor.processAudioBuffer(signal.subarray(offset, offset + chunkSize));
    if (result) results.push(result);
  }
  return results;
}

function centsOff(detected: number, expected: number) {
  return 1200 * Math.log2(detected / expected);
}

describe('AudioProcessor — precisão de detecção (afinação de guitarra padrão)', () => {
  const GUITAR_STRINGS = [
    { note: 'E2', freq: 82.41 },
    { note: 'A2', freq: 110.0 },
    { note: 'D3', freq: 146.83 },
    { note: 'G3', freq: 196.0 },
    { note: 'B3', freq: 246.94 },
    { note: 'E4', freq: 329.63 },
  ];

  // Com tom puro e sem ruído, a precisão medida fica abaixo de ~2 cents
  // (E2 a E4). 10 cents dá margem sem deixar de barrar regressões reais —
  // este teste pegou dois bugs de verdade: aliasing do buffer acumulado
  // (view do subarray mutada pelo slide antes de ser lida) e confusão de
  // oitava/harmônico na busca de autocorrelação (bestPeriod travando em um
  // múltiplo do período real, sobretudo em notas mais agudas).
  test.each(GUITAR_STRINGS)('detecta $note ($freq Hz) dentro de 10 cents', ({ freq }) => {
    const processor = new AudioProcessor(SAMPLE_RATE);
    const signal = makeSine(freq, SAMPLE_RATE, SAMPLE_RATE * 1.5);
    const detections = feed(processor, signal).filter(r => r.frequency > 0);

    expect(detections.length).toBeGreaterThan(0);
    const last = detections[detections.length - 1];
    expect(Math.abs(centsOff(last.frequency, freq))).toBeLessThan(10);
  });
});

describe('AudioProcessor — silence gate com histerese', () => {
  test('sinal fraco (abaixo do soundThreshold) nunca destrava o gate', () => {
    const processor = new AudioProcessor(SAMPLE_RATE);
    // amplitude 0.003 -> RMS ~= 0.00212, entre 0 e o soundThreshold (0.003):
    // não deve nunca ser interpretado como som.
    const quiet = makeSine(150, SAMPLE_RATE, SAMPLE_RATE, 0.003);
    const detections = feed(processor, quiet);
    expect(detections.every(r => r.frequency === 0)).toBe(true);
  });

  test('uma vez destravado, continua detectando em volume intermediário (histerese) até cair abaixo do silenceThreshold', () => {
    const processor = new AudioProcessor(SAMPLE_RATE);
    const loud = makeSine(220, SAMPLE_RATE, SAMPLE_RATE, 0.3);
    const mid = makeSine(220, SAMPLE_RATE, SAMPLE_RATE, 0.0025); // RMS ~0.00177: entre silenceThreshold(0.0015) e soundThreshold(0.003)
    const silence = new Float32Array(SAMPLE_RATE);

    const loudDetections = feed(processor, loud).filter(r => r.frequency > 0);
    expect(loudDetections.length).toBeGreaterThan(0);

    const midDetections = feed(processor, mid).filter(r => r.frequency > 0);
    expect(midDetections.length).toBeGreaterThan(0);

    const silentDetections = feed(processor, silence);
    expect(silentDetections.some(r => r.frequency === 0)).toBe(true);
  });
});

describe('AudioProcessor — robustez do buffer acumulado', () => {
  test('resetBuffer() limpa o estado e o gate volta a exigir soundThreshold para destravar', () => {
    const processor = new AudioProcessor(SAMPLE_RATE);
    const loud = makeSine(220, SAMPLE_RATE, SAMPLE_RATE, 0.3);
    feed(processor, loud);

    processor.resetBuffer();

    const mid = makeSine(220, SAMPLE_RATE, SAMPLE_RATE, 0.0025); // fica preso no meio da histerese
    const detections = feed(processor, mid);
    expect(detections.every(r => r.frequency === 0)).toBe(true);
  });

  test('um chunk maior que o espaço livre do buffer não trava nem lança exceção', () => {
    const processor = new AudioProcessor(SAMPLE_RATE);
    const hugeChunk = makeSine(150, SAMPLE_RATE, 20000, 0.3); // bem maior que o buffer interno (8192)
    expect(() => processor.processAudioBuffer(hugeChunk)).not.toThrow();
  });

  test('preserva as amostras mais recentes quando um chunk excede o espaço livre', () => {
    const processor = new AudioProcessor(SAMPLE_RATE);
    // Um chunk enorme e silencioso seguido de um pedaço curto e alto deve
    // detectar o som mais recente, não descartá-lo por causa do excedente.
    const silentPrefix = new Float32Array(20000);
    processor.processAudioBuffer(silentPrefix);
    const loudTail = makeSine(220, SAMPLE_RATE, SAMPLE_RATE, 0.3);
    const detections = feed(processor, loudTail).filter(r => r.frequency > 0);
    expect(detections.length).toBeGreaterThan(0);
  });
});

describe('AudioProcessor — validação de frequência', () => {
  test('isValidMusicalFrequency respeita os limites configurados', () => {
    const processor = new AudioProcessor(SAMPLE_RATE, 60, 1200);
    expect(processor.isValidMusicalFrequency(59)).toBe(false);
    expect(processor.isValidMusicalFrequency(60)).toBe(true);
    expect(processor.isValidMusicalFrequency(1200)).toBe(true);
    expect(processor.isValidMusicalFrequency(1201)).toBe(false);
  });
});
