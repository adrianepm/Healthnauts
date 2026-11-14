import { monitoring } from './monitoring.js';
import { chronological } from './trends.js';
import { catalog } from './config/catalog.js';
import { freshness, rules, assessmentMessages as messages } from './config/research.js';
import { inDataset } from './research-operations.js';

export const datasetFor = source => source === 'simulated' ? 'simulated' : 'real';
export const recordScope = (records, ctx) => records.filter(r => r.astronautId === ctx.astronautId && inDataset(r,ctx.dataset));
const at = record => Date.parse(record.recordedAt);
const iso = ms => new Date(ms).toISOString();
function evaluation(rule, indicator, series, status, details = {}) {
  const { level = null, message = messages[status], ...rest } = details;
  return { indicator, rule, status, level, inObservation:level !== null, quality:status,
    recordIds:[...new Set(series.map(r => r.id))], recordedAt:series.at(-1)?.recordedAt ?? null,
    source:series.at(-1)?.source ?? null, scientificCategory:null, message, limitation:rule.limitation ??
      'Demonstration only. Results do not determine diagnosis or operational clearance.', ...rest };
}

export function weightedWindow(samples, end, rule = rules.co2) {
  const from = end - rule.windowMs;
  const groups = Map.groupBy([...samples].sort(chronological),at);
  // Conflicting samples at one instant break an interpolation segment.
  const rows = [...groups.values()].map(group => group.every(r => r.value === group[0].value) ? group[0] : null);
  let coveredMs = 0;
  let integral = 0;
  const used = new Set();
  for (let i = 1; i < rows.length; i++) {
    const left = rows[i-1], right = rows[i];
    if (!left || !right) continue;
    const gap = at(right)-at(left);
    if (gap > rule.maxGapMs) continue;
    const start = Math.max(from,at(left)), stop = Math.min(end,at(right));
    if (stop <= start) continue;
    const y = time => left.value + (right.value-left.value) * (time-at(left))/gap;
    integral += (y(start)+y(stop))/2 * (stop-start);
    coveredMs += stop-start;
    used.add(left); used.add(right);
  }
  const coverage = coveredMs / rule.windowMs;
  return { value:coverage >= rule.minCoverage && coveredMs ? integral/coveredMs : null, coverage, coveredMs,
    from:iso(from), to:iso(end), records:[...used] };
}

function assessCo2(records, time) {
  const rule = rules.co2;
  const samples = records.filter(r => r.indicator === 'co2_partial_pressure' && r.context?.environment === 'nominal_cabin');
  const grouped = Map.groupBy(samples,r => JSON.stringify([r.source,r.context.location]));
  if (!grouped.size) {
    const other = records.filter(r => r.indicator === 'co2_partial_pressure').at(-1);
    return [evaluation(rule,'co2_partial_pressure',other ? [other] : [],other ? 'not_applicable' : 'insufficient_data',
      other ? { context:other.context } : {})];
  }
  return [...grouped.values()].map(series => {
    const latest = series.at(-1), context = latest.context;
    if (time-at(latest) > rule.maxAgeMs) return evaluation(rule,latest.indicator,[latest],'stale',{ context });
    const { records:used, ...window } = weightedWindow(series,at(latest),rule);
    const common = { context, window, value:window.value, unit:'mmHg' };
    if (window.value === null) return evaluation(rule,latest.indicator,used.length ? used : [latest],'insufficient_data',common);
    const outside = window.value > rule.limit;
    return evaluation(rule,latest.indicator,used,outside ? 'assessed' : 'no_demonstrative_signal',{
      ...common, scientificCategory:outside ? 'above_design_reference' : 'within_design_reference',
      ...(outside ? { level:'attention', message:rule.message } : {}),
    });
  });
}

