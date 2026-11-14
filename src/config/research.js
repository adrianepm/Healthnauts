export const HOUR = 3600000;
export const DAY = 24 * HOUR;
const nasa1 = 'https://www.nasa.gov/wp-content/uploads/2023/11/nasa-std-3001-vol-1-rev-c-with-signature.pdf';
const nasa2 = 'https://standards.nasa.gov/sites/default/files/standards/NASA/D/nasa-std-3001-vol-2-rev-d-signature.pdf';
const official = (url, edition, section) => ({ classification: 'official_standard', url, edition, section });
const team = section => ({ classification: 'team_proposal', section });
const rule = (id, kind, source, options) => ({ id, version: 1, kind, source, ...options });
export const rules = {
  co2: rule('cabin_co2_1h', 'time_weighted', official(nasa2, 'NASA-STD-3001 Vol. 2 Rev. D, §6.2.1.3', 'V2 6004'), {
    windowMs: HOUR, maxGapMs: 10 * 60000, maxAgeMs: 10 * 60000, minCoverage: 1, limit: 3,
    context: 'Nominal habitable cabin, one location and source', limitation: 'Linear interpolation across gaps of at most 10 minutes is an app approximation. No extrapolation.',
    message: 'The one-hour cabin CO₂ estimate exceeds the design reference. Share the readings with the crew.',
  }),
  aerobic_capacity: rule('aerobic_preflight', 'pre_mission', official(nasa1, 'Vol. 1 Rev. C', 'V1 4003'), { minimum: 80, message:'The recorded result is below the pre-mission comparison reference. Review compatible test results with the crew.' }),
  muscle_strength: rule('strength_preflight', 'pre_mission', official(nasa1, 'Vol. 1 Rev. C', 'V1 4024'), { minimum: 80, message:'The recorded result is below the pre-mission comparison reference. Review compatible test results with the crew.' }),
  body_mass: rule('mass_preflight', 'pre_mission', team('Descriptive comparison only'), {}),
  evaMicro: rule('vo2max_microgravity_eva', 'threshold', official(nasa1, 'Vol. 1 Rev. C', 'V1 4001'), { minimum: 32.9, message:'The recorded VO₂max is below the reference for the specified EVA context. Review with the crew.' }),
  evaSurface: rule('vo2max_surface_eva', 'threshold', official(nasa1, 'Vol. 1 Rev. C', 'V1 4002'), { minimum: 36.5, message:'The recorded VO₂max is below the reference for the specified EVA context. Review with the crew.' }),
  career: rule('spaceflight_career_dose', 'cumulative', official(nasa1, 'Vol. 1 Rev. C', 'V1 4030'), { limit: 600, message:'Review the supplied spaceflight exposure ledger with the radiation team.', bands: [75, 90], bandSource: team('75% and 90% are demonstration bands') }),
  exposure: rule('dose_ledger', 'cumulative', team('One non-overlapping ledger per scope, quantity and organ'), {}),
  news2: rule('news2_scale_1', 'composite_score', official('https://www.rcp.ac.uk/resources/national-early-warning-score-news-2/', 'RCP 2017', 'Charts 1 and 2'), {
    maxSpanMs: 5 * 60000, maxAgeMs: HOUR,
    bands: {
      respiratory_rate: [[8,3],[11,1],[20,0],[24,2],[null,3]],
      spo2: [[91,3],[93,2],[95,1],[null,0]],
      blood_pressure_systolic: [[90,3],[100,2],[110,1],[219,0],[null,3]],
      heart_rate: [[40,3],[50,1],[90,0],[110,1],[130,2],[null,3]],
      body_temperature: [[35,3],[36,1],[38,0],[39,1],[null,2]],
    },
    oxygenPoints: 2, alteredConsciousnessPoints: 3, medium: 5, high: 7, individualTrigger: 3,
    message: 'Review this demonstration NEWS2 result with the crew medical officer.',
    limitation: 'Hospital NEWS2, Scale 1 only. Spaceflight application is demonstrative. Low risk does not establish normal vital signs.',
  }),
  posture: rule('posture_delta', 'difference', team('Descriptive comparison within one supervised assessment'), {}),
  postEva: rule('post_eva_symptoms', 'checklist', { classification: 'team_proposal', url: 'https://www.nasa.gov/reference/risk-of-decompression-sickness/', section: 'Crew review of reported symptoms' }, {
    message: 'Report these post-EVA symptoms to the crew medical officer for assessment.',
  }),
  solar: rule('simulated_solar_event', 'threshold', team('Synthetic event flag, no external feed'), { minimum: 1, message: 'Simulated solar event active. Review the mission procedure in this exercise.' }),
  comm: rule('communication_context', 'threshold', team('Local report preparation with link status'), {
    processingSeconds: 900, message: 'Ground communication is unavailable. A report can be prepared locally.',
  }),
};
export const freshness = { fitnessMs: 14 * DAY, isolationMs: 7 * DAY, solarMs: HOUR, checklistMs: DAY };
export const gas = { ppmPerFraction: 1e6, waterVapourMmHg: 47, mmHgPerUnit: { mmHg: 1, kPa: 760 / 101.325, psia: 6894.757293168 * 760 / 101325 } };
export const doseUnits = { effective: { Sv:1000,mSv:1,uSv:0.001 }, absorbed: { Gy:1000,mGy:1,uGy:0.001 }, equivalent_organ: { 'Gy-Eq':1000,'mGy-Eq':1,'uGy-Eq':0.001 } };
export const doseCanonical = { effective:'mSv', absorbed:'mGy', equivalent_organ:'mGy-Eq' };
export const fitnessUnits = { body_mass:'kg', aerobic_capacity:'mL/kg/min', muscle_strength:'N', vo2max:'mL/kg/min' };
export const evaSymptoms = ['itching','muscle_joint_pain','rash','numbness_weakness','thinking_speech_change','dizziness_balance_hearing','breathlessness_chest_pain'];
export const destinations = ['ISS','Moon','Mars'];
export const activities = ['routine','exercise','eva','landing','post_landing','post_eva','transit'];
export const restrictedExport = new Set(['stress','mood','mood_score']);

