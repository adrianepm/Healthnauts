import { sha256 } from './sha256.js';
import { DAY, LIVE_LOCATION } from './config/research.js';
import { calculateResearch } from './research-operations.js';
import { validateBatch } from './validation.js';
import { catalog } from './config/catalog.js';

export const scenarios = [
  { id:'high-co2', areaId:'hostile_closed_environment', label:'One hour of elevated cabin CO₂' },
  { id:'solar-event', areaId:'radiation', label:'Simulated solar event' },
  { id:'poor-sleep', areaId:'isolation_confinement', label:'A week of short sleep' },
  { id:'fitness-change', areaId:'gravity_fields', label:'Fitness change and reported symptoms' },
  { id:'offline-report', areaId:'distance_from_earth', label:'Mars communication outage and local report' },
  { id:'depressurization', areaId:'hostile_closed_environment', label:'Cabin pressure loss' },
  { id:'sensor-fault', areaId:'hostile_closed_environment', label:'Cabin sensor offline' },
  { id:'fever', areaId:'gravity_fields', label:'Fever with a high early warning score' },
];
const MINUTE = 60000;
export function buildScenario(scenario, body, now) {
  const prefix = sha256(JSON.stringify([scenario.id,body.id])).slice(0,32);
  const stable = { astronautId:body.astronautId, source:'simulated' };
  const records = [], children = [];
  const before = ms => new Date(now.getTime()-ms).toISOString();
  const child = (kind,suffix,input) => {
    const result = calculateResearch(kind,{ ...stable,id:prefix+'-'+suffix,...input },now);
    records.push(...result.records); children.push(result.operation);
  };
  const batch = rows => records.push(...validateBatch({ astronautId:body.astronautId,
    records:rows.map(row => ({ source:'simulated',...row })) },scenario.areaId,catalog[scenario.areaId]));
  const mission = communication => ({
    missionId:prefix, destination:communication === 'unavailable' ? 'Mars' : 'ISS', activity:'routine',
    startedAt:before(30*DAY), recordedAt:before(2*DAY), oneWaySeconds:communication === 'unavailable' ? 1200 : 0.3,
    communication, solarConjunction:communication === 'unavailable', medicalResources:'Simulated inventory: vital signs monitor and first-aid supplies.',
  });
  // Uma hora de leituras da cabine, de 10 em 10 minutos, no local do sensor ao vivo (ou no local pedido).
  const cabin = (endedMs, reading) => {
    for (let i=6;i>=0;i--) child('atmosphere','gas-'+i,{
      location:body.location ?? LIVE_LOCATION,environment:'nominal_cabin',recordedAt:before(endedMs+i*10*MINUTE),
      pressure:{value:760,unit:'mmHg'},co2Ppm:3000,oxygenFraction:0.21,...reading(i),
    });
  };
  switch (scenario.id) {
    case 'high-co2': cabin(1000,() => ({ co2Ppm:5200 })); break;
    // A última leitura cai para 4,3 psia: pressão e O2 inspirado saem dos limites seguros.
    case 'depressurization': cabin(1000,i => i === 0 ? { pressure:{value:4.3,unit:'psia'} } : {}); break;
    // O sensor parou há 12 minutos: a leitura está velha e não é avaliada.
    case 'sensor-fault': cabin(12*MINUTE,() => ({})); break;
    case 'solar-event': child('solar','solar',{recordedAt:before(1000),active:true}); break;
    case 'poor-sleep':
      batch(Array.from({length:7},(_,i) => ({ indicator:'sleep_duration', value:i===6 ? 3.75 : 5.25, unit:'h',
        recordedAt:before(1000+(6-i)*DAY), groupId:prefix })));
      break;
    case 'fitness-change':
      child('mission','mission',mission('available'));
      child('reference','reference',{ missionId:prefix,indicator:'aerobic_capacity',method:'cycle-test',recordedAt:before(31*DAY),value:46,unit:'mL/kg/min' });
      batch([
        { indicator:'aerobic_capacity',value:35,unit:'mL/kg/min',recordedAt:before(1000),context:{ missionId:prefix,method:'cycle-test',activity:'routine' } },
        { indicator:'dizziness',value:1,unit:null,recordedAt:before(1000) },
      ]);
      break;
    case 'offline-report':
      child('mission','mission',{ ...mission('unavailable'),recordedAt:before(1000) });
      child('report','report',{ actions:[{ recordedAt:before(1000),description:'Crew logged the simulated communication outage.' }] });
      break;
    case 'fever': {
      // NEWS2 soma 8 (alto): vira Warning, nunca Emergency.
      const recordedAt = before(1000), sample = (value,unit) => ({ value,unit,recordedAt });
      child('vitals','vitals',{ activity:'routine',spo2Scale:1,recordedAt,measurements:{
        heart_rate:sample(118,'bpm'), blood_pressure_systolic:sample(104,'mmHg'), blood_pressure_diastolic:sample(66,'mmHg'),
        respiratory_rate:sample(23,'breaths/min'), spo2:sample(95,'%'), body_temperature:sample(39.4,'Cel'),
        supplemental_oxygen:sample(false,null), consciousness:sample('A',null) } });
      break;
    }
  }
  return { records, operation:{ ...stable, id:body.id, kind:'scenario', input:{ scenario:scenario.id, ...(body.location ? { location:body.location } : {}) }, status:'completed',
    createdAt:now.toISOString(),recordIds:records.map(r => r.id),children } };
}
