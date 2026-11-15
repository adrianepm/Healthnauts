import { chronological } from './trends.js';
import { numericError } from './validation.js';
import { finalize, maxLevel } from './config/levels.js';
const DAY = 86400000;
const dayNumber = value => Math.floor(Date.parse(value) / DAY);
const thresholdMatch = (value, rule) => rule.operator === 'lte' ? value <= rule.value : value >= rule.value;
const outside = (value, range, direction) => direction === 'above' ? value > range.upper
  : direction === 'below' ? value < range.lower : value < range.lower || value > range.upper;

// One latest observation per UTC day; manual/sensor/simulated are never pooled.
function dailySeries(records) {
  const byDay = new Map();
  for (const record of records) byDay.set(dayNumber(record.recordedAt), record);
  return [...byDay.values()];
}
function streak(records, count, matches) {
  if (records.length < count) return false;
  const tail = records.slice(-count);
  return tail.every((record, i) => matches(record.value)
    && (i === 0 || dayNumber(record.recordedAt) === dayNumber(tail[i - 1].recordedAt) + 1));
}
function baselineFor(records, config, asOf) {
  if (!records.length) return { status: 'insufficient', sampleCount: 0, config, reason: 'no_data' };
  const firstDay = dayNumber(records[0].recordedAt);
  const endDay = firstDay + config.days;
  const sample = records.filter(r => dayNumber(r.recordedAt) < endDay);
  const base = { config, from: new Date(firstDay * DAY).toISOString(), to: new Date(endDay * DAY).toISOString(), sampleCount: sample.length, recordIds: sample.map(r => r.id) };
  if (asOf < endDay * DAY) return { ...base, status: 'collecting', reason: 'first_seven_days' };
  if (sample.length < config.minSamples) return { ...base, status: 'insufficient', reason: 'missing_days' };
  const mean = sample.reduce((sum, r) => sum + r.value, 0) / sample.length;
  const sd = Math.sqrt(sample.reduce((sum, r) => sum + (r.value - mean) ** 2, 0) / (sample.length - 1));
  // Piso de DP (quando configurado) evita faixa estreita demais; sem piso, variância zero não forma faixa.
  const floor = config.minStandardDeviation ?? 0;
  if (!Number.isFinite(sd) || (sd === 0 && !floor)) return { ...base, status: 'insufficient', reason: 'zero_variance', mean, standardDeviation: Number.isFinite(sd) ? sd : null };
  const applied = Math.max(sd, floor);
  return { ...base, status: 'ready', mean, standardDeviation: sd, appliedStandardDeviation: applied, lower: mean - config.multiplier * applied, upper: mean + config.multiplier * applied };
}
export function monitoring(records, definitions, dataset, asOf = new Date()) {
  const end = new Date(asOf).getTime();
  return definitions.filter(d => d.monitoring).flatMap(def => (dataset === 'simulated' ? ['simulated'] : ['manual', 'sensor']).map(source => {
    const observations = records.filter(r => r.indicator === def.id && r.source === source && r.unit === def.unit
      && Number.isFinite(r.value) && !numericError(r.value, def.scale) && Date.parse(r.recordedAt) < end).sort(chronological);
    const daily = dailySeries(observations);
    const latest = observations.at(-1);
    const result = { indicator: def.id, source, isSimulated: source === 'simulated', unit: def.unit,
      asOf: new Date(end).toISOString(), evaluatedRecordId: latest?.id ?? null, recordedAt: latest?.recordedAt ?? null,
      isDemonstrative: true, status: 'no_data', level: null, inObservation: false, matchedRules: [],
      message: 'No comparable data are available.', baseline: null, recordIds: latest ? [latest.id] : [] };
    const config = def.monitoring;
    if (config.baseline) result.baseline = baselineFor(daily, config.baseline, end);
    if (!latest) return result;
    if (result.baseline && result.baseline.status !== 'ready') return { ...result,
      status: result.baseline.status === 'collecting' ? 'baseline_collecting' : 'baseline_insufficient',
      recordIds: result.baseline.recordIds ?? [], message: 'Your personal range is not ready yet. Keep logging every day.' };
    const matchingIds = new Set(result.baseline?.recordIds ?? []);
    if (latest) matchingIds.add(latest.id);
    const matches = config.rules.filter(rule => {
      if (rule.kind === 'threshold') {
        daily.slice(-rule.consecutive).forEach(r => matchingIds.add(r.id));
        return streak(daily, rule.consecutive, value => thresholdMatch(value, rule));
      }
      const postBaseline = daily.filter(r => Date.parse(r.recordedAt) >= Date.parse(result.baseline.to));
      postBaseline.slice(-rule.consecutive).forEach(r => matchingIds.add(r.id));
      return streak(postBaseline, rule.consecutive, value => outside(value, result.baseline, rule.direction));
    });
    if (result.baseline && Date.parse(latest.recordedAt) < Date.parse(result.baseline.to)) return { ...result, status: 'awaiting_follow_up', recordIds: result.baseline.recordIds, message: 'Your personal range is ready. Log a new entry to compare.' };
    const level = maxLevel(matches.map(r => r.level));
    const top = matches.find(r => r.level === level);
    const above = top?.kind === 'personal_range' && top.direction === 'outside' && latest.value > result.baseline.upper;
    return { ...result, recordIds: [...matchingIds], status: !config.rules.length ? 'not_applicable' : matches.length ? 'in_observation' : 'no_demonstrative_signal',
      level, inObservation: matches.length > 0, matchedRules: matches,
      message: top ? finalize(above ? top.messageAbove ?? top.message : top.message, level)
        : !config.rules.length ? 'Recorded. No follow-up rule applies to this count.'
        : config.baseline ? 'Within your usual range.' : 'Within the expected range.' };
  }));
}
