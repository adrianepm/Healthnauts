// Journey (árvore da saúde): a gamificação do app fica toda aqui. XP e sequência vêm só de tarefas FEITAS
// (check-in, teste de reação, exercício, pesagem), nunca do valor de saúde; nada morre nem é punido.
// Layout: faixa com dia da missão, sequência e XP; colunas Mental | árvore | Físico (empilhado no celular);
// missão semanal; tarefas de hoje (as mesmas da rotina do Next up, abrindo as mesmas janelas).
// Os níveis mostrados são os que a API já calcula (StatusPill). Nada aqui decide nível.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Apple, Brain, Check, Dumbbell, Flame, Flower2, HeartPulse, Moon, Rocket, Scale, ShieldCheck, Smile, Sparkles, Zap, type LucideIcon } from 'lucide-react';
import { useStore, XP_PER_CHECKIN, XP_PER_EXERCISE, XP_PER_PVT, XP_PER_WEIGH } from '../store/useStore';
import { api, type ApiRecord, type DisplayLevel } from '../services/api';
import { AREA } from '../config/api';
import { worstLevel } from '../../shared/config/levels.js';
import { pvtCollection } from '../../shared/config/isolation.js';
import { useReminders, routineProgress, type Reminder } from '../components/Notifications';
import { HealthTree, SIDE } from '../components/journey/Tree';
import { PageHeader, StatusPill } from '../components/ui';
import { REFERENCE } from '../lib/content';
import { fmtHours } from '../lib/format';
import { fmtTen, toTen } from '../lib/scales';
import { DAY, MENTAL_TASKS, PHYSICAL_TASKS, STAGE_COUNT, dayKeyOf, dayTasks, missionDay, missionOfWeek, missionProgress, stageOf, stageProgress, startOfDay, startOfWeek, streak, type Activity } from '../lib/journey';
import { cn } from '../lib/utils';

const PLAN = {
  pvtEveryDays: (pvtCollection.schedule.find((s: any) => s.kind === 'interval') as { days?: number } | undefined)?.days ?? 4,
  weighEveryDays: 7, exercisePlanMin: REFERENCE.exercisePlanMin,
};
const XP: Record<string, number> = { checkin: XP_PER_CHECKIN, pvt: XP_PER_PVT, exercise: XP_PER_EXERCISE, weigh: XP_PER_WEIGH };
const SHORT: Record<string, string> = { checkin: 'Morning check-in', pvt: 'Reaction check', exercise: 'Exercise', weigh: 'Weigh-in' };
const HISTORY_DAYS = 35;

/** Registros de 5 semanas de Isolation e Gravity (para sequência, missão e linhas de 7 dias). */
function useHistory() {
  const version = useStore((s) => s.version);
  const [rows, setRows] = useState<ApiRecord[]>([]);
  useEffect(() => {
    let live = true; const from = new Date(startOfDay(Date.now()) - HISTORY_DAYS * DAY); const to = new Date(Date.now() + 60000);
    Promise.all([api.history(AREA.isolation, from, to), api.history(AREA.gravity, from, to)])
      .then(([a, b]) => { if (live) setRows([...a.records, ...b.records]); }).catch(() => undefined);
    return () => { live = false; };
  }, [version]);
  return rows;
}

function activityOf(rows: ApiRecord[], checkins: string[]): Activity {
  const day = (r: ApiRecord) => dayKeyOf(Date.parse(r.recordedAt));
  const a: Activity = { checkins: new Set(checkins), pvts: new Set(), weighs: new Set(), exerciseMin: new Map() };
  for (const r of rows) {
    if (r.indicator === 'sleepiness_kss') a.checkins.add(day(r));
    else if (r.indicator === 'pvt_response_speed') a.pvts.add(day(r));
    else if (r.indicator === 'body_mass') a.weighs.add(day(r));
    else if (r.indicator === 'exercise_duration') a.exerciseMin.set(day(r), (a.exerciseMin.get(day(r)) ?? 0) + Number(r.value));
  }
  return a;
}