export function news2(operation, records, time) {
  const rule = rules.news2, input = operation.input;
  const samples = input.measurements;
  const expected = [...Object.keys(rule.bands),'supplemental_oxygen','consciousness'];
  const missing = expected.filter(indicator => !Object.hasOwn(samples,indicator));
  const context = { activity:input.activity, spo2Scale:1, assessmentId:operation.id };
  const base = { context, missing, diastolicIncludedInScore:false, operationId:operation.id };
  if (missing.length) return evaluation(rule,'news2',records,'insufficient_data',{ ...base, score:null, components:null });
  const components = {};
  for (const [indicator,bands] of Object.entries(rule.bands)) {
    components[indicator] = bands.find(([max]) => max === null || samples[indicator].value <= max)[1];
  }
  components.supplemental_oxygen = samples.supplemental_oxygen.value ? rule.oxygenPoints : 0;
  components.consciousness = samples.consciousness.value === 'A' ? 0 : rule.alteredConsciousnessPoints;
  const score = Object.values(components).reduce((a,b) => a+b,0);
  const individualTrigger = Object.values(components).includes(rule.individualTrigger);
  const scientificCategory = score >= rule.high ? 'high' : score >= rule.medium ? 'medium' : individualTrigger ? 'low_medium' : 'low';
  const stale = time-Date.parse(input.recordedAt) > rule.maxAgeMs;
  const level = stale || scientificCategory === 'low' ? null : scientificCategory === 'high' ? 'risk' : 'attention';
  return evaluation(rule,'news2',records,stale ? 'stale' : 'assessed',{ ...base, components, score, individualTrigger, scientificCategory, level,
    ...(level ? { message:rule.message } : {}) });
}

function assessFitness(records, operations, time) {
  const collected = records.filter(r => ['body_mass','aerobic_capacity','muscle_strength','vo2max'].includes(r.indicator));
  const pairs = Map.groupBy(collected,r => JSON.stringify([r.indicator,r.source,r.context?.missionId,r.context?.method,r.context?.evaEnvironment]));
  const result = [];
  for (const indicator of ['body_mass','aerobic_capacity','muscle_strength','vo2max']) {
    if (!collected.some(r => r.indicator === indicator)) result.push(evaluation(rules[indicator] ?? rules.evaMicro,indicator,[],'insufficient_data'));
  }
  for (const series of pairs.values()) {
    const r = series.at(-1);
    const { indicator, context = {} } = r;
    const rule = rules[indicator] ?? (context.evaEnvironment === 'surface' ? rules.evaSurface : rules.evaMicro);
    const common = { context, unit:r.unit, observedValue:r.value };
    if (time-at(r) > freshness.fitnessMs) { result.push(evaluation(rule,indicator,[r],'stale',common)); continue; }
    if (indicator === 'vo2max') {
      const applies = context.activity === 'eva' && Boolean(context.evaEnvironment && context.method);
      const below = applies && r.value < rule.minimum;
      result.push(evaluation(rule,indicator,[r],applies ? 'assessed' : 'not_applicable',{ ...common,
        scientificCategory:applies ? below ? 'below_performance_reference' : 'meets_performance_reference' : null,
        ...(below ? { level:'attention', message:rule.message } : {}) }));
      continue;
    }
    const mission = operations.filter(o => o.kind === 'mission' && o.input.missionId === context.missionId && Date.parse(o.input.recordedAt) <= at(r))
      .sort((a,b) => at(a.input)-at(b.input)).at(-1);
    const reference = mission && context.method && operations.filter(o => o.kind === 'reference' && o.input.missionId === context.missionId &&
      o.input.indicator === indicator && o.input.method === context.method && o.input.unit === r.unit &&
      Date.parse(o.input.recordedAt) < Date.parse(mission.input.startedAt) && at(r) >= Date.parse(mission.input.startedAt))
      .sort((a,b) => at(a.input)-at(b.input)).at(-1);
    const referenceInfo = { ...common, referenceId:reference?.id ?? null, referenceValue:reference?.input.value ?? null, referenceRecordedAt:reference?.input.recordedAt ?? null, missionContextId:mission?.id ?? null,
      percentOfReference:null, difference:reference ? r.value-reference.input.value : null };
    if (!reference || reference.input.value === 0) {
      result.push(evaluation(rule,indicator,[r],'insufficient_data',referenceInfo));
      continue;
    }
    const percent = r.value/reference.input.value*100;
    if (!Number.isFinite(percent)) {
      result.push(evaluation(rule,indicator,[r],'insufficient_data',referenceInfo));
      continue;
    }
    const below = rule.minimum !== undefined && percent < rule.minimum;
    result.push(evaluation(rule,indicator,[r],'assessed',{ ...referenceInfo, percentOfReference:percent,
      scientificCategory:rule.minimum === undefined ? null : below ? 'below_performance_reference' : 'meets_performance_reference',
      ...(below ? { level:'attention', message:rule.message } : {}) }));
  }
  return result;
}

