import { monitoring } from './monitoring.js';
import { chronological } from './trends.js';
import { catalog } from './config/catalog.js';
import { checkInIndicators, freshness, groupOf, rules, assessmentMessages as messages } from './config/research.js';
import { atLeast, criticalIndicators, displayLevelOf, emergencyRules, finalize, unavailableMessage } from './config/levels.js';
import { inDataset } from './research-operations.js';

export const datasetFor = source => source === 'simulated' ? 'simulated' : 'real';
export const recordScope = (records, ctx) => records.filter(r => r.astronautId === ctx.astronautId && inDataset(r,ctx.dataset));
const at = record => Date.parse(record.recordedAt);
const iso = ms => new Date(ms).toISOString();
// `level` é null quando nenhuma regra foi acionada. A mensagem do nível vem de rule.messages
// (texto "What to do" da especificação v2) e passa pela regra de texto 2.2.
function evaluation(rule, indicator, series, status, details = {}) {
  const { level = null, message, ...rest } = details;
  const text = message ?? (level ? rule.messages?.[level] : null) ?? messages[status];
  return { indicator, rule, status, level, inObservation:atLeast(level,'caution'), quality:status,
    recordIds:[...new Set(series.map(r => r.id))], recordedAt:series.at(-1)?.recordedAt ?? null,
    source:series.at(-1)?.source ?? null, scientificCategory:null, message:level ? finalize(text,level,rule.operational) : text,
    limitation:rule.limitation ?? 'Demonstration only. Results do not determine diagnosis or operational clearance.', ...rest };
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
  const rule = rules.co2, week = rules.co2Week;
  const samples = records.filter(r => r.indicator === 'co2_partial_pressure' && r.context?.environment === 'nominal_cabin');
  const grouped = Map.groupBy(samples,r => JSON.stringify([r.source,r.context.location]));
  if (!grouped.size) {
    const other = records.filter(r => r.indicator === 'co2_partial_pressure').at(-1);
    return [evaluation(rule,'co2_partial_pressure',other ? [other] : [],other ? 'not_applicable' : 'insufficient_data',
      other ? { context:other.context } : {}), evaluation(week,'co2_partial_pressure_7d',[],'insufficient_data')];
  }
  const series = [...grouped.values()];
  const hourly = series.map(series => {
    const latest = series.at(-1), context = latest.context;
    if (time-at(latest) > rule.maxAgeMs) return evaluation(rule,latest.indicator,[latest],'stale',{ context });
    const { records:used, ...window } = weightedWindow(series,at(latest),rule);
    const common = { context, window, value:window.value, unit:'mmHg' };
    if (window.value === null) return evaluation(rule,latest.indicator,used.length ? used : [latest],'insufficient_data',common);
    const level = window.value > rule.warningAbove ? 'warning' : window.value > rule.limit ? 'caution' : null;
    return evaluation(rule,latest.indicator,used,level ? 'assessed' : 'no_demonstrative_signal',{
      ...common, scientificCategory:level ? 'above_design_reference' : 'within_design_reference', level,
    });
  });
  // Média de 7 dias: mesma ponderação no tempo e mesma exigência de cobertura integral, sem extrapolar.
  const weekly = series.map(series => {
    const latest = series.at(-1), context = latest.context;
    if (time-at(latest) > week.maxAgeMs) return evaluation(week,'co2_partial_pressure_7d',[latest],'stale',{ context });
    const { records:used, ...window } = weightedWindow(series,at(latest),week);
    const common = { context, window, value:window.value, unit:'mmHg' };
    if (window.value === null) return evaluation(week,'co2_partial_pressure_7d',[latest],'insufficient_data',{ ...common,
      message:'The 7-day CO2 average needs seven days of continuous readings.' });
    const level = window.value >= week.limit ? 'advisory' : null;
    return evaluation(week,'co2_partial_pressure_7d',[used[0],latest],level ? 'assessed' : 'no_demonstrative_signal',{ ...common, level });
  });
  return [...hourly,...weekly];
}

