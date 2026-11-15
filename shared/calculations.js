import { catalog } from './config/catalog.js';
import { invalid, timestamp, validateBatch, validAstronaut } from './validation.js';

export const pvtProtocol = Object.freeze({ version: 'pvt-b-v1', durationMs: 180000, timeoutMs: 30000, lapseMs: 355, falseStartBelowMs: 100, maxEvents: 2000 });
function object(value, allowed, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(field, 'Send an object.');
  for (const key of Object.keys(value)) if (!allowed.includes(key)) invalid(`${field}.${key}`, 'Unknown field.');
}
function number(value, field, min, max) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) invalid(field, `Send a finite number between ${min} and ${max}.`);
}
function date(value, field) {
  if (!timestamp(value)) invalid(field, 'Send a valid ISO 8601 date with a time zone.');
  return Date.parse(value);
}
function common(body, idField, fields) {
  object(body, ['astronautId', idField, 'source', ...fields], 'body');
  if (!validAstronaut(body.astronautId)) invalid('astronautId', 'Use a valid astro_ identifier.');
  if (typeof body[idField] !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(body[idField])) invalid(idField, 'Use 1–128 characters: ASCII letters, digits, period, hyphen, underscore or colon.');
  if (!['manual', 'sensor', 'simulated'].includes(body.source)) invalid('source', 'Use manual, sensor or simulated.');
}
function operation(kind, id, input, status, calculation, records) {
  return { operation: { kind, id, astronautId: input.astronautId, source: input.source, input, status, calculation,
    createdAt: new Date().toISOString(), recordIds: records.map(r => r.id) }, records };
}
function aggregateRecords(body, values, recordedAt, extra = {}) {
  return validateBatch({ astronautId: body.astronautId, records: values.map(([indicator, value, unit]) => ({
    indicator, value, unit, source: body.source, recordedAt, ...extra,
  })) }, 'isolation_confinement', catalog.isolation_confinement);
}
export function calculateSleep(body) {
  common(body, 'episodeId', ['bedAt', 'wakeAt', 'sleepLatencyMinutes', 'awakeMinutes']);
  const bed = date(body.bedAt, 'bedAt'), wake = date(body.wakeAt, 'wakeAt');
  const timeInBedMinutes = (wake - bed) / 60000;
  if (timeInBedMinutes <= 0 || timeInBedMinutes > 1440) invalid('wakeAt', 'Wake time must be after bedtime, within 24 h.');
  number(body.sleepLatencyMinutes, 'sleepLatencyMinutes', 0, timeInBedMinutes);
  number(body.awakeMinutes, 'awakeMinutes', 0, timeInBedMinutes);
  const awake = body.sleepLatencyMinutes + body.awakeMinutes;
  if (awake > timeInBedMinutes) invalid('awakeMinutes', 'Sleep latency and time awake cannot exceed the time in bed.');
  const unroundedHours = (timeInBedMinutes - awake) / 60;
  const durationHours = Number(unroundedHours.toFixed(2));
  // Explicit key order makes JSON property ordering irrelevant to idempotency.
  const input = { astronautId: body.astronautId, episodeId: body.episodeId, source: body.source,
    bedAt: body.bedAt, wakeAt: body.wakeAt, sleepLatencyMinutes: body.sleepLatencyMinutes, awakeMinutes: body.awakeMinutes };
  const records = aggregateRecords(body, [['sleep_duration', durationHours, 'h']], body.wakeAt, { periodStart: body.bedAt });
  return operation('sleep', body.episodeId, input, 'completed', { version: 'sleep-v1', timeInBedMinutes, unroundedHours, durationHours, precision: 2 }, records);
}
export function calculatePvt(body) {
  common(body, 'sessionId', ['startedAt', 'endedAt', 'durationMs', 'completed', 'events']);
  if (date(body.endedAt, 'endedAt') <= date(body.startedAt, 'startedAt')) invalid('endedAt', 'End must be after start.');
  if (typeof body.completed !== 'boolean') invalid('completed', 'Send a boolean.');
  number(body.durationMs, 'durationMs', 0, pvtProtocol.durationMs + pvtProtocol.timeoutMs);
  if (body.completed && body.durationMs < pvtProtocol.durationMs) invalid('durationMs', 'A completed session must cover at least 180000 ms.');
  if (!Array.isArray(body.events) || body.events.length > pvtProtocol.maxEvents || (body.completed && !body.events.length)) invalid('events', 'Send up to 2000 events; a completed session needs events.');
  let lastAt = -1, validResponses = 0, lapses = 0, falseStarts = 0, timeouts = 0, reciprocalSum = 0;
  const events = body.events.map((event, index) => {
    const field = `events[${index}]`;
    object(event, event?.kind === 'response' ? ['kind', 'atMs', 'rtMs'] : ['kind', 'atMs'], field);
    if (!['response', 'false_start', 'timeout'].includes(event.kind)) invalid(`${field}.kind`, 'Use response, false_start or timeout.');
    number(event.atMs, `${field}.atMs`, 0, body.durationMs);
    if (event.atMs <= lastAt) invalid(`${field}.atMs`, 'Events must be in strict time order, without duplicates.');
    let rt;
    if (event.kind === 'response') {
      number(event.rtMs, `${field}.rtMs`, 0, pvtProtocol.timeoutMs);
      if (event.rtMs === pvtProtocol.timeoutMs) invalid(`${field}.rtMs`, 'At 30000 ms, send timeout.');
      rt = event.rtMs;
    } else if (event.kind === 'timeout') { rt = pvtProtocol.timeoutMs; timeouts++; }
    if (rt !== undefined) {
      const stimulusAt = event.atMs - rt;
      if (stimulusAt < 0 || stimulusAt < lastAt || stimulusAt >= pvtProtocol.durationMs) invalid(field, 'Stimulus outside the 3 min window or overlapping the previous event.');
    } else if (event.atMs >= pvtProtocol.durationMs) invalid(field, 'A tap without a stimulus must happen within the 3 min window.');
    lastAt = event.atMs;
    if (event.kind === 'false_start' || rt < pvtProtocol.falseStartBelowMs) falseStarts++;
    else {
      validResponses++;
      reciprocalSum += 1000 / rt;
      if (rt >= pvtProtocol.lapseMs) lapses++;
    }
    return { kind: event.kind, atMs: event.atMs, ...(event.kind === 'response' ? { rtMs: event.rtMs } : {}) };
  });
  const meanReciprocalSeconds = validResponses ? reciprocalSum / validResponses : null;
  const responseSpeed = meanReciprocalSeconds === null ? null : Number(meanReciprocalSeconds.toFixed(4));
  const status = !body.completed ? 'interrupted' : validResponses ? 'completed' : 'no_valid_responses';
  const input = { astronautId: body.astronautId, sessionId: body.sessionId, source: body.source, startedAt: body.startedAt,
    endedAt: body.endedAt, durationMs: body.durationMs, completed: body.completed, events };
  const calculation = { protocol: pvtProtocol, validResponses, timeouts, lapses, falseStarts, meanReciprocalSeconds, responseSpeed, precision: 4 };
  const records = status === 'completed' ? aggregateRecords(body, [
    ['pvt_response_speed', responseSpeed, '1/s'], ['pvt_lapses', lapses, 'count'], ['pvt_false_starts', falseStarts, 'count'],
  ], body.endedAt, { groupId: body.sessionId }) : [];
  return operation('pvt', body.sessionId, input, status, calculation, records);
}
