export const HOUR = 3600000;
export const DAY = 24 * HOUR;
const nasa1 = 'https://www.nasa.gov/wp-content/uploads/2023/11/nasa-std-3001-vol-1-rev-c-with-signature.pdf';
const nasa2 = 'https://standards.nasa.gov/sites/default/files/standards/NASA/D/nasa-std-3001-vol-2-rev-d-signature.pdf';
const co2Brief = 'https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf';
const pio2Table = 'https://ntrs.nasa.gov/api/citations/20220019130/downloads/SKC%20EVA%20Gas%20Related%20Problems%20related%20to%20Spacesuits%20Dec%202022_Final.pdf';
const acoustics = 'https://ntrs.nasa.gov/api/citations/20090043801/downloads/20090043801.pdf';
const dcsBrief = 'https://www.nasa.gov/sites/default/files/atoms/files/dcs_technical_brief_ochmo.pdf';
const srag = 'https://www.nationalacademies.org/cdn/materials/9fba0b8d-da37-49fe-9fc5-45b736630da3';
const standardMeasures = 'https://www.nasa.gov/reference/standard-measures/';
const eyeSurveillance = 'https://ntrs.nasa.gov/api/citations/20170009173/downloads/20170009173.pdf';
const orthostatic = 'https://www.msdmanuals.com/professional/cardiovascular-disorders/symptoms-of-cardiovascular-disorders/orthostatic-hypotension';
const official = (url, edition, section) => ({ classification: 'official_standard', url, edition, section });
const team = (section, url) => ({ classification: 'team_proposal', section, ...(url ? { url } : {}) });
const rule = (id, kind, source, options) => ({ id, version: 2, kind, source, ...options });
const fitnessMessages = {
  advisory: 'Your fitness is getting close to the minimum level (80% of pre-flight). Keep your full exercise schedule this week.',
  caution: 'Your fitness is below 80% of your pre-flight level, the NASA minimum. Review your exercise plan with the Crew Medical Officer.',
};
const vo2Message = 'Your aerobic capacity is below the minimum for this EVA. Follow the EVA readiness procedure and talk to your Crew Medical Officer before the EVA.';