// Leitura instantânea da cabine (pressão total e O2 inspirado): última amostra por origem e local.
function assessCabinReading(records, time, indicator, rule, classify) {
  const samples = records.filter(r => r.indicator === indicator && r.context?.environment !== 'suit');
  const grouped = Map.groupBy(samples,r => JSON.stringify([r.source,r.context?.location]));
  if (!grouped.size) return [evaluation(rule,indicator,[],'insufficient_data')];
  return [...grouped.values()].map(series => {
    const latest = series.at(-1), context = latest.context;
    if (time-at(latest) > rule.maxAgeMs) return evaluation(rule,indicator,[latest],'stale',{ context });
    const { level, ...details } = classify(latest.value);
    return evaluation(rule,indicator,[latest],level ? 'assessed' : 'no_demonstrative_signal',{ context, value:latest.value, unit:latest.unit, level, ...details });
  });
}
const pressureLevel = mmHg => {
  const rule = rules.pressure, psia = mmHg / rule.mmHgPerPsia;
  return { psia, level:psia < rule.minimumPsia || psia > rule.maximumPsia ? 'emergency' : null };
};
const oxygenLevel = mmHg => {
  const { normal, caution } = rules.oxygen;
  return { level:mmHg < caution[0] || mmHg > caution[1] ? 'emergency' : mmHg < normal[0] || mmHg > normal[1] ? 'caution' : null };
};

function assessClimate(records, time) {
  const rule = rules.climate, indicator = 'temperature_humidity';
  const samples = records.filter(r => ['temperature','relative_humidity'].includes(r.indicator));
  const grouped = Map.groupBy(samples,r => r.source);
  if (!grouped.size) return [evaluation(rule,indicator,[],'insufficient_data')];
  return [...grouped.values()].map(series => {
    const temperature = series.findLast(r => r.indicator === 'temperature'), humidity = series.findLast(r => r.indicator === 'relative_humidity');
    const used = [temperature,humidity].filter(Boolean).sort(chronological);
    if (used.length < 2) return evaluation(rule,indicator,used,'insufficient_data');
    if (used.some(r => time-at(r) > rule.maxAgeMs)) return evaluation(rule,indicator,used,'stale');
    const t = temperature.value, h = humidity.value;
    const outside = (value,[low,high]) => value < low || value > high;
    const level = outside(t,rule.safeTemperature) || h < rule.minimumHumidity ? 'caution'
      : outside(t,rule.comfort.temperature) || outside(h,rule.comfort.humidity) ? 'advisory' : null;
    return evaluation(rule,indicator,used,level ? 'assessed' : 'no_demonstrative_signal',{ level, value:{ temperature:t, humidity:h }, unit:{ temperature:'Cel', humidity:'%' } });
  });
}

function assessNoise(records, time) {
  const rule = rules.noise;
  const samples = records.filter(r => r.indicator === 'cabin_noise');
  const grouped = Map.groupBy(samples,r => JSON.stringify([r.source,r.context?.location,r.context?.activity]));
  if (!grouped.size) return [evaluation(rule,'cabin_noise',[],'insufficient_data')];
  return [...grouped.values()].map(series => {
    const latest = series.at(-1), context = latest.context;
    if (time-at(latest) > rule.maxAgeMs) return evaluation(rule,'cabin_noise',[latest],'stale',{ context });
    const reference = context?.activity === 'sleep' ? rule.sleep : rule.work;
    const level = latest.value >= rule.ceiling ? 'caution' : latest.value > reference ? 'advisory' : null;
    return evaluation(rule,'cabin_noise',[latest],level ? 'assessed' : 'no_demonstrative_signal',{ context, value:latest.value, unit:'dBA', reference, level });
  });
}

