import { Activity, Brain, Orbit, Radio, Shield, Wind } from 'lucide-react';
import type { AreaId } from './api';

export const areas = [
  { id: 'radiation', path: '/radiacao', title: 'Space Radiation', icon: Shield, description: 'Track radiation exposure and review simulated solar events.', priority: ['dose_rate', 'accumulated_dose', 'radiation_counter'] },
  { id: 'isolation_confinement', path: '/isolamento', title: 'Isolation & Confinement', icon: Brain, description: 'Track sleep, well-being and reaction time during a mission.', priority: ['sleep_duration', 'sleep_quality', 'fatigue_samn_perelli'] },
  { id: 'distance_from_earth', path: '/distancia', title: 'Distance from Earth', icon: Radio, description: 'Review communication delays, onboard resources and report preparation.', priority: ['communication_delay', 'onboard_medical_resources'] },
  { id: 'gravity_fields', path: '/gravidade', title: 'Gravity Fields', icon: Orbit, description: 'Follow physical conditioning, vital signs and changes in balance or vision.', priority: ['heart_rate', 'body_mass', 'exercise_duration'] },
  { id: 'hostile_closed_environment', path: '/ambiente', title: 'Cabin Environment', icon: Wind, description: 'Follow cabin air, pressure, noise and observations after a spacewalk.', priority: ['co2_concentration', 'co2_partial_pressure', 'temperature'] },
] satisfies { id: AreaId; path: string; title: string; icon: typeof Activity; description: string; priority: string[] }[];

export type Area = typeof areas[number];

const labels: Record<string, string> = {
  dose_rate: 'Dose rate', accumulated_dose: 'Accumulated dose', radiation_increment: 'Dose increment', radiation_counter: 'Dose counter', solar_event_simulated: 'Simulated solar event',
  career_effective_dose: 'Career radiation exposure', career_dose: 'Career radiation exposure', radiation_career_dose: 'Career radiation exposure', organ_dose: 'Organ dose',
  sleep_duration: 'Sleep duration', sleep_quality: 'Sleep quality', sleepiness_kss: 'Sleepiness (Karolinska scale)', fatigue_samn_perelli: 'Fatigue (Samn–Perelli scale)',
  stress: 'Stress', mood_score: 'Mood', pvt_response_speed: 'Reaction speed (PVT-B)', pvt_lapses: 'Slow or missed responses', pvt_false_starts: 'Early responses',
  fatigue: 'Fatigue (earlier scale)', mood: 'Mood (earlier scale)',
  communication_delay: 'One-way communication delay', onboard_medical_resources: 'Onboard medical resources',
  heart_rate: 'Heart rate', blood_pressure_systolic: 'Systolic blood pressure', blood_pressure_diastolic: 'Diastolic blood pressure',
  exercise_duration: 'Exercise duration', balance_vision_symptoms: 'Balance or vision observations', body_mass: 'Body mass',
  aerobic_capacity: 'Aerobic capacity', muscle_strength: 'Muscle strength', vo2max: 'Maximum oxygen uptake (VO₂max)',
  motion_sickness: 'Motion sickness', headache: 'Headache', dizziness: 'Dizziness', near_fainting: 'Near fainting',
  vision_change: 'Vision changes', amsler_change: 'Changes on an Amsler grid', respiratory_rate: 'Breathing rate', spo2: 'Blood oxygen saturation (SpO₂)',
  body_temperature: 'Body temperature', supplemental_oxygen: 'Supplemental oxygen', consciousness: 'Responsiveness',
  news2: 'Early warning score (NEWS2)', posture: 'Vital signs by position', co2_concentration: 'Cabin carbon dioxide', temperature: 'Cabin temperature',
  relative_humidity: 'Relative humidity', reported_symptoms: 'Reported symptoms', cabin_pressure: 'Cabin pressure',
  co2_partial_pressure: 'Carbon dioxide partial pressure', oxygen_fraction: 'Oxygen fraction', oxygen_partial_pressure: 'Oxygen partial pressure',
  inspired_oxygen_pressure: 'Inspired oxygen pressure (PIO₂)', cabin_noise: 'Cabin noise', post_eva_symptoms: 'Post-spacewalk symptoms',
};

export const labelFor = (id: string) => labels[id] ?? 'Monitoring assessment';
export const unitFor = (unit: string | null) => ({ Cel: '°C', uSv: 'µSv', 'uSv/h': 'µSv/h' }[unit ?? ''] ?? unit ?? '');
export const sourceFor = (source: string) => ({ simulated: 'Simulated', manual: 'Crew entry', sensor: 'Sensor' }[source] ?? 'Unspecified');
export const crewName = (id: string) => ({ astro_demo_001: 'Demo astronaut', astro_demo_002: 'Second demo astronaut', astro_demo_003: 'Third demo astronaut' }[id] ?? 'Selected astronaut');
export const timeLabel = (value: string) => new Intl.DateTimeFormat('en', {
  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short',
}).format(new Date(value));
