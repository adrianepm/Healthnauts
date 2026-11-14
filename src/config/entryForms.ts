import { labelFor } from './presentation';

export type Values = Record<string, string>;
type Option = readonly [string, string];
export type Field = {
  key: string; label: string; type: 'text' | 'number' | 'datetime-local' | 'select' | 'checkbox' | 'textarea';
  unit?: string; min?: number; max?: number; step?: number | 'any'; options?: Option[];
  optional?: boolean; hint?: string; initial?: string; maxLength?: number;
  when?: (values: Values) => boolean;
};
const select = (key: string, label: string, options: Option[], initial = options[0][0]): Field => ({ key, label, type: 'select', options, initial });
const number = (key: string, label: string, unit?: string, min = 0, max?: number, step: Field['step'] = 'any'): Field =>
  ({ key, label, unit, type: 'number', min, max, step });
const text = (key: string, label: string, hint?: string): Field => ({ key, label, hint, type: 'text', maxLength: 80 });
const date = (key: string, label: string): Field => ({ key, label, type: 'datetime-local' });
const check = (key: string, label: string): Field => ({ key, label, type: 'checkbox', optional: true });
const flag = (v: Values, key: string) => v[key] === 'true';
const num = (v: Values, key: string) => Number(v[key]);
const iso = (v: Values, key: string) => new Date(v[key]).toISOString();
const activities: Option[] = [['routine','Routine'], ['exercise','Exercise'], ['eva','Spacewalk'], ['landing','Landing'], ['post_landing','After landing'], ['post_eva','After a spacewalk'], ['transit','Transit']];
const activity = select('activity', 'Activity', activities);
const symptoms: Option[] = [['itching','Itching'], ['muscle_joint_pain','Muscle or joint pain'], ['rash','Rash'], ['numbness_weakness','Numbness or weakness'],
  ['thinking_speech_change','Changes in thinking or speech'], ['dizziness_balance_hearing','Changes in dizziness, balance or hearing'], ['breathlessness_chest_pain','Breathlessness or chest pain']];
const fitness: Option[] = ['body_mass','aerobic_capacity','muscle_strength','vo2max'].map(id => [id, labelFor(id)]);
const fitnessUnits: Record<string, string> = { body_mass:'kg', aerobic_capacity:'mL/kg/min', muscle_strength:'N', vo2max:'mL/kg/min' };
const vitalUnits: Record<string, string> = { heart_rate:'bpm', blood_pressure_systolic:'mmHg', blood_pressure_diastolic:'mmHg', respiratory_rate:'breaths/min', spo2:'%', body_temperature:'Cel' };
const vitalNumbers = Object.keys(vitalUnits).map(key => number(key, labelFor(key), key === 'body_temperature' ? '°C' : vitalUnits[key], 0, key === 'spo2' ? 100 : undefined, key === 'body_temperature' ? 0.1 : 1));
const vitalsFields = [...vitalNumbers, check('supplemental_oxygen','Supplemental oxygen was used'),
  select('consciousness','Responsiveness observed by the assessor',[['A','Alert'],['C','New confusion'],['V','Responds to voice'],['P','Responds to pain'],['U','Unresponsive']])];
const pressureUnits: Option[] = [['mmHg','mmHg'],['kPa','kPa'],['psia','psi absolute']];
const doseUnits: Record<string, Option[]> = { effective:[['uSv','µSv'],['mSv','mSv'],['Sv','Sv']],
  absorbed:[['uGy','µGy'],['mGy','mGy'],['Gy','Gy']], equivalent_organ:[['mGy-Eq','mGy-Eq'],['Gy-Eq','Gy-Eq'],['uGy-Eq','µGy-Eq']] };
