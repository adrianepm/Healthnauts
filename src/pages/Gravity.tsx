// Gravity fields: sinais vitais (NEWS2 de referência), condicionamento vs. pré-voo, equilíbrio e visão, osso.
// Osso não gera alerta: só a curva ilustrativa com selo e o acompanhamento do exercício (especificação 3.3).
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bone, Dumbbell, HeartPulse, Scale, Activity, Eye } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AREA } from '../config/api';
import { api } from '../services/api';
import { useStore } from '../store/useStore';
import { useArea } from './useArea';
import { KeyTiles, TodayHero, TopicLinks } from '../components/lean/Home';
import { CompareRow, TopicDetail, compareItem, useTopicState, type TopicDef } from '../components/lean/TopicDetail';
import { BarsChart, TrendChart } from '../components/charts';
import { VitalsCard } from '../components/VitalsCard';
import { Card, GRID, PageHeader, Section, SourcesList, StatusPill, axisProps } from '../components/ui';
import { REFERENCE, info } from '../lib/content';
import { DAY_MS, startOfToday } from '../lib/format';
import { NEUTRAL } from '../lib/levels';

const TOPICS: TopicDef[] = [
  { id: 'fitness', label: 'Fitness', indicators: ['aerobic_capacity', 'muscle_strength', 'body_mass', 'vo2max'], also: ['exercise_duration'] },
  { id: 'balance', label: 'Balance & vision', indicators: ['motion_sickness', 'headache', 'dizziness', 'vision_change', 'amsler_change'] },
  { id: 'vitals', label: 'Vital signs', indicators: ['news2'], also: ['heart_rate', 'respiratory_rate', 'spo2', 'body_temperature', 'blood_pressure_systolic', 'blood_pressure_diastolic', 'supplemental_oxygen', 'consciousness'] },
];
const pctNum = (x: any) => (typeof x?.percentOfReference === 'number' ? String(Math.round(x.percentOfReference)) : '—');
/** Régua de 60% a 110% do pré-voo, com o mínimo de 80% da NASA (aeróbico e força). Só leitura: o nível vem da API. */
const pctRuler = (x: any, name: string, minimum = true) => ({
  min: 60, max: 110, value: typeof x?.percentOfReference === 'number' ? x.percentOfReference : null, range: minimum ? [80, 110] as [number, number] : null,
  marks: minimum ? [{ at: 80, label: '80%', priority: 2 }, { at: 100, label: '100%', priority: 1 }] : [{ at: 100, label: '100%' }],
  label: `${name} on a 60 to 110% of pre-flight scale${minimum ? '; NASA minimum 80%' : ''}`,
});

