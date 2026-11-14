import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { scenarios } from '../shared/scenarios.js';
import { LIVE_LOCATION } from '../shared/config/research.js';
import { levels, footer } from '../shared/config/levels.js';
import { sha256 } from '../shared/sha256.js';
import { createRouter } from '../shared/router.js';
import { memoryApi } from '../test-support/memory-api.js';

const area = async (api, id) => (await api.get('/areas/' + id)).body.assessments;
const find = (list, indicator) => list.find(e => e.indicator === indicator);
const overviewArea = (overview, id) => overview.areas.find(a => a.areaId === id);

test('item 8: cenários novos depressurization, sensor-fault e fever', async () => {
  assert.deepEqual(scenarios.map(s => s.id), ['high-co2', 'solar-event', 'poor-sleep', 'fitness-change', 'offline-report', 'depressurization', 'sensor-fault', 'fever']);

  const depressurization = await memoryApi();
  const run = await depressurization.scenario('depressurization');
  assert.equal(run.status, 201);
  assert.ok(run.body.records.every(r => r.source === 'simulated'));
  const cabin = await area(depressurization, 'hostile_closed_environment');
  assert.equal(find(cabin, 'cabin_pressure').level, 'emergency');
  assert.ok(Math.abs(find(cabin, 'cabin_pressure').psia - 4.3) < 1e-9);
  assert.equal(find(cabin, 'inspired_oxygen_pressure').level, 'emergency');
  assert.equal(find(cabin, 'co2_partial_pressure').level, null);
  assert.equal((await depressurization.scenario('depressurization')).status, 200);

  // Sensor parado há 12 minutos: leitura velha, não avaliada, e sensor crítico.
  const fault = await memoryApi();
  await fault.scenario('sensor-fault');
  const stale = await area(fault, 'hostile_closed_environment');
  for (const indicator of ['cabin_pressure', 'inspired_oxygen_pressure', 'co2_partial_pressure']) {
    const item = find(stale, indicator);
    assert.equal(item.status, 'stale', indicator); assert.equal(item.level, null); assert.equal(item.displayLevel, 'unavailable');
    assert.equal(item.message, 'No reliable data. Check the sensor and measure again.');
  }
  assert.equal(find(stale, 'cabin_pressure').critical, true);
  assert.equal(find(stale, 'co2_partial_pressure').critical, false);
  assert.deepEqual((await fault.get('/alerts')).body.active, []);

  // NEWS2 alto vira Warning e nunca Emergency.
  const fever = await memoryApi();
  await fever.scenario('fever');
  const news2 = find(await area(fever, 'gravity_fields'), 'news2');
  assert.equal(news2.score, 8); assert.equal(news2.scientificCategory, 'high');
  assert.equal(news2.level, 'warning'); assert.equal(news2.requiresAcknowledgement, true);
  assert.equal(news2.rule.title, 'Early warning score (terrestrial reference, experimental)');
});

