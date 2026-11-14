import { additions } from './research.js';
import { dailyCollection, pvtCollection, isolationMonitoring, isolationReferences as refs } from './isolation.js';
const indicator = (id, label, unit, recordKind, description, extra = {}) => ({
  id, label, valueType: unit === null ? 'text' : 'number', unit,
  displayUnit: unit === 'Cel' ? '°C' : unit, recordKind, description, scale: null, ...extra,
});
const scale = (id, label, minLabel, maxLabel) => indicator(id, label, null, 'self_report',
  'Prototype scale, not a validated instrument.', {
    valueType: 'scale', scale: { min: 1, max: 5, step: 1, numericType: 'integer', precision: 0, minLabel, maxLabel },
  });
const mind = (id, label, unit, description, constraints, extra = {}) => indicator(id, label, unit, 'self_report', description, {
  valueType: 'scale', scale: constraints, collection: dailyCollection, monitoring: isolationMonitoring[id],
  references: [refs.rst], ...extra,
});
const score = { min: 0, max: 100, numericType: 'number', precision: 2, step: 0.01 };
const pvt = (id, label, unit, description, constraints) => mind(id, label, unit, description, constraints, {
  valueType: 'number', recordKind: 'performance_aggregate', collection: pvtCollection,
  groupRequired: true, aggregateGroup: 'pvt_b', references: [refs.pvt, refs.rst],
});
export const pvtIndicators = ['pvt_response_speed', 'pvt_lapses', 'pvt_false_starts'];
export const catalog = {
  radiation: [
    indicator('dose_rate', 'Dose rate', 'uSv/h', 'environmental_exposure', 'Rate shown by the instrument in uSv/h. The legacy reading has no defined dosimetric quantity: it is not integrated automatically and not compared with organ limits.'),
    indicator('accumulated_dose', 'Accumulated dose', 'uSv', 'environmental_exposure', 'Counter reading in uSv between periodStart and recordedAt. The legacy reading has no defined dosimetric quantity. Accumulated readings are never summed.', { periodStartRequired: true }),
  ],
  isolation_confinement: [
    mind('sleep_duration', 'Sleep duration', 'h', 'Calculated on the server by sleep-episodes (or received ready from the legacy records endpoint): (wake time − bed time − minutes to fall asleep − minutes awake at night), in hours. Timestamps carry a time zone and may cross midnight. Components are kept in operation.input.',
      { min: 0, max: 24, numericType: 'number', precision: 2, step: 0.01 }, {
        valueType: 'number', allowsPeriodStart: true, references: [refs.rst, refs.planning],
        calculation: { performedBy: 'server', endpoint: '/api/v1/areas/isolation_confinement/sleep-episodes', legacyPrecomputedAccepted: true, formula: '(wakeAt - bedAt) / 3600000 - (sleepLatencyMinutes + awakeMinutes) / 60',
          components: [
            { name: 'bedAt', description: 'Bed time with time zone.' },
            { name: 'wakeAt', description: 'Wake time with time zone.' },
            { name: 'sleepLatencyMinutes', unit: 'min', description: 'Minutes to fall asleep.' },
            { name: 'awakeMinutes', unit: 'min', description: 'Total minutes awake during the night.' },
          ], storedComponents: true, storage: 'operation.input' },
      }),
    mind('sleep_quality', 'Sleep quality', null, 'Personal rating from 0 to 100. Own labels: lower to higher perceived quality.', score),
    mind('sleepiness_kss', 'Sleepiness (KSS reference)', null, 'Values 1 to 9 of the referenced scale. Own short labels, not the official text.',
      { min: 1, max: 9, numericType: 'integer', precision: 0, step: 1, minLabel: 'Least sleepy', maxLabel: 'Most sleepy' },
      { references: [refs.kss], usage: { fullTextIncluded: false, permissionStatus: 'confirmation_required', note: 'Confirm permission with the authors before including the full KSS text.' } }),
    mind('fatigue_samn_perelli', 'Fatigue (Samn–Perelli reference)', null, 'Self-report from 1 to 7. Own short labels.',
      { min: 1, max: 7, numericType: 'integer', precision: 0, step: 1, minLabel: 'Least fatigue', maxLabel: 'Most fatigue' }, { references: [refs.samn] }),
    mind('stress', 'Stress', null, 'Perceived intensity from 0 to 100. Prototype scale, not a validated instrument.', score, { references: [refs.rst, refs.behavioral], privacy: { intendedAudience: ['astronaut', 'crew_medical_officer'], enforced: false } }),
    mind('mood_score', 'Mood', null, 'Personal rating from 0 to 100, from less positive to more positive. Prototype scale, not a validated instrument.', score, { references: [refs.behavioral], privacy: { intendedAudience: ['astronaut', 'crew_medical_officer'], enforced: false } }),
    pvt('pvt_response_speed', 'PVT-B mean speed', '1/s', 'Mean of 1/RT, with RT in seconds, calculated on the server by pvt-sessions from times measured in the browser with performance.now(). It is not 1/mean(RT). False starts (under 100 ms or a tap without stimulus) are excluded; a 30 s timeout counts as an RT of 30 s. Interrupted sessions or sessions without valid responses are audited without creating indicators; legacy aggregates are still accepted.',
      { min: 0, max: 10, numericType: 'number', precision: 4, step: 0.0001 }),
    pvt('pvt_lapses', 'PVT-B lapses', 'count', 'Count of responses of 355 ms or more, including no response within 30 s.',
      { min: 0, numericType: 'integer', precision: 0, step: 1 }),
    pvt('pvt_false_starts', 'PVT-B false starts', 'count', 'Count of responses under 100 ms or taps without stimulus. Excluded from the mean speed.',
      { min: 0, numericType: 'integer', precision: 0, step: 1 }),
    { ...scale('fatigue', 'Fatigue (legacy)', 'Little perceived fatigue', 'A lot of perceived fatigue'), deprecated: true, replacedBy: 'fatigue_samn_perelli', description: 'Old 1 to 5 demonstration scale, kept without conversion. It is not Samn–Perelli.' },
    { ...scale('mood', 'Mood (legacy)', 'Very negative', 'Very positive'), deprecated: true, replacedBy: 'mood_score', description: 'Old 1 to 5 demonstration scale, kept without conversion. Do not compare with the 0 to 100 mood.', privacy: { intendedAudience: ['astronaut', 'crew_medical_officer'], enforced: false } },
  ],
  distance_from_earth: [
    indicator('communication_delay', 'One-way communication delay', 's', 'operational_context', 'One-way delay. Operational context, not a clinical measure.'),
    indicator('onboard_medical_resources', 'Onboard medical resources', null, 'operational_context', 'Descriptive inventory. It does not assess treatment capability.'),
  ],
  gravity_fields: [
    indicator('heart_rate', 'Heart rate', 'bpm', 'measurement', 'Rate at the observed instant. Describe the context in the notes.'),
    indicator('blood_pressure_systolic', 'Systolic blood pressure', 'mmHg', 'measurement', 'Systolic component. groupId links the pair of the same observation.'),
    indicator('blood_pressure_diastolic', 'Diastolic blood pressure', 'mmHg', 'measurement', 'Diastolic component. groupId links the pair of the same observation.'),
    indicator('exercise_duration', 'Exercise', 'min', 'self_report', 'Duration of one session, without prescription.', { allowsPeriodStart: true }),
    indicator('balance_vision_symptoms', 'Balance and vision', null, 'self_report', 'Personal description. No cause is inferred.'),
  ],
  hostile_closed_environment: [
    indicator('co2_concentration', 'CO₂ concentration', 'ppm', 'environmental_exposure', 'Ambient concentration at the measuring point.'),
    indicator('temperature', 'Temperature', 'Cel', 'environmental_exposure', 'Ambient temperature at the measuring point.'),
    indicator('relative_humidity', 'Relative humidity', '%', 'environmental_exposure', 'Ambient relative humidity.'),
    indicator('reported_symptoms', 'Reported symptoms', null, 'self_report', 'Free-text report. No cause is linked to the cabin conditions.'),
  ],
};

for (const [area, definitions] of Object.entries(additions)) catalog[area].push(...definitions);
