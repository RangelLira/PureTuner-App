import { MetronomeEngine } from '../../src/services/MetronomeEngine';

// O motor dispara o primeiro tick imediatamente ao chamar start() (delay 0 —
// o metrônomo marca o tempo 1 assim que o usuário aperta "Iniciar", sem
// esperar um intervalo inteiro). Cada teste consome esse tick imediato com
// um advanceTimersByTime(0) isolado, e só então mede os intervalos
// subsequentes um a um.
function flushImmediateTick() {
  jest.advanceTimersByTime(0);
}

describe('MetronomeEngine', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('dispara o primeiro tick imediatamente e os seguintes no intervalo do BPM (120 BPM = 500ms)', () => {
    const engine = new MetronomeEngine();
    const onTick = jest.fn();
    engine.setBpm(120);
    engine.start(onTick);

    expect(onTick).not.toHaveBeenCalled();
    flushImmediateTick();
    expect(onTick).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(500);
    expect(onTick).toHaveBeenCalledTimes(2);
    jest.advanceTimersByTime(500);
    expect(onTick).toHaveBeenCalledTimes(3);

    engine.stop();
  });

  test('marca o primeiro tempo de cada compasso como downbeat (200 BPM = 300ms)', () => {
    const engine = new MetronomeEngine();
    const calls: Array<[number, number, boolean]> = [];
    engine.setBpm(200);
    engine.setTimeSignature(4);
    engine.start((beat, subBeat, isDownbeat) => calls.push([beat, subBeat, isDownbeat]));
    flushImmediateTick();

    for (let i = 0; i < 7; i++) jest.advanceTimersByTime(300);
    engine.stop();

    expect(calls).toHaveLength(8); // 2 compassos completos de 4 tempos
    expect(calls[0]).toEqual([1, 1, true]);
    expect(calls[1]).toEqual([2, 1, false]);
    expect(calls[2]).toEqual([3, 1, false]);
    expect(calls[3]).toEqual([4, 1, false]);
    expect(calls[4]).toEqual([1, 1, true]); // início do 2º compasso
  });

  test('respeita um compasso 3/4', () => {
    const engine = new MetronomeEngine();
    const beats: number[] = [];
    engine.setBpm(200);
    engine.setTimeSignature(3);
    engine.start(beat => beats.push(beat));
    flushImmediateTick();

    for (let i = 0; i < 5; i++) jest.advanceTimersByTime(300);
    engine.stop();

    expect(beats).toEqual([1, 2, 3, 1, 2, 3]);
  });

  test('subdivisões ciclam o subBeat de 1 até n dentro de cada tempo', () => {
    const engine = new MetronomeEngine();
    const subBeats: number[] = [];
    engine.setBpm(120); // 500ms/tempo -> subdivisão 2 = 250ms/subtick
    engine.setSubdivisions(2);
    engine.start((_beat, subBeat) => subBeats.push(subBeat));
    flushImmediateTick();

    for (let i = 0; i < 3; i++) jest.advanceTimersByTime(250);
    engine.stop();

    expect(subBeats).toEqual([1, 2, 1, 2]);
  });

  test('setSubdivisions satura em [1, 4]', () => {
    const engine = new MetronomeEngine();
    engine.setBpm(200);
    engine.setSubdivisions(10); // deve virar 4
    let maxSubBeat = 0;
    engine.start((_beat, subBeat) => { maxSubBeat = Math.max(maxSubBeat, subBeat); });
    flushImmediateTick();

    const subInterval = 60000 / 200 / 4;
    for (let i = 0; i < 4; i++) jest.advanceTimersByTime(subInterval);
    engine.stop();

    expect(maxSubBeat).toBe(4);
  });

  test('setBpm satura o máximo em 220', () => {
    const engine = new MetronomeEngine();
    const onTick = jest.fn();
    engine.setBpm(1000); // deve virar 220
    engine.start(onTick);
    flushImmediateTick();
    expect(onTick).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(60000 / 220);
    expect(onTick).toHaveBeenCalledTimes(2);

    engine.stop();
  });

  test('setBpm satura o mínimo em 40', () => {
    const engine = new MetronomeEngine();
    const onTick = jest.fn();
    engine.setBpm(1); // deve virar 40
    engine.start(onTick);
    flushImmediateTick();

    jest.advanceTimersByTime(60000 / 40 - 1);
    expect(onTick).toHaveBeenCalledTimes(1); // ainda não chegou lá
    jest.advanceTimersByTime(1);
    expect(onTick).toHaveBeenCalledTimes(2);

    engine.stop();
  });

  test('stop() cancela o timer — nenhum tick dispara depois disso', () => {
    const engine = new MetronomeEngine();
    const onTick = jest.fn();
    engine.setBpm(200);
    engine.start(onTick);
    flushImmediateTick();
    expect(onTick).toHaveBeenCalledTimes(1);

    engine.stop();
    jest.advanceTimersByTime(1000);
    expect(onTick).toHaveBeenCalledTimes(1); // não avançou mais
  });

  test('start() é idempotente — chamar de novo enquanto já roda não reinicia o timer', () => {
    const engine = new MetronomeEngine();
    const onTick = jest.fn();
    const other = jest.fn();
    engine.setBpm(200);
    engine.start(onTick);
    engine.start(other); // segunda chamada deve ser ignorada

    flushImmediateTick();
    jest.advanceTimersByTime(300);
    expect(onTick).toHaveBeenCalled();
    expect(other).not.toHaveBeenCalled();

    engine.stop();
  });

  test('mudar o BPM em execução re-ancora a fase sem disparar ticks de "catch-up"', () => {
    const engine = new MetronomeEngine();
    const onTick = jest.fn();
    engine.setBpm(120); // 500ms/tick
    engine.start(onTick);
    flushImmediateTick();
    expect(onTick).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(500);
    expect(onTick).toHaveBeenCalledTimes(2);

    engine.setBpm(60); // 1000ms/tick a partir de agora
    jest.advanceTimersByTime(999);
    expect(onTick).toHaveBeenCalledTimes(2); // ainda não passou 1000ms desde o último tick
    jest.advanceTimersByTime(2);
    expect(onTick).toHaveBeenCalledTimes(3); // exatamente um tick, sem rajada de catch-up

    engine.stop();
  });

  test('mudar o compasso, a subdivisão ou o BPM não lança erro num motor já parado', () => {
    const engine = new MetronomeEngine();
    expect(() => {
      engine.setTimeSignature(3);
      engine.setSubdivisions(2);
      engine.setBpm(90);
    }).not.toThrow();
  });
});