test('item 5: overview devolve o nível de cada área, de cada grupo, dos sinais vitais e o nível geral', async () => {
  const api = await memoryApi();
  await api.post('/demo/profile', { astronautId: api.astronautId });
  const calm = (await api.get('/overview')).body;
  assert.equal(calm.areas.length, 5);
  assert.deepEqual(calm.levels, levels); assert.equal(calm.footer, footer);
  for (const item of calm.areas) {
    assert.ok(Object.keys(levels).includes(item.displayLevel), item.areaId);
    assert.ok(item.headline.message);
    assert.ok(Object.values(item.groups).every(g => Object.keys(levels).includes(g.displayLevel)));
  }
  assert.equal(overviewArea(calm, 'radiation').displayLevel, 'normal');
  assert.equal(overviewArea(calm, 'isolation_confinement').displayLevel, 'normal');
  assert.equal(overviewArea(calm, 'gravity_fields').displayLevel, 'normal');
  assert.equal(overviewArea(calm, 'distance_from_earth').displayLevel, 'normal');
  // Sem leitura de sinais vitais nem de pressão: sensor crítico indisponível fica acima de Normal e de Advisory.
  assert.equal(calm.vitalSigns.displayLevel, 'unavailable'); assert.equal(calm.vitalSigns.indicator, 'news2');
  assert.equal(overviewArea(calm, 'hostile_closed_environment').displayLevel, 'unavailable');
  assert.equal(calm.overallLevel, null); assert.equal(calm.overallDisplayLevel, 'unavailable');
  assert.equal(calm.link.status, 'delayed'); assert.equal(calm.link.estimatedResponseSeconds, 2 * 480 + 900);
  assert.deepEqual(calm.activeAlerts, []);

  await api.scenario('solar-event');
  const solar = (await api.get('/overview')).body;
  assert.equal(overviewArea(solar, 'radiation').level, 'advisory');
  assert.equal(overviewArea(solar, 'radiation').groups.solar.level, 'advisory');
  assert.equal(overviewArea(solar, 'radiation').groups.exposure.displayLevel, 'normal');
  assert.equal(solar.overallDisplayLevel, 'unavailable');

  await api.scenario('fitness-change');
  await api.scenario('fever');
  const busy = (await api.get('/overview')).body;
  // Sinais vitais em Warning não mudam o nível da área de gravidade, que fica com o condicionamento.
  const gravity = overviewArea(busy, 'gravity_fields');
  assert.equal(busy.vitalSigns.level, 'warning');
  assert.equal(gravity.level, 'caution'); assert.equal(gravity.headline.indicator, 'aerobic_capacity');
  assert.equal(gravity.groups.vital_signs.level, 'warning'); assert.equal(gravity.groups.fitness.level, 'caution');
  assert.equal(gravity.groups.balance_vision.level, 'advisory');
  assert.equal(busy.overallLevel, 'warning'); assert.equal(busy.headline.indicator, 'news2');
  assert.deepEqual(busy.activeAlerts.map(a => a.indicator).sort(), ['aerobic_capacity', 'news2']);

  await api.scenario('depressurization');
  const emergency = (await api.get('/overview')).body;
  assert.equal(emergency.overallLevel, 'emergency');
  assert.equal(overviewArea(emergency, 'hostile_closed_environment').level, 'emergency');
  assert.equal(overviewArea(emergency, 'hostile_closed_environment').groups.atmosphere.level, 'emergency');
  // Contrato antigo preservado.
  for (const key of ['areaId', 'title', 'summary', 'dataStatus', 'recordCount', 'lastRecordedAt', 'latestRecord', 'highlights']) assert.ok(key in emergency.areas[0]);
});

test('ajuste 3: dose de carreira avaliada no perfil padrão e em todos os cenários', async () => {
  for (const scenario of scenarios) {
    const api = await memoryApi();
    assert.equal((await api.scenario(scenario.id)).status, 201, scenario.id);
    const career = (await area(api, 'radiation')).filter(e => e.indicator === 'career_effective_dose');
    assert.equal(career.length, 1, scenario.id);
    assert.equal(career[0].status, 'assessed', scenario.id);
    assert.equal(career[0].value, 195); assert.equal(career[0].percentOfLimit, 32.5);
    assert.equal(career[0].displayLevel, 'normal');
  }
  // O perfil é idempotente e não cria alertas.
  const api = await memoryApi();
  const first = await api.post('/demo/profile', { astronautId: api.astronautId });
  assert.equal(first.status, 201);
  const count = api.store.all().length, writes = api.writes();
  api.advance(3600000);
  assert.equal((await api.post('/demo/profile', { astronautId: api.astronautId })).status, 200);
  assert.equal(api.store.all().length, count); assert.equal(api.writes(), writes);
  assert.equal((await api.get('/alerts')).body.alerts.length, 0);
  assert.equal((await api.post('/demo/profile', { astronautId: 'bad' })).status, 400);
  const gravity = await area(api, 'gravity_fields');
  for (const indicator of ['aerobic_capacity', 'muscle_strength', 'body_mass']) assert.equal(find(gravity, indicator).displayLevel, 'normal', indicator);
  // A dose continua avaliada com o passar do tempo e com novas leituras do contador.
  api.advance(40 * 86400000);
  assert.equal(find(await area(api, 'radiation'), 'career_effective_dose').status, 'assessed');
});