// Regras da especificação v2, seção 3. O limite oficial fica em `source`; o nível atribuído a cada
// faixa é sempre proposta do time (`levelSource`), como manda a seção 2.1.
export const rules = {
  co2: rule('cabin_co2_1h', 'time_weighted', official(nasa2, 'NASA-STD-3001 Vol. 2 Rev. D, §6.2.1.3', 'V2 6004'), {
    windowMs: HOUR, maxGapMs: 10 * 60000, maxAgeMs: 5 * 60000, minCoverage: 1, limit: 3, warningAbove: 4.5, operational: true,
    levelSource: team('Above 3.0 mmHg is Caution. Above 4.5 mmHg is Warning: band of reported symptoms in OCHMO-TB-004, not an official limit.', co2Brief),
    context: 'Nominal habitable cabin, one location and source', limitation: 'Linear interpolation across gaps of at most 10 minutes is an app approximation. No extrapolation.',
    messages: {
      caution: 'Cabin CO2 is above the 1-hour limit. Headaches and poor sleep are more common at this level. Report it to the crew.',
      warning: "Cabin CO2 is high. Follow your mission's CO2 procedure and alert the crew and ground team.",
    },
  }),
  co2Week: rule('cabin_co2_7d', 'time_weighted', team('7-day average at or above 2.5 mmHg is Advisory. Research finding in OCHMO-TB-004, not a general limit of the standard.', co2Brief), {
    windowMs: 7 * DAY, maxGapMs: 10 * 60000, maxAgeMs: 5 * 60000, minCoverage: 1, limit: 2.5,
    limitation: 'Needs seven days of continuous readings from one location and source. No extrapolation.',
    messages: { advisory: 'Average CO2 this week is above 2.5 mmHg. Log any headache so the crew can compare.' },
  }),
  pressure: rule('cabin_pressure_total', 'threshold', official(nasa2, 'NASA-STD-3001 Vol. 2 Rev. D', 'V2 6006'), {
    minimumPsia: 5, maximumPsia: 15, mmHgPerPsia: 6894.757293168 * 760 / 101325, maxAgeMs: 5 * 60000, operational: true,
    levelSource: team('Outside 5.0 to 15.0 psia is Emergency. Prototype simplification: exposure duration and atmosphere composition are not considered. Rev. E not checked.'),
    messages: { emergency: 'CABIN PRESSURE OUTSIDE SAFE LIMITS. Follow the depressurization emergency procedure now.' },
  }),
  oxygen: rule('cabin_inspired_oxygen', 'threshold', official(pio2Table, 'NASA-STD-3001 Vol. 2 Rev. B, PIO2 table (NASA presentation, 2022)', 'Inspired oxygen partial pressure'), {
    normal: [145, 155], caution: [127, 356], maxAgeMs: 5 * 60000, operational: true,
    levelSource: team('127 to 144 or 156 to 356 mmHg is Caution; below 127 or above 356 mmHg is Emergency. Values from the Rev. B table; Rev. D differs and Rev. E was not checked. Exposure time is not considered.'),
    messages: {
      caution: 'Oxygen level is outside the target range. The crew should check the life support system.',
      emergency: 'OXYGEN OUTSIDE SAFE LIMITS. Follow the cabin atmosphere emergency procedure now.',
    },
  }),
  climate: rule('cabin_temperature_humidity', 'threshold', official(nasa2, 'NASA-STD-3001 Vol. 2 Rev. D', 'V2 6012, V2 6013'), {
    comfort: { temperature: [20, 25], humidity: [30, 60] }, safeTemperature: [18, 27], minimumHumidity: 25, maxAgeMs: 5 * 60000, operational: true,
    levelSource: team('Rectangular box instead of the official temperature and humidity polygon. Prototype simplification. Latest reading instead of an average.'),
    messages: {
      advisory: 'Cabin temperature or humidity is outside the comfort zone.',
      caution: 'Cabin temperature or humidity is outside safe limits. Alert the crew.',
    },
  }),
  noise: rule('cabin_noise_dba', 'threshold', official(nasa2, 'NASA-STD-3001 Vol. 2 Rev. D', 'V2 6077'), {
    work: 58, sleep: 49, ceiling: 85, maxAgeMs: 5 * 60000,
    levelSource: team('Broadband dBA instead of the NC-50 and NC-40 octave-band curves (NC-50 is about 58 dBA, NC-40 about 49 dBA). Prototype simplification.', acoustics),
    messages: {
      advisory: 'Noise is above the recommended level. Consider hearing protection.',
      caution: 'Noise is above 85 dBA. Leave the area or use hearing protection now.',
    },
  }),
  aerobic_capacity: rule('aerobic_preflight', 'pre_mission', official(nasa1, 'Vol. 1 Rev. C', 'V1 4003'), { minimum: 80, advisoryBelow: 90,
    levelSource: team('Below 80% of pre-flight is Caution. 80% to 89% is Advisory.'), messages: fitnessMessages }),
  muscle_strength: rule('strength_preflight', 'pre_mission', official(nasa1, 'Vol. 1 Rev. C', 'V1 4024'), { minimum: 80, advisoryBelow: 90,
    levelSource: team('Below 80% of pre-flight is Caution. 80% to 89% is Advisory.'), messages: fitnessMessages }),
  body_mass: rule('mass_preflight', 'pre_mission', team('Loss of 3% to 5% of pre-flight body mass is Advisory, above 5% is Caution. 5% is the Food and Nutrition Risk Record milestone, not an official limit.'), {
    advisoryLoss: 3, cautionLoss: 5,
    messages: {
      advisory: 'You have lost some body mass since launch. Try to eat your full planned meals and log your food.',
      caution: 'You have lost more than 5% of your pre-flight body mass. Talk to your Crew Medical Officer about your nutrition plan.',
    },
  }),
  evaMicro: rule('vo2max_microgravity_eva', 'threshold', official(nasa1, 'Vol. 1 Rev. C', 'V1 4001'), { minimum: 32.9, operational: true,
    levelSource: team('Below the minimum for the EVA context is Warning.'), messages: { warning: vo2Message } }),
  evaSurface: rule('vo2max_surface_eva', 'threshold', official(nasa1, 'Vol. 1 Rev. C', 'V1 4002'), { minimum: 36.5, operational: true,
    levelSource: team('Below the minimum for the EVA context is Warning.'), messages: { warning: vo2Message } }),
  career: rule('spaceflight_career_dose', 'cumulative', official(nasa1, 'Vol. 1 Rev. C', 'V1 4030'), { limit: 600, bands: [75, 90, 100],
    bandSource: team('75% and 90% are demonstration bands'), levelSource: team('75% to 89% is Advisory, 90% to 99% is Caution, 100% or more is Warning.'),
    messages: {
      advisory: 'Your accumulated radiation dose is above 75% of your career limit.',
      caution: 'Your accumulated dose is close to your career limit. Your Crew Medical Officer and the ground team will review your schedule.',
      warning: "Your accumulated dose reached your career limit. Follow your mission's radiation procedure and talk to your Crew Medical Officer.",
    } }),
  exposure: rule('dose_ledger', 'cumulative', team('One non-overlapping ledger per scope, quantity and organ'), {}),
  news2: rule('news2_scale_1', 'composite_score', official('https://www.rcp.ac.uk/resources/national-early-warning-score-news-2/', 'RCP 2017', 'Charts 1 and 2'), {
    maxSpanMs: 5 * 60000, maxAgeMs: 10 * 60000,
    bands: {
      respiratory_rate: [[8,3],[11,1],[20,0],[24,2],[null,3]],
      spo2: [[91,3],[93,2],[95,1],[null,0]],
      blood_pressure_systolic: [[90,3],[100,2],[110,1],[219,0],[null,3]],
      heart_rate: [[40,3],[50,1],[90,0],[110,1],[130,2],[null,3]],
      body_temperature: [[35,3],[36,1],[38,0],[39,1],[null,2]],
    },
    oxygenPoints: 2, alteredConsciousnessPoints: 3, medium: 5, high: 7, individualTrigger: 3,
    // Valores impossíveis viram Unavailable (especificação 2.4): FC 0 ou > 250, SpO2 > 100, temperatura < 30 °C.
    plausible: { heart_rate: [1, 250], spo2: [0, 100], body_temperature: [30, Infinity] },
    levelSource: team('One parameter scoring 3, or a total of 5 to 6, is Caution. A total of 7 or more is Warning and never Emergency. Readings older than 10 minutes are Unavailable.'),
    title: 'Early warning score (terrestrial reference, experimental)',
    messages: {
      caution: 'One or more vital signs are outside the expected range. Rest for 5 minutes and measure again. If it stays the same, talk to your Crew Medical Officer.',
      warning: 'Several vital signs are outside the expected range. Stop your current activity, stay where the crew can see you, and contact your Crew Medical Officer now. A report for the flight surgeon is ready.',
      unavailable: 'No reliable vital signs. Check that the sensor is on and in contact with your skin.',
    },
    limitation: 'Hospital NEWS2, Scale 1 only. Not validated for astronauts. Low risk does not establish normal vital signs.',
  }),
  posture: rule('post_landing_stand_test', 'difference', { classification: 'external_reference', url: orthostatic, section: 'Freeman et al. 2011 consensus: 20/10 mmHg within 3 minutes. Earth clinical definition, not a NASA limit.' }, {
    systolicDrop: 20, diastolicDrop: 10, heartRateRise: 30, withinSeconds: 180, appliesTo: 'post_landing',
    levelSource: team('Drop of 20/10 mmHg is Caution, with dizziness or near-fainting it is Warning, heart rate rise of 30 bpm is Advisory. Only assessed after landing.', standardMeasures),
    messages: {
      advisory: 'Your heart rate rose when you stood up. Move slowly.',
      caution: 'Your blood pressure dropped when you stood up. This is common after spaceflight. Stand up slowly and follow your post-landing plan.',
      warning: 'Your blood pressure dropped and you felt faint. Sit or lie down now and inform your Crew Medical Officer.',
    },
  }),
  symptoms: rule('balance_vision_symptoms', 'checklist', team('Cut-offs of the self-report scales are team decisions. Prototype scale, not a validated instrument.', standardMeasures), {
    maxAgeMs: 36 * HOUR, motionAdvisory: 5, motionCaution: 20, headacheAdvisory: 4, references: [standardMeasures, eyeSurveillance, co2Brief],
    messages: {
      motion_sickness: {
        advisory: 'You reported motion sickness. Limit fast head movements and log whether any medication helped.',
        caution: 'You reported vomiting. Drink small amounts of water often and talk to your Crew Medical Officer.',
      },
      dizziness: {
        advisory: 'You reported dizziness. Move slowly and hold on to handrails.',
        warning: 'Dizziness with near-fainting. Lie down or stay secured and contact your Crew Medical Officer now.',
      },
      vision: { caution: 'You noticed a change in your vision. This is common in long missions. Your Crew Medical Officer may schedule an eye exam.' },
      headache: { advisory: 'You reported a headache. Check the cabin CO2 reading and your hydration.' },
    },
  }),
  postEva: rule('post_eva_symptoms', 'checklist', team('Any reported item is Warning. There is no approved Emergency criterion in the app.', dcsBrief), { operational: true,
    messages: {
      warning: 'You reported a symptom that can be related to decompression after EVA. Tell your Crew Medical Officer now and follow the decompression sickness procedure. Do not wait for it to pass.',
      normal: 'No symptoms reported. Check again in 1 hour.',
    },
  }),
  solar: rule('simulated_solar_event', 'threshold', team('Synthetic event flag, no external feed. SPE inside the vehicle is Advisory; SPE during EVA or an ESPE is Warning.', srag), { minimum: 1, operational: true,
    messages: {
      advisory: 'Solar particle event detected. Inside the vehicle the impact is minimal. EVAs may be postponed by the flight team.',
      eva: 'Solar particle event during EVA. Follow your EVA radiation procedure now.',
      espe: "Energetic solar particle event. Follow your mission's shelter procedure and move to the shielded area.",
      normal: 'Radiation levels are back to normal.',
    } }),
  comm: rule('communication_context', 'threshold', team('No Earth link is shown as Advisory. Ground reports stay queued until the link returns.'), {
    processingSeconds: 900,
    messages: { advisory: 'No contact with Earth. Follow the onboard procedure with your Crew Medical Officer.' },
  }),
};
// Validade (2.4): sinais vitais 10 min, cabine 5 min, check-in diário 36 h. Proposta do time.
export const freshness = { fitnessMs: 14 * DAY, isolationMs: 7 * DAY, checkInMs: 36 * HOUR, solarMs: HOUR, checklistMs: DAY };
export const checkInIndicators = ['sleep_duration', 'sleep_quality', 'sleepiness_kss', 'fatigue_samn_perelli', 'stress', 'mood_score'];
// Local do sensor simulado ao vivo; os cenários de cabine usam o mesmo por padrão.
export const LIVE_LOCATION = 'cabin-main';
export const gas = { ppmPerFraction: 1e6, waterVapourMmHg: 47, mmHgPerUnit: { mmHg: 1, kPa: 760 / 101.325, psia: 6894.757293168 * 760 / 101325 } };
export const doseUnits = { effective: { Sv:1000,mSv:1,uSv:0.001 }, absorbed: { Gy:1000,mGy:1,uGy:0.001 }, equivalent_organ: { 'Gy-Eq':1000,'mGy-Eq':1,'uGy-Eq':0.001 } };
export const doseCanonical = { effective:'mSv', absorbed:'mGy', equivalent_organ:'mGy-Eq' };
export const fitnessUnits = { body_mass:'kg', aerobic_capacity:'mL/kg/min', muscle_strength:'N', vo2max:'mL/kg/min' };
export const evaSymptoms = ['itching','muscle_joint_pain','rash','numbness_weakness','thinking_speech_change','dizziness_balance_hearing','breathlessness_chest_pain'];
export const destinations = ['ISS','Moon','Mars'];
export const activities = ['routine','exercise','eva','landing','post_landing','post_eva','transit'];
export const solarClasses = ['SPE','ESPE'];
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
    measurement('motion_sickness','Motion sickness',null,'balance_vision',{ valueType:'scale', scale:{min:0,max:20,numericType:'integer'}, description:'Self-report from 0 (feeling fine) to 20 (vomiting).' }),
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
  radiation: { exposure:['dose_rate','accumulated_dose','radiation_increment','radiation_counter','career_effective_dose'], solar:['solar_event_simulated'] },
  isolation_confinement: { sleep:['sleep_duration','sleep_quality'], check_in:['sleepiness_kss','fatigue_samn_perelli','stress','mood_score'], vigilance:['pvt_response_speed','pvt_lapses','pvt_false_starts'] },
  gravity_fields: { fitness:[...Object.keys(fitnessUnits),'exercise_duration'], balance_vision:['motion_sickness','headache','dizziness','near_fainting','vision_change','amsler_change','balance_vision_symptoms'], vital_signs:['heart_rate','blood_pressure_systolic','blood_pressure_diastolic','respiratory_rate','spo2','body_temperature','supplemental_oxygen','consciousness','news2','posture'] },
  hostile_closed_environment: { atmosphere:['co2_concentration','cabin_pressure','co2_partial_pressure','co2_partial_pressure_7d','oxygen_fraction','oxygen_partial_pressure','inspired_oxygen_pressure','temperature','relative_humidity','temperature_humidity'], noise:['cabin_noise'], post_eva:['post_eva_symptoms','reported_symptoms'] },
  distance_from_earth: { mission:['communication_delay','onboard_medical_resources'], reports:[] },
};
export const groupOf = (areaId, indicator) => Object.entries(groups[areaId] ?? {}).find(([, list]) => list.includes(indicator))?.[0] ?? null;

export const assessmentMessages = {
  insufficient_data:'No reliable data. Check the sensor and measure again.',
  not_applicable:'This rule does not apply to the recorded context.',
  stale:'No reliable data. Check the sensor and measure again.',
  assessed:'Within the expected range.',
  no_demonstrative_signal:'Within the expected range.',
};
