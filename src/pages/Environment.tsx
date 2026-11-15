// Environment (cabine): ar, pressão, O2, conforto, ruído e checklist pós-EVA. Níveis e mensagens vêm da API.
import { useState } from 'react';
import { Gauge, Thermometer, Volume2, Wind, Activity, ClipboardList } from 'lucide-react';
import { gas, rules } from '../../shared/config/research.js';
import { AREA } from '../config/api';
import { api } from '../services/api';
import { useStore } from '../store/useStore';
import { useArea } from './useArea';
import { KeyTiles, TodayHero, TopicLinks } from '../components/lean/Home';
import { CompareRow, TopicDetail, compareItem, type TopicDef } from '../components/lean/TopicDetail';
import { TrendChart, type RefLine } from '../components/charts';
import { Card, Section, StatusPill } from '../components/ui';
import { LEVEL_UI } from '../lib/levels';
import { EVA_SYMPTOMS, info } from '../lib/content';
import { ago, fmtDateTime } from '../lib/format';

const TOPICS: TopicDef[] = [
  { id: 'air', label: 'Air', indicators: ['co2_partial_pressure', 'co2_partial_pressure_7d', 'cabin_pressure', 'inspired_oxygen_pressure'] },
  { id: 'comfort', label: 'Comfort & noise', indicators: ['temperature_humidity', 'cabin_noise'] },
  { id: 'eva', label: 'After EVA', indicators: ['post_eva_symptoms'] },
];
const PSIA = gas.mmHgPerUnit.psia as number;
const COMFORT = rules.climate.comfort as { temperature: number[]; humidity: number[] };
const toPsia = (mmHg: number) => mmHg / PSIA;
const n = (v: unknown, digits = 1) => (typeof v === 'number' && Number.isFinite(v) ? v.toFixed(digits) : '—');
// Réguas dos gráficos: os mesmos números das regras de shared/config/research.js.
const CO2_REFS: RefLine[] = [
  { y: rules.co2.limit, label: `${rules.co2.limit} mmHg (1 h, NASA)`, color: LEVEL_UI.caution.color },
  { y: rules.co2.warningAbove, label: `${rules.co2.warningAbove} mmHg`, color: LEVEL_UI.warning.color },
];
const PRESSURE_REFS: RefLine[] = [
  { y: rules.pressure.minimumPsia, label: `${rules.pressure.minimumPsia} psia`, color: LEVEL_UI.emergency.color },
  { y: rules.pressure.maximumPsia, label: `${rules.pressure.maximumPsia} psia`, color: LEVEL_UI.emergency.color },
];
const NOISE_REFS: RefLine[] = [
  { y: rules.noise.sleep, label: `${rules.noise.sleep} dBA (sleep)`, color: '#94A3B8' },
  { y: rules.noise.work, label: `${rules.noise.work} dBA (work)`, color: LEVEL_UI.advisory.color },
  { y: rules.noise.ceiling, label: `${rules.noise.ceiling} dBA`, color: LEVEL_UI.caution.color },
];

