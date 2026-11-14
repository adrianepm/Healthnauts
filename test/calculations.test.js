import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, rename, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { calculateSleep, calculatePvt } from '../src/calculations.js';
import { openStore } from '../src/store.js';
import { createApp } from '../src/app.js';
const sleep = (extra = {}) => ({ astronautId: 'astro_demo_001', episodeId: 'sleep-001', source: 'manual', bedAt: '2026-11-13T23:00:00-03:00', wakeAt: '2026-11-14T07:00:00-03:00', sleepLatencyMinutes: 20, awakeMinutes: 25, ...extra });
const pvt = (extra = {}) => ({ astronautId: 'astro_demo_001', sessionId: 'pvt-001', source: 'manual', startedAt: '2026-11-14T11:00:00Z', endedAt: '2026-11-14T11:03:00Z', durationMs: 180000, completed: true, events: [
  { kind: 'response', atMs: 1500, rtMs: 500 },
  { kind: 'response', atMs: 3750, rtMs: 250 },
  { kind: 'response', atMs: 5099, rtMs: 99 },
  { kind: 'false_start', atMs: 5500 },
  { kind: 'timeout', atMs: 37000 },
], ...extra });

test('sono: meia-noite, fusos, frações, arredondamento e componentes auditáveis', () => {
  const result = calculateSleep(sleep());
  assert.equal(result.records[0].value, 7.25);
  assert.equal(result.records[0].unit, 'h');
  assert.equal(result.records[0].periodStart, sleep().bedAt);
  assert.deepEqual(result.operation.input, sleep());
  assert.equal(result.operation.calculation.unroundedHours, 7.25);
  assert.equal(calculateSleep(sleep({ sleepLatencyMinutes: 1, awakeMinutes: 0 })).records[0].value, 7.98);
  assert.equal(calculateSleep(sleep({ sleepLatencyMinutes: 480, awakeMinutes: 0 })).records[0].value, 0);
  assert.equal(calculateSleep(sleep({ bedAt: '2026-11-13T23:00:00-02:00', awakeMinutes: 0, sleepLatencyMinutes: 0 })).records[0].value, 9);
});

test('sono: rejeita datas sem fuso, intervalos inválidos, números negativos e campos extras', () => {
  for (const extra of [
    { bedAt: '2026-11-13T23:00:00' }, { wakeAt: '2026-02-30T07:00:00Z' },
    { wakeAt: sleep().bedAt }, { wakeAt: '2026-11-13T22:00:00-03:00' }, { wakeAt: '2026-11-15T07:00:00-03:00' },
    { sleepLatencyMinutes: -1 }, { awakeMinutes: Infinity }, { awakeMinutes: '20' }, { sleepLatencyMinutes: null },
    { sleepLatencyMinutes: 480, awakeMinutes: 1 }, { sleep_duration: 7 }, { episodeId: '../unsafe' }, { astronautId: 'other' },
  ]) assert.throws(() => calculateSleep(sleep(extra)), { code: 'VALIDATION_ERROR' });
});

test('PVT: média dos inversos, timeout de 30 s e falsos inícios excluídos da média', () => {
  const result = calculatePvt(pvt());
  const calculation = result.operation.calculation;
  assert.equal(calculation.validResponses, 3);
  assert.equal(calculation.lapses, 2); assert.equal(calculation.falseStarts, 2); assert.equal(calculation.timeouts, 1);
  assert.equal(calculation.meanReciprocalSeconds, (2 + 4 + 1 / 30) / 3);
  assert.equal(calculation.responseSpeed, 2.0111);
  assert.deepEqual(result.records.map(r => r.value), [2.0111, 2, 2]);
  assert.ok(result.records.every(r => r.groupId === 'pvt-001'));
  assert.deepEqual(result.operation.input.events, pvt().events);
});

test('PVT: limites 100/355 ms, interrupção e ausência de respostas válidas', () => {
  const response = rtMs => ({ kind: 'response', atMs: 1000 + rtMs, rtMs });
  for (const [rt, valid, lapses, falseStarts] of [[0, 0, 0, 1], [99.999, 0, 0, 1], [100, 1, 0, 0], [354.999, 1, 0, 0], [355, 1, 1, 0]]) {
    const result = calculatePvt(pvt({ events: [response(rt)] }));
    assert.equal(result.operation.calculation.validResponses, valid);
    assert.equal(result.operation.calculation.lapses, lapses);
    assert.equal(result.operation.calculation.falseStarts, falseStarts);
    if (!valid) { assert.equal(result.operation.status, 'no_valid_responses'); assert.equal(result.records.length, 0); assert.equal(result.operation.calculation.responseSpeed, null); }
  }
  const interrupted = calculatePvt(pvt({ completed: false, durationMs: 40000, endedAt: '2026-11-14T11:00:40Z' }));
  assert.equal(interrupted.operation.status, 'interrupted'); assert.equal(interrupted.records.length, 0);
  assert.equal(interrupted.operation.calculation.lapses, 2);
  assert.equal(calculatePvt(pvt({ completed: false, durationMs: 0, events: [] })).records.length, 0);
  const finalTimeout = calculatePvt(pvt({ durationMs: 209000, endedAt: '2026-11-14T11:03:29Z', events: [{ kind: 'timeout', atMs: 209000 }] }));
  assert.equal(finalTimeout.records[0].value, 0.0333);
});