/** Último valor de cada um dos 7 dias (hoje incluído); `sum` soma o dia (exercício); `skip` ignora registros. */
function daily(rows: ApiRecord[], indicator: string, mode: 'last' | 'sum' | 'median' = 'last', skip?: (r: ApiRecord) => boolean) {
  const today = startOfDay(Date.now());
  return Array.from({ length: 7 }, (_, i) => {
    const from = today - (6 - i) * DAY; const to = from + DAY;
    const xs = rows.filter((r) => r.indicator === indicator && !skip?.(r) && Date.parse(r.recordedAt) >= from && Date.parse(r.recordedAt) < to).map((r) => Number(r.value)).filter(Number.isFinite);
    if (!xs.length) return mode === 'sum' ? 0 : null;
    if (mode === 'sum') return xs.reduce((s, x) => s + x, 0);
    if (mode === 'median') { const s = [...xs].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; }
    return xs.at(-1)!;
  });
}

/** Histórico, atividade por dia, rotina de hoje e sequência (usado aqui e no mini cartão da Overview). */
export function useJourney() {
  const ui = useStore((s) => s.ui); const mission = useStore((s) => s.mission);
  const rows = useHistory();
  const reminders = useReminders();
  const now = Date.now();
  const activity = useMemo(() => activityOf(rows, ui.checkins), [rows, ui.checkins]);
  const todayKey = dayKeyOf(now);
  const { done: doneToday, total: totalToday } = routineProgress(reminders);
  // Hoje: a rotina do Next up (mesma regra); dias anteriores: as mesmas regras sobre os registros.
  const isComplete = (key: string, ms: number) => key === todayKey ? totalToday > 0 && doneToday === totalToday : dayTasks(activity, key, ms, PLAN).complete;
  const st = streak(isComplete, now, mission ? Date.parse(mission.input.startedAt) : undefined);
  return { ui, mission, rows, reminders, activity, st, stage: stageOf(ui.xp), now };
}

