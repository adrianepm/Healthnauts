import { isolationReferences } from './isolation.js';
const nasa = { title: 'NASA — 5 Hazards of Human Spaceflight', url: 'https://www.nasa.gov/hrp/hazards/' };
const csa = { title: 'Canadian Space Agency — Careers in space: Health science experts', url: 'https://www.asc-csa.gc.ca/eng/jobs/careers-in-space/health-sciences.asp' };
const area = (id, title, summary, body, highlights, references = [nasa, csa]) => ({
  id, title, summary, content: [{ id: 'introduction', title: 'About this demonstration', body },
    { id: 'procedures', title: 'How to use it', body: "Follow your mission's approved procedure. This demonstration describes records and does not give individual medical advice." }],
  references, highlightIndicators: highlights,
});
export const areas = [
  area('radiation', 'Space radiation', 'Career dose, daily rate and solar activity.', 'This screen shows exposure, not health. Radiation risk is mainly long term, and no symptom is attributed to radiation automatically. Dose rate and accumulated dose are tracked separately.', ['dose_rate', 'accumulated_dose'], [nasa, { title: 'Canadian Space Agency — How does radiation affect the human body in space?', url: 'https://www.asc-csa.gc.ca/eng/astronauts/space-medicine/radiation.asp' }]),
  area('isolation_confinement', 'Isolation and confinement', 'Sleep, sleepiness, fatigue, stress, mood and reaction test.', 'This tool supports self-monitoring and does not diagnose any condition. Rules, personal ranges and levels are team proposals, not medical criteria. Aviation and driving scales are not validated here for spaceflight. The KSS uses our own labels until the licence is confirmed. Mood and stress are meant for the astronaut and the Crew Medical Officer; this local API does not enforce access control yet.', ['sleep_duration', 'fatigue_samn_perelli', 'mood_score'], Object.values(isolationReferences)),
  area('distance_from_earth', 'Distance from Earth', 'Communication delay, Earth link and onboard resources.', 'The one-way delay and the inventory are operational context. They are not clinical measures and do not assess treatment capability. Ground reports are simulated in this browser.', ['communication_delay', 'onboard_medical_resources']),
  area('gravity_fields', 'Gravity fields', 'Fitness, body mass, balance and vision reports.', 'Log observations and their context. No cause is attributed to the gravity field. Bone projections are illustrative and never raise an alert.', ['heart_rate', 'exercise_duration']),
  area('hostile_closed_environment', 'Hostile closed environment', 'Cabin air, pressure, temperature, humidity and noise.', 'CO₂, oxygen, pressure, temperature, humidity and noise describe the cabin. Personal reports are shown next to them, without inferring a cause. Each limit is marked as NASA or as a prototype simplification.', ['co2_concentration', 'temperature', 'relative_humidity']),
];