test('PVT: rejeita sessões, eventos e cronologia incoerentes', () => {
  for (const extra of [
    { completed: 'true' }, { durationMs: 179999 }, { durationMs: 210001 }, { durationMs: NaN },
    { endedAt: pvt().startedAt }, { startedAt: '2026-11-14T11:00:00' }, { events: [] }, { events: {} },
    { events: Array(2001).fill({ kind: 'false_start', atMs: 1 }) },
    { events: [{ kind: 'response', atMs: 1000, rtMs: -1 }] },
    { events: [{ kind: 'response', atMs: 1000, rtMs: '100' }] },
    { events: [{ kind: 'response', atMs: 1000, rtMs: 2000 }] },
    { events: [{ kind: 'response', atMs: 31000, rtMs: 30000 }] },
    { events: [{ kind: 'timeout', atMs: 29999 }] },
    { events: [{ kind: 'timeout', atMs: 31000, rtMs: 30000 }] },
    { events: [{ kind: 'false_start', atMs: 10, rtMs: 0 }] },
    { events: [{ kind: 'response', atMs: 180001, rtMs: 300 }] },
    { events: [{ kind: 'false_start', atMs: 10 }, { kind: 'false_start', atMs: 10 }] },
    { events: [{ kind: 'false_start', atMs: 2000 }, { kind: 'response', atMs: 2100, rtMs: 500 }] },
    { events: [{ kind: 'lapse', atMs: 2000 }] }, { responseSpeed: 4 },
  ]) assert.throws(() => calculatePvt(pvt(extra)), { code: 'VALIDATION_ERROR' });
});

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'nasa-calculations-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const file = join(dir, 'records.json');
  const store = await openStore(file, new Date('2026-11-14T15:00:00Z'));
  const server = createApp(store).listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api/v1/areas/isolation_confinement`;
  const post = async (path, body) => {
    const res = await fetch(`${base}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return { status: res.status, body: await res.json() };
  };
  return { file, store, server, base, post };
}

test('HTTP sono: persiste componentes, consulta auditoria e preserva endpoints antigos', async t => {
  const { file, store, base, post } = await fixture(t);
  const original = store.all();
  const first = await post('sleep-episodes', sleep());
  assert.equal(first.status, 201); assert.equal(first.body.records[0].value, 7.25);
  assert.equal(first.body.replayed, false);
  const repeated = await post('sleep-episodes', Object.fromEntries(Object.entries(sleep()).reverse()));
  assert.equal(repeated.status, 200); assert.equal(repeated.body.replayed, true);
  assert.deepEqual(repeated.body.records, first.body.records);
  assert.equal((await post('sleep-episodes', sleep({ awakeMinutes: 20 }))).status, 409);
  assert.equal((await post('sleep-episodes', sleep({ awakeMinutes: -1 }))).status, 400);
  assert.deepEqual(store.all().slice(0, original.length), original);
  const saved = JSON.parse(await readFile(file, 'utf8'));
  assert.equal(saved.schemaVersion, 2); assert.deepEqual(saved.operations[0].input, sleep());
  const audit = await fetch(`${base}/sleep-episodes/sleep-001?astronautId=astro_demo_001&dataset=real`);
  assert.equal(audit.status, 200); assert.deepEqual((await audit.json()).operation.input, sleep());
  assert.equal((await fetch(`${base}/sleep-episodes/sleep-001?astronautId=astro_demo_001`)).status, 404);
  const history = await (await fetch(`${base}/history?astronautId=astro_demo_001&dataset=real&indicator=sleep_duration&from=2026-11-14T00:00:00Z&to=2026-11-15T00:00:00Z`)).json();
  assert.equal(history.records[0].value, 7.25);
  const legacy = await post('records', { astronautId: 'astro_demo_001', records: [{ indicator: 'sleep_duration', value: 8, unit: 'h', source: 'manual', recordedAt: '2026-11-15T10:00:00Z' }] });
  assert.equal(legacy.status, 201);
  const reopened = await openStore(file);
  assert.equal(reopened.all().length, original.length + 2);
  assert.deepEqual(reopened.findOperation('sleep', 'astro_demo_001', 'sleep-001').operation.input, sleep());
});