function LogForms() {
  const refresh = useStore((s) => s.refresh); const mission = useStore((s) => s.mission);
  const [minutes, setMinutes] = useState(30); const [mass, setMass] = useState('');
  const [ms, setMs] = useState(0); const [headache, setHeadache] = useState(0);
  const [flags, setFlags] = useState({ dizziness: false, near_fainting: false, vision_change: false, amsler_change: false });
  const [busy, setBusy] = useState<string | null>(null);
  const run = async (k: string, fn: () => Promise<unknown>) => { setBusy(k); try { await fn(); await refresh(); } finally { setBusy(null); } };
  const now = () => new Date().toISOString();
  // Vindo do "Start" da rotina na Overview: rola até o campo e põe o foco nele.
  const focus = (useLocation().state as { focus?: string } | null)?.focus;
  const exRef = useRef<HTMLInputElement>(null); const massRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const el = focus === 'exercise' ? exRef.current : focus === 'weigh' ? massRef.current : null;
    if (el) { el.scrollIntoView({ block: 'center' }); el.focus(); }
  }, [focus]);
  const ctx = { missionId: mission?.input.missionId, method: 'scale', activity: 'routine' };
  return (
    <div className="grid lg:grid-cols-3 gap-3 items-start">
      <Card title="Log exercise" sub={`Plan: about ${REFERENCE.exercisePlanMin} min a day, 6-7 days a week`} icon={<Dumbbell size={18} aria-hidden="true" />}>
        <div className="flex gap-2"><input ref={exRef} aria-label="Exercise minutes" type="number" min={1} max={600} value={minutes} onChange={(e) => setMinutes(Math.max(1, +e.target.value))} className="field" /><span className="self-center text-sm text-slate-300" aria-hidden="true">min</span></div>
        <button disabled={!!busy} onClick={() => run('ex', () => api.records(AREA.gravity, [{ indicator: 'exercise_duration', value: minutes, unit: 'min', recordedAt: now() }]))} className="btn-primary mt-3 w-full">Save session</button>
      </Card>
      <Card title="Weekly weigh-in" sub="Compared with your pre-flight body mass by the onboard service" icon={<Scale size={18} aria-hidden="true" />}>
        <div className="flex gap-2"><input ref={massRef} aria-label="Body mass in kg" type="number" step="0.1" min={30} max={200} value={mass} placeholder="kg" onChange={(e) => setMass(e.target.value)} className="field" /><span className="self-center text-sm text-slate-300" aria-hidden="true">kg</span></div>
        <button disabled={!!busy || !mass || !mission} onClick={() => run('mass', () => api.records(AREA.gravity, [{ indicator: 'body_mass', value: Number(mass), unit: 'kg', recordedAt: now(), context: ctx }]))} className="btn-primary mt-3 w-full">Save weight</button>
      </Card>
      <Card title="Balance & vision report" sub="Prototype scales, not validated instruments" icon={<Eye size={18} aria-hidden="true" />}>
        <label className="block text-xs text-slate-300">Motion sickness: <b className="font-mono text-slate-100">{ms}</b> (0 feeling fine · 20 vomiting)<input type="range" min={0} max={20} value={ms} onChange={(e) => setMs(+e.target.value)} className="w-full accent-brand" /></label>
        <label className="block text-xs text-slate-300 mt-2">Headache: <b className="font-mono text-slate-100">{headache}</b> / 10<input type="range" min={0} max={10} value={headache} onChange={(e) => setHeadache(+e.target.value)} className="w-full accent-brand" /></label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 mt-2 text-xs">
          {([['dizziness', 'Dizziness'], ['near_fainting', 'Near fainting'], ['vision_change', 'Vision changed since yesterday'], ['amsler_change', 'Amsler grid looks different']] as const).map(([k, l]) => (
            <label key={k} className="tap flex items-center gap-2"><input type="checkbox" checked={flags[k]} onChange={(e) => setFlags({ ...flags, [k]: e.target.checked })} className="accent-brand" />{l}</label>
          ))}
        </div>
        <button disabled={!!busy} onClick={() => run('sym', () => api.records(AREA.gravity, [
          { indicator: 'motion_sickness', value: ms, unit: null, recordedAt: now() }, { indicator: 'headache', value: headache, unit: null, recordedAt: now() },
          ...Object.entries(flags).map(([indicator, v]) => ({ indicator, value: v ? 1 : 0, unit: null, recordedAt: now() })),
        ]))} className="btn-primary mt-3 w-full">Save report</button>
      </Card>
    </div>
  );
}

/** Bone Loss Educational Simulation: 100 − taxa × meses. Não gera alerta. */
function BoneSimulation({ startedAt }: { startedAt?: string }) {
  const months = Array.from({ length: 13 }, (_, m) => m);
  const [lo, hi] = REFERENCE.boneRates;
  const data = months.map((m) => ({ m, low: 100 - lo * m, high: 100 - hi * m }));
  const now = startedAt ? (Date.now() - Date.parse(startedAt)) / (30 * DAY_MS) : null;
  return (
    <Card title="Bone loss · educational simulation" sub={`100 − rate × months, with ${lo}% to ${hi}% per month`} icon={<Bone size={18} aria-hidden="true" />}
      >
      <p className="chip mb-3">Illustrative projection, not an actual bone density measurement.</p>
      <div className="h-48">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="m" {...axisProps} unit=" mo" interval="preserveStartEnd" minTickGap={14} />
            <YAxis domain={[80, 100]} {...axisProps} unit="%" width={48} />
            <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => `${Number(v).toFixed(1)}%`} labelFormatter={(m) => `Month ${m}`} />
            <Line dataKey="low" name={`${lo}%/month`} stroke={NEUTRAL} strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line dataKey="high" name={`${hi}%/month`} stroke="#9AA3B5" strokeDasharray="4 4" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-slate-500 mt-1">Bone density is only measured before and after flight (DXA). {now !== null && `Mission month ${now.toFixed(1)}.`} No alert comes from this curve.</p>
      <SourcesList ids={['s22']} />
    </Card>
  );
}