export function news2(operation, records, time) {
  const rule = rules.news2, input = operation.input;
  const samples = input.measurements;
  const expected = [...Object.keys(rule.bands),'supplemental_oxygen','consciousness'];
  const missing = expected.filter(indicator => !Object.hasOwn(samples,indicator));
  const context = { activity:input.activity, spo2Scale:1, assessmentId:operation.id };
  const base = { context, missing, diastolicIncludedInScore:false, operationId:operation.id };
  const unavailable = { message:rule.messages.unavailable };
  if (missing.length) return evaluation(rule,'news2',records,'insufficient_data',{ ...base, ...unavailable, score:null, components:null });
  // Valor impossível não é pontuado: a leitura fica Unavailable.
  const implausible = Object.entries(rule.plausible).filter(([indicator,[min,max]]) => samples[indicator].value < min || samples[indicator].value > max).map(([indicator]) => indicator);
  if (implausible.length) return evaluation(rule,'news2',records,'insufficient_data',{ ...base, ...unavailable, reason:'implausible_value', implausible, score:null, components:null });
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
  // Soma alta vira Warning, nunca Emergency: escore de saúde não gera Emergency.
  const level = stale || scientificCategory === 'low' ? null : scientificCategory === 'high' ? 'warning' : 'caution';
  return evaluation(rule,'news2',records,stale ? 'stale' : 'assessed',{ ...base, components, score, individualTrigger, scientificCategory, level,
    ...(stale ? unavailable : {}) });
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
        ...(below ? { level:'warning' } : {}) }));
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
      result.push(evaluation(rule,indicator,[r],'insufficient_data',{ ...referenceInfo, message:'No compatible pre-flight reference for this test.' }));
      continue;
    }
    const percent = r.value/reference.input.value*100;
    if (!Number.isFinite(percent)) {
      result.push(evaluation(rule,indicator,[r],'insufficient_data',referenceInfo));
      continue;
    }
    let level = null, scientificCategory = null;
    if (indicator === 'body_mass') {
      const loss = 100-percent;
      level = loss > rule.cautionLoss ? 'caution' : loss >= rule.advisoryLoss ? 'advisory' : null;
    } else {
      const below = percent < rule.minimum;
      level = below ? 'caution' : percent < rule.advisoryBelow ? 'advisory' : null;
      scientificCategory = below ? 'below_performance_reference' : 'meets_performance_reference';
    }
    result.push(evaluation(rule,indicator,[r],'assessed',{ ...referenceInfo, percentOfReference:percent, scientificCategory, level }));
  }
  return result;
}

// Autorrelatos de equilíbrio e visão (especificação v2, 3.4). Cortes são proposta do time.
function assessSymptoms(records, time) {
  const rule = rules.symptoms, text = rule.messages;
  const result = [];
  const latest = (source, indicator) => records.findLast(r => r.indicator === indicator && r.source === source);
  const fresh = r => r && time-at(r) <= rule.maxAgeMs;
  const each = (indicator, extra, classify) => {
    const ids = [indicator,...extra];
    const sources = [...new Set(records.filter(r => ids.includes(r.indicator)).map(r => r.source))];
    if (!sources.length) return result.push(evaluation(rule,indicator,[],'insufficient_data',{ message:'Not reported yet.' }));
    for (const source of sources) {
      const used = ids.map(id => latest(source,id)).filter(Boolean).sort(chronological);
      const current = used.filter(fresh);
      if (!current.length) { result.push(evaluation(rule,indicator,used,'stale',{ message:'No recent report. Log how you feel today.' })); continue; }
      const value = id => current.find(r => r.indicator === id)?.value ?? null;
      const { level = null, message } = classify(value);
      result.push(evaluation(rule,indicator,current,level ? 'assessed' : 'no_demonstrative_signal',{ level, value:value(indicator), ...(level ? { message } : {}) }));
    }
  };
  each('motion_sickness',[],value => {
    const v = value('motion_sickness');
    const level = v >= rule.motionCaution ? 'caution' : v >= rule.motionAdvisory ? 'advisory' : null;
    return { level, message:text.motion_sickness[level] };
  });
  each('dizziness',['near_fainting'],value => {
    const dizzy = value('dizziness') === 1, faint = value('near_fainting') === 1;
    if (dizzy && faint) return { level:'warning', message:text.dizziness.warning };
    if (dizzy) return { level:'advisory', message:text.dizziness.advisory };
    // Quase desmaio sem tontura não está na tabela 3.4: tratado como Advisory (decisão do time).
    return faint ? { level:'advisory', message:'You reported near-fainting. Move slowly and hold on to handrails.' } : {};
  });
  for (const indicator of ['vision_change','amsler_change']) each(indicator,[],value =>
    value(indicator) === 1 ? { level:'caution', message:text.vision.caution } : {});
  each('headache',[],value => value('headache') >= rule.headacheAdvisory ? { level:'advisory', message:text.headache.advisory } : {});
  return result;
}

