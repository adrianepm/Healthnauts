import test from 'node:test';
import assert from 'node:assert/strict';
import { memoryApi } from '../test-support/memory-api.js';
import { PROFILE_MISSION } from '../shared/profile.js';

const SECOND = 1000, MINUTE = 60 * SECOND;
const reports = async api => (await api.get('/ground-reports')).body.reports;
const seconds = (later, earlier) => (Date.parse(later) - Date.parse(earlier)) / SECOND;
// Novo contexto da mesma missão do perfil, para ligar ou desligar o link com a Terra.
const link = async (api, communication, oneWaySeconds = 480) => {
  const { mission } = (await api.get('/mission')).body;
  const profile = api.store.findOperation('mission', api.astronautId, 'demo-profile-mission').operation.input;
  return api.post('/areas/distance_from_earth/operations/mission', { ...profile, id: 'link-' + api.now().getTime(), recordedAt: api.now().toISOString(),
    communication, oneWaySeconds, solarConjunction: communication === 'unavailable', destination: mission?.input.destination ?? 'Mars' });
};

test('item 4: QUEUED -> SENT -> RECEIVED -> REPLIED com chegada e resposta calculadas pelo atraso', async () => {
  const api = await memoryApi();
  await api.scenario('fever');
  const created = api.now().toISOString();
  const [report] = await reports(api);
  assert.equal(report.kind, 'automatic'); assert.equal(report.level, 'warning'); assert.equal(report.immediate, false);
  assert.equal(report.createdAt, created); assert.equal(report.isSimulation, true);
  assert.deepEqual(report.mission, { missionId: PROFILE_MISSION, destination: 'Mars', activity: 'transit' });
  const t = report.transmission;
  assert.equal(t.status, 'SENT'); assert.equal(t.sentAt, created); assert.equal(t.oneWaySeconds, 480);
  // expectedArrivalAt = sentAt + atraso; expectedReplyAt = sentAt + 2 × atraso + 15 min.
  assert.equal(seconds(t.expectedArrivalAt, t.sentAt), 480);
  assert.equal(seconds(t.expectedReplyAt, t.sentAt), 2 * 480 + 900);
  assert.equal(t.reply, null);
  assert.equal(t.message, 'Follow the onboard procedure now. A report has been sent to the flight surgeon. Expected reply in about 31 minutes.');
  assert.deepEqual(report.parameters.map(p => [p.indicator, p.level, p.value]), [['news2', 'warning', 8]]);
  assert.ok(report.parameters[0].measuredAt && report.parameters[0].receivedAt);
  assert.equal(report.acknowledgement.status, 'pending');
  api.advance(480 * SECOND - 1);
  assert.equal((await reports(api))[0].transmission.status, 'SENT');
  api.advance(1);
  const received = (await reports(api))[0].transmission;
  assert.equal(received.status, 'RECEIVED'); assert.equal(received.receivedAt, t.expectedArrivalAt); assert.equal(received.reply, null);
  api.advance((480 + 900) * SECOND);
  const replied = (await reports(api))[0];
  assert.equal(replied.transmission.status, 'REPLIED'); assert.equal(replied.transmission.repliedAt, t.expectedReplyAt);
  assert.equal(replied.transmission.reply, 'Flight surgeon reviewed your report. Continue the onboard procedure and send new vitals in 30 min.');
  // Sem confirmação no prazo o relatório leva a marca "not acknowledged".
  assert.equal(replied.notAcknowledged, true); assert.equal(replied.acknowledgement.mark, 'not acknowledged');
  assert.match(replied.acknowledgement.note, /does not mean loss of consciousness/);
});

