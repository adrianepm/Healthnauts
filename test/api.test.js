import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore } from '../src/store.js';
import { createApp } from '../src/app.js';
import { catalog } from '../src/config/catalog.js';
import { trends } from '../src/trends.js';
import { timestamp } from '../src/validation.js';
const astronautId = 'astro_demo_001';
const now = new Date('2026-11-14T15:00:00Z');
async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'nasa-test-'));
  const file = join(dir, 'records.json');
  const store = await openStore(file, now);
  const server = createApp(store, { now: () => now }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await rm(dir, { recursive: true }); });
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  const get = async path => { const r = await fetch(`${base}${path}`); return { status: r.status, body: await r.json() }; };
  const post = async records => {
    const r = await fetch(`${base}/areas/radiation/records`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ astronautId, records }) });
    return { status: r.status, body: await r.json() };
  };
  return { file, store, base, get, post };
}
const reading = (extra = {}) => ({ indicator: 'dose_rate', value: 10, unit: 'uSv/h', recordedAt: '2026-11-14T12:30:00Z', source: 'manual', ...extra });
test('demo inicial cobre as cinco áreas e o catálogo preservado; real começa vazio', async t => {
  const { get } = await fixture(t);
  const demo = await get(`/overview?astronautId=${astronautId}`);
  assert.equal(demo.status, 200); assert.equal(demo.body.dataset, 'simulated'); assert.equal(demo.body.areas.length, 5);
  for (const [area, definitions] of Object.entries(catalog)) {
    const detail = (await get(`/areas/${area}?astronautId=${astronautId}`)).body;
    const initialDefinitions = definitions.filter(d => d.seeded !== false);
    assert.equal(detail.latestRecords.length, initialDefinitions.length);
    assert.deepEqual(detail.indicatorDefinitions, definitions);
    const history = (await get(`/areas/${area}/history?astronautId=${astronautId}`)).body;
    assert.equal(history.records.length, initialDefinitions.reduce((count, d) => count + (d.aggregateGroup === 'pvt_b' ? 2 : 7), 0));
    assert.ok(history.records.every(r => r.isSimulated && r.source === 'simulated'));
    assert.ok(history.trends.filter(r => initialDefinitions.some(d => d.id === r.indicator)).every(r => r.status === (definitions.find(d => d.id === r.indicator).valueType === 'text' ? 'not_applicable' : 'available')));
  }
  const real = (await get(`/overview?astronautId=${astronautId}&dataset=real`)).body;
  assert.ok(real.areas.every(a => a.recordCount === 0 && a.dataStatus === 'no_data' && a.lastRecordedAt === null && a.highlights.length === 0));
});
test('lote atômico, validação, persistência e escritas concorrentes', async t => {
  const { store, file, post, get } = await fixture(t);
  const count = store.all().length;
  for (const invalid of [ { unit: 'bad' }, { value: '10' }, { indicator: 'mood' }, { recordedAt: '2026-02-30T00:00:00Z' }, { indicator: 'accumulated_dose', unit: 'uSv' }, { isSimulated: false } ]) {
    assert.equal((await post([reading(), reading(invalid)])).status, 400);
    assert.equal(store.all().length, count);
  }
  const results = await Promise.all([post([reading()]), post([reading({ source: 'sensor' })])]);
  assert.ok(results.every(r => r.status === 201));
  assert.ok(results.every(r => r.body.records[0].isSimulated === false && r.body.records[0].id && r.body.records[0].createdAt));
  assert.equal((await openStore(file, new Date('2027-01-01'))).all().length, count + 2);
  assert.equal(JSON.parse(await readFile(file, 'utf8')).length, count + 2);
  const real = (await get(`/areas/radiation/history?astronautId=${astronautId}&dataset=real`)).body;
  assert.equal(real.records.length, 2);
  assert.ok(real.trends.filter(t => ['dose_rate','accumulated_dose'].includes(t.indicator)).every(t => t.status === 'insufficient_history'));
});
test('filtros inclusivo/exclusivo, erros JSON e CORS local', async t => {
  const { base, post, get } = await fixture(t);
  await post([reading(), reading({ recordedAt: '2026-11-14T13:00:00Z' })]);
  const r = await get(`/areas/radiation/history?astronautId=${astronautId}&dataset=real&indicator=dose_rate&from=2026-11-14T12:30:00Z&to=2026-11-14T13:00:00Z`);
  assert.equal(r.body.records.length, 1);
  assert.equal((await get(`/areas/unknown?astronautId=${astronautId}`)).status, 404);
  assert.equal((await get(`/overview?astronautId=${astronautId}&dataset=invalid`)).status, 400);
  assert.equal((await get('/overview')).status, 400);
  const invalid = await fetch(`${base}/areas/radiation/records`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal((await invalid.json()).error.code, 'INVALID_JSON');
  const cors = await fetch(`${base}/overview`, { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173' } });
  assert.equal(cors.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  const external = await fetch(`${base}/overview`, { headers: { Origin: 'https://example.com' } });
  assert.equal(external.headers.get('access-control-allow-origin'), null);
});
test('comparação usa origem, instantes distintos e mesmo início acumulado', () => {
  const def = catalog.radiation.filter(d => d.id === 'accumulated_dose');
  const record = (id, day, periodStart, value) => ({ id, indicator: 'accumulated_dose', source: 'simulated', unit: 'uSv', recordedAt: `2026-11-${day}T12:00:00Z`, periodStart, value });
  const old = '2026-11-01T00:00:00Z', fresh = '2026-11-10T00:00:00Z';
  const records = [record('a', 11, old, 100), record('b', 12, old, 200), record('c', 13, fresh, 10)];
  assert.equal(trends(records, def, 'simulated')[0].status, 'insufficient_history');
  records.push(record('d', 14, fresh, 30));
  assert.equal(trends(records, def, 'simulated')[0].delta, 20);
});
test('arquivo inválido não é sobrescrito e datas impossíveis são rejeitadas', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'nasa-corrupt-')); t.after(() => rm(dir, { recursive: true }));
  const file = join(dir, 'records.json'); await writeFile(file, 'invalid');
  await assert.rejects(openStore(file)); assert.equal(await readFile(file, 'utf8'), 'invalid');
  assert.equal(timestamp('2026-11-14T10:00:00-03:00'), true);
  assert.equal(timestamp('2026-11-14T10:00:00'), false);
  assert.equal(timestamp('2026-02-29T10:00:00Z'), false);
});
test('validação das escalas e intervalos segue o catálogo', async () => {
  const { validateBatch } = await import('../src/validation.js');
  const validate = (area, r) => validateBatch({ astronautId, records: [r] }, area, catalog[area]);
  const fatigue = { indicator: 'fatigue', unit: null, value: 3, recordedAt: now.toISOString(), source: 'simulated' };
  for (const value of [0, 6, 2.5, '3']) assert.throws(() => validate('isolation_confinement', { ...fatigue, value }));
  assert.equal(validate('isolation_confinement', fatigue)[0].isSimulated, true);
  const dose = reading({ indicator: 'accumulated_dose', unit: 'uSv', periodStart: '2026-11-14T13:00:00Z' });
  assert.throws(() => validate('radiation', dose));
  assert.throws(() => validate('radiation', reading({ source: 'unknown' })));
});