export default function Journey() {
  const overview = useStore((s) => s.overview); const details = useStore((s) => s.details);
  const addReward = useStore((s) => s.addReward);
  const { ui, mission, rows, reminders, activity, st, stage, now } = useJourney();

  const md = missionDay(mission?.input.startedAt, mission?.input.destination, now);
  const week = startOfWeek(now); const m = missionOfWeek(week); const progress = missionProgress(m, activity, week);
  const earned = ui.rewards.some((r) => r.id === m.id);
  useEffect(() => { if (progress >= m.target && !earned) addReward({ id: m.id, kind: m.reward }); }, [progress, m.id, earned]);

  // Níveis das copas: Isolation (mental) e Gravity com sinais vitais (físico), como a barra lateral (worstLevel de shared/).
  const area = (id: string) => overview?.areas.find((a) => a.areaId === id);
  const mentalLevel = area(AREA.isolation)?.displayLevel ?? null;
  const g = area(AREA.gravity);
  const physicalLevel = g && overview ? worstLevel([g.headline, { ...overview.vitalSigns, critical: true }]).displayLevel as DisplayLevel : null;
  const lv = (areaId: string, indicator: string) => (details as any)[areaId]?.assessments?.find((x: any) => x.indicator === indicator)?.displayLevel as DisplayLevel | undefined;

  const side = (ids: string[]) => reminders.filter((r) => ids.includes(r.id));
  const mentalTasks = side(MENTAL_TASKS); const physicalTasks = side(PHYSICAL_TASKS);
  const count = (list: Reminder[]) => { const today = list.filter((r) => r.status !== 'later'); return { done: today.filter((r) => r.status === 'done').length, total: today.length }; };
  const mc = count(mentalTasks); const pc = count(physicalTasks);

  // Brilho da copa quando uma tarefa daquele lado é concluída (contagem sobe).
  const [glow, setGlow] = useState({ mental: 0, physical: 0 });
  const prev = useRef({ mental: mc.done, physical: pc.done });
  useEffect(() => {
    const up = { mental: mc.done > prev.current.mental, physical: pc.done > prev.current.physical };
    prev.current = { mental: mc.done, physical: pc.done };
    if (up.mental || up.physical) setGlow((x) => ({ mental: x.mental + (up.mental ? 1 : 0), physical: x.physical + (up.physical ? 1 : 0) }));
  }, [mc.done, pc.done]);

  const flowers = ui.rewards.filter((r) => r.kind === 'flower').length; const fruits = ui.rewards.filter((r) => r.kind === 'fruit').length;
  const hr = daily(rows, 'heart_rate', 'median', (r) => (r.context as any)?.activity === 'exercise');
  const label = `${stage.name} · stage ${stage.index + 1} of ${STAGE_COUNT}`;

  return (
    <div className="space-y-4">
      <PageHeader title="Journey" sub="Your health tree grows with the routine you complete. It never punishes a bad day." />

      {/* Faixa superior */}
      <section aria-label="Progress" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard icon={Rocket} title="Mission day">
          {md ? <><Big>{md.day}</Big>{md.total && <span className="text-sm text-slate-300"> of <span className="font-mono">{md.total}</span></span>}</> : <Big>–</Big>}
          {md?.total ? <Bar value={Math.min(1, md.day / md.total)} label="Mission progress" color="rgb(var(--text-2))" /> : null}
          <span className="text-xs text-slate-300">{mission ? `${mission.input.destination} · planned length for the demo` : 'No mission context'}</span>
        </StatCard>
        <StatCard icon={Flame} title="Streak">
          <span><Big>{st.days}</Big><span className="text-sm text-slate-300"> {st.days === 1 ? 'day' : 'days'} with the full routine</span></span>
          <ol className="flex gap-1.5" aria-label="This week">
            {st.week.map((d, i) => (
              <li key={d.key} className="flex flex-col items-center gap-0.5">
                <span className={cn('grid place-items-center w-6 h-6 rounded-full border text-[10px]',
                  d.state === 'complete' ? 'bg-brand border-brand text-space-bg' : d.state === 'shield' ? 'border-slate-300 text-slate-200' : d.state === 'today' ? 'border-brand' : 'border-space-strong border-dashed')}
                  aria-label={`${'MTWTFSS'[i]}: ${d.state === 'complete' ? 'complete' : d.state === 'shield' ? 'protected by the rest shield' : d.state === 'today' ? 'today, in progress' : d.state === 'future' ? 'coming' : 'not complete'}`}>
                  {d.state === 'complete' && <Check size={12} strokeWidth={3} aria-hidden="true" />}
                  {d.state === 'shield' && <ShieldCheck size={12} aria-hidden="true" />}
                </span>
                <span className="text-[11px] text-slate-300" aria-hidden="true">{'MTWTFSS'[i]}</span>
              </li>
            ))}
          </ol>
          <span className="text-xs text-slate-300 inline-flex items-center gap-1"><ShieldCheck size={13} aria-hidden="true" />{st.shieldUsedThisWeek ? 'Rest shield used this week' : '1 rest shield ready this week'}</span>
        </StatCard>
        <StatCard icon={Sparkles} title="Total XP">
          <span><Big>{ui.xp}</Big><span className="text-sm text-slate-300"> XP · {stage.name}</span></span>
          <Bar value={stageProgress(ui.xp)} label="XP to the next stage" color="rgb(var(--brand))" />
          <span className="text-xs text-slate-300">{stage.next === null ? 'Final stage reached' : <><span className="font-mono">{stage.next - ui.xp}</span> XP to stage {stage.index + 2}</>}</span>
        </StatCard>
      </section>

      {/* Mental | árvore | Físico */}
      <section aria-label="Health tree" className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1fr)] gap-3 items-stretch">
        <SideColumn side="mental" title="Mental" icon={Brain} footer={`${mc.done} of ${mc.total} mental tasks done today`} className="order-2 lg:order-1">
          <Metric icon={Smile} label="Mood" value={fmtLast(daily(rows, 'mood_score'), fmtTen)} unit="of 10" series={daily(rows, 'mood_score').map(nz(toTen))} level={lv(AREA.isolation, 'mood_score')} color={SIDE.mental} />
          <Metric icon={Zap} label="Stress" value={fmtLast(daily(rows, 'stress'), fmtTen)} unit="of 10" series={daily(rows, 'stress').map(nz(toTen))} level={lv(AREA.isolation, 'stress')} color={SIDE.mental} />
          <Metric icon={Moon} label="Sleep" value={fmtLast(daily(rows, 'sleep_duration'), fmtHours)} series={daily(rows, 'sleep_duration')} level={lv(AREA.isolation, 'sleep_duration')} color={SIDE.mental} />
        </SideColumn>
        <div className="card order-1 lg:order-2 flex flex-col items-center justify-center">
          <HealthTree stage={stage.index} mental={mentalLevel} physical={physicalLevel} flowers={flowers} fruits={fruits} glow={glow} label={label} />
          <div className="mt-2 flex gap-4 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: SIDE.mental }} aria-hidden="true" /><Brain size={13} aria-hidden="true" />Left: mental</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: SIDE.physical }} aria-hidden="true" /><Dumbbell size={13} aria-hidden="true" />Right: physical</span>
          </div>
          <p className="mt-2 text-xs text-slate-300 text-center max-w-xs">Leaves turn slightly yellow when an area is at Caution or above. The tree never loses what it has grown.</p>
        </div>
        <SideColumn side="physical" title="Physical" icon={Dumbbell} footer={`${pc.done} of ${pc.total} physical tasks done today`} className="order-3">
          <Metric icon={Dumbbell} label="Exercise" value={fmtLast(daily(rows, 'exercise_duration', 'sum'), (x) => String(Math.round(x)))} unit="min today" series={daily(rows, 'exercise_duration', 'sum')} note={`Plan about ${PLAN.exercisePlanMin} min a day`} color={SIDE.physical} />
          <Metric icon={Scale} label="Weight" value={fmtLast(daily(rows, 'body_mass'), (x) => x.toFixed(1))} unit="kg" series={daily(rows, 'body_mass')} level={lv(AREA.gravity, 'body_mass')} color={SIDE.physical} />
          <Metric icon={HeartPulse} label="Resting heart rate" value={fmtLast(hr, (x) => String(Math.round(x)))} unit="bpm" series={hr} level={overview?.vitalSigns.displayLevel} note="Level: vital signs" color={SIDE.physical} />
        </SideColumn>
      </section>

      {/* Missão da árvore */}
      <section aria-labelledby="mission-title" className="card flex flex-wrap items-center gap-x-6 gap-y-3">
        <span className="w-11 h-11 rounded-md grid place-items-center border" style={{ borderColor: SIDE[m.side] + '80', color: SIDE[m.side] }} aria-hidden="true">
          {m.reward === 'flower' ? <Flower2 size={20} /> : <Apple size={20} />}
        </span>
        <div className="flex-1 min-w-[14rem]">
          <h2 id="mission-title" className="text-xs font-medium text-slate-300">Tree mission · this week · {m.side === 'mental' ? 'Mental' : 'Physical'}</h2>
          <p className="text-base font-semibold text-slate-50">{m.title}</p>
          <p className="text-xs text-slate-300">Reward: {m.reward === 'flower' ? 'a flower on the mental side' : 'a fruit on the physical side'}. It stays on your tree.</p>
        </div>
        <div className="w-full sm:w-56">
          <p className="text-sm text-slate-200 text-right"><span className="font-mono text-slate-50">{progress}</span> of <span className="font-mono">{m.target}</span>{progress >= m.target && <span className="text-slate-300"> · earned</span>}</p>
          <Bar value={progress / m.target} label="Mission progress" color={SIDE[m.side]} />
        </div>
      </section>

      {/* Tarefas de hoje */}
      <section aria-labelledby="tasks-title" className="card">
        <h2 id="tasks-title" className="card-title">Today's tasks</h2>
        <div className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-4">
          <TaskList side="mental" title="Mental" icon={Brain} items={mentalTasks} />
          <TaskList side="physical" title="Physical" icon={Dumbbell} items={physicalTasks} />
        </div>
        <p className="mt-3 text-xs text-slate-300">XP rewards doing the task, never the result. A task done here or in Next up counts in both.</p>
      </section>
    </div>
  );
}

