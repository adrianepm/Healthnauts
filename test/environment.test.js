import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateResearch } from '../shared/research-operations.js';
import { evaluateArea, news2 } from '../shared/evaluation.js';
import { rules } from '../shared/config/research.js';

const clock = new Date('2026-11-14T15:00:00Z'), time = clock.getTime();
const MINUTE = 60000, HOUR = 60 * MINUTE;
const iso = (ms = 0) => new Date(time + ms).toISOString();
const astronautId = 'astro_demo_001', ctx = { astronautId, dataset: 'real' };
const base = id => ({ id, source: 'manual', astronautId });
const calc = (kind, body) => calculateResearch(kind, body, clock);
const evaluate = (area, rows, operations = [], at = time) => evaluateArea(area, rows, operations, ctx, at);
const find = (list, indicator) => list.find(e => e.indicator === indicator);
let counter = 0;
const row = (areaId, indicator, value, extra = {}) => ({ id: 'r' + counter++, astronautId, areaId, indicator, value, unit: null, source: 'manual', recordedAt: iso(-1000), ...extra });
const cabin = (pressure, oxygenFraction = 0.21, co2Ppm = 3000) => calc('atmosphere', { ...base('gas' + counter++), location: 'lab', environment: 'nominal_cabin',
  recordedAt: iso(-1000), pressure, co2Ppm, oxygenFraction }).records;
const mission = (extra = {}) => calc('mission', { ...base('mission'), missionId: 'm1', startedAt: iso(-100 * MINUTE), recordedAt: iso(-100 * MINUTE), destination: 'ISS',
  activity: 'routine', communication: 'available', solarConjunction: false, oneWaySeconds: 1, medicalResources: 'Demo', ...extra }).operation;

test('item 3: pressão total fora de 5,0 a 15,0 psia é Emergency', () => {
  const level = psia => find(evaluate('hostile_closed_environment', cabin({ value: psia, unit: 'psia' })), 'cabin_pressure');
  for (const psia of [5, 10.2, 14.7, 15]) { assert.equal(level(psia).level, null, psia); assert.equal(level(psia).displayLevel, 'normal'); }
  for (const psia of [4.99, 15.01, 2]) assert.equal(level(psia).level, 'emergency', psia);
  const low = level(4.3);
  assert.ok(Math.abs(low.psia - 4.3) < 1e-9);
  assert.match(low.message, /^CABIN PRESSURE OUTSIDE SAFE LIMITS\. Follow the depressurization emergency procedure now\./);
  assert.equal(low.rule.source.classification, 'official_standard');
  assert.equal(low.rule.levelSource.classification, 'team_proposal');
  assert.equal(low.critical, true);
});

