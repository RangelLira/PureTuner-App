// Se o usuário parar de tocar por mais que isso, a próxima batida começa
// uma sequência nova em vez de entrar na média da anterior.
export const TAP_TEMPO_IDLE_RESET_MS = 2000;

// Só as últimas N batidas entram na média — evita que uma sequência muito
// longa deixe o tap lento pra reagir a uma mudança de tempo.
export const TAP_TEMPO_MAX_SAMPLES = 8;

const MIN_BPM = 40;
const MAX_BPM = 220;

// Calcula o BPM a partir de uma sequência de timestamps de toques (ms, em
// ordem cronológica), pela média dos intervalos entre toques consecutivos.
// Precisa de pelo menos 2 toques; satura no mesmo intervalo 40–220 que o
// MetronomeEngine já aplica.
export function computeTapTempoBpm(tapTimestamps: number[]): number | null {
  if (tapTimestamps.length < 2) return null;

  const intervals: number[] = [];
  for (let i = 1; i < tapTimestamps.length; i++) {
    intervals.push(tapTimestamps[i] - tapTimestamps[i - 1]);
  }

  const avgInterval = intervals.reduce((sum, v) => sum + v, 0) / intervals.length;
  if (avgInterval <= 0) return null;

  const bpm = Math.round(60000 / avgInterval);
  return Math.max(MIN_BPM, Math.min(MAX_BPM, bpm));
}
