// Semente da demonstração do navegador (src/services/demoSeed.ts): estresse e PVT-B abrem avaliados.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRouter } from '../shared/router.js';
import { registerRoutes } from '../shared/routes.js';
import { createStore, parseStored } from '../shared/store-core.js';
import { demoSeedStart, isolationFollowUp } from '../src/services/demoSeed.ts';

const astronautId = 'astro_demo_001';

async function seededApi(today, clock) {
  const store = await createStore(parseStored(null, demoSeedStart(today)), async () => {}, demoSeedStart(today));
  const router = createRouter();
  registerRoutes(router, store, () => clock);
  await router.handle('POST', '/api/v1/demo/profile', { body: { astronautId } });
  for (const batch of isolationFollowUp(today)) {
    const r = await router.handle('POST', '/api/v1/areas/isolation_confinement/records', { body: { astronautId, records: batch.map((x) => ({ source: 'simulated', ...x })) } });
    assert.equal(r.status, 201, JSON.stringify(r.body));
  }
  return router;
}

test('demo: com a semente complementar, sono, estresse, humor e PVT-B abrem avaliados (não Unavailable)', async () => {
  // Meia-noite em Brasília (UTC-3) e em Tóquio (UTC+9): a janela da faixa pessoal é em dias UTC.
  for (const today of [new Date('2026-11-14T03:00:00Z'), new Date('2026-11-13T15:00:00Z')]) {
    for (const hours of [0.1, 12, 23.9]) {
      const router = await seededApi(today, new Date(today.getTime() + hours * 3600000));
      const { assessments } = (await router.handle('GET', '/api/v1/areas/isolation_confinement', { query: { astronautId, dataset: 'simulated' } })).body;
      for (const id of ['sleep_quality', 'stress', 'mood_score', 'pvt_response_speed', 'pvt_lapses', 'sleepiness_kss']) {
        const a = assessments.find((x) => x.indicator === id);
        assert.equal(a.displayLevel, 'normal', `${id} às ${hours} h: ${a.status}`);
      }
    }
  }
});