const nz = (f: (x: number) => number) => (x: number | null) => (x === null ? null : f(x));
/** Último valor dos 7 dias (hoje ou o dia mais recente com dado). */
function fmtLast(series: (number | null)[], fmt: (x: number) => string) { const x = [...series].reverse().find((v) => v !== null); return x === null || x === undefined ? null : fmt(x); }

const Big = ({ children }: { children: ReactNode }) => <span className="font-mono text-3xl font-medium text-slate-50 leading-none">{children}</span>;

function Bar({ value, label, color }: { value: number; label: string; color: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <span className="block h-1.5 rounded-full bg-space-card2 overflow-hidden" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
    </span>
  );
}

function StatCard({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <div className="card !p-4 flex flex-col gap-2.5">
      <span className="inline-flex items-center gap-2 text-sm text-slate-200"><Icon size={16} aria-hidden="true" className="text-slate-300" />{title}</span>
      {children}
    </div>
  );
}

function SideColumn({ side, title, icon: Icon, footer, className, children }: { side: 'mental' | 'physical'; title: string; icon: LucideIcon; footer: string; className?: string; children: ReactNode }) {
  return (
    <section aria-label={title} className={cn('card !p-4 flex flex-col gap-3 border-t-2', className)} style={{ borderTopColor: SIDE[side] }}>
      <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-50"><Icon size={18} aria-hidden="true" style={{ color: SIDE[side] }} />{title}</h2>
      <div className="flex-1 space-y-3">{children}</div>
      <p className="text-xs text-slate-300 pt-2 border-t border-space-line">{footer}</p>
    </section>
  );
}

