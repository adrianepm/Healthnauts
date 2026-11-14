import { randomUUID } from './id.js';
import { catalog } from './config/catalog.js';
import { activities, destinations, doseCanonical, doseUnits, evaSymptoms, fitnessUnits, gas, rules, solarClasses } from './config/research.js';
import { invalid, numericError, timestamp, validAstronaut, validId } from './validation.js';

export const inDataset = (value, dataset) => dataset === 'simulated' ? value.source === 'simulated' : ['manual','sensor'].includes(value.source);
const oneOf = (value, choices, field) => { if (!choices.includes(value)) invalid(field, 'Unsupported value.'); };
const finite = (value, field, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  if (!Number.isFinite(value) || value < min || value > max) invalid(field, 'Invalid numeric value.');
};
const id = (value, field) => { if (!validId(value)) invalid(field, 'Invalid identifier.'); };
const date = (value, field) => { if (!timestamp(value)) invalid(field, 'Use ISO 8601 with offset.'); return Date.parse(value); };
const shape = (value, fields, field) => {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !fields.includes(k))) invalid(field, 'Invalid fields.');
};
const flag = (value, field) => { if (typeof value !== 'boolean') invalid(field, 'Expected boolean.'); };
const text = (value, field, max = 2000) => {
  if (typeof value !== 'string' || !value.trim() || value.length > max) invalid(field, 'Invalid text.');
};
const inputs = {
  atmosphere: ['location','environment','recordedAt','pressure','co2Ppm','oxygenFraction'],
  noise: ['location','context','method','periodStart','recordedAt','dba'],
  post_eva: ['evaEndedAt','recordedAt','symptoms'],
  vitals: ['activity','spo2Scale','recordedAt','measurements'],
  posture: ['supervised','activity','standAt','samples'],
  radiation: ['missionId','scope','quantity','organ','mode','seriesId','periodStart','recordedAt','value','unit','completePriorHistory','doseMethod'],
  solar: ['recordedAt','active','eventClass'],
  mission: ['missionId','destination','activity','startedAt','recordedAt','oneWaySeconds','communication','solarConjunction','medicalResources','processingSeconds'],
  reference: ['missionId','indicator','method','recordedAt','value','unit'],
  report: ['actions'],
};
export const operationAreas = {
  atmosphere:'hostile_closed_environment', noise:'hostile_closed_environment', post_eva:'hostile_closed_environment',
  vitals:'gravity_fields', posture:'gravity_fields', radiation:'radiation', solar:'radiation',
  mission:'distance_from_earth', reference:'distance_from_earth', report:'distance_from_earth',
};
export const vitalIds = ['heart_rate','blood_pressure_systolic','blood_pressure_diastolic','respiratory_rate','spo2','body_temperature','supplemental_oxygen','consciousness'];
export function calculateResearch(kind, body, now) {
  const areaId = operationAreas[kind];
  shape(body, ['astronautId','id','source',...inputs[kind]], 'body');
  if (!validAstronaut(body.astronautId)) invalid('astronautId','Invalid astronaut identifier.');
  id(body.id,'id');
  oneOf(body.source,['manual','sensor','simulated'],'source');
  const { astronautId, source } = body;
  const records = [];
  const createdAt = now.toISOString();
  const add = (indicator, value, recordedAt = body.recordedAt, extra = {}) => {
    const def = catalog[areaId].find(item => item.id === indicator);
    const unit = extra.unit ?? def.unit;
    if (def.valueType !== 'text') {
      finite(value, indicator, def.scale?.min ?? 0);
      const error = numericError(value, def.scale);
      if (error) invalid(indicator, error);
    } else text(value,indicator);
    records.push({ id:randomUUID(), astronautId, areaId, indicator, value, unit, recordedAt,
      source, isSimulated:source === 'simulated', groupId:body.id, notes:null, createdAt, ...extra });
  };
  let calculation = null;
  if ('recordedAt' in body) date(body.recordedAt,'recordedAt');
  switch (kind) {
    case 'atmosphere': {
      date(body.recordedAt,'recordedAt'); id(body.location,'location');
      oneOf(body.environment,['nominal_cabin','off_nominal_cabin','suit'],'environment');
      shape(body.pressure,['value','unit'],'pressure');
      oneOf(body.pressure.unit,Object.keys(gas.mmHgPerUnit),'pressure.unit');
      finite(body.pressure.value,'pressure.value',Number.MIN_VALUE,10000);
      finite(body.co2Ppm,'co2Ppm',0,gas.ppmPerFraction);
      finite(body.oxygenFraction,'oxygenFraction',0,1);
      const co2Fraction = body.co2Ppm / gas.ppmPerFraction;
      if (co2Fraction + body.oxygenFraction > 1) invalid('oxygenFraction','Gas fractions exceed one.');
      const pressure = body.pressure.value * gas.mmHgPerUnit[body.pressure.unit];
      const partialCo2 = co2Fraction * pressure;
      const partialO2 = pressure * body.oxygenFraction;
      const inspiredO2 = pressure >= gas.waterVapourMmHg ? (pressure - gas.waterVapourMmHg) * body.oxygenFraction : null;
      const context = { location:body.location, environment:body.environment };
      for (const [indicator,value] of Object.entries({ cabin_pressure:pressure, co2_concentration:body.co2Ppm,
        co2_partial_pressure:partialCo2, oxygen_fraction:body.oxygenFraction, oxygen_partial_pressure:partialO2,
        inspired_oxygen_pressure:inspiredO2 })) if (value !== null) add(indicator,value,body.recordedAt,{ context });
      calculation = { version:'gas-v1', pressureMmHg:pressure, partialCo2, partialO2, inspiredO2, constants:gas,
        source:'https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-003-habitable-atmosphere.pdf',
        limitation:'Shared location and timestamp for all inputs. Inspired pressure assumes saturated water vapour at 37 °C. Below that vapour pressure, PIO₂ is unavailable.' };
      break;
    }
    case 'noise': {
      id(body.location,'location'); id(body.context,'context'); id(body.method,'method');
      const ms = date(body.recordedAt,'recordedAt') - date(body.periodStart,'periodStart');
      if (ms <= 0) invalid('periodStart','Expected positive measurement interval.');
      add('cabin_noise',body.dba,body.recordedAt,{ periodStart:body.periodStart, context:{ location:body.location, activity:body.context, method:body.method } });
      calculation = { durationSeconds:ms/1000, status:'not_applicable', limitation:'Broadband dBA does not establish octave-band NC compliance.' };
      break;
    }
    case 'post_eva': {
      if (date(body.recordedAt,'recordedAt') < date(body.evaEndedAt,'evaEndedAt')) invalid('recordedAt','Must follow the EVA.');
      if (!Array.isArray(body.symptoms) || new Set(body.symptoms).size !== body.symptoms.length || body.symptoms.some(s => !evaSymptoms.includes(s))) invalid('symptoms','Invalid symptom checklist.');
      add('post_eva_symptoms',body.symptoms.join(', ') || 'none_reported');
      break;
    }
    case 'vitals': {
      oneOf(body.activity,activities,'activity');
      oneOf(body.spo2Scale,[1],'spo2Scale');
      const end = date(body.recordedAt,'recordedAt');
      shape(body.measurements,vitalIds,'measurements');
      const measurements = body.measurements;
      if (measurements.blood_pressure_systolic && measurements.blood_pressure_diastolic &&
        measurements.blood_pressure_systolic.value < measurements.blood_pressure_diastolic.value) invalid('measurements','Systolic pressure must be at least diastolic pressure.');
      for (const [indicator, sample] of Object.entries(measurements)) {
        shape(sample,['value','unit','recordedAt'],indicator);
        const instant = date(sample.recordedAt,indicator+'.recordedAt');
        if (instant > end || instant < end - rules.news2.maxSpanMs) invalid(indicator,'Measurements must belong to one assessment within five minutes.');
        const def = catalog[areaId].find(d => d.id === indicator);
        if (sample.unit !== def.unit) invalid(indicator+'.unit','Unexpected unit.');
        if (indicator === 'supplemental_oxygen') flag(sample.value,indicator);
        if (indicator === 'consciousness') oneOf(sample.value,['A','C','V','P','U'],indicator);
        if (['heart_rate','blood_pressure_systolic','blood_pressure_diastolic'].includes(indicator) && !Number.isSafeInteger(sample.value)) invalid(indicator,'Expected integer.');
        add(indicator,indicator === 'supplemental_oxygen' ? Number(sample.value) : sample.value,sample.recordedAt,
          { context:{ assessment:'news2', activity:body.activity, spo2Scale:1 } });
      }
      break;
    }
    case 'posture': {
      if (body.supervised !== true) invalid('supervised','Only supervised observations can be recorded.');
      oneOf(body.activity,['post_landing','routine'],'activity');
      const stand = date(body.standAt,'standAt');
      if (!Array.isArray(body.samples) || body.samples.length < 2 || body.samples.length > 20) invalid('samples','Expected 2–20 samples.');
      let previous = -Infinity;
      for (const sample of body.samples) {
        shape(sample,['position','recordedAt','systolic','diastolic','heartRate'],'samples');
        oneOf(sample.position,['supine','standing','seated'],'position');
        const instant = date(sample.recordedAt,'samples.recordedAt');
        if (instant <= previous || (sample.position === 'standing' ? instant < stand : instant >= stand)) invalid('samples','Incoherent sample chronology or position.');
        previous = instant;
        if (sample.systolic < sample.diastolic) invalid('samples','Systolic pressure must be at least diastolic pressure.');
        for (const [indicator,value] of [['blood_pressure_systolic',sample.systolic],['blood_pressure_diastolic',sample.diastolic],['heart_rate',sample.heartRate]]) {
          add(indicator,value,sample.recordedAt,{ context:{ assessment:'posture', position:sample.position, activity:body.activity } });
        }
      }
      const supine = body.samples.findLast(s => s.position === 'supine');
      const standing = body.samples.filter(s => s.position === 'standing');
      if (!supine || !standing.length) invalid('samples','Include a supine reference and at least one standing sample.');
      calculation = { differences:standing.map(s => ({ recordedAt:s.recordedAt, secondsAfterStanding:(Date.parse(s.recordedAt)-stand)/1000,
        systolicMmHg:s.systolic-supine.systolic, diastolicMmHg:s.diastolic-supine.diastolic, heartRateBpm:s.heartRate-supine.heartRate })) };
      break;
    }
    case 'radiation': {
      id(body.missionId,'missionId'); id(body.seriesId,'seriesId');
      oneOf(body.scope,['mission','prior_spaceflight'],'scope');
      oneOf(body.quantity,Object.keys(doseUnits),'quantity');
      oneOf(body.mode,['increment','counter'],'mode');
      if (body.quantity === 'effective') oneOf(body.organ,[null],'organ');
      else id(body.organ,'organ');
      if (body.doseMethod !== undefined) id(body.doseMethod,'doseMethod');
      flag(body.completePriorHistory,'completePriorHistory');
      if (body.completePriorHistory && (body.scope !== 'prior_spaceflight' || body.quantity !== 'effective' || body.mode !== 'counter')) invalid('completePriorHistory','Only a prior spaceflight effective-dose total can attest complete history.');
      const start = date(body.periodStart,'periodStart');
      const end = date(body.recordedAt,'recordedAt');
      if (start >= end) invalid('periodStart','Expected a positive exposure interval.');
      oneOf(body.unit,Object.keys(doseUnits[body.quantity]),'unit'); finite(body.value,'value',0,1e12);
      const canonicalValue = body.value * doseUnits[body.quantity][body.unit];
      const canonicalUnit = doseCanonical[body.quantity];
      add(body.mode === 'increment' ? 'radiation_increment' : 'radiation_counter',canonicalValue,body.recordedAt,{ unit:canonicalUnit,
        periodStart:body.periodStart, context:{ missionId:body.missionId, scope:body.scope, quantity:body.quantity, organ:body.organ, seriesId:body.seriesId, ...(body.doseMethod ? { doseMethod:body.doseMethod } : {}) } });
      calculation = { version:'dose-prefix-v1', canonicalValue, canonicalUnit };
      break;
    }
    case 'solar':
      oneOf(source,['simulated'],'source'); flag(body.active,'active'); date(body.recordedAt,'recordedAt');
      if (body.eventClass !== undefined) oneOf(body.eventClass,solarClasses,'eventClass');
      add('solar_event_simulated',Number(body.active)); break;
    case 'mission': {
      id(body.missionId,'missionId'); oneOf(body.destination,destinations,'destination'); oneOf(body.activity,activities,'activity');
      if (date(body.startedAt,'startedAt') > date(body.recordedAt,'recordedAt')) invalid('startedAt','Mission start must precede context.');
      oneOf(body.communication,['available','delayed','unavailable'],'communication');
      flag(body.solarConjunction,'solarConjunction');
      if (body.solarConjunction && (source !== 'simulated' || body.destination !== 'Mars' || body.communication !== 'unavailable')) invalid('solarConjunction','This simulated Mars scenario requires an unavailable link.');
      if (body.oneWaySeconds !== null || body.communication !== 'unavailable') finite(body.oneWaySeconds,'oneWaySeconds',0,1e6);
      const processingSeconds = body.processingSeconds === undefined ? rules.comm.processingSeconds : body.processingSeconds;
      finite(processingSeconds,'processingSeconds',0,1e6);
      text(body.medicalResources,'medicalResources');
      if (body.oneWaySeconds !== null) add('communication_delay',body.oneWaySeconds);
      add('onboard_medical_resources',body.medicalResources);
      calculation = { estimatedResponseSeconds:body.communication === 'unavailable' ? null : 2 * body.oneWaySeconds + processingSeconds,
        oneWaySeconds:body.oneWaySeconds, processingSeconds, formula:'2 × oneWaySeconds + processingSeconds',
        limitation:'Planning estimate only. Actual response time is not guaranteed.' };
      break;
    }
    case 'reference':
      id(body.missionId,'missionId'); id(body.method,'method'); date(body.recordedAt,'recordedAt');
      oneOf(body.indicator,Object.keys(fitnessUnits),'indicator'); oneOf(body.unit,[fitnessUnits[body.indicator]],'unit'); finite(body.value,'value');
      break;
    case 'report':
      if (!Array.isArray(body.actions) || body.actions.length > 50) invalid('actions','Expected up to 50 recorded actions.');
      for (const action of body.actions) {
        shape(action,['recordedAt','description'],'actions'); date(action.recordedAt,'actions.recordedAt'); text(action.description,'actions.description');
      }
      break;
  }
  return { records, operation:{ kind,id:body.id,astronautId,source,input:body,status:'completed',createdAt,recordIds:records.map(r => r.id),calculation } };
}