function PostEvaForm() {
  const refresh = useStore((s) => s.refresh);
  const [ended, setEnded] = useState(60); const [picked, setPicked] = useState<string[]>([]); const [busy, setBusy] = useState(false);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const send = async () => {
    setBusy(true);
    try { await api.operation(AREA.cabin, 'post_eva', { evaEndedAt: new Date(Date.now() - ended * 60000).toISOString(), recordedAt: new Date().toISOString(), symptoms: picked }); setPicked([]); await refresh(); }
    finally { setBusy(false); }
  };
  return (
    <div>
      <label className="text-xs text-slate-400 inline-flex items-center gap-2">EVA ended
        <input type="number" min={0} max={1440} value={ended} onChange={(e) => setEnded(Math.max(0, +e.target.value))} className="field !w-20 !py-1" /> min ago</label>
      <div className="grid sm:grid-cols-2 gap-1.5 mt-3">
        {EVA_SYMPTOMS.map(([id, label]) => (
          <label key={id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer ${picked.includes(id) ? 'border-sky-400 bg-sky-400/10' : 'border-space-line'}`}>
            <input type="checkbox" checked={picked.includes(id)} onChange={() => toggle(id)} className="accent-sky-400" />{label}
          </label>
        ))}
      </div>
      <button onClick={send} disabled={busy} className="btn-primary mt-3">{picked.length ? `Report ${picked.length} symptom${picked.length > 1 ? 's' : ''}` : 'No symptoms'}</button>
      <p className="text-[11px] text-slate-500 mt-2">Most decompression sickness cases appear 60 to 240 minutes after decompression. Check again every hour.</p>
    </div>
  );
}

export default function Environment() {
  const d = useArea(AREA.cabin);
  const grav = useStore((s) => s.details[AREA.gravity]);
  const [topic, setTopic] = useState<string | null>(null);
  if (!d.ready) return <p className="text-sm text-slate-400">Loading…</p>;
  const lv = (id: string) => d.a(id)?.displayLevel ?? 'unavailable';
  const co2 = d.a('co2_partial_pressure'); const p = d.a('cabin_pressure'); const o2 = d.a('inspired_oxygen_pressure');
  const th = d.a('temperature_humidity'); const noise = d.a('cabin_noise');
  const headache = grav?.latestRecords.find((r) => r.indicator === 'headache');

  return (
    <div className="space-y-5">
      <h1 className="text-sm text-slate-400">Hostile closed environment · Cabin air, pressure, comfort and noise</h1>
      <TodayHero level={d.summary!.displayLevel} label="Cabin now" message={d.summary!.headline.message ?? ''} sub={`last reading ${ago(d.latest('cabin_pressure')?.recordedAt ?? d.summary!.lastRecordedAt)}`} also={d.also(d.summary!.headline.indicator)} />
      <KeyTiles cols={5} tiles={[
        { key: 'co2', title: 'CO₂ · 1 h avg', icon: Wind, value: <>{n(co2?.value, 2)}<span className="text-base text-slate-400"> mmHg</span></>, level: lv('co2_partial_pressure'), compare: `Limit ${rules.co2.limit} mmHg (NASA)`, onClick: () => setTopic('air') },
        { key: 'p', title: 'Cabin pressure', icon: Gauge, value: <>{n(p?.psia ?? (typeof p?.value === 'number' ? toPsia(p.value) : undefined), 1)}<span className="text-base text-slate-400"> psia</span></>, level: lv('cabin_pressure'), compare: `Safe ${rules.pressure.minimumPsia}-${rules.pressure.maximumPsia} psia (ISS 14.7)`, onClick: () => setTopic('air') },
        { key: 'o2', title: 'Inspired O₂', icon: Activity, value: <>{n(o2?.value, 0)}<span className="text-base text-slate-400"> mmHg</span></>, level: lv('inspired_oxygen_pressure'), compare: `Target ${rules.oxygen.normal[0]}-${rules.oxygen.normal[1]} mmHg`, onClick: () => setTopic('air') },
        { key: 'th', title: 'Temp · humidity', icon: Thermometer, value: th?.value ? <>{n(th.value.temperature, 1)}°<span className="text-base text-slate-400"> · {n(th.value.humidity, 0)}%</span></> : '—', level: lv('temperature_humidity'), compare: `Comfort ${COMFORT.temperature.join('-')} °C, ${COMFORT.humidity.join('-')}% RH`, onClick: () => setTopic('comfort') },
        { key: 'noise', title: 'Noise', icon: Volume2, value: <>{n(noise?.value, 0)}<span className="text-base text-slate-400"> dBA</span></>, level: lv('cabin_noise'), compare: `Work ≤ ${rules.noise.work} dBA · never ${rules.noise.ceiling}`, onClick: () => setTopic('comfort') },
      ]} />
      <TopicLinks topics={TOPICS.map((t) => ({ id: t.id, label: t.label, level: d.worst(t.indicators) }))} onOpen={setTopic} />
      <Card title="Post-EVA symptom check" sub="Decompression sickness checklist · shown after each EVA" icon={<ClipboardList size={18} />} right={<StatusPill level={lv('post_eva_symptoms')} />}>
        <p className="text-sm text-slate-300 mb-3">{d.a('post_eva_symptoms')?.message}</p>
        <PostEvaForm />
      </Card>
      <p className="text-[11px] text-slate-500">Limits marked NASA come from NASA-STD-3001 Vol. 2 Rev. D (PIO₂ from the Rev. B table). The temperature/humidity box and noise in dBA are prototype simplifications. Rev. E was not checked.</p>

      <TopicDetail areaId={AREA.cabin} topics={TOPICS} topic={topic} onTopic={setTopic} assessments={d.assessments}>
        {(t, ctx) => (<>
          {t === 'air' && (<>
            <CompareRow periodLabel={ctx.periodLabel} items={[
              { ...compareItem(ctx, 'co2_partial_pressure', 'CO₂ reading', (x) => `${x.toFixed(2)} mmHg`), level: lv('co2_partial_pressure') },
              { ...compareItem(ctx, 'cabin_pressure', 'Cabin pressure', (x) => `${x.toFixed(1)} psia`, 'number', toPsia), level: lv('cabin_pressure') },
              { ...compareItem(ctx, 'inspired_oxygen_pressure', 'Inspired O₂', (x) => `${Math.round(x)} mmHg`), level: lv('inspired_oxygen_pressure') },
            ]} />
            <Section title="CO₂ partial pressure (each reading)"><TrendChart records={ctx.series('co2_partial_pressure')} refs={CO2_REFS} unit="" fmt={(x) => `${x.toFixed(2)} mmHg`} lastLevel={lv('co2_partial_pressure')} /></Section>
            <p className="text-[11px] text-slate-500">The level uses the time-weighted 1-hour average ({n(co2?.value, 2)} mmHg). 7-day average: {d.a('co2_partial_pressure_7d')?.message}</p>
            <div className="mt-3 rounded-xl border border-space-line p-3 text-xs text-slate-300">
              Reported headache (shown side by side, no cause is inferred): <b>{headache ? `${headache.value}/10 · ${fmtDateTime(headache.recordedAt)}` : 'none reported'}</b>
            </div>
            <Section title="Total cabin pressure"><TrendChart records={ctx.series('cabin_pressure').map((r) => ({ ...r, value: toPsia(Number(r.value)) }))} refs={PRESSURE_REFS} domain={[0, 16]} fmt={(x) => `${x.toFixed(2)} psia`} lastLevel={lv('cabin_pressure')} /></Section>
            <Section title="Inspired oxygen (PIO₂)"><TrendChart records={ctx.series('inspired_oxygen_pressure')} refs={[{ y: rules.oxygen.normal[0], label: `${rules.oxygen.normal[0]} mmHg`, color: LEVEL_UI.caution.color }, { y: rules.oxygen.normal[1], label: `${rules.oxygen.normal[1]} mmHg`, color: LEVEL_UI.caution.color }]} fmt={(x) => `${Math.round(x)} mmHg`} lastLevel={lv('inspired_oxygen_pressure')} /></Section>
          </>)}
          {t === 'comfort' && (<>
            <CompareRow periodLabel={ctx.periodLabel} items={[
              { ...compareItem(ctx, 'temperature', 'Temperature', (x) => `${x.toFixed(1)} °C`), level: lv('temperature_humidity') },
              { ...compareItem(ctx, 'relative_humidity', 'Humidity', (x) => `${Math.round(x)}%`), level: lv('temperature_humidity') },
              { ...compareItem(ctx, 'cabin_noise', 'Noise', (x) => `${Math.round(x)} dBA`), level: lv('cabin_noise') },
            ]} />
            <Section title="Temperature"><TrendChart records={ctx.series('temperature')} refs={COMFORT.temperature.map((y: number) => ({ y, label: `${y} °C`, color: '#94A3B8' }))} fmt={(x) => `${x} °C`} lastLevel={lv('temperature_humidity')} /></Section>
            <Section title="Relative humidity"><TrendChart records={ctx.series('relative_humidity')} refs={COMFORT.humidity.map((y: number) => ({ y, label: `${y}%`, color: '#94A3B8' }))} fmt={(x) => `${x}%`} lastLevel={lv('temperature_humidity')} /></Section>
            <Section title="Noise"><TrendChart records={ctx.series('cabin_noise')} refs={NOISE_REFS} fmt={(x) => `${x} dBA`} lastLevel={lv('cabin_noise')} /></Section>
          </>)}
          {t === 'eva' && <Section title="Post-EVA checklist"><PostEvaForm /></Section>}
          <p className="text-[11px] text-slate-500 mt-4">{info(t === 'air' ? 'co2_partial_pressure' : t === 'comfort' ? 'cabin_noise' : 'post_eva_symptoms').why}</p>
        </>)}
      </TopicDetail>
    </div>
  );
}