test('ajuste 4: cenários de cabine usam o local do sensor ao vivo e aceitam outro local', async () => {
  const api = await memoryApi();
  const standard = await api.scenario('high-co2');
  assert.ok(standard.body.records.every(r => r.context.location === LIVE_LOCATION));
  assert.equal(LIVE_LOCATION, 'cabin-main');
  const moved = await api.post('/scenarios/depressurization', { astronautId: api.astronautId, id: 'other-module', location: 'node-2' });
  assert.equal(moved.status, 201);
  assert.ok(moved.body.records.every(r => r.context.location === 'node-2'));
  assert.equal((await api.post('/scenarios/high-co2', { astronautId: api.astronautId, id: 'x', location: '../bad' })).status, 400);
  // A cabine é um único volume monitorado: a hora de CO2 normal do segundo cenário já encerrou o alerta de CO2.
  const during = (await api.get('/alerts')).body;
  assert.deepEqual(during.active.map(a => a.indicator).sort(), ['cabin_pressure', 'inspired_oxygen_pressure']);
  assert.equal(during.notifications.find(a => a.indicator === 'co2_partial_pressure').active, false);
  // Leituras novas e normais encerram os alertas de pressão e O2.
  api.advance(60000);
  for (let i = 6; i >= 0; i--) {
    const result = await api.post('/areas/hostile_closed_environment/operations/atmosphere', { astronautId: api.astronautId, id: 'live-' + i, source: 'simulated',
      location: 'node-3', environment: 'nominal_cabin', recordedAt: new Date(api.now().getTime() - i * 600000).toISOString(),
      pressure: { value: 14.7, unit: 'psia' }, co2Ppm: 2500, oxygenFraction: 0.21 });
    assert.equal(result.status, 201);
  }
  const after = (await api.get('/alerts')).body;
  assert.deepEqual(after.active.filter(a => a.areaId === 'hostile_closed_environment'), []);
  assert.equal(after.notifications.filter(a => a.resolvedAt).length, 3);
  assert.equal(overviewArea((await api.get('/overview')).body, 'hostile_closed_environment').groups.atmosphere.displayLevel, 'normal');
});

test('opção A: shared/ não depende do Node e o roteador responde como o Express', async () => {
  const dir = new URL('../shared/', import.meta.url);
  const files = [...(await readdir(dir)).filter(f => f.endsWith('.js')).map(f => f), ...(await readdir(new URL('config/', dir))).map(f => 'config/' + f)];
  assert.ok(files.length >= 20);
  for (const name of files) {
    const text = await readFile(new URL(name, dir), 'utf8');
    assert.doesNotMatch(text, /from 'node:|require\(|process\.|from 'express'/, name);
  }
  assert.equal(sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(sha256(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  const router = createRouter();
  router.get('/items/:id', (req, res) => res.json({ id: req.params.id, q: req.query.q ?? null }));
  router.post('/items', (req, res) => res.status(201).json(req.body));
  router.get('/boom', () => { throw new TypeError('x'); });
  assert.deepEqual(await router.handle('GET', '/items/a%20b', { query: { q: '1' } }), { status: 200, body: { id: 'a b', q: '1' } });
  assert.deepEqual(await router.handle('POST', '/items', { body: { ok: true } }), { status: 201, body: { ok: true } });
  assert.equal((await router.handle('GET', '/missing')).body.error.code, 'NOT_FOUND');
  assert.equal((await router.handle('POST', '/items/a')).status, 404);
  const api = await memoryApi();
  assert.equal((await api.get('/areas/unknown')).body.error.code, 'AREA_NOT_FOUND');
  assert.equal((await api.get('/overview', { astronautId: 'bad' })).status, 400);
  assert.equal((await api.post('/scenarios/unknown', { astronautId: api.astronautId, id: 'x' })).status, 404);
});