test('item 3: PIO2 127 a 144 ou 156 a 356 é Caution; abaixo de 127 ou acima de 356 é Emergency', () => {
  // A 760 mmHg, PIO2 = 713 × FiO2.
  const level = fraction => find(evaluate('hostile_closed_environment', cabin({ value: 760, unit: 'mmHg' }, fraction)), 'inspired_oxygen_pressure');
  assert.equal(level(0.21).level, null);
  for (const [pio2, expected] of [[145, null], [155, null], [144.9, 'caution'], [127, 'caution'], [126.9, 'emergency'], [155.1, 'caution'], [356, 'caution'], [356.1, 'emergency']]) {
    const result = level(pio2 / 713);
    assert.ok(Math.abs(result.value - pio2) < 1e-6);
    assert.equal(result.level, expected, pio2);
  }
  assert.match(level(0.1).message, /^OXYGEN OUTSIDE SAFE LIMITS\./);
  assert.match(level(0.19).message, /Follow your mission's approved procedure\. Talk to your Crew Medical Officer\.$/);
});

test('item 3: ppCO2 de 1 h acima de 3,0 é Caution e acima de 4,5 é Warning; média de 7 dias a partir de 2,5 é Advisory', () => {
  const samples = (value, minutes) => minutes.map(minute => row('hostile_closed_environment', 'co2_partial_pressure', value,
    { recordedAt: iso(minute * MINUTE), context: { location: 'lab', environment: 'nominal_cabin' } }));
  const hour = [-60, -50, -40, -30, -20, -10, 0];
  const hourly = value => find(evaluate('hostile_closed_environment', samples(value, hour)), 'co2_partial_pressure');
  for (const [value, level] of [[3, null], [3.001, 'caution'], [4.5, 'caution'], [4.501, 'warning']]) assert.equal(hourly(value).level, level, value);
  assert.match(hourly(5).message, /^Cabin CO2 is high\. Follow your mission's CO2 procedure/);
  assert.equal(hourly(5).rule.levelSource.classification, 'team_proposal');
  const week = Array.from({ length: 7 * 24 * 6 + 1 }, (_, i) => -i * 10).reverse();
  const weekly = (value, minutes = week) => find(evaluate('hostile_closed_environment', samples(value, minutes)), 'co2_partial_pressure_7d');
  assert.equal(weekly(2.5).level, 'advisory');
  assert.ok(Math.abs(weekly(2.5).value - 2.5) < 1e-9);
  assert.equal(weekly(2.49).level, null); assert.equal(weekly(2.49).displayLevel, 'normal');
  // Sem sete dias contínuos não há média: nada é extrapolado.
  const partial = weekly(4, hour);
  assert.equal(partial.status, 'insufficient_data'); assert.equal(partial.displayLevel, 'unavailable'); assert.equal(partial.level, null);
});

test('item 3: caixa de temperatura e umidade', () => {
  const level = (temperature, humidity, at = time) => find(evaluate('hostile_closed_environment', [
    row('hostile_closed_environment', 'temperature', temperature, { unit: 'Cel' }), row('hostile_closed_environment', 'relative_humidity', humidity, { unit: '%' })], [], at), 'temperature_humidity');
  for (const [t, h, expected] of [[20, 30, null], [25, 60, null], [23, 45, null], [26, 45, 'advisory'], [19, 45, 'advisory'], [23, 61, 'advisory'], [23, 27, 'advisory'], [23, 25, 'advisory'],
    [27.1, 45, 'caution'], [17.9, 45, 'caution'], [23, 24.9, 'caution']]) assert.equal(level(t, h).level, expected, `${t} °C / ${h} %`);
  assert.equal(level(28, 45).message, "Cabin temperature or humidity is outside safe limits. Alert the crew. Follow your mission's approved procedure. Talk to your Crew Medical Officer.");
  assert.equal(level(28, 45, time + 5 * MINUTE).status, 'stale');
  const alone = find(evaluate('hostile_closed_environment', [row('hostile_closed_environment', 'temperature', 23, { unit: 'Cel' })]), 'temperature_humidity');
  assert.equal(alone.status, 'insufficient_data');
});

test('item 3: ruído 58 dBA no trabalho, 49 dBA no sono e teto de 85 dBA', () => {
  const level = (dba, context) => find(evaluate('hostile_closed_environment', calc('noise', { ...base('noise' + counter++), location: 'lab', context, method: 'slm',
    periodStart: iso(-2 * MINUTE), recordedAt: iso(-1000), dba }).records), 'cabin_noise');
  for (const [dba, context, expected] of [[58, 'work', null], [58.1, 'work', 'advisory'], [84.9, 'work', 'advisory'], [85, 'work', 'caution'],
    [49, 'sleep', null], [50, 'sleep', 'advisory'], [85, 'sleep', 'caution']]) assert.equal(level(dba, context).level, expected, `${dba} ${context}`);
  assert.equal(level(60, 'sleep').reference, 49);
  assert.equal(level(90, 'work').message, 'Noise is above 85 dBA. Leave the area or use hearing protection now. Talk to your Crew Medical Officer.');
});

test('item 3: massa 3% a 5% Advisory e acima de 5% Caution; aeróbico e força 80% a 89% Advisory', () => {
  const reference = (indicator, value, unit) => calc('reference', { ...base('ref-' + indicator), missionId: 'm1', method: 'std', indicator, recordedAt: iso(-101 * MINUTE), value, unit }).operation;
  const check = (indicator, unit, referenceValue, value) => find(evaluate('gravity_fields',
    [row('gravity_fields', indicator, value, { unit, context: { missionId: 'm1', method: 'std' } })], [mission(), reference(indicator, referenceValue, unit)]), indicator);
  for (const [value, expected] of [[80, null], [78, null], [77.5, 'advisory'], [76, 'advisory'], [75, 'caution']]) assert.equal(check('body_mass', 'kg', 80, value).level, expected, value);
  assert.match(check('body_mass', 'kg', 80, 75).message, /more than 5% of your pre-flight body mass/);
  for (const indicator of ['aerobic_capacity', 'muscle_strength']) {
    const unit = rules[indicator] && indicator === 'aerobic_capacity' ? 'mL/kg/min' : 'N';
    for (const [value, expected] of [[40, null], [36, null], [35.9, 'advisory'], [32, 'advisory'], [31.9, 'caution']]) assert.equal(check(indicator, unit, 40, value).level, expected, `${indicator} ${value}`);
    assert.match(check(indicator, unit, 40, 30).message, /below 80% of your pre-flight level/);
  }
  // VO2max abaixo do mínimo em contexto de EVA é Warning.
  const vo2 = value => find(evaluate('gravity_fields', [row('gravity_fields', 'vo2max', value, { unit: 'mL/kg/min', context: { activity: 'eva', evaEnvironment: 'microgravity', method: 'std' } })]), 'vo2max');
  assert.equal(vo2(32.8).level, 'warning'); assert.equal(vo2(32.9).level, null);
});

test('item 3: sintomas da seção 3.4', () => {
  const symptom = (indicator, rows, at = time) => find(evaluate('gravity_fields', rows.map(([id, value]) => row('gravity_fields', id, value)), [], at), indicator);
  for (const [value, expected] of [[0, null], [4, null], [5, 'advisory'], [19, 'advisory'], [20, 'caution']]) assert.equal(symptom('motion_sickness', [['motion_sickness', value]]).level, expected, value);
  assert.equal(symptom('dizziness', [['dizziness', 0]]).level, null);
  assert.equal(symptom('dizziness', [['dizziness', 1]]).level, 'advisory');
  const faint = symptom('dizziness', [['dizziness', 1], ['near_fainting', 1]]);
  assert.equal(faint.level, 'warning'); assert.equal(faint.requiresAcknowledgement, true);
  assert.match(faint.message, /^Dizziness with near-fainting\./);
  assert.equal(symptom('vision_change', [['vision_change', 1]]).level, 'caution');
  assert.equal(symptom('amsler_change', [['amsler_change', 1]]).level, 'caution');
  assert.equal(symptom('amsler_change', [['amsler_change', 0]]).level, null);
  for (const [value, expected] of [[3, null], [4, 'advisory'], [10, 'advisory']]) assert.equal(symptom('headache', [['headache', value]]).level, expected, value);
  // Sem relato ou relato com mais de 36 h: Unavailable.
  assert.equal(symptom('headache', []).displayLevel, 'unavailable');
  assert.equal(symptom('headache', [['headache', 8]], time + 36 * HOUR).status, 'stale');
  assert.equal(symptom('headache', [['headache', 8]]).rule.source.classification, 'team_proposal');
});

test('stand test só recebe nível depois do pouso', () => {
  const posture = (activity, standing, extraRows = []) => {
    const sample = (position, seconds, systolic, diastolic, heartRate) => ({ position, recordedAt: iso(-10 * MINUTE + seconds * 1000), systolic, diastolic, heartRate });
    const { operation, records } = calc('posture', { ...base('posture' + counter++), supervised: true, activity, standAt: iso(-10 * MINUTE),
      samples: [sample('supine', -60, 120, 80, 60), sample('standing', 60, ...standing)] });
    return find(evaluate('gravity_fields', [...records, ...extraRows], [operation]), 'posture');
  };
  assert.equal(posture('routine', [90, 60, 100]).status, 'not_applicable');
  assert.equal(posture('routine', [90, 60, 100]).level, null);
  assert.equal(posture('post_landing', [118, 79, 70]).level, null);
  assert.equal(posture('post_landing', [118, 79, 90]).level, 'advisory');
  assert.equal(posture('post_landing', [100, 79, 70]).level, 'caution');
  assert.equal(posture('post_landing', [119, 70, 70]).level, 'caution');
  const dizzy = [row('gravity_fields', 'dizziness', 1, { recordedAt: iso(-5 * MINUTE) })];
  assert.equal(posture('post_landing', [100, 79, 70], dizzy).level, 'warning');
  assert.equal(posture('post_landing', [118, 79, 70], dizzy).level, null);
});

test('validade 2.4: sinais vitais 10 min, cabine 5 min, check-in 36 h e valores impossíveis viram Unavailable', () => {
  const sample = (value, unit) => ({ value, unit, recordedAt: iso(-1000) });
  const vitals = extra => calc('vitals', { ...base('v' + counter++), recordedAt: iso(0), activity: 'routine', spo2Scale: 1, measurements: {
    heart_rate: sample(118, 'bpm'), blood_pressure_systolic: sample(104, 'mmHg'), blood_pressure_diastolic: sample(66, 'mmHg'), respiratory_rate: sample(23, 'breaths/min'),
    spo2: sample(95, '%'), body_temperature: sample(39.4, 'Cel'), supplemental_oxygen: sample(false, null), consciousness: sample('A', null), ...extra } });
  const fever = vitals({});
  const high = news2(fever.operation, fever.records, time);
  // NEWS2 alto vira Warning, nunca Emergency.
  assert.equal(high.score, 8); assert.equal(high.scientificCategory, 'high'); assert.equal(high.level, 'warning');
  assert.match(high.message, /^Several vital signs are outside the expected range\./);
  assert.equal(news2(fever.operation, fever.records, time + 10 * MINUTE).status, 'assessed');
  const old = news2(fever.operation, fever.records, time + 10 * MINUTE + 1);
  assert.equal(old.status, 'stale'); assert.equal(old.level, null);
  assert.equal(old.message, 'No reliable vital signs. Check that the sensor is on and in contact with your skin.');
  for (const extra of [{ heart_rate: sample(0, 'bpm') }, { heart_rate: sample(251, 'bpm') }, { body_temperature: sample(29.9, 'Cel') }]) {
    const bad = vitals(extra), result = news2(bad.operation, bad.records, time);
    assert.equal(result.status, 'insufficient_data'); assert.equal(result.reason, 'implausible_value'); assert.equal(result.score, null);
  }
  const medium = vitals({ heart_rate: sample(75, 'bpm'), respiratory_rate: sample(16, 'breaths/min'), body_temperature: sample(37, 'Cel'), spo2: sample(91, '%') });
  assert.equal(news2(medium.operation, medium.records, time).level, 'caution');
  const pressure = at => find(evaluate('hostile_closed_environment', cabin({ value: 14.7, unit: 'psia' }), [], at), 'cabin_pressure');
  assert.equal(pressure(time + 5 * MINUTE - 1000).displayLevel, 'normal');
  const stale = pressure(time + 5 * MINUTE);
  assert.equal(stale.status, 'stale'); assert.equal(stale.displayLevel, 'unavailable'); assert.equal(stale.critical, true);
  assert.equal(stale.message, 'No reliable data. Check the sensor and measure again.');
  const sleep = at => find(evaluate('isolation_confinement', [row('isolation_confinement', 'sleep_duration', 3, { unit: 'h' })], [], at), 'sleep_duration');
  assert.equal(sleep(time).level, 'warning');
  assert.equal(sleep(time + 36 * HOUR - 2000).level, 'warning');
  const expired = sleep(time + 36 * HOUR);
  assert.equal(expired.status, 'stale'); assert.equal(expired.level, null); assert.equal(expired.displayLevel, 'unavailable');
});

test('radiação: carreira 75/90/100% e evento solar por classe e atividade', () => {
  const dose = { ...base('dose'), missionId: 'm1', quantity: 'effective', organ: null, mode: 'counter', unit: 'mSv', doseMethod: 'NASA_Q' };
  const career = value => {
    const prior = calc('radiation', { ...dose, id: 'prior', scope: 'prior_spaceflight', seriesId: 'prior', periodStart: iso(-400 * MINUTE), recordedAt: iso(-200 * MINUTE), value: 300, completePriorHistory: true });
    const current = calc('radiation', { ...dose, scope: 'mission', seriesId: 'dosimeter', periodStart: iso(-100 * MINUTE), recordedAt: iso(-MINUTE), value: value - 300, completePriorHistory: false });
    return find(evaluate('radiation', [...prior.records, ...current.records], [prior.operation, current.operation, mission()]), 'career_effective_dose');
  };
  for (const [value, expected] of [[449, null], [450, 'advisory'], [539, 'advisory'], [540, 'caution'], [599, 'caution'], [600, 'warning'], [700, 'warning']]) assert.equal(career(value).level, expected, value);
  assert.equal(career(600).level === 'emergency', false);
  const simulated = { astronautId, dataset: 'simulated' };
  const solar = (input, missionInput) => {
    const event = calculateResearch('solar', { astronautId, source: 'simulated', id: 's' + counter++, recordedAt: iso(-1000), ...input }, clock);
    const operations = [event.operation, ...(missionInput ? [calculateResearch('mission', { ...mission().input, source: 'simulated', ...missionInput }, clock).operation] : [])];
    return evaluateArea('radiation', event.records, operations, simulated, time).find(e => e.indicator === 'solar_event_simulated');
  };
  assert.equal(solar({ active: true }).level, 'advisory');
  assert.equal(solar({ active: true, eventClass: 'ESPE' }).level, 'warning');
  assert.match(solar({ active: true, eventClass: 'ESPE' }).message, /shelter procedure/);
  assert.equal(solar({ active: true }, { activity: 'eva' }).level, 'warning');
  assert.match(solar({ active: true }, { activity: 'eva' }).message, /^Solar particle event during EVA\./);
  assert.equal(solar({ active: false }).level, null);
  assert.equal(solar({ active: false }).message, 'Radiation levels are back to normal.');
  assert.throws(() => solar({ active: true, eventClass: 'X9' }), { code: 'VALIDATION_ERROR' });
  // Especificação 3.5: "Sem evento" é Normal, não Unavailable; a dose de carreira continua no resultado.
  const none = evaluateArea('radiation', [], [], simulated, time);
  const noEvent = none.find(e => e.indicator === 'solar_event_simulated');
  assert.equal(noEvent.displayLevel, 'normal');
  assert.equal(noEvent.message, 'No solar event recorded.');
  assert.ok(none.some(e => e.indicator === 'career_effective_dose'));
});
