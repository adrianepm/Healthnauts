import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore } from '../src/store.js';
import { createApp } from '../src/app.js';

const astronautId = 'astro_demo_001';
const now = new Date('2026-11-14T15:00:00Z');

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'astrovida-fe-test-'));
  const file = join(dir, 'records.json');
  const store = await openStore(file, now);
  const server = createApp(store, { now: () => now }).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(dir, { recursive: true });
  });
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;

  const get = async (path) => {
    const r = await fetch(`${base}${path}`);
    return { status: r.status, body: await r.json() };
  };

  const post = async (path, body) => {
    const r = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: r.status, body: await r.json() };
  };

  return { store, base, get, post };
}

test('frontend-integration: Todas as 6 telas consom seus endpoints correspondentes com sucesso', async (t) => {
  const { get } = await fixture(t);

  // 1. Tela Inicial
  const overview = await get(`/overview?astronautId=${astronautId}&dataset=simulated`);
  assert.equal(overview.status, 200);
  assert.equal(overview.body.areas.length, 5);
  assert.ok(overview.body.areas.every((a) => a.dataStatus === 'available'));

  // 2. Radiação
  const rad = await get(`/areas/radiation?astronautId=${astronautId}&dataset=simulated`);
  assert.equal(rad.status, 200);
  assert.equal(rad.body.area.id, 'radiation');
  assert.ok(rad.body.assessments.some((a) => a.indicator === 'career_effective_dose'));

  // 3. Isolamento e Confinamento
  const iso = await get(`/areas/isolation_confinement?astronautId=${astronautId}&dataset=simulated`);
  assert.equal(iso.status, 200);
  assert.equal(iso.body.area.id, 'isolation_confinement');
  assert.ok(Array.isArray(iso.body.assessments));

  // 4. Distância da Terra e Missão
  const dist = await get(`/areas/distance_from_earth?astronautId=${astronautId}&dataset=simulated`);
  assert.equal(dist.status, 200);
  assert.equal(dist.body.area.id, 'distance_from_earth');

  const mission = await get(`/mission?astronautId=${astronautId}&dataset=simulated`);
  assert.equal(mission.status, 200);

  // 5. Campos Gravitacionais
  const grav = await get(`/areas/gravity_fields?astronautId=${astronautId}&dataset=simulated`);
  assert.equal(grav.status, 200);
  assert.equal(grav.body.area.id, 'gravity_fields');
  assert.ok(grav.body.assessments.some((a) => a.indicator === 'news2'));

  // 6. Ambientes Fechados Hostis
  const env = await get(`/areas/hostile_closed_environment?astronautId=${astronautId}&dataset=simulated`);
  assert.equal(env.status, 200);
  assert.equal(env.body.area.id, 'hostile_closed_environment');

  // Alertas Globais
  const alerts = await get(`/alerts?astronautId=${astronautId}&dataset=simulated`);
  assert.equal(alerts.status, 200);
  assert.ok(Array.isArray(alerts.body.assessments));
  assert.ok(Array.isArray(alerts.body.alerts));
});

test('frontend-integration: Cálculo server-side de sono e teste PVT-B completo e interrompido', async (t) => {
  const { post, get } = await fixture(t);

  // Registro de Sono
  const sleepRes = await post('/areas/isolation_confinement/sleep-episodes', {
    astronautId,
    episodeId: 'sleep-test-1',
    source: 'manual',
    bedAt: '2026-11-13T22:30:00Z',
    wakeAt: '2026-11-14T06:30:00Z',
    sleepLatencyMinutes: 15,
    awakeMinutes: 20,
  });
  assert.equal(sleepRes.status, 201);
  assert.equal(sleepRes.body.operation.calculation.durationHours, 7.42);
  assert.equal(sleepRes.body.operation.calculation.timeInBedMinutes, 480);

  // PVT Concluído (3 min)
  const pvtCompleted = await post('/areas/isolation_confinement/pvt-sessions', {
    astronautId,
    sessionId: 'pvt-test-completed',
    source: 'manual',
    startedAt: '2026-11-14T14:00:00Z',
    endedAt: '2026-11-14T14:03:00Z',
    durationMs: 180000,
    completed: true,
    events: [
      { kind: 'response', atMs: 5000, rtMs: 240 },
      { kind: 'response', atMs: 12000, rtMs: 380 }, // lapse
      { kind: 'false_start', atMs: 25000 },
    ],
  });
  assert.equal(pvtCompleted.status, 201);
  assert.equal(pvtCompleted.body.operation.status, 'completed');
  assert.equal(pvtCompleted.body.operation.calculation.lapses, 1);
  assert.equal(pvtCompleted.body.operation.calculation.falseStarts, 1);
  assert.ok(typeof pvtCompleted.body.operation.calculation.responseSpeed === 'number');

  // PVT Interrompido (não deve gerar indicadores na baseline)
  const pvtInterrupted = await post('/areas/isolation_confinement/pvt-sessions', {
    astronautId,
    sessionId: 'pvt-test-interrupted',
    source: 'manual',
    startedAt: '2026-11-14T14:10:00Z',
    endedAt: '2026-11-14T14:11:00Z',
    durationMs: 60000,
    completed: false,
    events: [{ kind: 'response', atMs: 5000, rtMs: 220 }],
  });
  assert.equal(pvtInterrupted.status, 201);
  assert.equal(pvtInterrupted.body.operation.status, 'interrupted');
  assert.equal(pvtInterrupted.body.records.length, 0); // nenhuma contaminação de indicador
});

