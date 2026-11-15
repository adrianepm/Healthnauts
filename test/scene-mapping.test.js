// RIDGE Scene (src/components/scene/sceneMapping.ts): cada cenário do DemoPanel provoca a reação certa,
// e a cena só repete nível e mensagem da API (nunca inventa valor).
import test from 'node:test';
import assert from 'node:assert/strict';
import { memoryApi } from '../test-support/memory-api.js';
import { atmosphereReading, climateRecords, noiseReading, vitalsReading } from '../src/sim/payloads.ts';
import { sceneState, signalPulse } from '../src/components/scene/sceneMapping.ts';

const rnd = () => 0.5;
const op = (api, area, kind, id, body) => api.post(`/areas/${area}/operations/${kind}`, { astronautId: api.astronautId, id, source: 'simulated', ...body });

// Mesmo ciclo do sensor ao vivo (src/sim/liveSensors.ts), com o modo pedido.
async function liveSensor(api, cabin = 'nominal', vitals = 'nominal', tag = 't') {
  const now = api.now().getTime();
  if (cabin !== 'offline') {
    for (let i = 6; i >= 0; i--) await op(api, 'hostile_closed_environment', 'atmosphere', `${tag}-gas-${i}`, atmosphereReading(cabin, new Date(now - i * 600000), rnd));
    await api.post('/areas/hostile_closed_environment/records', { astronautId: api.astronautId, records: climateRecords(new Date(now), rnd).map((x) => ({ source: 'simulated', ...x })) });
    await op(api, 'hostile_closed_environment', 'noise', `${tag}-noise`, noiseReading(new Date(now), 120000, rnd));
  }
  const v = vitalsReading(vitals, new Date(now), rnd);
  await op(api, 'gravity_fields', 'vitals', `${tag}-vitals`, v);
  return { heartRate: v.measurements.heart_rate.value, respiratoryRate: v.measurements.respiratory_rate.value };
}

async function scene(api, live) {
  const overview = (await api.get('/overview')).body;
  const { reports } = (await api.get('/ground-reports')).body;
  return { s: sceneState({ overview, reports, live, now: api.now().getTime() }), overview, reports };
}

async function start() {
  const api = await memoryApi();
  await api.post('/demo/profile', { astronautId: api.astronautId });
  const live = await liveSensor(api, 'nominal', 'nominal', 'n');
  return { api, live };
}

test('cena: estado nominal tem tudo avaliado, sem pulso, coração no ritmo da FC ao vivo', async () => {
  const { api, live } = await start();
  const { s, overview } = await scene(api, live);
  assert.equal(s.emergency, false);
  assert.equal(s.vitals.level, overview.vitalSigns.displayLevel);
  assert.equal(s.vitals.level, 'normal');
  assert.ok(Math.abs(s.vitals.beatSeconds - 60 / live.heartRate) < 1e-9);
  assert.ok(Math.abs(s.vitals.breathSeconds - 60 / live.respiratoryRate) < 1e-9);
  assert.equal(s.environment.level, 'normal');
  assert.equal(s.environment.cabinGlow, false);
  assert.equal(s.radiation.solarActive, false);
  assert.equal(s.earth.signal, null);
  for (const e of [s.radiation, s.distance, s.environment, s.isolation, s.vitals, s.gravity]) assert.equal(e.pulse, false, e.target);
});

test('cena · fever: coração acelera e sinais vitais assumem o nível da API', async () => {
  const { api, live } = await start();
  const before = (await scene(api, live)).s.vitals.beatSeconds;
  api.advance(60000);
  await api.scenario('fever');
  const fever = await liveSensor(api, 'nominal', 'fever', 'f');
  const { s, overview } = await scene(api, fever);
  assert.equal(fever.heartRate, 118);
  assert.ok(s.vitals.beatSeconds < before, 'batimento mais rápido');
  assert.equal(s.vitals.level, overview.vitalSigns.displayLevel);
  assert.equal(s.vitals.level, 'warning');
  assert.equal(s.vitals.pulse, true);
  assert.equal(s.vitals.message, overview.vitalSigns.message);
  // Warning gera relatório: o pulso sai da nave rumo à Terra.
  assert.equal(s.earth.signal?.phase, 'outbound');
});

