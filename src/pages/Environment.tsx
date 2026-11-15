// Environment (cabine): ar, pressão, O2, conforto, ruído e checklist pós-EVA. Níveis e mensagens vêm da API.
import { useState } from 'react';
import { Gauge, Thermometer, Volume2, Wind, Activity, ClipboardList } from 'lucide-react';
import { gas, rules } from '../../shared/config/research.js';
import { AREA } from '../config/api';
import { api } from '../services/api';
import { useStore } from '../store/useStore';
import { toast } from '../store/toast';
import { useArea } from './useArea';
import { KeyTiles, TodayHero, TopicLinks } from '../components/lean/Home';
import { CompareRow, TopicDetail, compareItem, useTopicState, type TopicDef } from '../components/lean/TopicDetail';
import { TrendChart, type RefLine } from '../components/charts';
import { Card, PageHeader, Section, StatusPill } from '../components/ui';
import { LEVEL_UI } from '../lib/levels';
import { EVA_SYMPTOMS, info } from '../lib/content';
import { ago, fmtDateTime } from '../lib/format';

const TOPICS: TopicDef[] = [
  { id: 'air', label: 'Air', indicators: ['co2_partial_pressure', 'co2_partial_pressure_7d', 'cabin_pressure', 'inspired_oxygen_pressure'], also: ['co2_concentration', 'oxygen_fraction', 'oxygen_partial_pressure'] },
  { id: 'comfort', label: 'Comfort & noise', indicators: ['temperature_humidity', 'cabin_noise'], also: ['temperature', 'relative_humidity'] },
  { id: 'eva', label: 'After EVA', indicators: ['post_eva_symptoms'], also: ['reported_symptoms'] },
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
    try { await api.operation(AREA.cabin, 'post_eva', { evaEndedAt: new Date(Date.now() - ended * 60000).toISOString(), recordedAt: new Date().toISOString(), symptoms: picked }); setPicked([]); await refresh(); toast.success('Post-EVA check saved'); }
    catch (err) { toast.error(err); }
    finally { setBusy(false); }
  };
  return (
    <div>
      <label className="text-xs text-slate-400 inline-flex items-center gap-2">EVA ended
        <input type="number" min={0} max={1440} value={ended} onChange={(e) => setEnded(Math.max(0, +e.target.value))} className="field !w-20 !py-1" /> min ago</label>
      <div className="grid sm:grid-cols-2 gap-1.5 mt-3">
        {EVA_SYMPTOMS.map(([id, label]) => (
          <label key={id} className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer ${picked.includes(id) ? 'border-brand bg-brand/10' : 'border-space-line'}`}>
            <input type="checkbox" checked={picked.includes(id)} onChange={() => toggle(id)} className="accent-brand" />{label}
          </label>
        ))}
      </div>
      <button onClick={send} disabled={busy} className="btn-primary mt-3">{picked.length ? `Report ${picked.length} symptom${picked.length > 1 ? 's' : ''}` : 'No symptoms'}</button>
      <p className="text-xs text-slate-500 mt-2">Most decompression sickness cases appear 60 to 240 minutes after decompression. Check again every hour.</p>
    </div>
  );
}

export default function Environment() {
  const d = useArea(AREA.cabin);
  const grav = useStore((s) => s.details[AREA.gravity]);
  const [topic, setTopic] = useTopicState(TOPICS);
  if (!d.ready) return <p className="text-sm text-slate-400">Loading…</p>;
  const lv = (id: string) => d.a(id)?.displayLevel ?? 'unavailable';
  const co2 = d.a('co2_partial_pressure'); const p = d.a('cabin_pressure'); const o2 = d.a('inspired_oxygen_pressure');
  const th = d.a('temperature_humidity'); const noise = d.a('cabin_noise');
  const headache = grav?.latestRecords.find((r) => r.indicator === 'headache');

  const psia = typeof p?.psia === 'number' ? p.psia : typeof p?.value === 'number' ? toPsia(p.value) : null;
  const val = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : null);
  const temp = val(th?.value?.temperature);
  const [o2lo, o2hi] = rules.oxygen.normal as number[];
  return (
    <div className="space-y-5">
      <PageHeader title="Environment" sub="Hostile closed environment · cabin air, pressure, comfort and noise" />
      <TodayHero level={d.summary!.displayLevel} label="Cabin now" message={d.summary!.headline.message ?? ''} sub={`Last reading ${ago(d.latest('cabin_pressure')?.recordedAt ?? d.summary!.lastRecordedAt)}`} also={d.also(d.summary!.headline.indicator)} />
      <KeyTiles tiles={[
        { key: 'co2', indicator: 'co2_partial_pressure', title: 'CO₂ · 1 h avg', icon: Wind, value: n(co2?.value, 2), unit: 'mmHg', level: lv('co2_partial_pressure'), compare: `Limit ${rules.co2.limit} mmHg (NASA, 1 h) · ${rules.co2.warningAbove} team warning level`, onClick: () => setTopic('air'),
          ruler: { min: 0, max: 6, value: val(co2?.value), range: [0, rules.co2.limit], marks: [{ at: rules.co2.limit, label: String(rules.co2.limit), priority: 2 }, { at: rules.co2.warningAbove, label: String(rules.co2.warningAbove), priority: 1 }],
            label: `CO2 on a 0 to 6 mmHg scale; limit ${rules.co2.limit} mmHg` } },
        { key: 'p', indicator: 'cabin_pressure', title: 'Cabin pressure', icon: Gauge, value: n(psia, 1), unit: 'psia', level: lv('cabin_pressure'), compare: `Safe ${rules.pressure.minimumPsia}-${rules.pressure.maximumPsia} psia (ISS 14.7)`, onClick: () => setTopic('air'),
          ruler: { min: 0, max: 16, value: psia, range: [rules.pressure.minimumPsia, rules.pressure.maximumPsia], marks: [{ at: rules.pressure.minimumPsia, label: String(rules.pressure.minimumPsia) }, { at: rules.pressure.maximumPsia, label: String(rules.pressure.maximumPsia) }],
            label: `Cabin pressure on a 0 to 16 psia scale; safe range ${rules.pressure.minimumPsia} to ${rules.pressure.maximumPsia} psia` } },
        { key: 'o2', indicator: 'inspired_oxygen_pressure', title: 'Inspired O₂', icon: Activity, value: n(o2?.value, 0), unit: 'mmHg', level: lv('inspired_oxygen_pressure'), compare: `Target ${o2lo}-${o2hi} mmHg`, onClick: () => setTopic('air'),
          ruler: { min: 120, max: 170, value: val(o2?.value), range: [o2lo, o2hi], marks: [{ at: o2lo, label: String(o2lo) }, { at: o2hi, label: String(o2hi) }], label: `Inspired oxygen on a 120 to 170 mmHg scale; target ${o2lo} to ${o2hi} mmHg` } },
        { key: 'th', indicator: 'temperature_humidity', title: 'Temp · humidity', icon: Thermometer, value: temp === null ? '—' : n(temp, 1), unit: temp === null ? undefined : `°C · ${n(th?.value?.humidity, 0)}% RH`, level: lv('temperature_humidity'), compare: `Comfort ${COMFORT.temperature.join('-')} °C, ${COMFORT.humidity.join('-')}% RH`, onClick: () => setTopic('comfort'),
          ruler: { min: 15, max: 30, value: temp, range: COMFORT.temperature as [number, number], marks: COMFORT.temperature.map((t) => ({ at: t, label: `${t}°` })), label: `Temperature on a 15 to 30 °C scale; comfort ${COMFORT.temperature.join(' to ')} °C` } },
        { key: 'noise', indicator: 'cabin_noise', title: 'Noise', icon: Volume2, value: n(noise?.value, 0), unit: 'dBA', level: lv('cabin_noise'), compare: `Work ≤ ${rules.noise.work} dBA · never ${rules.noise.ceiling}`, onClick: () => setTopic('comfort'),
          ruler: { min: 30, max: 90, value: val(noise?.value), range: [30, rules.noise.work], marks: [{ at: rules.noise.work, label: String(rules.noise.work), priority: 1 }, { at: rules.noise.ceiling, label: String(rules.noise.ceiling), priority: 2 }], label: `Noise on a 30 to 90 dBA scale; work level ${rules.noise.work}, never above ${rules.noise.ceiling} dBA` } },
      ]} />
      <TopicLinks topics={TOPICS.map((t) => ({ id: t.id, label: t.label, level: d.worst(t.indicators) }))} onOpen={setTopic} />
      <Card title="Post-EVA symptom check" sub="Decompression sickness checklist · shown after each EVA" icon={<ClipboardList size={18} />} right={<StatusPill level={lv('post_eva_symptoms')} />}>
        <p className="text-sm text-slate-300 mb-3">{d.a('post_eva_symptoms')?.message}</p>
        <PostEvaForm />
      </Card>
      <p className="text-xs text-slate-500">Limits marked NASA come from NASA-STD-3001 Vol. 2 Rev. F (July 2026). The temperature/humidity box and noise in dBA are prototype simplifications.</p>

      <TopicDetail areaId={AREA.cabin} topics={TOPICS} topic={topic} onTopic={setTopic} assessments={d.assessments}>
        {(t, ctx) => (<>
          {t === 'air' && (<>
            <CompareRow periodLabel={ctx.periodLabel} items={[
              { ...compareItem(ctx, 'co2_partial_pressure', 'CO₂ reading', (x) => `${x.toFixed(2)} mmHg`), level: lv('co2_partial_pressure') },
              { ...compareItem(ctx, 'cabin_pressure', 'Cabin pressure', (x) => `${x.toFixed(1)} psia`, 'number', toPsia), level: lv('cabin_pressure') },
              { ...compareItem(ctx, 'inspired_oxygen_pressure', 'Inspired O₂', (x) => `${Math.round(x)} mmHg`), level: lv('inspired_oxygen_pressure') },
            ]} />
            <Section indicator="co2_partial_pressure co2_partial_pressure_7d co2_concentration" title="CO₂ partial pressure (each reading)"><TrendChart records={ctx.series('co2_partial_pressure')} refs={CO2_REFS} unit="" fmt={(x) => `${x.toFixed(2)} mmHg`} lastLevel={lv('co2_partial_pressure')} /></Section>
            <p className="text-xs text-slate-500">The level uses the time-weighted 1-hour average ({n(co2?.value, 2)} mmHg). 7-day average: {d.a('co2_partial_pressure_7d')?.message}</p>
            <div className="mt-3 rounded-md border border-space-line p-3 text-xs text-slate-300">
              Reported headache (shown side by side, no cause is inferred): <b>{headache ? `${headache.value}/10 · ${fmtDateTime(headache.recordedAt)}` : 'none reported'}</b>
            </div>
            <Section indicator="cabin_pressure" title="Total cabin pressure"><TrendChart records={ctx.series('cabin_pressure').map((r) => ({ ...r, value: toPsia(Number(r.value)) }))} refs={PRESSURE_REFS} domain={[0, 16]} fmt={(x) => `${x.toFixed(2)} psia`} lastLevel={lv('cabin_pressure')} /></Section>
            <Section indicator="inspired_oxygen_pressure oxygen_fraction oxygen_partial_pressure" title="Inspired oxygen (PIO₂)"><TrendChart records={ctx.series('inspired_oxygen_pressure')} refs={[{ y: rules.oxygen.normal[0], label: `${rules.oxygen.normal[0]} mmHg`, color: LEVEL_UI.caution.color }, { y: rules.oxygen.normal[1], label: `${rules.oxygen.normal[1]} mmHg`, color: LEVEL_UI.caution.color }]} fmt={(x) => `${Math.round(x)} mmHg`} lastLevel={lv('inspired_oxygen_pressure')} /></Section>
          </>)}
          {t === 'comfort' && (<>
            <CompareRow periodLabel={ctx.periodLabel} items={[
              { ...compareItem(ctx, 'temperature', 'Temperature', (x) => `${x.toFixed(1)} °C`), level: lv('temperature_humidity') },
              { ...compareItem(ctx, 'relative_humidity', 'Humidity', (x) => `${Math.round(x)}%`), level: lv('temperature_humidity') },
              { ...compareItem(ctx, 'cabin_noise', 'Noise', (x) => `${Math.round(x)} dBA`), level: lv('cabin_noise') },
            ]} />
            <Section indicator="temperature temperature_humidity" title="Temperature"><TrendChart records={ctx.series('temperature')} refs={COMFORT.temperature.map((y: number) => ({ y, label: `${y} °C`, color: '#94A3B8' }))} fmt={(x) => `${x} °C`} lastLevel={lv('temperature_humidity')} /></Section>
            <Section indicator="relative_humidity" title="Relative humidity"><TrendChart records={ctx.series('relative_humidity')} refs={COMFORT.humidity.map((y: number) => ({ y, label: `${y}%`, color: '#94A3B8' }))} fmt={(x) => `${x}%`} lastLevel={lv('temperature_humidity')} /></Section>
            <Section indicator="cabin_noise" title="Noise"><TrendChart records={ctx.series('cabin_noise')} refs={NOISE_REFS} fmt={(x) => `${x} dBA`} lastLevel={lv('cabin_noise')} /></Section>
          </>)}
          {t === 'eva' && <Section indicator="post_eva_symptoms reported_symptoms" title="Post-EVA checklist"><PostEvaForm /></Section>}
          <p className="text-xs text-slate-500 mt-4">{info(t === 'air' ? 'co2_partial_pressure' : t === 'comfort' ? 'cabin_noise' : 'post_eva_symptoms').why}</p>
        </>)}
      </TopicDetail>
    </div>
  );
}
