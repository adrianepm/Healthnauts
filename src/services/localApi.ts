// "Computador de bordo" no navegador: o mesmo roteador e o mesmo núcleo de store de shared/
// que o Express usa. Nada de regra fica aqui; só a persistência em localStorage (sempre em try/catch).
import { createRouter } from '../../shared/router.js';
import { registerRoutes } from '../../shared/routes.js';
import { createStore, parseStored } from '../../shared/store-core.js';
import { STORAGE_KEY, ASTRONAUT_ID, DATASET, AREA } from '../config/api';
import { demoSeedStart, isolationFollowUp } from './demoSeed';

type Handle = (method: string, path: string, opts: { query?: Record<string, string>; body?: unknown }) => Promise<{ status: number; body: any }>;

function readSaved(): unknown {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function save(payload: unknown) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch { /* cota cheia ou modo privado: segue só em memória */ }
}

let ready: Promise<Handle> | null = null;

async function boot(): Promise<Handle> {
  // A demonstração nova é semeada a partir da meia-noite local de ontem (src/services/demoSeed.ts):
  // os 7 dias da faixa pessoal terminam anteontem e o check-in de ontem à noite já é comparado com ela.
  // O check-in de hoje continua pendente.
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const seedAt = demoSeedStart(today);
  const saved = readSaved();
  let initial; let fresh = !saved;
  try { initial = parseStored(saved as any, seedAt); } catch { initial = parseStored(null, seedAt); fresh = true; }
  const store = await createStore(initial, async (payload: unknown) => save(payload), seedAt);
  const router = createRouter();
  registerRoutes(router, store, () => new Date());
  const handle: Handle = (method, path, opts) => router.handle(method, path, opts as any);
  if (fresh) {
    for (const batch of isolationFollowUp(today)) {
      await handle('POST', `/api/v1/areas/${AREA.isolation}/records`,
        { body: { astronautId: ASTRONAUT_ID, records: batch.map((r) => ({ source: DATASET, ...r })) } });
    }
  }
  return handle;
}

export function localHandle(): Promise<Handle> {
  if (!ready) ready = boot();
  return ready;
}

/** Apaga os dados locais e recria a demonstração do zero. */
export function resetLocal() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignora */ }
  ready = null;
}
