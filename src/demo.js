import { randomUUID } from 'node:crypto';
import { catalog, pvtIndicators } from './config/catalog.js';
export const ASTRONAUT = 'astro_demo_001';
export function createDemo(now = new Date()) {
  const base = { dose_rate: 12, accumulated_dose: 140, sleep_duration: 7, fatigue: 2, mood: 3,
    sleep_quality: 72, sleepiness_kss: 3, fatigue_samn_perelli: 2, stress: 25, mood_score: 70,
    pvt_response_speed: 3.5, pvt_lapses: 1, pvt_false_starts: 0,
    communication_delay: 480, onboard_medical_resources: 'Inventário fictício: kit de primeiros socorros e equipamento de monitoramento.',
    heart_rate: 72, blood_pressure_systolic: 118, blood_pressure_diastolic: 76, exercise_duration: 30,
    balance_vision_symptoms: 'Relato fictício: sensação de desequilíbrio ao mudar de posição.',
    co2_concentration: 950, temperature: 23, relative_humidity: 45, reported_symptoms: 'Relato fictício: desconforto na garganta.' };
  const start = now.getTime() - 7 * 86400000;
  const records = [];
  for (let day = 0; day < 7; day++) {
    const time = now.getTime() - (6 - day) * 86400000 - 60000;
    for (const [areaId, definitions] of Object.entries(catalog)) for (const d of definitions) {
      if (pvtIndicators.includes(d.id) && day % 4 !== 0) continue;
      const value = d.valueType === 'text' ? base[d.id] : d.id === 'accumulated_dose' ? 140 * (day + 1)
        : d.scale?.numericType === 'integer' || d.valueType === 'scale' ? base[d.id] + day % 2 : Number((base[d.id] + (day % 3) * 0.5).toFixed(2));
      records.push({ id: randomUUID(), astronautId: ASTRONAUT, areaId, indicator: d.id, value, unit: d.unit,
        recordedAt: new Date(time).toISOString(), source: 'simulated', isSimulated: true,
        notes: 'Dado fictício de demonstração; não representa uma pessoa real.', createdAt: now.toISOString(),
        ...(d.id === 'accumulated_dose' ? { periodStart: new Date(start).toISOString() } : {}),
        ...(pvtIndicators.includes(d.id) ? { groupId: `demo-pvt-${new Date(time).toISOString()}` } : {}),
        ...(d.id.startsWith('blood_pressure_') ? { groupId: `demo-bp-${day}` } : {}),
      });
    }
  }
  return records;
}

// Add only the new research indicators, never reinterpret old mood/fatigue records.
export function isolationDemoAdditions(records, now = new Date()) {
  const seed = records.filter(r => r.astronautId === ASTRONAUT && r.source === 'simulated' && Number.isFinite(Date.parse(r.createdAt)))
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))[0];
  const anchor = seed ? new Date(seed.createdAt) : now;
  const newIds = new Set(catalog.isolation_confinement.filter(d => !['sleep_duration', 'fatigue', 'mood'].includes(d.id)).map(d => d.id));
  const additions = createDemo(anchor).filter(r => r.areaId === 'isolation_confinement' && newIds.has(r.indicator));
  return additions.filter(r => !records.some(old => old.id === `demo-isolation-v2:${r.indicator}:${r.recordedAt}`
    || (old.astronautId === r.astronautId && old.areaId === r.areaId && old.source === 'simulated'
      && old.indicator === r.indicator && Date.parse(old.recordedAt) === Date.parse(r.recordedAt))))
    .map(r => ({ ...r, id: `demo-isolation-v2:${r.indicator}:${r.recordedAt}`,
      ...(pvtIndicators.includes(r.indicator) ? { groupId: `demo-pvt-${r.recordedAt}` } : {}) }));
}