test('cena · depressurization: cabine na cor do nível (Emergency), luz pulsando, cena em emergência', async () => {
  const { api, live } = await start();
  api.advance(60000);
  await api.scenario('depressurization');
  await liveSensor(api, 'depressurization', 'nominal', 'd');
  const { s } = await scene(api, live);
  assert.equal(s.environment.level, 'emergency');
  assert.equal(s.environment.cabinGlow, true);
  assert.equal(s.sensors.pressure, 'emergency');
  assert.equal(s.emergency, true);
  assert.equal(s.overall, 'emergency');
});

test('cena · sensor-fault: sensores da cabine em Unavailable (cinza, parados)', async () => {
  const { api, live } = await start();
  api.advance(60000);
  await api.scenario('sensor-fault');
  // O sensor ao vivo para (modo offline); depois de 5 min a última leitura vence (validade 2.4).
  api.advance(6 * 60000);
  const v = await liveSensor(api, 'offline', 'nominal', 's');
  const { s } = await scene(api, v);
  assert.equal(s.sensors.co2, 'unavailable');
  assert.equal(s.sensors.o2, 'unavailable');
  assert.equal(s.sensors.pressure, 'unavailable');
  assert.equal(s.environment.cabinGlow, false);
  assert.equal(s.environment.pulse, false);
});

test('cena · sinais vitais sem dado: coração parado e cinza', async () => {
  const api = await memoryApi();
  await api.post('/demo/profile', { astronautId: api.astronautId });
  const { s } = await scene(api, { heartRate: 70, respiratoryRate: 14 });
  assert.equal(s.vitals.level, 'unavailable');
  assert.equal(s.vitals.beatSeconds, null);
  assert.equal(s.vitals.breathSeconds, null);
});

test('cena · solar-event: partículas e aura com a cor do nível de Radiation', async () => {
  const { api, live } = await start();
  await api.scenario('solar-event');
  const { s, overview } = await scene(api, live);
  assert.equal(s.radiation.solarActive, true);
  assert.equal(s.radiation.level, overview.areas.find((a) => a.areaId === 'radiation').displayLevel);
  assert.equal(s.radiation.level, 'advisory');
});

test('cena · offline-report: sem link o texto é o da API; relatório QUEUED deixa o pulso parado na nave', async () => {
  const { api, live } = await start();
  await api.scenario('offline-report');
  let { s, overview } = await scene(api, live);
  assert.equal(s.earth.linkStatus, 'unavailable');
  assert.equal(s.earth.text, overview.link.message);
  assert.match(s.earth.text, /No contact with Earth/);
  // Um Warning sem link: o relatório fica QUEUED e o pulso não sai da nave.
  api.advance(60000);
  await api.scenario('fever');
  ({ s } = await scene(api, live));
  assert.equal(s.earth.reportStatus, 'QUEUED');
  assert.deepEqual(s.earth.signal, { position: 0, phase: 'held' });
  assert.match(s.earth.text, /No contact with Earth/);
});

test('cena: pulso do relatório segue sentAt → expectedArrivalAt e volta até expectedReplyAt', () => {
  const t0 = Date.parse('2026-11-14T15:00:00Z');
  const r = { createdAt: new Date(t0).toISOString(), transmission: { status: 'SENT', sentAt: new Date(t0).toISOString(),
    expectedArrivalAt: new Date(t0 + 480000).toISOString(), expectedReplyAt: new Date(t0 + 2 * 480000 + 900000).toISOString() } };
  assert.deepEqual(signalPulse(r, t0 + 240000), { position: 0.5, phase: 'outbound' });
  assert.deepEqual(signalPulse(r, t0 + 480000), { position: 1, phase: 'return' });
  const back = signalPulse(r, t0 + 480000 + (480000 + 900000) / 2);
  assert.equal(back.phase, 'return'); assert.ok(Math.abs(back.position - 0.5) < 1e-9);
  assert.equal(signalPulse(r, t0 + 2 * 480000 + 900000), null);
  assert.equal(signalPulse(null, t0), null);
});

test('cena: sem resposta da API tudo fica Unavailable', () => {
  const s = sceneState({ overview: null, reports: [], live: { heartRate: 80, respiratoryRate: 14 }, now: Date.now() });
  for (const e of [s.radiation, s.distance, s.environment, s.isolation, s.vitals, s.gravity, s.earth]) assert.equal(e.level, 'unavailable', e.target);
  assert.equal(s.vitals.beatSeconds, null);
  assert.equal(s.radiation.solarActive, false);
});
