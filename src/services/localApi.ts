// "Computador de bordo" no navegador: o mesmo roteador e o mesmo núcleo de store de shared/
// que o Express usa. Nada de regra fica aqui; só a persistência em localStorage (sempre em try/catch).
import { createRouter } from '../../shared/router.js';
import { registerRoutes } from '../../shared/routes.js';
import { createStore, parseStored } from '../../shared/store-core.js';
import { STORAGE_KEY } from '../config/api';

type Handle = (method: string, path: string, opts: { query?: Record<string, string>; body?: unknown }) => Promise<{ status: number; body: any }>;

function readSaved(): unknown {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function save(payload: unknown) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch { /* cota cheia ou modo privado: segue só em memória */ }
}

let ready: Promise<Handle> | null = null;

async function boot(): Promise<Handle> {
  // A demonstração nova é semeada à meia-noite local: os 7 dias de exemplo terminam ontem,
  // então o check-in de hoje fica pendente e o que o astronauta registrar hoje é o dado mais recente.
  const seedAt = new Date(); seedAt.setHours(0, 0, 0, 0);
  let initial;
  try { initial = parseStored(readSaved() as any, seedAt); } catch { initial = parseStored(null, seedAt); }
  const store = await createStore(initial, async (payload: unknown) => save(payload), seedAt);
  const router = createRouter();
  registerRoutes(router, store, () => new Date());
  return (method, path, opts) => router.handle(method, path, opts);
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