test('ajuste 2: sem link com a Terra o relatório fica QUEUED até o link voltar (não existe NO_LINK)', async () => {
  const api = await memoryApi();
  await api.scenario('offline-report');
  api.advance(MINUTE);
  await api.scenario('fever');
  const created = api.now().toISOString();
  const queued = (await reports(api))[0];
  assert.equal(queued.transmission.status, 'QUEUED'); assert.equal(queued.transmission.linkStatus, 'unavailable');
  assert.equal(queued.transmission.message, 'No contact with Earth. Follow the onboard procedure with your Crew Medical Officer.');
  assert.equal(queued.transmission.sentAt, null); assert.equal(queued.transmission.expectedReplyAt, null);
  const ground = (await api.get('/ground-reports')).body;
  assert.equal(ground.link.status, 'unavailable'); assert.equal(ground.link.estimatedResponseSeconds, null);
  assert.equal(ground.link.message, 'No contact with Earth. Follow the onboard procedure with your Crew Medical Officer.');
  // O alerta local segue igual: Warning, com confirmação obrigatória.
  const alert = (await api.get('/alerts')).body.active.find(a => a.indicator === 'news2');
  assert.equal(alert.level, 'warning'); assert.equal(alert.requiresAcknowledgement, true);
  api.advance(3 * 60 * MINUTE);
  assert.equal((await reports(api))[0].transmission.status, 'QUEUED');
  assert.doesNotMatch(JSON.stringify(await api.get('/ground-reports')), /NO_LINK/);
  // O link volta: o relatório sai da fila com o horário real do envio.
  assert.equal((await link(api, 'delayed', 240)).status, 201);
  const restoredAt = api.now().toISOString();
  const sent = (await reports(api))[0];
  assert.equal(sent.createdAt, created);
  assert.equal(sent.transmission.status, 'SENT'); assert.equal(sent.transmission.sentAt, restoredAt); assert.equal(sent.transmission.queuedAt, created);
  assert.equal(seconds(sent.transmission.expectedArrivalAt, restoredAt), 240);
  assert.equal(seconds(sent.transmission.expectedReplyAt, restoredAt), 2 * 240 + 900);
  api.advance((2 * 240 + 900) * SECOND);
  assert.equal((await reports(api))[0].transmission.status, 'REPLIED');
  // O link cair de novo não desfaz um envio já feito, mas segura os relatórios novos.
  await link(api, 'unavailable', null);
  assert.equal((await reports(api))[0].transmission.status, 'REPLIED');
  const overview = (await api.get('/overview')).body;
  assert.equal(overview.link.status, 'unavailable');
  assert.equal(overview.areas.find(a => a.areaId === 'distance_from_earth').level, 'advisory');
});

test('item 4: Emergency gera relatório imediato único para alertas simultâneos; confirmação parcial marca "not acknowledged"', async () => {
  const api = await memoryApi();
  await api.scenario('depressurization');
  const alerts = (await api.get('/alerts')).body.active;
  assert.equal(new Set(alerts.map(a => a.groundReportId)).size, 1);
  const [report] = await reports(api);
  assert.equal(report.id, alerts[0].groundReportId);
  assert.equal(report.level, 'emergency'); assert.equal(report.immediate, true);
  assert.deepEqual(report.alertIds.sort(), alerts.map(a => a.id).sort());
  assert.deepEqual(report.parameters.map(p => p.indicator).sort(), ['cabin_pressure', 'inspired_oxygen_pressure']);
  await api.post(`/alerts/${alerts[0].id}/acknowledge`, { astronautId: api.astronautId });
  assert.equal((await reports(api))[0].acknowledgement.status, 'pending');
  api.advance(2 * MINUTE + 1);
  const late = (await reports(api))[0];
  assert.equal(late.acknowledgement.status, 'not_acknowledged'); assert.equal(late.notAcknowledged, true);
  assert.deepEqual(late.acknowledgement.alerts.map(a => a.status).sort(), ['acknowledged', 'not_acknowledged']);
});

