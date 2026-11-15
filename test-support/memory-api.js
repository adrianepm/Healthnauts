// API completa em memória: mesmo roteador e mesmo núcleo de store que o navegador usa no modo local.
import { createRouter } from '../shared/router.js';
import { registerRoutes } from '../shared/routes.js';
import { createStore, parseStored } from '../shared/store-core.js';

export async function memoryApi(start = '2026-11-14T15:00:00Z') {
  let clock = new Date(start), writes = 0;
  const store = await createStore(parseStored(null, clock), async () => { writes++; }, clock);
  const router = createRouter();
  registerRoutes(router, store, () => clock);
  const astronautId = 'astro_demo_001';
  return {
    store, astronautId, now: () => clock, writes: () => writes,
    advance(ms) { clock = new Date(clock.getTime() + ms); return clock; },
    get: (path, query = {}) => router.handle('GET', '/api/v1' + path, { query: { astronautId, dataset: 'simulated', ...query } }),
    post: (path, body) => router.handle('POST', '/api/v1' + path, { body }),
    scenario(id, extra = {}) { return this.post('/scenarios/' + id, { astronautId, id: 'run-' + id, ...extra }); },
  };
}