export function exposureLedger(series) {
  const rows = [...new Map([...series].sort(chronological).map(r =>
    [JSON.stringify([r.indicator,r.context.seriesId,r.context.doseMethod,r.unit,at(r),Date.parse(r.periodStart),r.value]),r])).values()];
  if (!rows.length) return { value:null, reason:'missing' };
  if (new Set(rows.map(r => JSON.stringify([r.context.seriesId,r.context.doseMethod,r.unit,r.indicator]))).size !== 1) return { value:null, reason:'mixed_ledgers' };
  if (rows[0].indicator === 'radiation_counter') {
    const monotonic = rows.every((r,i) => Date.parse(r.periodStart) === Date.parse(rows[0].periodStart) &&
      (!i || (at(r)>at(rows[i-1]) && r.value>=rows[i-1].value)));
    return monotonic ? { value:rows.at(-1).value, from:rows[0].periodStart, to:rows.at(-1).recordedAt, contiguous:true } : { value:null, reason:'counter_reset_or_decrease' };
  }
  if (rows.some((r,i) => i && Date.parse(r.periodStart)<at(rows[i-1]))) return { value:null, reason:'overlapping_intervals' };
  return { value:rows.reduce((sum,r) => sum+r.value,0), from:rows[0].periodStart, to:rows.at(-1).recordedAt,
    contiguous:rows.every((r,i) => !i || Date.parse(r.periodStart)===at(rows[i-1])) };
}

function assessRadiation(records, operations) {
  const ledgers = Map.groupBy(records.filter(r => ['radiation_increment','radiation_counter'].includes(r.indicator)),
    r => JSON.stringify([r.source,r.context.missionId,r.context.scope,r.context.quantity,r.context.organ]));
  const assessments = [...ledgers.values()].map(series => {
    const last = series.at(-1), ledger = exposureLedger(series);
    return { series, last, ledger, result:evaluation(rules.exposure,last.indicator,series,ledger.value === null ? 'insufficient_data' : 'assessed',
      { ...ledger, unit:last.unit, context:last.context }) };
  });
  const career = assessments.filter(x => x.last.context.scope === 'mission' && x.last.context.quantity === 'effective').map(current => {
    const { last, ledger } = current;
    const prior = assessments.find(x => x.last.source === last.source && x.last.context.missionId === last.context.missionId &&
      x.last.context.scope === 'prior_spaceflight' && x.last.context.quantity === 'effective');
    const mission = operations.filter(o => o.kind === 'mission' && o.input.missionId === last.context.missionId && at(o.input) <= at(last))
      .sort((a,b) => at(a.input)-at(b.input)).at(-1);
    const attested = prior && operations.some(o => o.kind === 'radiation' && o.recordIds.includes(prior.last.id) && o.input.completePriorHistory);
    const complete = mission && attested && last.context.doseMethod === 'NASA_Q' && prior.last.context.doseMethod === 'NASA_Q' && ledger.value !== null && prior.ledger.value !== null && ledger.contiguous &&
      Date.parse(ledger.from) === Date.parse(mission.input.startedAt) && Date.parse(prior.ledger.to) <= Date.parse(ledger.from);
    const used = [...new Map([...(prior?.series ?? []), ...current.series].map(r => [r.id,r])).values()];
    const context = { missionId:last.context.missionId, missionContextId:mission?.id ?? null };
    if (!complete) return evaluation(rules.career,'career_effective_dose',used,'insufficient_data',{ context, unit:'mSv', value:null });
    const value = ledger.value + prior.ledger.value, percentOfLimit = value/rules.career.limit*100;
    const [attention,risk] = rules.career.bands;
    const level = percentOfLimit >= risk ? 'risk' : percentOfLimit >= attention ? 'attention' : null;
    return evaluation(rules.career,'career_effective_dose',used,'assessed',{ context, value, percentOfLimit, unit:'mSv', level,
      scientificCategory:value >= rules.career.limit ? 'at_or_above_exposure_limit' : 'below_exposure_limit',
      ...(level ? { message:rules.career.message } : {}) });
  });
  if (!career.length) career.push(evaluation(rules.career,'career_effective_dose',[],'insufficient_data',{unit:'mSv',value:null}));
  return [...assessments.map(x => x.result), ...career];
}

