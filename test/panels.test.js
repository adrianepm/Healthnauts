// My panels (src/lib/panels.ts) e comparação com 7 dias (src/lib/compare.ts): funções puras da Overview.
import test from 'node:test';
import assert from 'node:assert/strict';
import { COVERED_BY, DEFAULT_PANELS, MAX_PANELS, PANELS_KEY, clearPanels, loadPanels, normalizePanels, panelId, savePanels, sortPanels, togglePanel } from '../src/lib/panels.ts';
import { weekCompare } from '../src/lib/compare.ts';
import { catalog } from '../shared/config/catalog.js';
import { memoryApi } from '../test-support/memory-api.js';

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };

test('painéis: padrão com 6, um por área (sinais vitais à parte), sem repetir, todos no catálogo ou nas avaliações da API', async () => {
  const api = await memoryApi();
  await api.post('/demo/profile', { astronautId: api.astronautId });
  const areas = new Set(DEFAULT_PANELS.map((id) => id.split(':')[0]));
  assert.equal(areas.size, 5);
  assert.deepEqual(DEFAULT_PANELS.map((id) => id.split(':')[1]),
    ['sleep_duration', 'heart_rate', 'co2_partial_pressure', 'career_effective_dose', 'aerobic_capacity', 'communication_delay']);
  assert.equal(new Set(DEFAULT_PANELS).size, DEFAULT_PANELS.length);
  for (const id of DEFAULT_PANELS) assert.equal(COVERED_BY[id.split(':')[1]], undefined, id);
  for (const id of DEFAULT_PANELS) {
    const [area, indicator] = id.split(':');
    const d = (await api.get(`/areas/${area}`)).body;
    const known = catalog[area].some((x) => x.id === indicator) || d.assessments.some((x) => x.indicator === indicator);
    assert.ok(known, id);
  }
});

test('painéis: limite de 10 e desmarcar', () => {
  let c = [];
  for (let i = 0; i < 12; i++) c = togglePanel(c, `a:${i}`);
  assert.equal(c.length, MAX_PANELS);
  assert.ok(!c.includes('a:10'));
  c = togglePanel(c, 'a:3');
  assert.equal(c.length, MAX_PANELS - 1);
  assert.ok(!c.includes('a:3'));
});

test('painéis: mais grave primeiro (Emergency > Warning > Caution > Unavailable > Advisory > Normal), empate na ordem escolhida', () => {
  const chosen = ['n1', 'adv', 'un', 'n2', 'ca', 'wa', 'em', 'none'];
  const lv = { n1: 'normal', adv: 'advisory', un: 'unavailable', n2: 'normal', ca: 'caution', wa: 'warning', em: 'emergency', none: null };
  const sorted = sortPanels(chosen.map((id) => ({ id, level: lv[id] })), chosen).map((p) => p.id);
  assert.deepEqual(sorted, ['em', 'wa', 'ca', 'un', 'adv', 'n1', 'n2', 'none']);
});

test('painéis: gravação no localStorage; sem escolha, dado inválido ou storage com erro = padrão', () => {
  const s = memory();
  assert.deepEqual(loadPanels(s), DEFAULT_PANELS);
  savePanels([panelId('radiation', 'dose_rate')], s);
  assert.deepEqual(loadPanels(s), ['radiation:dose_rate']);
  s.setItem(PANELS_KEY, '{oops');
  assert.deepEqual(loadPanels(s), DEFAULT_PANELS);
  clearPanels(s);
  assert.deepEqual(loadPanels(s), DEFAULT_PANELS);
  const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
  assert.deepEqual(loadPanels(broken), DEFAULT_PANELS);
  assert.doesNotThrow(() => savePanels(['x:y'], broken));
  assert.doesNotThrow(() => clearPanels(broken));
});

test('comparação: média dos 7 dias antes de hoje, seta pela diferença arredondada', () => {
  const today0 = Date.parse('2026-11-15T00:00:00Z');
  const day = 86400000;
  const r = (d, v, indicator = 'sleep_duration') => ({ indicator, value: v, recordedAt: new Date(today0 - d * day + 3600000).toISOString() });
  const recs = [r(1, 7), r(2, 8), r(3, 6), r(9, 1), r(0, 2), r(1, 99, 'stress')];
  const w = weekCompare(6.5, recs, 'sleep_duration', today0);
  assert.equal(w.count, 3);
  assert.equal(w.avg, 7);
  assert.equal(w.direction, 'down');
  assert.equal(weekCompare(7.5, recs, 'sleep_duration', today0).direction, 'up');
  assert.equal(weekCompare(7.02, recs, 'sleep_duration', today0).direction, 'same');
  assert.equal(weekCompare(null, recs, 'sleep_duration', today0), null);
  assert.equal(weekCompare('text', recs, 'sleep_duration', today0), null);
  assert.equal(weekCompare(5, recs, 'heart_rate', today0), null);
});

test('painéis: indicador que repete outro vira o que o cobre (temperatura + umidade = temperature_humidity)', async () => {
  const api = await memoryApi();
  await api.post('/demo/profile', { astronautId: api.astronautId });
  const cabin = 'hostile_closed_environment';
  const d = (await api.get(`/areas/${cabin}`)).body;
  for (const [covered, by] of Object.entries(COVERED_BY)) {
    assert.ok(catalog[cabin].some((x) => x.id === covered), covered);
    assert.ok(catalog[cabin].some((x) => x.id === by) || d.assessments.some((x) => x.indicator === by), by);
  }
  const t = panelId(cabin, 'temperature'), h = panelId(cabin, 'relative_humidity'), th = panelId(cabin, 'temperature_humidity');
  assert.deepEqual(normalizePanels([t, h, th, panelId(cabin, 'cabin_noise')]), [th, panelId(cabin, 'cabin_noise')]);
  const s = memory();
  savePanels([t, h], s);
  assert.deepEqual(loadPanels(s), [th]);
});
