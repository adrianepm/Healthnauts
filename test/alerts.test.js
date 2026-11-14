import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore } from '../server/store.js';
import { createApp } from '../server/app.js';
import { buildAlerts } from '../shared/alerts.js';
import { memoryApi } from '../test-support/memory-api.js';

const MINUTE = 60000;
const active = async api => (await api.get('/alerts')).body.active;
const acknowledge = (api, id, body = { astronautId: api.astronautId, dataset: 'simulated' }) => api.post(`/alerts/${id}/acknowledge`, body);
const sample = (api, value, unit) => ({ value, unit, recordedAt: api.now().toISOString() });
const normalVitals = api => api.post('/areas/gravity_fields/operations/vitals', { astronautId: api.astronautId, id: 'recovered', source: 'simulated',
  activity: 'routine', spo2Scale: 1, recordedAt: api.now().toISOString(), measurements: {
    heart_rate: sample(api, 72, 'bpm'), blood_pressure_systolic: sample(api, 118, 'mmHg'), blood_pressure_diastolic: sample(api, 76, 'mmHg'),
    respiratory_rate: sample(api, 15, 'breaths/min'), spo2: sample(api, 98, '%'), body_temperature: sample(api, 36.8, 'Cel'),
    supplemental_oxygen: sample(api, false, null), consciousness: sample(api, 'A', null) } });

test('item 2: Warning exige confirmação e grava shownAt, acknowledgedAt, active e resolvedAt', async () => {
  const api = await memoryApi(), start = api.now().toISOString();
  await api.scenario('fever');
  const [alert] = await active(api);
  assert.equal(alert.indicator, 'news2'); assert.equal(alert.level, 'warning');
  assert.equal(alert.shownAt, start); assert.equal(alert.active, true); assert.equal(alert.resolvedAt, null);
  assert.equal(alert.requiresAcknowledgement, true); assert.equal(alert.acknowledgedAt, null);
  assert.equal(alert.acknowledgementStatus, 'pending'); assert.equal(alert.escalatedTo, null);
  assert.equal(Date.parse(alert.acknowledgeBy) - Date.parse(alert.shownAt), 10 * MINUTE);
  assert.match(alert.acknowledgementNote, /^No acknowledgement does not mean loss of consciousness\./);
  assert.ok(alert.groundReportId);
  api.advance(3 * MINUTE);
  const confirmed = await acknowledge(api, alert.id);
  assert.equal(confirmed.status, 200);
  assert.equal(confirmed.body.alert.acknowledgedAt, api.now().toISOString());
  assert.equal(confirmed.body.alert.acknowledgementStatus, 'acknowledged');
  assert.match(confirmed.body.note, /does not mean loss of consciousness/);
  // Repetir a confirmação não muda o horário gravado.
  api.advance(MINUTE);
  assert.equal((await acknowledge(api, alert.id)).body.alert.acknowledgedAt, confirmed.body.alert.acknowledgedAt);
  // Confirmado continua ativo até a condição voltar ao normal; não escala depois do prazo.
  api.advance(20 * MINUTE);
  const later = (await active(api))[0];
  assert.equal(later.active, true); assert.equal(later.escalatedTo, null); assert.equal(later.acknowledgementStatus, 'acknowledged');
  assert.equal((await normalVitals(api)).status, 201);
  assert.deepEqual(await active(api), []);
  const resolved = (await api.get('/alerts')).body.notifications[0];
  assert.equal(resolved.active, false); assert.equal(resolved.resolvedAt, api.now().toISOString());
  assert.equal(resolved.acknowledgedAt, confirmed.body.alert.acknowledgedAt);
});

test('item 2: sem confirmação em 10 min (Warning) ou 2 min (Emergency) escala para o Crew Medical Officer', async () => {
  const api = await memoryApi();
  await api.scenario('fever');
  api.advance(10 * MINUTE);
  assert.equal((await active(api))[0].escalatedTo, null);
  api.advance(1);
  const warning = (await active(api))[0];
  assert.equal(warning.escalatedTo, 'crew_medical_officer');
  assert.deepEqual(warning.alsoNotified, ['second_crew_member']);
  assert.equal(warning.escalatedAt, warning.acknowledgeBy);
  assert.equal(warning.acknowledgementStatus, 'not_acknowledged');
  // Confirmar atrasado grava o horário, mas o escalonamento já aconteceu.
  const late = (await acknowledge(api, warning.id)).body.alert;
  assert.equal(late.acknowledgedAt, api.now().toISOString()); assert.equal(late.escalatedTo, 'crew_medical_officer');

  const emergency = await memoryApi();
  await emergency.scenario('depressurization');
  const alerts = await active(emergency);
  assert.deepEqual(alerts.map(a => [a.indicator, a.level]).sort(), [['cabin_pressure', 'emergency'], ['inspired_oxygen_pressure', 'emergency']]);
  assert.ok(alerts.every(a => Date.parse(a.acknowledgeBy) - Date.parse(a.shownAt) === 2 * MINUTE));
  emergency.advance(2 * MINUTE);
  assert.ok((await active(emergency)).every(a => a.escalatedTo === null));
  emergency.advance(1);
  assert.ok((await active(emergency)).every(a => a.escalatedTo === 'crew_medical_officer'));
});

