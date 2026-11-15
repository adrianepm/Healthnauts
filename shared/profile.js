import { catalog } from './config/catalog.js';
import { DAY } from './config/research.js';
import { calculateResearch } from './research-operations.js';
import { validateBatch } from './validation.js';

// Perfil padrão da demonstração: contexto da missão, referências pré-voo e histórico de dose
// atestado. Sem ele o card de dose de carreira ficaria Unavailable o tempo todo.
export const PROFILE_ID = 'demo-profile';
export const PROFILE_MISSION = 'demo-mission';
export function buildProfile(astronautId, now) {
  const stable = { astronautId, source:'simulated' };
  const records = [], children = [];
  const before = ms => new Date(now.getTime()-ms).toISOString();
  const child = (kind,suffix,input) => {
    const result = calculateResearch(kind,{ ...stable,id:PROFILE_ID+'-'+suffix,...input },now);
    records.push(...result.records); children.push(result.operation);
  };
  const startedAt = before(45*DAY);
  child('mission','mission',{ missionId:PROFILE_MISSION, destination:'Mars', activity:'transit', startedAt, recordedAt:startedAt,
    oneWaySeconds:480, communication:'delayed', solarConjunction:false,
    medicalResources:'Simulated inventory: vital signs monitor, first-aid kit and exercise devices.' });
  const fitness = [['aerobic_capacity','cycle-test','mL/kg/min',46,43.5],['muscle_strength','dynamometer','N',1500,1410],['body_mass','scale','kg',78,76.9]];
  for (const [indicator,method,unit,value] of fitness) child('reference','reference-'+indicator,{ missionId:PROFILE_MISSION,indicator,method,recordedAt:before(46*DAY),value,unit });
  // Histórico prévio atestado + contador contínuo desde o início da missão, ambos em NASA_Q.
  const dose = { missionId:PROFILE_MISSION, quantity:'effective', organ:null, mode:'counter', unit:'mSv', doseMethod:'NASA_Q' };
  child('radiation','dose-prior',{ ...dose, scope:'prior_spaceflight', seriesId:'career-prior', periodStart:before(1200*DAY), recordedAt:before(60*DAY), value:150, completePriorHistory:true });
  child('radiation','dose-mission',{ ...dose, scope:'mission', seriesId:'mission-dosimeter', periodStart:startedAt, recordedAt:before(60000), value:45, completePriorHistory:false });
  records.push(...validateBatch({ astronautId, records:fitness.map(([indicator,method,unit,,value]) => ({ source:'simulated', indicator, value, unit,
    recordedAt:before(60000), context:{ missionId:PROFILE_MISSION, method, activity:'routine' } })) },'gravity_fields',catalog.gravity_fields));
  return { records, operation:{ ...stable, id:PROFILE_ID, kind:'profile', input:{ profile:'default' }, status:'completed',
    createdAt:now.toISOString(), recordIds:records.map(r => r.id), children } };
}
// Idempotente: só cria o perfil se o astronauta ainda não tiver um.
export async function ensureProfile(store, astronautId, now) {
  const existing = store.findOperation('profile',astronautId,PROFILE_ID);
  if (existing) return { ...existing, replayed:true };
  const { records, operation } = buildProfile(astronautId,now);
  return store.saveOperation(operation,records,now.getTime());
}
