import { PitchDetector } from '../../src/services/PitchDetector';

describe('PitchDetector', () => {
  test('frequência zero ou negativa retorna resultado vazio, sem nota', () => {
    const pd = new PitchDetector();
    expect(pd.detectPitch(0)).toEqual({ note: '', frequency: 0, cents: 0, isInTune: false, confidence: 0 });
    expect(pd.detectPitch(-10)).toEqual({ note: '', frequency: 0, cents: 0, isInTune: false, confidence: 0 });
  });

  test('frequência exata de uma nota conhecida (A4 = 440Hz) dá 0 cents e afinado', () => {
    const pd = new PitchDetector(5);
    const result = pd.detectPitch(440);
    expect(result.note).toBe('A');
    expect(result.cents).toBe(0);
    expect(result.isInTune).toBe(true);
  });

  test('calcula cents corretamente para uma frequência levemente aguda', () => {
    const pd = new PitchDetector(5);
    // 1200*log2(442/440) ≈ 7.85 cents
    const result = pd.detectPitch(442);
    expect(result.note).toBe('A');
    expect(result.cents).toBe(8);
    expect(result.isInTune).toBe(false); // fora da tolerância de 5 cents
  });

  test('calcula cents negativos para uma frequência levemente grave', () => {
    const pd = new PitchDetector(5);
    const result = pd.detectPitch(438);
    expect(result.note).toBe('A');
    expect(result.cents).toBeLessThan(0);
  });

  test('respeita a tolerância de cents configurada no construtor', () => {
    const loose = new PitchDetector(20);
    const strict = new PitchDetector(2);
    const result1 = loose.detectPitch(442); // ~8 cents de diferença
    const result2 = strict.detectPitch(442);
    expect(result1.isInTune).toBe(true);
    expect(result2.isInTune).toBe(false);
  });

  test('encontra a nota mais próxima em qualquer oitava (afinação padrão de guitarra)', () => {
    const pd = new PitchDetector();
    const strings = [
      { freq: 82.41, note: 'E' },
      { freq: 110.0, note: 'A' },
      { freq: 146.83, note: 'D' },
      { freq: 196.0, note: 'G' },
      { freq: 246.94, note: 'B' },
      { freq: 329.63, note: 'E' },
    ];
    for (const { freq, note } of strings) {
      const result = pd.detectPitch(freq);
      expect(result.note).toBe(note);
      expect(Math.abs(result.cents)).toBeLessThanOrEqual(1);
    }
  });

  test('escolhe a nota mais próxima quando a frequência fica exatamente no meio entre duas notas', () => {
    const pd = new PitchDetector();
    // Meio geométrico entre A4 (440) e A#4 (466.16) — deve cair para o lado
    // de menor distância absoluta em Hz, não em cents.
    const midpoint = Math.sqrt(440 * 466.16);
    const result = pd.detectPitch(midpoint);
    expect(['A', 'A#']).toContain(result.note);
  });

  test('confidence é repassado sem alteração', () => {
    const pd = new PitchDetector();
    expect(pd.detectPitch(440, 0.72).confidence).toBe(0.72);
  });
});