export function evaluateArea(areaId, records, operations, ctx, time) {
  const rows = recordScope(records,ctx).filter(r => r.areaId === areaId && at(r) <= time).sort(chronological);
  const scoped = operations.flatMap(o => [o, ...(o.children ?? [])]).filter(o => o.astronautId === ctx.astronautId && inDataset(o,ctx.dataset) &&
    (o.kind === 'posture' ? at(o.input.samples.at(-1)) <= time : !o.input.recordedAt || at(o.input) <= time));
  const latestBySource = (kind, distinguish = () => '') => [...Map.groupBy(scoped.filter(o => o.kind === kind),o => JSON.stringify([o.source,distinguish(o)]))
    .values()].map(series => series.sort((a,b) => (at(a.input) || Date.parse(a.createdAt)) - (at(b.input) || Date.parse(b.createdAt))).at(-1));
  const linked = o => rows.filter(r => o.recordIds.includes(r.id));
  let result = [];
  if (areaId === 'isolation_confinement') {
    result = monitoring(rows,catalog[areaId],ctx.dataset,new Date(time+1)).map(item => ({
      ...item, scientificCategory:null, context:{ source:item.source }, rule: {
        ...(item.matchedRules.find(rule => rule.level === item.level) ?? { id:'isolation_'+item.indicator, version:1, kind:'isolation' }),
        source: { classification:'team_proposal', references:catalog[areaId].find(d => d.id === item.indicator).references,
          limitation:'Legacy demonstration thresholds preserved. KSS and Samn–Perelli band verification is pending.' },
      },
      status:item.recordedAt && time-Date.parse(item.recordedAt)>freshness.isolationMs ? 'stale' : item.status,
    })).map(item => item.status === 'stale' ? { ...item, level:null, inObservation:false, message:messages.stale } : item);
  } else if (areaId === 'gravity_fields') {
    const vital = latestBySource('vitals').map(o => news2(o,linked(o),time));
    if (!vital.length) vital.push(evaluation(rules.news2,'news2',[],'insufficient_data'));
    result = [...assessFitness(rows,scoped,time), ...vital, ...latestBySource('posture').map(o =>
      evaluation(rules.posture,'posture',linked(o),'assessed',{ context:{activity:o.input.activity,supervised:true}, ...o.calculation }))];
  } else if (areaId === 'hostile_closed_environment') {
    result = [...assessCo2(rows,time), ...latestBySource('post_eva').map(o => {
      const stale = time-at(o.input)>freshness.checklistMs;
      const flagged = !stale && o.input.symptoms.length > 0;
      return evaluation(rules.postEva,'post_eva_symptoms',linked(o),stale ? 'stale' : 'assessed',{
        context:{evaEndedAt:o.input.evaEndedAt}, symptoms:o.input.symptoms, ...(flagged ? {level:'attention',message:rules.postEva.message} : {}),
      });
    })];
  } else if (areaId === 'radiation') {
    const solar = latestBySource('solar').map(o => {
      const stale = time-at(o.input)>freshness.solarMs, active = o.input.active && !stale;
      return evaluation(rules.solar,'solar_event_simulated',linked(o),stale ? 'stale' : 'assessed',{
        simulated:true, active:o.input.active, ...(active ? {level:'attention',message:rules.solar.message} : {}),
      });
    });
    result = [...assessRadiation(rows,scoped),...solar];
  } else {
    result = latestBySource('mission',o => o.input.missionId).map(o => {
      const unavailable = o.input.communication === 'unavailable';
      return evaluation(rules.comm,'communication_delay',linked(o),'assessed',{
        operationId:o.id, context:o.input, ...o.calculation,
        ...(unavailable ? {level:'attention',message:rules.comm.message} : {}),
      });
    });
    if (!result.length) result.push(evaluation(rules.comm,'communication_delay',[],'insufficient_data'));
  }
  return result.map(item => ({
    ...item, areaId, astronautId:ctx.astronautId, dataset:ctx.dataset, asOf:iso(time),
    quality:item.quality ?? item.status, isDemonstrative:true, limitation:item.limitation ?? 'Demonstration only. Not a diagnosis.',
  }));
}
