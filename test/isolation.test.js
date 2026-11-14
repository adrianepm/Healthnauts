import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { catalog, pvtIndicators } from '../src/config/catalog.js';
import { validateBatch } from '../src/validation.js';
import { monitoring } from '../src/monitoring.js';
import { createDemo, ASTRONAUT } from '../src/demo.js';
import { openStore } from '../src/store.js';
import { createApp } from '../src/app.js';
const definitions = catalog.isolation_confinement;
const now = new Date('2026-11-14T15:00:00Z');
const record = (indicator, value, extra = {}) => ({ indicator, value, unit: definitions.find(d => d.id === indicator).unit, source: 'manual', recordedAt: now.toISOString(), ...extra });
const validate = records => validateBatch({ astronautId: ASTRONAUT, records }, 'isolation_confinement', definitions);
const pvt = (extra = {}) => pvtIndicators.map((id, i) => record(id, [3.4567, 2, 0][i], { groupId: 'run-1', ...extra }));
const series = (indicator, values, source = 'manual') => values.map((value, i) => ({ ...record(indicator, value), id: `r${i}`, source, recordedAt: new Date(Date.UTC(2026, 10, 1 + i, 12)).toISOString() }));
const assess = (indicator, values, asOf = '2026-11-11T00:00:00Z') => monitoring(series(indicator, values), definitions.filter(d => d.id === indicator), 'real', asOf)[0];

test('escalas configuráveis, limites, precisão e compatibilidade de legados', () => {
  for (const id of ['sleep_quality', 'stress', 'mood_score']) {
    for (const value of [0, 0.01, 50.25, 100]) assert.equal(validate([record(id, value)])[0].value, value);
    for (const value of [-1, 100.01, 5.123, '50', null, Infinity]) assert.throws(() => validate([record(id, value)]));
  }
  for (const [id, max] of [['sleepiness_kss', 9], ['fatigue_samn_perelli', 7], ['fatigue', 5], ['mood', 5]]) {
    for (const value of [1, max]) assert.doesNotThrow(() => validate([record(id, value)]));
    for (const value of [0, max + 1, 2.5]) assert.throws(() => validate([record(id, value)]));
  }
  for (const value of [0, 7.25, 24]) assert.doesNotThrow(() => validate([record('sleep_duration', value)]));
  for (const value of [-1, 24.01, 7.555]) assert.throws(() => validate([record('sleep_duration', value)]));
  assert.throws(() => validate([record('sleep_quality', 50, { unit: '%' })]));
  const custom = [{ id: 'custom', valueType: 'scale', unit: 'points', scale: { min: -2, max: 2, numericType: 'number', precision: 1, step: 0.5 } }];
  const check = value => validateBatch({ astronautId: ASTRONAUT, records: [{ indicator: 'custom', value, unit: 'points', recordedAt: now.toISOString(), source: 'manual' }] }, 'isolation_confinement', custom);
  assert.doesNotThrow(() => check(-1.5)); assert.throws(() => check(0.1));
});

test('PVT aceita somente três agregados coerentes e contagens inteiras não negativas', () => {
  assert.equal(validate(pvt()).length, 3);
  for (const field of ['pvt_lapses', 'pvt_false_starts']) for (const value of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => validate(pvt().map(r => r.indicator === field ? { ...r, value } : r)));
  }
  for (const value of [-1, 10.1, 1.12345]) assert.throws(() => validate(pvt().map((r, i) => i === 0 ? { ...r, value } : r)));
  assert.throws(() => validate(pvt({ groupId: undefined })));
  assert.throws(() => validate(pvt().slice(0, 2)));
  assert.throws(() => validate([...pvt(), pvt()[0]]));
  assert.throws(() => validate(pvt().map((r, i) => i === 0 ? { ...r, source: 'sensor' } : r)));
  assert.throws(() => validate(pvt().map((r, i) => i === 0 ? { ...r, recordedAt: '2026-11-15T00:00:00Z' } : r)));
  assert.throws(() => validate(pvt().map((r, i) => i === 0 ? { ...r, reactionTimes: [200, 300] } : r)));
});

