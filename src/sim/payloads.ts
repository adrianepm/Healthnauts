// Leituras do sensor simulado (especificação 1.6): valores normais com pequena variação.
// Os modos fora do normal repetem os valores dos cenários de shared/scenarios.js, para o sensor
// continuar a condição que o cenário criou. Arquivo puro (sem imports) para os testes em Node.

export type CabinMode = 'nominal' | 'high-co2' | 'depressurization' | 'offline';
export type VitalsMode = 'nominal' | 'fever' | 'exercise';
export const LIVE_LOCATION = 'cabin-main';

const jitter = (center: number, amp: number, rnd: () => number) => center + (rnd() * 2 - 1) * amp;
const int = (v: number) => Math.round(v);

export function atmosphereReading(mode: CabinMode, at: Date, rnd: () => number = Math.random) {
  return {
    location: LIVE_LOCATION, environment: 'nominal_cabin', recordedAt: at.toISOString(),
    pressure: mode === 'depressurization' ? { value: 4.3, unit: 'psia' } : { value: Number(jitter(14.7, 0.05, rnd).toFixed(2)), unit: 'psia' },
    co2Ppm: mode === 'high-co2' ? 5200 : int(jitter(2900, 300, rnd)),
    oxygenFraction: 0.21,
  };
}

export function climateRecords(at: Date, rnd: () => number = Math.random) {
  const recordedAt = at.toISOString();
  return [
    { indicator: 'temperature', value: Number(jitter(22.8, 0.6, rnd).toFixed(1)), unit: 'Cel', recordedAt },
    { indicator: 'relative_humidity', value: Number(jitter(45, 4, rnd).toFixed(0)), unit: '%', recordedAt },
  ];
}

export function noiseReading(at: Date, periodMs: number, rnd: () => number = Math.random) {
  return { location: LIVE_LOCATION, context: 'work', method: 'simulated-sound-level-meter',
    periodStart: new Date(at.getTime() - periodMs).toISOString(), recordedAt: at.toISOString(), dba: Number(jitter(52, 2, rnd).toFixed(1)) };
}

export function vitalsReading(mode: VitalsMode, at: Date, rnd: () => number = Math.random) {
  const recordedAt = at.toISOString();
  const s = (value: unknown, unit: string | null) => ({ value, unit, recordedAt });
  const v = mode === 'fever' ? { hr: 118, sbp: 104, dbp: 66, rr: 23, spo2: 95, temp: 39.4 }
    : mode === 'exercise' ? { hr: int(jitter(142, 4, rnd)), sbp: int(jitter(134, 3, rnd)), dbp: int(jitter(76, 2, rnd)), rr: int(jitter(26, 1, rnd)), spo2: 97, temp: 37.2 }
    : { hr: int(jitter(66, 4, rnd)), sbp: int(jitter(116, 4, rnd)), dbp: int(jitter(74, 3, rnd)), rr: int(jitter(14, 1.5, rnd)), spo2: int(jitter(98, 1, rnd)), temp: Number(jitter(36.7, 0.2, rnd).toFixed(1)) };
  return {
    activity: mode === 'exercise' ? 'exercise' : 'routine', spo2Scale: 1, recordedAt,
    measurements: {
      heart_rate: s(v.hr, 'bpm'), blood_pressure_systolic: s(v.sbp, 'mmHg'), blood_pressure_diastolic: s(v.dbp, 'mmHg'),
      respiratory_rate: s(v.rr, 'breaths/min'), spo2: s(Math.min(100, v.spo2), '%'), body_temperature: s(v.temp, 'Cel'),
      supplemental_oxygen: s(false, null), consciousness: s('A', null),
    },
  };
}
