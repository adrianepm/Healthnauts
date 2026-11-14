import { randomUUID } from 'node:crypto';
import { catalog } from './config/catalog.js';
export const ASTRONAUT = 'astro_demo_001';
export function createDemo(now = new Date()) {
  const base = { dose_rate: 12, accumulated_dose: 140, sleep_duration: 7, fatigue: 2, mood: 3,
    communication_delay: 480, onboard_medical_resources: 'Inventário fictício: kit de primeiros socorros e equipamento de monitoramento.',
    heart_rate: 72, blood_pressure_systolic: 118, blood_pressure_diastolic: 76, exercise_duration: 30,
    balance_vision_symptoms: 'Relato fictício: sensação de desequilíbrio ao mudar de posição.',
    co2_concentration: 950, temperature: 23, relative_humidity: 45, reported_symptoms: 'Relato fictício: desconforto na garganta.' };
  const start = now.getTime() - 7 * 86400000;
  const records = [];
  for (let day = 0; day < 7; day++) {
    const time = now.getTime() - (6 - day) * 86400000 - 60000;
    for (const [areaId, definitions] of Object.entries(catalog)) for (const d of definitions) {
      const value = d.valueType === 'text' ? base[d.id] : d.id === 'accumulated_dose' ? 140 * (day + 1)
        : d.valueType === 'scale' ? base[d.id] + day % 2 : Number((base[d.id] + (day % 3) * 0.5).toFixed(2));
      records.push({ id: randomUUID(), astronautId: ASTRONAUT, areaId, indicator: d.id, value, unit: d.unit,
        recordedAt: new Date(time).toISOString(), source: 'simulated', isSimulated: true,
        notes: 'Dado fictício de demonstração; não representa uma pessoa real.', createdAt: now.toISOString(),
        ...(d.id === 'accumulated_dose' ? { periodStart: new Date(start).toISOString() } : {}),
        ...(d.id.startsWith('blood_pressure_') ? { groupId: `demo-bp-${day}` } : {}),
      });
    }
  }
  return records;
}