test('PVT: reenvio concorrente e após reabrir não duplica; conflito preserva original', async t => {
  const { file, store, post } = await fixture(t);
  const originalCount = store.all().length;
  const results = await Promise.all([post('pvt-sessions', pvt()), post('pvt-sessions', pvt()), post('pvt-sessions', pvt())]);
  assert.deepEqual(results.map(r => r.status).sort(), [200, 200, 201]);
  assert.equal(store.all().length, originalCount + 3);
  assert.ok(results.every(r => r.body.records[0].id === results[0].body.records[0].id));
  assert.equal((await post('pvt-sessions', pvt({ source: 'sensor' }))).status, 409);
  const reopened = await openStore(file);
  const calculated = calculatePvt(pvt());
  const replay = await reopened.saveOperation(calculated.operation, calculated.records);
  assert.equal(replay.replayed, true); assert.equal(reopened.all().length, originalCount + 3);
  assert.deepEqual(replay.records, results[0].body.records);
});

test('sessão interrompida é auditada sem indicadores e é terminal; legado conflita com ID reutilizado', async t => {
  const { file, store, post } = await fixture(t);
  const originalCount = store.all().length;
  const interrupted = pvt({ completed: false });
  const first = await post('pvt-sessions', interrupted);
  assert.equal(first.status, 201); assert.equal(first.body.operation.status, 'interrupted'); assert.deepEqual(first.body.records, []);
  assert.equal((await post('pvt-sessions', interrupted)).status, 200);
  assert.equal((await post('pvt-sessions', pvt())).status, 409);
  assert.equal(store.all().length, originalCount);
  assert.equal((await openStore(file)).findOperation('pvt', 'astro_demo_001', 'pvt-001').operation.status, 'interrupted');
  const legacy = calculatePvt(pvt({ sessionId: 'legacy' })).records.map(({ id, astronautId, areaId, createdAt, isSimulated, ...r }) => r);
  assert.equal((await post('records', { astronautId: 'astro_demo_001', records: legacy })).status, 201);
  assert.equal((await post('pvt-sessions', pvt({ sessionId: 'legacy' }))).status, 409);
});

test('falha na gravação não confirma idempotência nem deixa agregados parciais', async t => {
  const { file, store } = await fixture(t);
  const before = store.all();
  const calculated = calculatePvt(pvt());
  await rename(file, `${file}.backup`);
  await mkdir(file); // Force rename onto a directory to fail, without permissions tricks.
  await assert.rejects(store.saveOperation(calculated.operation, calculated.records));
  assert.deepEqual(store.all(), before); assert.equal(store.findOperation('pvt', 'astro_demo_001', 'pvt-001'), null);
  await rm(file, { recursive: true }); await rename(`${file}.backup`, file);
  const retry = await store.saveOperation(calculated.operation, calculated.records);
  assert.equal(retry.replayed, false); assert.equal(store.all().length, before.length + 3);
});

test('exemplos de Samuel são reproduzíveis pela API, incluindo reenvio e conflito', async t => {
  const { post } = await fixture(t);
  const examples = JSON.parse(await readFile(new URL('../docs/examples.json', import.meta.url), 'utf8'));
  for (const name of ['sleepEpisode', 'sleepEpisodeReplay', 'pvtSession', 'pvtSessionReplay', 'pvtInterrupted', 'pvtConflict']) {
    const example = examples[name];
    const path = example.request.split('/').at(-1);
    const actual = await post(path, example.body);
    assert.equal(actual.status, example.status, name);
    if (actual.status === 409) assert.deepEqual(actual.body, example.response);
    else {
      assert.equal(actual.body.replayed, example.response.replayed);
      assert.equal(actual.body.operation.status, example.response.operation.status);
      assert.deepEqual(actual.body.operation.input, example.response.operation.input);
      assert.deepEqual(actual.body.operation.calculation, example.response.operation.calculation);
      const stable = records => records.map(({ id, createdAt, ...r }) => r);
      assert.deepEqual(stable(actual.body.records), stable(example.response.records));
    }
  }
});

test('envios legados concorrentes com operações não se perdem na migração v2', async t => {
  const { post, file, store } = await fixture(t);
  const before = store.all().length;
  const legacy = { astronautId: 'astro_demo_001', records: [{ indicator: 'sleep_quality', value: 75, unit: null, source: 'manual', recordedAt: '2026-11-14T12:00:00Z' }] };
  const results = await Promise.all([post('records', legacy), post('pvt-sessions', pvt()), post('sleep-episodes', sleep())]);
  assert.ok(results.every(r => r.status === 201));
  const reopened = await openStore(file);
  assert.equal(reopened.all().length, before + 5);
  assert.ok(reopened.findOperation('pvt', 'astro_demo_001', 'pvt-001'));
  assert.ok(reopened.findOperation('sleep', 'astro_demo_001', 'sleep-001'));
});