// Stand test: só recebe nível depois do pouso (não existe em microgravidade).
function assessPosture(operation, linked, rows, time) {
  const rule = rules.posture, input = operation.input;
  const details = { context:{ activity:input.activity, supervised:true }, ...operation.calculation };
  if (input.activity !== rule.appliesTo) return evaluation(rule,'posture',linked,'not_applicable',{ ...details,
    message:'The stand test is only assessed after landing.' });
  const standing = operation.calculation.differences;
  const early = standing.filter(d => d.secondsAfterStanding <= rule.withinSeconds);
  const systolicDrop = Math.max(0,...early.map(d => -d.systolicMmHg)), diastolicDrop = Math.max(0,...early.map(d => -d.diastolicMmHg));
  const heartRateRise = Math.max(0,...standing.map(d => d.heartRateBpm));
  const drop = systolicDrop >= rule.systolicDrop || diastolicDrop >= rule.diastolicDrop;
  const stand = Date.parse(input.standAt);
  const faint = ['dizziness','near_fainting'].some(id => {
    const r = rows.findLast(row => row.indicator === id && row.source === operation.source);
    return r && r.value === 1 && at(r) >= stand && at(r) <= time;
  });
  const level = drop ? (faint ? 'warning' : 'caution') : heartRateRise >= rule.heartRateRise ? 'advisory' : null;
  return evaluation(rule,'posture',linked,'assessed',{ ...details, systolicDrop, diastolicDrop, heartRateRise, reportedFaintness:faint, level });
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
      { ...ledger, unit:last.unit, context:last.context, message:ledger.value === null ? 'The exposure ledger is incomplete or inconsistent.' : 'Exposure ledger recorded.' }) };
  });
  const unavailable = { unit:'mSv', value:null, message:'Career dose needs a complete prior history and a continuous mission ledger.' };
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
    if (!complete) return evaluation(rules.career,'career_effective_dose',used,'insufficient_data',{ context, ...unavailable });
    const value = ledger.value + prior.ledger.value, percentOfLimit = value/rules.career.limit*100;
    const [advisory,caution,warning] = rules.career.bands;
    const level = percentOfLimit >= warning ? 'warning' : percentOfLimit >= caution ? 'caution' : percentOfLimit >= advisory ? 'advisory' : null;
    return evaluation(rules.career,'career_effective_dose',used,'assessed',{ context, value, percentOfLimit, unit:'mSv', level,
      missionValue:ledger.value, priorValue:prior.ledger.value,
      scientificCategory:value >= rules.career.limit ? 'at_or_above_exposure_limit' : 'below_exposure_limit' });
  });
  if (!career.length) career.push(evaluation(rules.career,'career_effective_dose',[],'insufficient_data',unavailable));
  return [...assessments.map(x => x.result), ...career];
}