/** Linha de 7 dias, sem eixos (só tendência). Dias sem dado ficam de fora da linha. */
function Sparkline({ series, color }: { series: (number | null)[]; color: string }) {
  const pts = series.map((v, i) => (v === null ? null : [i, v] as [number, number])).filter(Boolean) as [number, number][];
  if (pts.length < 2) return <span className="block h-7 text-xs text-slate-300">Not enough days yet</span>;
  const ys = pts.map((p) => p[1]); const lo = Math.min(...ys); const hi = Math.max(...ys); const span = hi - lo || 1;
  const X = (i: number) => 2 + (i / 6) * 96; const Y = (v: number) => 24 - ((v - lo) / span) * 20;
  const d = pts.map(([i, v], k) => `${k ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
  const [li, lv] = pts.at(-1)!;
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="block w-full h-7" aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      <circle cx={X(li)} cy={Y(lv)} r={2} fill={color} />
    </svg>
  );
}

function Metric({ icon: Icon, label, value, unit, series, level, levelNote, note, color }: {
  icon: LucideIcon; label: string; value: string | null; unit?: string; series: (number | null)[]; level?: DisplayLevel; levelNote?: string; note?: string; color: string;
}) {
  return (
    <div className="rounded-md border border-space-line bg-space-card2/50 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-200"><Icon size={14} aria-hidden="true" className="text-slate-300" />{label}</span>
        {level ? <span className="inline-flex items-center gap-1.5">{levelNote && <span className="text-xs text-slate-300">{levelNote}</span>}<StatusPill level={level} small /></span> : null}
      </div>
      <div className="mt-1 grid grid-cols-[auto_minmax(0,1fr)] items-end gap-3">
        <span className="whitespace-nowrap"><span className="font-mono text-xl font-medium text-slate-50">{value ?? '–'}</span>{unit && value && <span className="text-xs text-slate-300 ml-1">{unit}</span>}</span>
        <Sparkline series={series} color={color} />
      </div>
      {note && <p className="text-xs text-slate-300 mt-0.5">{note} · 7 days</p>}
      {!note && <p className="sr-only">Line: last 7 days</p>}
    </div>
  );
}

function TaskList({ side, title, icon: Icon, items }: { side: 'mental' | 'physical'; title: string; icon: LucideIcon; items: Reminder[] }) {
  return (
    <div>
      <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-slate-100"><Icon size={15} aria-hidden="true" style={{ color: SIDE[side] }} />{title}</h3>
      <ul className="mt-1.5 divide-y divide-space-line">
        {items.map((r) => (
          <li key={r.id}>
            <button type="button" onClick={r.go} className="w-full flex items-center gap-3 py-2 text-left hover:bg-space-card2 rounded-md px-1">
              <span className={cn('grid place-items-center w-6 h-6 rounded-full border-2 shrink-0', r.status === 'done' ? 'bg-slate-300 border-slate-300 text-space-bg' : r.status === 'ready' ? 'border-slate-300' : 'border-dashed border-space-strong')} aria-hidden="true">
                {r.status === 'done' && <Check size={13} strokeWidth={3} />}
              </span>
              <span className="flex-1 min-w-0 text-sm text-slate-100">{SHORT[r.id] ?? r.title}
                <span className="sr-only">: {r.status === 'done' ? 'done' : r.status === 'ready' ? 'to do today' : `later, ${r.returnsIn ?? ''}`}</span>
                {r.status === 'later' && r.returnsIn && <span className="block text-xs text-slate-300">Later · {r.returnsIn}</span>}
              </span>
              <span className={cn('font-mono text-xs whitespace-nowrap', r.status === 'done' ? 'text-slate-300' : 'text-brand-soft')}>+{XP[r.id]} XP</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
