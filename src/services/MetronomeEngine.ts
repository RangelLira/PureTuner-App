export type BeatCallback = (
  beat: number,
  subBeat: number,
  isDownbeat: boolean,
) => void;

export class MetronomeEngine {
  private bpm = 120;
  private beatsPerMeasure = 4;
  private subdivisions = 1;
  private isRunning = false;
  private tickCount = 0;

  // Compassos compostos (6/8): a "colcheia" de base já é 1/3 da semínima
  // de referência (mesma equivalência de "modulação métrica" que faz um
  // 6/8 soar igual a um 2/4 em tercina contínua) — não 1/1 como em
  // 1/4-4/4. beatsPerMeasure continua 6 (as 6 bolinhas visuais, sem
  // agrupamento em 2 tempos pontuados) só a duração de cada clique muda.
  private compoundFactor = 1;
  private static readonly COMPOUND_SUBDIVISION_FACTOR = 3;

  // Phase reference: when BPM changes mid-run we start a new phase so the
  // absolute-time drift correction doesn't "catch up" from the old tempo.
  private phaseStartTime = 0;  // wall-clock time when this BPM phase began
  private phaseStartTick = 0;  // tickCount at the start of this phase

  // When the most-recent tick actually fired (needed for smooth BPM transitions)
  private lastTickTime = 0;

  private timerRef: ReturnType<typeof setTimeout> | null = null;
  private onTick: BeatCallback | null = null;

  start(onTick: BeatCallback): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.tickCount = 0;
    this.lastTickTime = 0;
    this.phaseStartTime = Date.now();
    this.phaseStartTick = 0;
    this.onTick = onTick;
    this.scheduleNext();
  }

  stop(): void {
    this.isRunning = false;
    if (this.timerRef) {
      clearTimeout(this.timerRef);
      this.timerRef = null;
    }
    this.onTick = null;
  }

  setBpm(bpm: number): void {
    const newBpm = Math.max(40, Math.min(220, bpm));
    if (newBpm === this.bpm) return;
    this.bpm = newBpm;

    if (!this.isRunning || this.timerRef === null) return;

    // ── Smooth BPM transition ──────────────────────────────────────────────
    // Without re-anchoring: oldStartTime + tickCount * newInterval drifts far
    // from reality → the engine fires many ticks immediately to "catch up".
    //
    // Fix: start a new phase so the next tick fires exactly newInterval after
    // the last tick that actually played, then drift-correct from there.
    clearTimeout(this.timerRef);
    this.timerRef = null;

    const newInterval = this.tickIntervalMs();
    const lastFired   = this.lastTickTime > 0 ? this.lastTickTime : this.phaseStartTime;

    this.phaseStartTime = lastFired + newInterval; // next tick target
    this.phaseStartTick = this.tickCount;           // anchor tickCount here
    this.scheduleNext();
  }

  setTimeSignature(beats: number): void {
    this.beatsPerMeasure = beats;
  }

  setSubdivisions(n: number): void {
    this.subdivisions = Math.max(1, Math.min(4, n));
  }

  setCompound(isCompound: boolean): void {
    this.compoundFactor = isCompound ? MetronomeEngine.COMPOUND_SUBDIVISION_FACTOR : 1;
  }

  private tickIntervalMs(): number {
    return 60000 / this.bpm / this.subdivisions / this.compoundFactor;
  }

  private scheduleNext(): void {
    const tickIntervalMs  = this.tickIntervalMs();
    const ticksIntoPhase  = this.tickCount - this.phaseStartTick;
    let expectedTime      = this.phaseStartTime + ticksIntoPhase * tickIntervalMs;

    // Se o app ficou tempo suficiente em segundo plano pra JS thread parar de
    // rodar (Doze/App Standby), o setTimeout pendente só dispara ao voltar —
    // mas expectedTime continua calculado a partir da fase antiga, agora
    // muito no passado. Sem isso, cada scheduleNext() re-agendaria com delay
    // 0 até "alcançar" o tempo real: uma rajada de milhares de tiques em
    // sequência (a "metralhadora"). Re-ancora a fase pro agora em vez de
    // tentar recuperar os tiques perdidos.
    const now = Date.now();
    if (now - expectedTime > tickIntervalMs * 2) {
      this.phaseStartTime = now;
      this.phaseStartTick = this.tickCount;
      expectedTime = now;
    }

    const delay = Math.max(0, expectedTime - now);

    this.timerRef = setTimeout(() => {
      if (!this.isRunning) return;

      this.lastTickTime = Date.now();

      const subs    = this.subdivisions;
      const total   = this.tickCount;
      const beat    = (Math.floor(total / subs) % this.beatsPerMeasure) + 1;
      const subBeat = (total % subs) + 1;

      try {
        this.onTick?.(beat, subBeat, beat === 1 && subBeat === 1);
      } catch {
        // prevent engine crash if callback throws
      }

      this.tickCount++;
      this.scheduleNext();
    }, delay);
  }
}
