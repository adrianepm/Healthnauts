// Sinais vitais ao vivo (sensor simulado) + NEWS2 como referência experimental. Nível vem da API (vitalSigns / news2).
import { Activity, HeartPulse } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useSim } from './DemoPanel';
import { AREA } from '../config/api';
import { ago } from '../lib/format';
import { Card, StatusPill } from './ui';

export function VitalsCard({ detailed }: { detailed?: boolean }) {
  const vital = useStore((s) => s.overview?.vitalSigns);
  const news2 = useStore((s) => s.details[AREA.gravity]?.assessments.find((a) => a.indicator === 'news2'));
  const s = useSim();
  const m = s.lastVitals?.measurements;
  const items: [string, string][] = m ? [
    ['Heart rate', `${m.heart_rate.value} bpm`], ['Blood pressure', `${m.blood_pressure_systolic.value}/${m.blood_pressure_diastolic.value} mmHg`],
    ['Respiratory rate', `${m.respiratory_rate.value} /min`], ['SpO₂', `${m.spo2.value}%`], ['Temperature', `${m.body_temperature.value} °C`],
  ] : [];
  return (
    <Card title="Vital signs" sub={`Simulated wrist sensor · ${s.lastVitals ? 'updated ' + ago(s.lastVitals.recordedAt) : 'waiting for a reading'}${s.lastVitals?.activity === 'exercise' ? ' · exercising' : ''}`}
      icon={<HeartPulse size={18} />} right={vital && <StatusPill level={vital.displayLevel} />}>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {items.map(([k, v]) => <div key={k} className="rounded-xl border border-space-line p-3"><p className="text-xs text-slate-400">{k}</p><p className="text-lg font-semibold mt-0.5">{v}</p></div>)}
      </div>
      {vital?.message && <p className="text-sm text-slate-200 mt-3">{vital.message}</p>}
      {news2 && (
        <div className="mt-3 rounded-xl border border-space-line bg-space-deep/60 p-3">
          <p className="text-xs text-slate-300 inline-flex items-center gap-1.5"><Activity size={13} />Early warning score (terrestrial reference, experimental): <b className="text-slate-100">{news2.score ?? '—'}</b></p>
          {detailed && news2.components && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {Object.entries(news2.components as Record<string, number>).map(([k, pts]) => (
                <span key={k} className="chip normal-case border-space-line text-slate-300">{k.replace(/_/g, ' ')}: {pts}</span>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-500 mt-1.5">{news2.limitation}</p>
        </div>
      )}
    </Card>
  );
}