test('item 4: relatório manual, reenvio idempotente, validação e privacidade', async () => {
  const api = await memoryApi();
  await api.scenario('high-co2');
  // Estresse acima da faixa pessoal por 3 dias gera Caution, mas humor e estresse nunca são exportados.
  const day = 86400000, stress = [20, 22, 21, 20, 23, 21, 22, 90, 90, 90];
  api.advance(10 * day);
  const records = stress.map((value, i) => ({ indicator: 'stress', value, unit: null, source: 'simulated', recordedAt: new Date(api.now().getTime() - (9 - i) * day - 60000).toISOString() }));
  assert.equal((await api.post('/areas/isolation_confinement/records', { astronautId: api.astronautId, records })).status, 201);
  const active = (await api.get('/alerts')).body.active;
  assert.ok(active.some(a => a.indicator === 'stress' && a.level === 'caution'));
  const body = { astronautId: api.astronautId, id: 'manual-1', source: 'simulated', note: 'Routine update.',
    actions: [{ recordedAt: api.now().toISOString(), description: 'Crew checked the CO2 scrubber.' }] };
  const created = await api.post('/ground-reports', body);
  assert.equal(created.status, 201); assert.equal(created.body.replayed, false);
  const report = created.body.report;
  assert.equal(report.kind, 'manual'); assert.equal(report.level, null); assert.deepEqual(report.actions, body.actions); assert.equal(report.note, 'Routine update.');
  assert.equal(report.transmission.status, 'SENT'); assert.equal(report.acknowledgement.status, 'not_required');
  assert.ok(report.parameters.some(p => p.indicator === 'co2_partial_pressure'));
  assert.ok(report.parameters.every(p => p.indicator !== 'stress'));
  const writes = api.writes();
  const replay = await api.post('/ground-reports', body);
  assert.equal(replay.status, 200); assert.equal(replay.body.replayed, true); assert.equal(api.writes(), writes);
  assert.equal((await api.post('/ground-reports', { ...body, note: 'Changed.' })).status, 409);
  for (const invalid of [{ id: '../x' }, { source: 'unknown' }, { actions: 'none' }, { actions: [{ description: 'no date' }] }, { extra: true }, { astronautId: 'bad' }]) {
    assert.equal((await api.post('/ground-reports', { ...body, id: 'manual-2', ...invalid })).status, 400, JSON.stringify(invalid));
  }
  assert.equal((await reports(api)).filter(r => r.kind === 'manual').length, 1);
  // Consultar não grava; o relatório antigo da rota de operações continua preparado e não enviado.
  await api.get('/ground-reports'); await api.get('/overview');
  assert.equal(api.writes(), writes);
  const legacy = await api.post('/areas/distance_from_earth/operations/report', { astronautId: api.astronautId, id: 'legacy', source: 'simulated', actions: [] });
  assert.equal(legacy.body.operation.calculation.status, 'prepared'); assert.equal(legacy.body.operation.calculation.deliveryStatus, 'not_sent');
});

test('item 4: sem contexto de missão o relatório espera na fila', async () => {
  const api = await memoryApi();
  // Sinais vitais enviados sem perfil nem missão cadastrada.
  const now = api.now().toISOString(), sample = (value, unit) => ({ value, unit, recordedAt: now });
  await api.post('/areas/gravity_fields/operations/vitals', { astronautId: api.astronautId, id: 'v1', source: 'simulated', activity: 'routine', spo2Scale: 1, recordedAt: now, measurements: {
    heart_rate: sample(135, 'bpm'), blood_pressure_systolic: sample(88, 'mmHg'), blood_pressure_diastolic: sample(60, 'mmHg'), respiratory_rate: sample(26, 'breaths/min'),
    spo2: sample(90, '%'), body_temperature: sample(39.5, 'Cel'), supplemental_oxygen: sample(false, null), consciousness: sample('A', null) } });
  const [report] = await reports(api);
  assert.equal(report.transmission.status, 'QUEUED'); assert.equal(report.transmission.linkStatus, 'unknown');
  assert.equal(report.mission.missionId, null);
});