test('baseline aguarda sete dias, exige dias suficientes e variância, usa média ± 2 DP amostrais', () => {
  const values = [50, 51, 49, 50, 51, 49, 50];
  assert.equal(assess('sleep_quality', values, '2026-11-07T23:59:59Z').status, 'baseline_collecting');
  const ready = assess('sleep_quality', values, '2026-11-08T00:00:00Z');
  assert.equal(ready.status, 'awaiting_follow_up');
  assert.equal(ready.baseline.mean, 50);
  assert.ok(Math.abs(ready.baseline.standardDeviation - Math.sqrt(4 / 6)) < 1e-10);
  assert.equal(ready.baseline.config.basis, 'proposta da equipe');
  assert.equal(assess('sleep_quality', [50, 51]).status, 'baseline_insufficient');
  assert.equal(assess('sleep_quality', Array(10).fill(50)).baseline.reason, 'zero_variance');
  assert.equal(assess('sleep_quality', [...values, 90, 90]).level, null);
  assert.equal(assess('sleep_quality', [...values, 90, 90, 90]).level, 'attention');
  assert.equal(assess('stress', [...values, 10, 10, 10]).level, null);
  assert.equal(assess('stress', [...values, 90, 90, 90]).level, 'attention');
  assert.equal(assess('mood_score', [...values, 10, 10, 10]).level, 'attention');
});

test('não mistura origens nem duplica dias, lacunas quebram sequência e futuro é excluído', () => {
  const def = definitions.filter(d => d.id === 'sleep_quality');
  const records = series('sleep_quality', [50, 51, 49, 50, 51, 49, 50, 90, 90, 90]);
  records[8].recordedAt = records[7].recordedAt;
  let result = monitoring(records, def, 'real', '2026-11-11')[0];
  assert.equal(result.level, null);
  const noBaseline = [...series('sleep_quality', [50, 51, 49]), ...series('sleep_quality', [50, 51, 49, 50, 51, 49, 50], 'sensor')];
  result = monitoring(noBaseline, def, 'real', '2026-11-11')[0];
  assert.equal(result.baseline.status, 'insufficient');
  const future = monitoring(series('sleep_quality', [50, 51, 49, 50, 51, 49, 50, 90, 90, 90]), def, 'real', '2026-11-09')[0];
  assert.equal(future.level, null); assert.equal(future.recordedAt, '2026-11-08T12:00:00.000Z');
});

test('limites demonstrativos, origem das regras e PVT com duas amostras em sete dias', () => {
  for (const [id, value, level] of [['sleep_duration', 4, 'risk'], ['sleep_duration', 6, 'attention'], ['sleep_duration', 6.01, null], ['sleepiness_kss', 7, 'attention'], ['sleepiness_kss', 8, 'risk'], ['fatigue_samn_perelli', 4, 'attention'], ['fatigue_samn_perelli', 5, 'risk']]) {
    const result = assess(id, [value]); assert.equal(result.level, level); assert.ok(result.isDemonstrative);
  }
  const records = series('pvt_response_speed', [3, 4, 1]);
  records[1].recordedAt = '2026-11-05T12:00:00Z'; records[2].recordedAt = '2026-11-09T12:00:00Z';
  const result = monitoring(records, definitions.filter(d => d.id === 'pvt_response_speed'), 'real', '2026-11-10')[0];
  assert.equal(result.baseline.sampleCount, 2); assert.equal(result.level, 'attention');
  for (const def of definitions.filter(d => d.monitoring)) for (const rule of def.monitoring.rules) {
    assert.ok(['fonte', 'proposta da equipe'].includes(rule.basis)); assert.ok(rule.note);
    if (rule.basis === 'fonte') assert.ok(rule.references.length);
  }
});

