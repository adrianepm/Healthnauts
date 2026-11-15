// O front chama a API local (mesmo roteador de shared/) com estes formatos de payload.
// Os testes garantem que o sensor simulado, o check-in e o cenário de despressurização
// produzem os níveis esperados SEM a interface decidir nada.
import test from 'node:test';
import assert from 'node:assert/strict';
import { memoryApi } from '../test-support/memory-api.js';
import { atmosphereReading, climateRecords, noiseReading, vitalsReading } from '../src/sim/payloads.ts';

const rnd = () => 0.5; // sem ruído: valores no centro da faixa normal
const op = (api, area, kind, id, body) => api.post(`/areas/${area}/operations/${kind}`, { astronautId: api.astronautId, id, source: 'simulated', ...body });

async function liveSensor(api, cabin = 'nominal', vitals = 'nominal', tag = 't') {
  const now = api.now().getTime();
  for (let i = 6; i >= 0; i--) {
    const r = await op(api, 'hostile_closed_environment', 'atmosphere', `${tag}-gas-${i}`, atmosphereReading(cabin, new Date(now - i * 600000), rnd));
    assert.equal(r.status, 201, JSON.stringify(r.body));
  }
  let r = await api.post('/areas/hostile_closed_environment/records', { astronautId: api.astronautId, records: climateRecords(new Date(now), rnd).map((x) => ({ source: 'simulated', ...x })) });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  r = await op(api, 'hostile_closed_environment', 'noise', `${tag}-noise`, noiseReading(new Date(now), 120000, rnd));
  assert.equal(r.status, 201, JSON.stringify(r.body));
  r = await op(api, 'gravity_fields', 'vitals', `${tag}-vitals`, vitalsReading(vitals, new Date(now), rnd));
  assert.equal(r.status, 201, JSON.stringify(r.body));
}

test('front: perfil + sensor simulado deixam cabine e sinais vitais avaliados como Normal', async () => {
  const api = await memoryApi();
  assert.equal((await api.post('/demo/profile', { astronautId: api.astronautId })).status, 201);
  const before = (await api.get('/overview')).body;
  assert.equal(before.areas.find((a) => a.areaId === 'hostile_closed_environment').displayLevel, 'unavailable');
  await liveSensor(api);
  const o = (await api.get('/overview')).body;
  assert.equal(o.vitalSigns.displayLevel, 'normal');
  const cabin = o.areas.find((a) => a.areaId === 'hostile_closed_environment');
  assert.equal(cabin.groups.atmosphere.displayLevel, 'normal');
  assert.equal(cabin.groups.noise.displayLevel, 'normal');
  const career = (await api.get('/areas/radiation')).body.assessments.find((a) => a.indicator === 'career_effective_dose');
  assert.equal(career.displayLevel, 'normal');
});

test('front: sensor em modo despressurização gera Emergency, Acknowledge e relatório imediato', async () => {
  const api = await memoryApi();
  await api.post('/demo/profile', { astronautId: api.astronautId });
  await liveSensor(api, 'nominal', 'nominal', 'a');
  api.advance(60000);
  assert.equal((await api.scenario('depressurization')).status, 201);
  await op(api, 'hostile_closed_environment', 'atmosphere', 'b-gas', atmosphereReading('depressurization', api.now(), rnd));
  const { active } = (await api.get('/alerts')).body;
  const emergency = active.filter((a) => a.level === 'emergency');
  assert.ok(emergency.length >= 1);
  assert.match(emergency[0].acknowledgementNote, /No acknowledgement does not mean loss of consciousness\./);
  const ack = await api.post(`/alerts/${emergency[0].id}/acknowledge`, { astronautId: api.astronautId, dataset: 'simulated' });
  assert.equal(ack.status, 200);
  assert.equal(ack.body.alert.acknowledgementStatus, 'acknowledged');
  assert.equal(ack.body.alert.active, true);
  const reports = (await api.get('/ground-reports')).body.reports;
  assert.ok(reports.some((r) => r.immediate && r.level === 'emergency'));
  // Volta ao normal: uma leitura válida de pressão encerra o alerta.
  api.advance(60000);
  await op(api, 'hostile_closed_environment', 'atmosphere', 'c-gas', atmosphereReading('nominal', api.now(), rnd));
  const after = (await api.get('/alerts')).body.active.filter((a) => a.indicator === 'cabin_pressure');
  assert.equal(after.length, 0);
});

test('front: sinais vitais de febre ficam em Warning (NEWS2 nunca vira Emergency)', async () => {
  const api = await memoryApi();
  await api.post('/demo/profile', { astronautId: api.astronautId });
  await op(api, 'gravity_fields', 'vitals', 'fever-1', vitalsReading('fever', api.now(), rnd));
  const o = (await api.get('/overview')).body;
  assert.equal(o.vitalSigns.displayLevel, 'warning');
});

test('front: check-in da manhã grava sono e escalas nos formatos do formulário', async () => {
  // Como no navegador (src/services/localApi.ts): demonstração semeada à meia-noite, check-in de manhã.
  const api = await memoryApi('2026-11-14T00:00:00Z');
  api.advance(8 * 3600000);
  const now = api.now().getTime(); const iso = (ms) => new Date(ms).toISOString();
  const sleep = await api.post('/areas/isolation_confinement/sleep-episodes', { astronautId: api.astronautId, episodeId: 'ep-1', source: 'simulated',
    bedAt: iso(now - 4 * 3600000), wakeAt: iso(now - 600000), sleepLatencyMinutes: 15, awakeMinutes: 10 });
  assert.equal(sleep.status, 201);
  const records = [['sleep_quality', 70], ['sleepiness_kss', 8], ['fatigue_samn_perelli', 7], ['stress', 30], ['mood_score', 70]]
    .map(([indicator, value]) => ({ indicator, value, unit: null, source: 'simulated', recordedAt: iso(now) }));
  assert.equal((await api.post('/areas/isolation_confinement/records', { astronautId: api.astronautId, records })).status, 201);
  const a = (await api.get('/areas/isolation_confinement')).body.assessments;
  const level = (id) => a.find((x) => x.indicator === id).displayLevel;
  assert.equal(level('sleep_duration'), 'warning'); // ≤ 4 h
  assert.equal(level('sleepiness_kss'), 'caution'); // KSS 8
  assert.equal(level('fatigue_samn_perelli'), 'warning'); // Samn-Perelli 7
});

test('front: teste de reação curto (modo demo) é gravado sem nota', async () => {
  const api = await memoryApi();
  const start = api.now();
  const r = await api.post('/areas/isolation_confinement/pvt-sessions', { astronautId: api.astronautId, sessionId: 'pvt-demo', source: 'simulated',
    startedAt: start.toISOString(), endedAt: new Date(start.getTime() + 31000).toISOString(), durationMs: 31000, completed: false,
    events: [{ kind: 'false_start', atMs: 800 }, { kind: 'response', atMs: 3300, rtMs: 280 }, { kind: 'response', atMs: 7400, rtMs: 400 }] });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.equal(r.body.operation.status, 'interrupted');
  assert.equal(r.body.records.length, 0);
});