const only = (key: string, when: (values: Values) => boolean, field: Field): Field => ({ ...field, key, when });
type Form = {
  title: string; description: string; button: string; area: string; fields: Field[];
  operation?: string; records?: (values: Values) => { indicator: string; value: number | string; unit: string | null; context?: Record<string,string> }[];
  input?: (values: Values, now: string) => Record<string, unknown>;
};
const cabin = 'hostile_closed_environment', gravity = 'gravity_fields', isolation = 'isolation_confinement', distance = 'distance_from_earth';
const fitnessValue = number('value','Measurement');
const missionId = text('missionId','Mission name','Use the same mission name for related records.');
const fitnessMethod = text('method','Measurement method','Use the same method for baseline and follow-up.');
export const entryForms = {
  checkin: { title:'Daily check-in', description:'Record how you feel today. Use fictional data in this prototype.', button:'Save check-in', area:isolation,
    fields:[number('mood_score','Mood (least to most positive)',undefined,0,100,0.01), number('stress','Stress intensity',undefined,0,100,0.01),
      number('sleep_quality','Sleep quality',undefined,0,100,0.01), number('sleepiness_kss','Sleepiness (least to most sleepy)',undefined,1,9,1),
      number('fatigue_samn_perelli','Fatigue (least to most tired)',undefined,1,7,1)].map(f => ({...f, hint:`Enter a value from ${f.min} to ${f.max}.`})),
    records:v => ['mood_score','stress','sleep_quality','sleepiness_kss','fatigue_samn_perelli'].map(indicator => ({ indicator, value:num(v,indicator), unit:null })) },
  symptoms: { title:'Record symptoms', description:'Describe changes you noticed. These observations do not establish a cause.', button:'Save symptoms', area:gravity,
    fields:[number('motion_sickness','Motion sickness severity',undefined,0,20,1), number('headache','Headache severity',undefined,0,10),
      ...['dizziness','near_fainting','vision_change','amsler_change'].map(id => check(id,labelFor(id)))],
    records:v => ['motion_sickness','headache','dizziness','near_fainting','vision_change','amsler_change'].map(indicator => ({
      indicator, value:['motion_sickness','headache'].includes(indicator) ? num(v,indicator) : Number(flag(v,indicator)), unit:null })) },
  atmosphere: { title:'Record cabin air', description:'Use readings taken in the same location and at the same time. Inspired oxygen pressure (PIO₂) is calculated from these readings.', button:'Save cabin readings', area:cabin, operation:'atmosphere',
    fields:[text('location','Measurement location'), select('environment','Environment',[['nominal_cabin','Standard cabin'],['off_nominal_cabin','Nonstandard cabin'],['suit','Space suit']]),
      number('pressure','Absolute cabin pressure',undefined,0.01,10000), select('pressureUnit','Pressure unit',pressureUnits), number('co2Ppm','Carbon dioxide','ppm',0,1000000),
      { ...number('oxygenFraction','Oxygen fraction',undefined,0,1), hint:'Enter a fraction from 0 to 1. For example, 21% is 0.21.' }],
    input:(v,recordedAt) => ({ recordedAt, location:v.location.trim().replace(/\s+/g,'-'), environment:v.environment,
      pressure:{ value:num(v,'pressure'), unit:v.pressureUnit }, co2Ppm:num(v,'co2Ppm'), oxygenFraction:num(v,'oxygenFraction') }) },
  noise: { title:'Record cabin noise', description:'Enter the measurement interval and meter reading. Automatic noise classification is unavailable.', button:'Save noise reading', area:cabin, operation:'noise',
    fields:[text('location','Measurement location'), text('context','Activity'), text('method','Measurement method'), date('periodStart','Measurement start'), date('recordedAt','Measurement end'), number('dba','Noise level','dBA')],
    input:v => ({ location:v.location.trim().replace(/\s+/g,'-'), context:v.context.trim().replace(/\s+/g,'-'), method:v.method.trim().replace(/\s+/g,'-'),
      periodStart:iso(v,'periodStart'), recordedAt:iso(v,'recordedAt'), dba:num(v,'dba') }) },
  postEva: { title:'Record post-spacewalk symptoms', description:'Select any symptoms noticed after returning from a spacewalk. Leave the list blank if none were noticed.', button:'Save spacewalk observations', area:cabin, operation:'post_eva',
    fields:[date('evaEndedAt','Spacewalk ended'), ...symptoms.map(([id,label]) => check(id,label))],
    input:(v,recordedAt) => ({ recordedAt, evaEndedAt:iso(v,'evaEndedAt'), symptoms:symptoms.filter(([id]) => flag(v,id)).map(([id]) => id) }) },
  vitals: { title:'Record vital signs', description:'Use readings from the same observation. NEWS2 is a demonstration of the National Early Warning Score, using oxygen saturation scale 1.', button:'Save vital signs', area:gravity, operation:'vitals',
    fields:[activity, ...vitalsFields],
    input:(v,recordedAt) => ({ recordedAt, spo2Scale:1, activity:v.activity, measurements:Object.fromEntries(vitalsFields.map(({key}) => [key,{
      recordedAt, unit:vitalUnits[key] ?? null, value:key === 'supplemental_oxygen' ? flag(v,key) : key === 'consciousness' ? v[key] : num(v,key) }])) }) },
  posture: { title:'Record supervised posture readings', description:'Enter observations from a completed, supervised assessment. Use the times at which readings were taken.', button:'Save posture readings', area:gravity, operation:'posture',
    fields:[select('activity','Activity',[['routine','Routine'],['post_landing','After landing']]), date('standAt','Time of standing'),
      ...(['lying','standing'] as const).flatMap(position => [date(position+'Time',`Time of ${position} reading`),
        number(position+'Sys',`Systolic pressure while ${position}`,'mmHg',0,undefined,1),
        number(position+'Dia',`Diastolic pressure while ${position}`,'mmHg',0,undefined,1), number(position+'Hr',`Heart rate while ${position}`,'bpm',0,undefined,1)]),
      {...check('supervised','This assessment was supervised'), optional:false}],
    input:v => ({ standAt:iso(v,'standAt'), supervised:flag(v,'supervised'), activity:v.activity,
      samples:(['lying','standing'] as const).map(position => ({ position:position === 'lying' ? 'supine' : 'standing',
        recordedAt:iso(v,position+'Time'), systolic:num(v,position+'Sys'), diastolic:num(v,position+'Dia'), heartRate:num(v,position+'Hr') })) }) },
  radiation: { title:'Record radiation exposure', description:'Enter the measured quantity and its exposure interval. Use a consistent instrument or series name to identify comparable readings.', button:'Save exposure', area:'radiation', operation:'radiation',
    fields:[missionId, text('seriesId','Instrument or series name'), select('scope','Exposure coverage',[['mission','Current mission'],['prior_spaceflight','Previous spaceflight']]),
      select('quantity','Dose quantity',[['effective','Effective dose'],['absorbed','Absorbed dose'],['equivalent_organ','Organ dose in gray-equivalent']]),
      only('organ',v => v.quantity !== 'effective',text('organ','Organ measured')), select('mode','Reading type',[['increment','Dose during this interval'],['counter','Accumulated counter reading']]),
      date('periodStart','Exposure start'), date('recordedAt','Exposure end'), number('value','Dose reading'),
      ...Object.entries(doseUnits).map(([qty,units]) => only(qty,v => v.quantity === qty,select(qty,'Dose unit',units))),
      only('completePriorHistory',v => v.scope === 'prior_spaceflight' && v.quantity === 'effective' && v.mode === 'counter',check('completePriorHistory','This total covers all previous spaceflight exposure')),
      only('nasaQ',v => v.quantity === 'effective',check('nasaQ','This reading uses the NASA quality factor method'))],
    input:v => ({ missionId:identifier(v.missionId), seriesId:identifier(v.seriesId), scope:v.scope, quantity:v.quantity, organ:v.quantity === 'effective' ? null : identifier(v.organ),
      mode:v.mode, periodStart:iso(v,'periodStart'), recordedAt:iso(v,'recordedAt'), value:num(v,'value'), unit:v[v.quantity],
      completePriorHistory:v.scope === 'prior_spaceflight' && v.quantity === 'effective' && v.mode === 'counter' && flag(v,'completePriorHistory'),
      ...(v.quantity === 'effective' && flag(v,'nasaQ') ? { doseMethod:'NASA_Q' } : {}) }) },
  mission: { title:'Update mission context', description:'Record current communication and the resources aboard. The response estimate is for planning.', button:'Save mission context', area:distance, operation:'mission',
    fields:[missionId, select('destination','Destination',[['ISS','International Space Station'],['Moon','Moon'],['Mars','Mars']]), activity, date('startedAt','Mission start'),
      select('communication','Connection status',[['available','Available'],['delayed','Delayed'],['unavailable','Unavailable']]),
      { ...number('oneWaySeconds','One-way delay','s'), optional:true, hint:'Required unless the connection is unavailable.' },
      { ...number('processingSeconds','Ground processing estimate','s'), optional:true }, check('solarConjunction','Simulated Mars solar conjunction'),
      { key:'medicalResources', label:'Onboard medical resources', type:'textarea', maxLength:500 }],
    input:(v,recordedAt) => ({ missionId:identifier(v.missionId), destination:v.destination, activity:v.activity, startedAt:iso(v,'startedAt'), recordedAt, communication:v.communication,
      oneWaySeconds:v.oneWaySeconds === undefined || v.oneWaySeconds === '' ? null : num(v,'oneWaySeconds'), solarConjunction:flag(v,'solarConjunction'),
      medicalResources:v.medicalResources, ...(v.processingSeconds ? {processingSeconds:num(v,'processingSeconds')} : {}) }) },
  reference: { title:'Record pre-mission reference', description:'Use an assessment recorded before the mission started.', button:'Save reference', area:distance, operation:'reference',
    fields:[missionId, select('indicator','Measurement',fitness), fitnessMethod, date('recordedAt','Reference date and time'), fitnessValue],
    input:v => ({ missionId:identifier(v.missionId), indicator:v.indicator, method:identifier(v.method), recordedAt:iso(v,'recordedAt'), value:num(v,'value'), unit:fitnessUnits[v.indicator] }) },
  fitness: { title:'Record fitness measurement', description:'Use the same test method and unit as your pre-mission reference for comparison.', button:'Save fitness measurement', area:gravity,
    fields:[missionId, select('indicator','Measurement',fitness), fitnessMethod, fitnessValue, activity,
      only('evaEnvironment',v => v.indicator === 'vo2max' && v.activity === 'eva',select('evaEnvironment','Spacewalk environment',[['microgravity','Microgravity'],['surface','Planetary surface']]))],
    records:v => [{ indicator:v.indicator, value:num(v,'value'), unit:fitnessUnits[v.indicator],
      context:{ missionId:identifier(v.missionId), method:identifier(v.method), activity:v.activity, ...(v.indicator === 'vo2max' && v.activity === 'eva' ? { evaEnvironment:v.evaEnvironment } : {}) } }] },
  exercise: { title:'Record exercise', description:'Record an exercise session for your activity history.', button:'Save exercise', area:gravity,
    fields:[number('exercise_duration','Exercise duration','min',1)],
    records:v => [{ indicator:'exercise_duration', value:num(v,'exercise_duration'), unit:'min' }] },
  cabinConditions: { title:'Record cabin conditions', description:'Enter environmental temperature and relative humidity. Automatic classification is unavailable.', button:'Save cabin conditions', area:cabin,
    fields:[number('temperature','Air temperature','°C'), number('relative_humidity','Relative humidity','%',0,100)],
    records:v => [{ indicator:'temperature', value:num(v,'temperature'), unit:'Cel' },{ indicator:'relative_humidity', value:num(v,'relative_humidity'), unit:'%' }] },
  report: { title:'Prepare a report', description:'Summarize the selected records for local review. Preparing a report does not send it to Earth.', button:'Prepare report', area:distance, operation:'report',
    fields:[] },
} satisfies Record<string, Form>;

export type EntryKind = keyof typeof entryForms;
export function entryForm(kind: EntryKind): Form { return entryForms[kind]; }
export function fieldUnit(kind: EntryKind, field: Field, values: Values) {
  return (kind === 'reference' || kind === 'fitness') && field.key === 'value' ? fitnessUnits[values.indicator] : field.unit;
}
function identifier(value: string) { return value.trim().replace(/\s+/g,'-'); }