export function evaluateArea(areaId, records, operations, ctx, time) {
  const rows = recordScope(records,ctx).filter(r => r.areaId === areaId && at(r) <= time).sort(chronological);
  const scoped = operations.flatMap(o => [o, ...(o.children ?? [])]).filter(o => o.astronautId === ctx.astronautId && inDataset(o,ctx.dataset) &&
    (o.kind === 'posture' ? at(o.input.samples.at(-1)) <= time : !o.input?.recordedAt || at(o.input) <= time));
  const latestBySource = (kind, distinguish = () => '') => [...Map.groupBy(scoped.filter(o => o.kind === kind),o => JSON.stringify([o.source,distinguish(o)]))
    .values()].map(series => series.sort((a,b) => (at(a.input) || Date.parse(a.createdAt)) - (at(b.input) || Date.parse(b.createdAt))).at(-1));
  const linked = o => rows.filter(r => o.recordIds.includes(r.id));
  let result = [];
  if (areaId === 'isolation_confinement') {
    result = monitoring(rows,catalog[areaId],ctx.dataset,new Date(time+1)).map(item => ({
      ...item, scientificCategory:null, context:{ source:item.source }, rule: {
        ...(item.matchedRules.find(rule => rule.level === item.level) ?? { id:'isolation_'+item.indicator, version:2, kind:'isolation' }),
        source: { classification:'team_proposal', references:catalog[areaId].find(d => d.id === item.indicator).references,
          limitation:'Levels follow specification v2, section 3.2, and are team decisions. Aviation scales are not validated for spaceflight.' },
      },
      // Check-in diário vale 36 h; o PVT-B é feito a cada 4 dias e mantém 7 dias.
      status:item.recordedAt && time-Date.parse(item.recordedAt)>(checkInIndicators.includes(item.indicator) ? freshness.checkInMs : freshness.isolationMs) ? 'stale' : item.status,
    })).map(item => item.status === 'stale' ? { ...item, level:null, inObservation:false, message:'Your last entry is too old. Do a new check-in.' } : item);
  } else if (areaId === 'gravity_fields') {
    const vital = latestBySource('vitals').map(o => news2(o,linked(o),time));
    if (!vital.length) vital.push(evaluation(rules.news2,'news2',[],'insufficient_data',{ message:rules.news2.messages.unavailable }));
    result = [...assessFitness(rows,scoped,time), ...assessSymptoms(rows,time), ...vital,
      ...latestBySource('posture').map(o => assessPosture(o,linked(o),rows,time))];
  } else if (areaId === 'hostile_closed_environment') {
    result = [...assessCo2(rows,time),
      ...assessCabinReading(rows,time,'cabin_pressure',rules.pressure,pressureLevel),
      ...assessCabinReading(rows,time,'inspired_oxygen_pressure',rules.oxygen,oxygenLevel),
      ...assessClimate(rows,time), ...assessNoise(rows,time),
      ...latestBySource('post_eva').map(o => {
        const stale = time-at(o.input)>freshness.checklistMs;
        const flagged = !stale && o.input.symptoms.length > 0;
        return evaluation(rules.postEva,'post_eva_symptoms',linked(o),stale ? 'stale' : 'assessed',{
          context:{evaEndedAt:o.input.evaEndedAt}, symptoms:o.input.symptoms,
          ...(flagged ? {level:'warning'} : stale ? {} : {message:rules.postEva.messages.normal}),
        });
      })];
  } else if (areaId === 'radiation') {
    const mission = scoped.filter(o => o.kind === 'mission').sort((a,b) => at(a.input)-at(b.input)).at(-1);
    const solar = latestBySource('solar').map(o => {
      const stale = time-at(o.input)>freshness.solarMs, active = o.input.active && !stale;
      const eventClass = o.input.eventClass ?? 'SPE', duringEva = mission?.input.activity === 'eva';
      // SPE dentro da nave é Advisory; em EVA, ou sendo ESPE, é Warning.
      const event = duringEva ? { level:'warning', message:rules.solar.messages.eva }
        : eventClass === 'ESPE' ? { level:'warning', message:rules.solar.messages.espe } : { level:'advisory' };
      return evaluation(rules.solar,'solar_event_simulated',linked(o),stale ? 'stale' : 'assessed',{
        simulated:true, active:o.input.active, eventClass, duringEva,
        ...(active ? event : stale ? {} : { message:rules.solar.messages.normal }),
      });
    });
    // Especificação v2, 3.5: "Sem evento" é Normal (não Unavailable).
    if (!solar.length) solar.push(evaluation(rules.solar,'solar_event_simulated',[],'assessed',{ simulated:true, active:false, message:'No solar event recorded.' }));
    result = [...assessRadiation(rows,scoped),...solar];
  } else {
    result = latestBySource('mission',o => o.input.missionId).map(o => {
      const unavailable = o.input.communication === 'unavailable';
      return evaluation(rules.comm,'communication_delay',linked(o),'assessed',{
        operationId:o.id, context:o.input, ...o.calculation,
        ...(unavailable ? {level:'advisory'} : { message:'Earth link available.' }),
      });
    });
    if (!result.length) result.push(evaluation(rules.comm,'communication_delay',[],'insufficient_data',{ message:'No mission context recorded.' }));
  }
  return result.map(item => {
    // Trava: só pressão da cabine e O2 podem chegar a Emergency.
    const level = item.level === 'emergency' && !emergencyRules.includes(item.rule.id) ? 'warning' : item.level;
    const status = item.status;
    return {
      ...item, level, areaId, astronautId:ctx.astronautId, dataset:ctx.dataset, asOf:iso(time),
      displayLevel:displayLevelOf(status,level), group:groupOf(areaId,item.indicator),
      critical:criticalIndicators.includes(item.indicator), requiresAcknowledgement:atLeast(level,'warning'),
      inObservation:atLeast(level,'caution'),
      message:displayLevelOf(status,level) === 'unavailable' && !item.message ? unavailableMessage : item.message,
      quality:item.quality ?? item.status, isDemonstrative:true, limitation:item.limitation ?? 'Demonstration only. Not a diagnosis.',
    };
  });
}