test('migração incremental preserva todos os registros e é idempotente mesmo após passagem do tempo', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'isolation-migration-')); t.after(() => rm(dir, { recursive: true }));
  const file = join(dir, 'records.json');
  const newIds = definitions.filter(d => !['sleep_duration', 'fatigue', 'mood'].includes(d.id)).map(d => d.id);
  const old = createDemo(now).filter(r => !newIds.includes(r.indicator));
  old.push({ ...old[0], id: 'manual-preserved', source: 'manual', isSimulated: false });
  await writeFile(file, JSON.stringify(old));
  const first = (await openStore(file, now)).all();
  assert.deepEqual(first.slice(0, old.length), old);
  assert.equal(first.length - old.length, 41);
  const bytes = await readFile(file, 'utf8');
  assert.deepEqual((await openStore(file, new Date('2027-01-01'))).all(), first);
  assert.equal(await readFile(file, 'utf8'), bytes);
  for (const id of newIds) assert.ok(first.some(r => r.indicator === id));
  // A partially applied migration is completed without adding a second copy.
  await writeFile(file, JSON.stringify(first.slice(0, -1)));
  const repaired = (await openStore(file, now)).all();
  assert.equal(repaired.length, first.length);
  assert.equal(new Set(repaired.map(r => r.id)).size, repaired.length);
});

test('dados simulados são válidos e PVT segue intervalo de quatro dias', () => {
  const demo = createDemo(now).filter(r => r.areaId === 'isolation_confinement');
  const input = demo.map(({ indicator, value, unit, recordedAt, source, groupId, periodStart }) => ({ indicator, value, unit, recordedAt, source, ...(groupId ? { groupId } : {}), ...(periodStart ? { periodStart } : {}) }));
  assert.doesNotThrow(() => validate(input));
  const times = demo.filter(r => r.indicator === 'pvt_lapses').map(r => Date.parse(r.recordedAt));
  assert.equal(times.length, 2); assert.equal(times[1] - times[0], 4 * 86400000);
});

test('HTTP mantém contrato, persiste check-in/PVT e usa histórico completo na baseline', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'isolation-api-')); t.after(() => rm(dir, { recursive: true }));
  const store = await openStore(join(dir, 'records.json'), now);
  const server = createApp(store, { now: () => now }).listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api/v1/areas/isolation_confinement`;
  const post = records => fetch(`${base}/records`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ astronautId: ASTRONAUT, records }) });
  assert.equal((await post(pvt())).status, 201);
  const count = store.all().length;
  assert.equal((await post(pvt().slice(0, 2))).status, 400); assert.equal(store.all().length, count);
  const daily = series('sleep_quality', [50, 51, 49, 50, 51, 49, 50, 90, 90, 90]).map(({ id, ...r }) => r);
  assert.equal((await post(daily)).status, 201);
  const query = `astronautId=${ASTRONAUT}&dataset=real`;
  const response = await fetch(`${base}/history?${query}&indicator=sleep_quality&from=2026-11-10T00:00:00Z&to=2026-11-11T00:00:00Z`);
  const history = await response.json();
  assert.equal(response.status, 200); assert.equal(history.records.length, 1);
  assert.equal(history.monitoring[0].baseline.sampleCount, 7); assert.equal(history.monitoring[0].level, 'attention');
  assert.ok(Array.isArray(history.trends));
  const detail = await (await fetch(`${base}?${query}`)).json();
  assert.ok(detail.indicatorDefinitions && detail.latestRecords && detail.monitoring);
  assert.equal(detail.indicatorDefinitions.find(d => d.id === 'mood').replacedBy, 'mood_score');
});

test('exemplos documentados seguem catálogo e payloads aceitos', async () => {
  const examples = JSON.parse(await readFile(new URL('../docs/examples.json', import.meta.url), 'utf8'));
  const detail = examples.detail.find(e => e.response.area.id === 'isolation_confinement');
  assert.deepEqual(detail.response.indicatorDefinitions, definitions);
  for (const example of [examples.isolationCheckIn, examples.isolationPvt]) {
    const records = validate(example.body.records);
    assert.equal(example.status, 201);
    assert.equal(records.length, example.response.records.length);
    assert.equal(example.request, 'POST /api/v1/areas/isolation_confinement/records');
    for (const [index, record] of records.entries()) {
      for (const [key, value] of Object.entries(example.body.records[index])) assert.deepEqual(record[key], value);
    }
  }
});