test('item 2: Caution notifica sem confirmação; erros de rota; alerta resolvido antes do prazo não escala', async () => {
  const api = await memoryApi();
  await api.scenario('high-co2');
  const [caution] = await active(api);
  assert.equal(caution.level, 'caution'); assert.equal(caution.requiresAcknowledgement, false);
  assert.equal(caution.acknowledgementStatus, 'not_required'); assert.equal(caution.groundReportId, null);
  assert.equal((await acknowledge(api, caution.id)).status, 409);
  assert.equal((await acknowledge(api, 'unknown')).status, 404);
  assert.equal((await acknowledge(api, caution.id, { astronautId: 'bad' })).status, 400);
  assert.equal((await acknowledge(api, caution.id, { astronautId: api.astronautId, extra: 1 })).status, 400);
  // Advisory não vira notificação.
  await api.scenario('solar-event');
  assert.equal((await active(api)).length, 1);
  assert.ok((await api.get('/alerts')).body.alerts.some(e => e.level === 'advisory'));
  // Outro astronauta e o dataset real não enxergam estes alertas.
  assert.equal((await api.get('/alerts', { dataset: 'real' })).body.notifications.length, 0);
  assert.equal((await api.get('/alerts', { astronautId: 'astro_other' })).body.notifications.length, 0);

  const fever = await memoryApi();
  await fever.scenario('fever');
  fever.advance(4 * MINUTE);
  await normalVitals(fever);
  fever.advance(30 * MINUTE);
  const [resolved] = (await fever.get('/alerts')).body.notifications;
  assert.equal(resolved.active, false); assert.equal(resolved.escalatedTo, null);
  assert.equal(resolved.acknowledgementStatus, 'resolved_before_acknowledgement');
});

test('item 2: alerta que sobe de nível reinicia o prazo e dado indisponível não encerra alerta', () => {
  const at = minutes => new Date(Date.UTC(2026, 10, 14, 15, minutes)).toISOString();
  const entry = (id, minutes, level, status = 'assessed') => ({ id, astronautId: 'astro_demo_001', dataset: 'simulated', areaId: 'hostile_closed_environment',
    indicator: 'co2_partial_pressure', source: 'simulated', status, level, message: 'm', evaluatedAt: at(minutes), recordedAt: at(minutes), rule: { id: 'cabin_co2_1h', version: 2, source: {} } });
  const history = [entry('a', 0, 'caution'), entry('b', 5, 'warning'), entry('c', 8, null, 'stale'), entry('d', 30, null, 'no_demonstrative_signal'), entry('e', 40, 'caution')];
  const [first, second] = buildAlerts(history, [], Date.parse(at(60)));
  assert.equal(first.id, 'a'); assert.equal(first.shownAt, at(0)); assert.equal(first.peakLevel, 'warning');
  assert.equal(first.acknowledgementRequiredAt, at(5)); assert.equal(first.acknowledgeBy, at(15));
  assert.equal(first.resolvedAt, at(30)); assert.equal(first.escalatedTo, 'crew_medical_officer');
  assert.deepEqual(first.assessmentIds, ['a', 'b']);
  assert.equal(second.id, 'e'); assert.equal(second.active, true); assert.equal(second.requiresAcknowledgement, false);
  // Antes do prazo, e com confirmação dentro do prazo, não há escalonamento.
  assert.equal(buildAlerts(history, [], Date.parse(at(14)))[0].escalatedTo, null);
  const ack = [{ alertId: 'a', astronautId: 'astro_demo_001', dataset: 'simulated', acknowledgedAt: at(9) }];
  assert.equal(buildAlerts(history, ack, Date.parse(at(60)))[0].escalatedTo, null);
});

test('item 2: consultar alertas não grava nada; a confirmação persiste no arquivo e sobrevive a reabrir', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'nasa-alerts-')); t.after(() => rm(dir, { recursive: true }));
  const file = join(dir, 'records.json');
  let clock = new Date('2026-11-14T15:00:00Z');
  const serve = async () => {
    const server = createApp(await openStore(file, clock), { now: () => clock }).listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const request = async (path, body) => {
      const r = await fetch(`http://127.0.0.1:${server.address().port}/api/v1${path}`, body === undefined ? undefined :
        { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      return { status: r.status, body: await r.json() };
    };
    return { request, close: () => new Promise(resolve => server.close(resolve)) };
  };
  const query = '?astronautId=astro_demo_001&dataset=simulated';
  const first = await serve();
  assert.equal((await first.request('/scenarios/fever', { astronautId: 'astro_demo_001', id: 'fever-1' })).status, 201);
  const bytes = await readFile(file, 'utf8');
  const [alert] = (await first.request('/alerts' + query)).body.active;
  await first.request('/overview' + query); await first.request('/ground-reports' + query);
  assert.equal(await readFile(file, 'utf8'), bytes);
  clock = new Date(clock.getTime() + MINUTE);
  const confirmed = await first.request(`/alerts/${alert.id}/acknowledge`, { astronautId: 'astro_demo_001' });
  assert.equal(confirmed.status, 200);
  assert.equal(JSON.parse(await readFile(file, 'utf8')).acknowledgements.length, 1);
  await first.close();
  const second = await serve();
  t.after(second.close);
  const reopened = (await second.request('/alerts' + query)).body.active[0];
  assert.equal(reopened.id, alert.id); assert.equal(reopened.acknowledgedAt, confirmed.body.alert.acknowledgedAt);
});
