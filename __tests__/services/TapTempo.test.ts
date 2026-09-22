import { computeTapTempoBpm } from '../../src/services/TapTempo';

describe('computeTapTempoBpm', () => {
  test('retorna null com menos de 2 toques', () => {
    expect(computeTapTempoBpm([])).toBeNull();
    expect(computeTapTempoBpm([1000])).toBeNull();
  });

  test('calcula BPM a partir de intervalos regulares (500ms = 120 BPM)', () => {
    const taps = [0, 500, 1000, 1500];
    expect(computeTapTempoBpm(taps)).toBe(120);
  });

  test('usa a média de intervalos irregulares', () => {
    const taps = [0, 480, 1000, 1520]; // intervalos: 480, 520, 520 -> média ~506.7ms -> ~118 BPM
    const bpm = computeTapTempoBpm(taps);
    expect(bpm).toBeGreaterThan(110);
    expect(bpm).toBeLessThan(125);
  });

  test('satura nos limites 40–220 BPM', () => {
    const slow = [0, 3000, 6000]; // 20 BPM antes do clamp
    expect(computeTapTempoBpm(slow)).toBe(40);

    const fast = [0, 100, 200]; // 600 BPM antes do clamp
    expect(computeTapTempoBpm(fast)).toBe(220);
  });
});