const measurement = (id, label, unit, group, options = {}) => ({
  id, label, unit, displayUnit: unit, valueType: 'number', recordKind: 'measurement', group, scale: { min: 0 }, seeded: false, ...options,
});
const composite = (id, label, unit, group, options) => measurement(id, label, unit, group, { operationOnly: true, ...options });
const flag = (id, label, group) => measurement(id, label, null, group, { valueType: 'scale', scale: { min:0, max:1, numericType:'integer' } });
export const additions = {
  radiation: [
    composite('radiation_increment','Incremental exposure',null,'exposure',{ dynamicUnit: true, allowsPeriodStart: true }),
    composite('radiation_counter','Exposure counter',null,'exposure',{ dynamicUnit: true, allowsPeriodStart: true }),
    composite('solar_event_simulated','Simulated solar event',null,'solar',{ valueType:'scale', scale:{min:0,max:1,numericType:'integer'} }),
  ],
  gravity_fields: [
    ...Object.entries(fitnessUnits).map(([id,unit]) => measurement(id, ({body_mass:'Body mass',aerobic_capacity:'Aerobic capacity',muscle_strength:'Muscle strength',vo2max:'VO₂max'})[id],unit,'fitness',{ contextFields: ['method','activity','evaEnvironment','missionId'] })),
    measurement('motion_sickness','Motion sickness',null,'balance_vision',{ valueType:'scale', scale:{min:0,max:20,numericType:'integer'}, description:'Self-report, collection only.' }),
    measurement('headache','Headache',null,'balance_vision',{ valueType:'scale', scale:{min:0,max:10}, description:'Prototype scale, not a validated instrument.' }),
    ...[['dizziness','Dizziness'],['near_fainting','Near fainting'],['vision_change','Vision change'],['amsler_change','Self-reported Amsler change']].map(([id,label]) => flag(id,label,'balance_vision')),
    composite('respiratory_rate','Respiratory rate','breaths/min','vital_signs',{scale:{min:0,numericType:'integer'}}),
    composite('spo2','Peripheral oxygen saturation','%','vital_signs',{scale:{min:0,max:100,numericType:'integer'}}),
    composite('body_temperature','Body temperature','Cel','vital_signs',{scale:{min:0,precision:1}}),
    { ...flag('supplemental_oxygen','Supplemental oxygen','vital_signs'), operationOnly:true },
    composite('consciousness','Assessor-reported consciousness',null,'vital_signs',{valueType:'text',scale:null}),
  ],
  hostile_closed_environment: [
    composite('cabin_pressure','Total cabin pressure','mmHg','atmosphere'),
    composite('co2_partial_pressure','CO₂ partial pressure','mmHg','atmosphere'),
    composite('oxygen_fraction','Cabin oxygen fraction','fraction','atmosphere',{scale:{min:0,max:1}}),
    composite('oxygen_partial_pressure','Dry oxygen partial pressure','mmHg','atmosphere'),
    composite('inspired_oxygen_pressure','Inspired oxygen pressure','mmHg','atmosphere'),
    composite('cabin_noise','Cabin noise','dBA','noise',{ allowsPeriodStart:true }),
    composite('post_eva_symptoms','Post-EVA symptom checklist',null,'post_eva',{valueType:'text',scale:null}),
  ],
};
export const groups = {
  radiation: { exposure:['dose_rate','accumulated_dose','radiation_increment','radiation_counter'], solar:['solar_event_simulated'] },
  isolation_confinement: { sleep:['sleep_duration','sleep_quality'], check_in:['sleepiness_kss','fatigue_samn_perelli','stress','mood_score'], vigilance:['pvt_response_speed','pvt_lapses','pvt_false_starts'] },
  gravity_fields: { fitness:[...Object.keys(fitnessUnits),'exercise_duration'], balance_vision:['motion_sickness','headache','dizziness','near_fainting','vision_change','amsler_change','balance_vision_symptoms'], vital_signs:['heart_rate','blood_pressure_systolic','blood_pressure_diastolic','respiratory_rate','spo2','body_temperature','supplemental_oxygen','consciousness'] },
  hostile_closed_environment: { atmosphere:['co2_concentration','cabin_pressure','co2_partial_pressure','oxygen_fraction','oxygen_partial_pressure','inspired_oxygen_pressure','temperature','relative_humidity'], noise:['cabin_noise'], post_eva:['post_eva_symptoms','reported_symptoms'] },
  distance_from_earth: { mission:['communication_delay','onboard_medical_resources'], reports:[] },
};

export const assessmentMessages = {
  insufficient_data:'There is not enough comparable data for this assessment.',
  not_applicable:'This rule does not apply to the recorded context.',
  stale:'The last measurement is too old for a current assessment.',
  assessed:'The calculation is available for crew review.',
  no_demonstrative_signal:'No demonstration rule was triggered for these inputs.',
};
