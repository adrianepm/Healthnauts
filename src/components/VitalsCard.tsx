// Sinais vitais ao vivo (sensor simulado) + NEWS2 como referência experimental. Nível vem da API (vitalSigns / news2).
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Activity, HeartPulse } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useSim } from './DemoPanel';
import { AREA } from '../config/api';
import { ago } from '../lib/format';
import { Card, Num, StatusPill } from './ui';

const NEWS2_LABEL: Record<string, string> = {
  respiratory_rate: 'Respiratory rate', spo2: 'SpO₂', blood_pressure_systolic: 'Systolic BP', heart_rate: 'Heart rate',
  body_temperature: 'Temperature', supplemental_oxygen: 'Supplemental O₂', consciousness: 'Consciousness',
};

export function VitalsCard({ detailed }: { detailed?: boolean }) {
  const vital = useStore((s) => s.overview?.vitalSigns);
  const news2 = useStore((s) => s.details[AREA.gravity]?.assessments.find((a) => a.indicator === 'news2'));
  const s = useSim();
  const m = s.lastVitals?.measurements;
  // Aberto pelo corpo da Overview: rola até este cartão.
  const focus = (useLocation().state as { focus?: string } | null)?.focus === 'vitals';
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (detailed && focus) ref.current?.scrollIntoView({ block: 'center' }); }, [detailed, focus]);
  const items: [string, string, string][] = m ? [
    ['Heart rate', String(m.heart_rate.value), 'bpm'], ['Blood pressure', `${m.blood_pressure_systolic.value}/${m.blood_pressure_diastolic.value}`, 'mmHg'],
    ['Respiratory rate', String(m.respiratory_rate.value), '/min'], ['SpO₂', String(m.spo2.value), '%'], ['Temperature', String(m.body_temperature.value), '°C'],
  ] : [];
  return (
    <div ref={ref} id="vital-signs" className="scroll-mt-24">
    <Card title="Vital signs" sub={`Simulated wrist sensor · ${s.lastVitals ? 'updated ' + ago(s.lastVitals.recordedAt) : 'waiting for a reading'}${s.lastVitals?.activity === 'exercise' ? ' · exercising' : ''}`}
      icon={<HeartPulse size={18} />} right={vital && <StatusPill level={vital.displayLevel} />}>
      <dl className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {items.map(([k, v, u]) => (
          <div key={k} className="rounded-md border border-space-line bg-space-card2 px-3 py-2.5">
            <dt className="text-xs text-slate-300">{k}</dt>
            <dd className="text-xl font-medium text-slate-50 mt-0.5"><Num>{v}</Num><span className="text-xs font-normal text-slate-300 ml-1">{u}</span></dd>
          </div>
        ))}
      </dl>
      {vital?.message && <p className="text-sm text-slate-200 mt-3">{vital.message}</p>}
      {news2 && (
        <div className="mt-3 rounded-md border border-space-line p-3">
          <p className="text-xs text-slate-300 inline-flex flex-wrap items-center gap-1.5"><Activity size={14} aria-hidden="true" />Early warning score (terrestrial reference, experimental): <b className="font-mono text-slate-50">{news2.score ?? '—'}</b></p>
          {detailed && news2.components && (
            <dl className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-x-4 gap-y-1 mt-2">
              {Object.entries(news2.components as Record<string, number>).map(([k, pts]) => (
                <div key={k} className="flex items-baseline justify-between gap-2 border-b border-space-line py-1 text-xs">
                  <dt className="text-slate-300">{NEWS2_LABEL[k] ?? k.replace(/_/g, ' ')}</dt><dd className="font-mono text-slate-100">{pts}</dd>
                </div>
              ))}
            </dl>
          )}
          <p className="text-xs text-slate-300 mt-2">{news2.limitation}</p>
        </div>
      )}
    </Card>
    </div>
  );
}
