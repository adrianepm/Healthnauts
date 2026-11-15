// Sensor simulado ao vivo: posta leituras de cabine e sinais vitais na API local.
// Sem ele tudo vira Unavailable (validade 2.4: vitais 10 min, cabine 5 min). Começa ligado ao abrir o site.
import { api } from '../services/api';
import { AREA } from '../config/api';
import { atmosphereReading, climateRecords, noiseReading, vitalsReading, type CabinMode, type VitalsMode } from './payloads';

export const TICK_MS = 2 * 60000; // dentro da validade de 5 min da cabine e do intervalo máximo de 10 min do CO2
const BACKFILL_STEP_MS = 10 * 60000; // o CO2 de 1 h precisa de uma hora coberta, com intervalos de até 10 min
const SIM_KEY = 'healthnauts:sim';

export interface SimState { on: boolean; cabin: CabinMode; vitals: VitalsMode; lastCabinAt: number | null; lastVitals: ReturnType<typeof vitalsReading> | null }

function load(): SimState {
  const base: SimState = { on: true, cabin: 'nominal', vitals: 'nominal', lastCabinAt: null, lastVitals: null };
  try { const s = JSON.parse(localStorage.getItem(SIM_KEY) || 'null'); return s ? { ...base, ...s, on: true } : base; } catch { return base; }
}
let state = load();
const listeners = new Set<(s: SimState) => void>();
let timer: ReturnType<typeof setInterval> | null = null;
let busy: Promise<void> = Promise.resolve();

function set(patch: Partial<SimState>) {
  state = { ...state, ...patch };
  try { localStorage.setItem(SIM_KEY, JSON.stringify(state)); } catch { /* ignora */ }
  listeners.forEach((l) => l(state));
}

async function postCabin(at: Date) {
  await api.operation(AREA.cabin, 'atmosphere', atmosphereReading(state.cabin, at));
}

/** Uma rodada de leituras. `onData` é chamado depois para a tela atualizar. */
async function tick(onData: () => void) {
  const now = new Date();
  try {
    if (state.cabin !== 'offline') {
      // Se a cabine ficou sem leitura por mais de 10 min, cobre a última hora antes de seguir.
      if (!state.lastCabinAt || now.getTime() - state.lastCabinAt > BACKFILL_STEP_MS) {
        for (let i = 6; i >= 1; i--) await postCabin(new Date(now.getTime() - i * BACKFILL_STEP_MS));
      }
      await postCabin(now);
      await api.records(AREA.cabin, climateRecords(now));
      await api.operation(AREA.cabin, 'noise', noiseReading(now, TICK_MS));
      set({ lastCabinAt: now.getTime() });
    }
    const vitals = vitalsReading(state.vitals, now);
    await api.operation(AREA.gravity, 'vitals', vitals);
    set({ lastVitals: vitals });
  } catch (error) {
    console.warn('Simulated sensor reading rejected', error);
  }
  onData();
}

export const sim = {
  get: () => state,
  subscribe(l: (s: SimState) => void) { listeners.add(l); return () => { listeners.delete(l); }; },
  start(onData: () => void) {
    if (timer) return;
    set({ on: true });
    const run = () => { busy = busy.then(() => tick(onData)); return busy; };
    timer = setInterval(run, TICK_MS);
    return run();
  },
  stop() { if (timer) clearInterval(timer); timer = null; set({ on: false }); },
  /** Muda o modo e posta uma leitura na hora, para a tela reagir sem esperar o próximo ciclo. */
  async setMode(patch: Partial<Pick<SimState, 'cabin' | 'vitals'>>, onData: () => void) {
    set(patch);
    if (timer) { busy = busy.then(() => tick(onData)); await busy; }
  },
  /** Depois do "Reset demo": esquece o estado do sensor (o store foi recriado). */
  reset() { set({ cabin: 'nominal', vitals: 'nominal', lastCabinAt: null, lastVitals: null }); },
};