test('frontend-integration: Todos os 5 cenários demonstrativos executam e retornam feedback com relatório', async (t) => {
  const { get, post } = await fixture(t);

  const scenarioList = await get('/scenarios');
  assert.equal(scenarioList.status, 200);
  assert.equal(scenarioList.body.scenarios.length, 5);

  const scenarioIds = ['high-co2', 'solar-event', 'poor-sleep', 'fitness-change', 'offline-report'];
  for (const sId of scenarioIds) {
    const runRes = await post(`/scenarios/${sId}`, {
      astronautId,
      id: `run-${sId}-${Date.now()}`,
    });
    assert.equal(runRes.status, 201);
    assert.equal(runRes.body.operation.status, 'completed');
    if (sId === 'offline-report') {
      assert.ok(runRes.body.operation.calculation.reportId);
    }
  }
});

test('frontend-integration: NEWS2, atmosfera e relatório local operam com estado not_sent e regras do contrato', async (t) => {
  const { post, get } = await fixture(t);

  // NEWS2 via vitals
  const vitalsRes = await post('/areas/gravity_fields/operations/vitals', {
    astronautId,
    id: 'vitals-op-1',
    source: 'manual',
    activity: 'routine',
    spo2Scale: 1,
    recordedAt: '2026-11-14T14:59:00Z',
    measurements: {
      heart_rate: { value: 72, unit: 'bpm', recordedAt: '2026-11-14T14:59:00Z' },
      blood_pressure_systolic: { value: 118, unit: 'mmHg', recordedAt: '2026-11-14T14:59:00Z' },
      blood_pressure_diastolic: { value: 76, unit: 'mmHg', recordedAt: '2026-11-14T14:59:00Z' },
      respiratory_rate: { value: 16, unit: 'breaths/min', recordedAt: '2026-11-14T14:59:00Z' },
      spo2: { value: 98, unit: '%', recordedAt: '2026-11-14T14:59:00Z' },
      body_temperature: { value: 36.8, unit: 'Cel', recordedAt: '2026-11-14T14:59:00Z' },
      supplemental_oxygen: { value: false, unit: null, recordedAt: '2026-11-14T14:59:00Z' },
      consciousness: { value: 'A', unit: null, recordedAt: '2026-11-14T14:59:00Z' },
    },
  });
  assert.equal(vitalsRes.status, 201);
  assert.equal(vitalsRes.body.operation.calculation.score, 0);
  assert.equal(vitalsRes.body.operation.calculation.scientificCategory, 'low');

  // Atmosfera: cálculo de ppCO2, ppO2 e PIO2
  const atmoRes = await post('/areas/hostile_closed_environment/operations/atmosphere', {
    astronautId,
    id: 'atmo-op-1',
    source: 'manual',
    location: 'cabin-deck-a',
    environment: 'nominal_cabin',
    recordedAt: '2026-11-14T14:59:00Z',
    pressure: { value: 760, unit: 'mmHg' },
    co2Ppm: 1200,
    oxygenFraction: 0.21,
  });
  assert.equal(atmoRes.status, 201);
  assert.equal(atmoRes.body.operation.calculation.pressureMmHg, 760);
  assert.ok(Math.abs(atmoRes.body.operation.calculation.partialCo2 - 0.912) < 0.01);
  assert.ok(Math.abs(atmoRes.body.operation.calculation.partialO2 - 159.6) < 0.1);

  // Relatório preparado: deliveryStatus: "not_sent"
  const reportRes = await post('/areas/distance_from_earth/operations/report', {
    astronautId,
    id: 'report-op-1',
    source: 'manual',
    actions: [{ recordedAt: '2026-11-14T14:58:00Z', description: 'Monitoramento diário concluído.' }],
  });
  assert.equal(reportRes.status, 201);
  assert.equal(reportRes.body.operation.calculation.status, 'prepared');
  assert.equal(reportRes.body.operation.calculation.deliveryStatus, 'not_sent');
});