export default function Gravity() {
  const d = useArea(AREA.gravity);
  const mission = useStore((s) => s.mission);
  const [topic, setTopic] = useTopicState(TOPICS);
  if (!d.ready) return <p className="text-sm text-slate-400">Loading…</p>;
  const lv = (id: string) => d.a(id)?.displayLevel ?? 'unavailable';
  // Bone Protection Tracker: dias da última semana com o plano de exercício cumprido (só acompanhamento).
  const byDay = new Map<number, number>();
  for (const r of d.week.filter((x) => x.indicator === 'exercise_duration')) {
    const day = new Date(r.recordedAt); day.setHours(0, 0, 0, 0);
    byDay.set(day.getTime(), (byDay.get(day.getTime()) ?? 0) + Number(r.value));
  }
  const today = byDay.get(startOfToday()) ?? 0;
  const daysOnPlan = [...byDay.values()].filter((m) => m >= REFERENCE.exercisePlanMin).length;

  return (
    <div className="space-y-5">
      <PageHeader title="Gravity" sub="Gravity fields · vital signs, fitness, balance and bone" />
      <TodayHero level={d.summary!.displayLevel} label="Body today" message={d.summary!.headline.message ?? ''} sub="Vital signs are shown separately below" also={d.also(d.summary!.headline.indicator).filter((x) => x.label !== info('news2').label)} />
      <VitalsCard detailed />
      <KeyTiles tiles={[
        { key: 'aer', indicator: 'aerobic_capacity', title: 'Aerobic capacity', icon: HeartPulse, value: pctNum(d.newest('aerobic_capacity')), unit: '%', level: d.newest('aerobic_capacity')?.displayLevel ?? 'unavailable', compare: 'of pre-flight (NASA minimum 80%)', onClick: () => setTopic('fitness'), ruler: pctRuler(d.newest('aerobic_capacity'), 'Aerobic capacity') },
        { key: 'str', indicator: 'muscle_strength', title: 'Muscle strength', icon: Dumbbell, value: pctNum(d.a('muscle_strength')), unit: '%', level: lv('muscle_strength'), compare: 'of pre-flight (NASA minimum 80%)', onClick: () => setTopic('fitness'), ruler: pctRuler(d.a('muscle_strength'), 'Muscle strength') },
        { key: 'mass', indicator: 'body_mass', title: 'Body mass', icon: Scale, value: pctNum(d.a('body_mass')), unit: '%', level: lv('body_mass'), compare: `of pre-flight · ${d.a('body_mass')?.observedValue ?? '—'} kg`, onClick: () => setTopic('fitness'), ruler: pctRuler(d.a('body_mass'), 'Body mass', false) },
        { key: 'ex', indicator: 'exercise_duration', title: 'Exercise today', icon: Activity, value: String(Math.round(today)), unit: 'min', compare: `Plan ~${REFERENCE.exercisePlanMin} min · ${daysOnPlan} of 7 days on plan`, onClick: () => setTopic('fitness'),
          ruler: { min: 0, max: REFERENCE.exercisePlanMin * 1.5, value: today, marks: [{ at: REFERENCE.exercisePlanMin, label: String(REFERENCE.exercisePlanMin) }], label: `Exercise today on a scale to ${REFERENCE.exercisePlanMin * 1.5} min; plan ${REFERENCE.exercisePlanMin} min` } },
      ]} />
      <TopicLinks topics={TOPICS.map((t) => ({ id: t.id, label: t.label, level: d.worst(t.indicators) }))} onOpen={setTopic} />
      <LogForms />
      <div className="grid lg:grid-cols-2 gap-3">
        <BoneSimulation startedAt={mission?.input.startedAt} />
        <Card title="Bone protection tracker" sub="Resistance exercise done vs. plan · prevention, not diagnosis" icon={<Bone size={18} aria-hidden="true" />}>
          <BarsChart records={d.week.filter((r) => r.indicator === "exercise_duration")} unit=" min" domain={[0, REFERENCE.exercisePlanMin * 1.5]} refs={[{ y: REFERENCE.exercisePlanMin, label: `${REFERENCE.exercisePlanMin} min plan` }]} fmt={(x) => `${x} min`} />
          <p className="text-xs text-slate-500 mt-1">On the ISS crews exercise about 1.5 h a day, 6 to 7 days a week, with loads of 2 to 3 times body weight for bone.</p>
          <SourcesList ids={['s22']} />
        </Card>
      </div>
      <p className="text-xs text-slate-500">Post-landing stand test appears only after landing (phase POST_LANDING): standing is not possible in microgravity.</p>

      <TopicDetail areaId={AREA.gravity} topics={TOPICS} topic={topic} onTopic={setTopic} assessments={d.assessments}>
        {(t, ctx) => (<>
          {t === 'fitness' && (<>
            <CompareRow periodLabel={ctx.periodLabel} items={[
              compareItem(ctx, 'body_mass', 'Body mass', (x) => `${x.toFixed(1)} kg`),
              compareItem(ctx, 'aerobic_capacity', 'Aerobic capacity', (x) => x.toFixed(1)),
              compareItem(ctx, 'muscle_strength', 'Strength', (x) => `${Math.round(x)} N`),
            ]} />
            <Section indicator="body_mass" title="Body mass"><TrendChart records={ctx.series('body_mass')} fmt={(x) => `${x} kg`} lastLevel={lv('body_mass')} /></Section>
            <Section indicator="exercise_duration" title="Exercise sessions"><BarsChart records={ctx.series("exercise_duration")} unit=" min" refs={[{ y: REFERENCE.exercisePlanMin, label: `${REFERENCE.exercisePlanMin} min/day plan` }]} fmt={(x) => `${x} min`} /></Section>
          </>)}
          {t === 'balance' && (<>
            <CompareRow periodLabel={ctx.periodLabel} items={[
              compareItem(ctx, 'motion_sickness', 'Motion sickness (0-20)', (x) => x.toFixed(0)),
              compareItem(ctx, 'headache', 'Headache (0-10)', (x) => x.toFixed(0)),
            ]} />
            <Section indicator="headache" title="Headache (shown next to cabin CO₂ on Environment)"><TrendChart records={ctx.series('headache')} domain={[0, 10]} lastLevel={lv('headache')} /></Section>
            <Section indicator="motion_sickness" title="Motion sickness"><TrendChart records={ctx.series('motion_sickness')} domain={[0, 20]} lastLevel={lv('motion_sickness')} /></Section>
            <ul className="mt-4 space-y-1 text-xs">
              {['dizziness', 'vision_change', 'amsler_change'].map((id) => <li key={id} className="flex items-center gap-2"><StatusPill level={lv(id)} small />{d.a(id)?.message}</li>)}
            </ul>
          </>)}
          {t === 'vitals' && (<>
            <Section indicator="heart_rate respiratory_rate spo2 news2" title="Heart rate"><TrendChart records={ctx.series('heart_rate')} fmt={(x) => `${x} bpm`} dayTicks={false} /></Section>
            <Section indicator="body_temperature" title="Body temperature"><TrendChart records={ctx.series('body_temperature')} fmt={(x) => `${x} °C`} dayTicks={false} /></Section>
            <Section indicator="blood_pressure_systolic blood_pressure_diastolic" title="Systolic blood pressure"><TrendChart records={ctx.series('blood_pressure_systolic')} fmt={(x) => `${x} mmHg`} dayTicks={false} /></Section>
            <p className="text-xs text-slate-500 mt-2">In microgravity 24-hour blood pressure drops about 8 to 10 mmHg and heart rate does not change (Norsk et al. 2015).</p>
          </>)}
        </>)}
      </TopicDetail>
    </div>
  );
}
