// Aba Isolation (Mind & Sleep), versão enxuta do protótipo aprovado.
// Tela inicial: resumo do dia + 4 indicadores. Detalhe por tópico só quando o astronauta abre.
import { useState } from 'react';
import { BellRing, Brain, Gauge, Moon, Play, Timer } from 'lucide-react';
import { isolationMonitoring } from '../../shared/config/isolation.js';
import { AREA } from '../config/api';
import { useStore, dayKey } from '../store/useStore';
import { useArea } from './useArea';
import { KeyTiles, TodayHero, TopicLinks } from '../components/lean/Home';
import { CompareRow, TopicDetail, compareItem, type TopicDef } from '../components/lean/TopicDetail';
import { BarsChart, ScaleHeat, TrendChart, hoursFmt, sleepRefs } from '../components/charts';
import { Section } from '../components/ui';
import { SupportTools } from '../components/SupportTools';
import { ago, deltaText, fmtHours } from '../lib/format';
import { KSS_LABELS, REFERENCE, SP_LABELS } from '../lib/content';

const TOPICS: TopicDef[] = [
  { id: 'sleep', label: 'Sleep', indicators: ['sleep_duration', 'sleep_quality'] },
  { id: 'alertness', label: 'Alertness', indicators: ['sleepiness_kss', 'fatigue_samn_perelli', 'pvt_response_speed', 'pvt_lapses'] },
  { id: 'mind', label: 'Mind', indicators: ['stress', 'mood_score'] },
];
// Réguas do gráfico de sono: os mesmos cortes das regras de shared/config/isolation.js.
const sleepRule = (id: string) => isolationMonitoring.sleep_duration.rules.find((r: any) => r.id === id)?.value as number;
const SLEEP_REFS = sleepRefs(REFERENCE.sleepPlanH, sleepRule('sleep_six_hours'), sleepRule('sleep_four_hours'));
const rtMs = (speed: number) => 1000 / speed; // velocidade média 1/RT → tempo aproximado em ms (só leitura)

export default function Isolation() {
  const d = useArea(AREA.isolation);
  const [topic, setTopic] = useState<string | null>(null);
  const { ui, setCheckinOpen, setPvtOpen } = useStore();
  if (!d.ready) return <p className="text-sm text-slate-400">Loading…</p>;
  const checkinDone = ui.checkins.includes(dayKey());
  const v = (id: string) => { const r = d.latest(id); return r ? Number(r.value) : NaN; };
  const band = (id: string) => { const b = d.a(id)?.baseline; return b?.status === 'ready' ? { lower: b.lower!, upper: b.upper! } : null; };
  const lastCheckin = d.latest('sleepiness_kss')?.recordedAt;

  return (
    <div className="space-y-5">
      <h1 className="text-sm text-slate-400">Isolation & confinement · Mind and sleep</h1>
      <TodayHero level={d.summary!.displayLevel} message={d.summary!.headline.message ?? ''} sub={`last check-in ${ago(lastCheckin)}`}
        also={d.also(d.summary!.headline.indicator)}
        action={!checkinDone && (
          <button onClick={() => setCheckinOpen(true)} className="relative inline-flex items-center gap-2 rounded-xl border border-space-line bg-space-deep hover:border-slate-500 px-4 py-3 text-sm">
            <BellRing size={16} className="text-slate-300" />
            <span className="text-left"><span className="block font-semibold">Morning check-in</span><span className="block text-xs text-slate-400">Pending · about 1 min</span></span>
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-xs font-bold grid place-items-center text-white">1</span>
          </button>
        )} />
      <KeyTiles tiles={[
        { key: 'sleep', title: 'Sleep last night', icon: Moon, value: fmtHours(v('sleep_duration')), level: d.a('sleep_duration')?.displayLevel ?? 'unavailable',
          compare: `${deltaText(v('sleep_duration'), d.avg7('sleep_duration'), 'hours')} vs 7-day avg`, onClick: () => setTopic('sleep') },
        { key: 'kss', title: 'Sleepiness', icon: Gauge, value: Number.isFinite(v('sleepiness_kss')) ? v('sleepiness_kss') : '—', level: d.a('sleepiness_kss')?.displayLevel ?? 'unavailable',
          compare: `${deltaText(v('sleepiness_kss'), d.avg7('sleepiness_kss'))} vs 7-day avg (1-9 scale)`, onClick: () => setTopic('alertness') },
        { key: 'pvt', title: 'Reaction time', icon: Timer, value: Number.isFinite(v('pvt_response_speed')) ? `${Math.round(rtMs(v('pvt_response_speed')))} ms` : '—',
          level: d.a('pvt_response_speed')?.displayLevel ?? 'unavailable',
          compare: `≈ from mean speed · test ${ago(d.latest('pvt_response_speed')?.recordedAt)}`, onClick: () => setTopic('alertness') },
        { key: 'stress', title: 'Stress', icon: Brain, value: Number.isFinite(v('stress')) ? Math.round(v('stress')) : '—', level: d.a('stress')?.displayLevel ?? 'unavailable',
          compare: `${deltaText(v('stress'), d.avg7('stress'))} vs 7-day avg (0-100)`, onClick: () => setTopic('mind') },
      ]} />
      <TopicLinks topics={TOPICS.map((t) => ({ id: t.id, label: t.label, level: d.worst(t.indicators) }))} onOpen={setTopic} />

      <TopicDetail areaId={AREA.isolation} topics={TOPICS} topic={topic} onTopic={setTopic} assessments={d.assessments}>
        {(t, ctx) => (<>
          {t === 'sleep' && (<>
            <CompareRow periodLabel={ctx.periodLabel} items={[
              compareItem(ctx, 'sleep_duration', 'Sleep duration', hoursFmt, 'hours'),
              compareItem(ctx, 'sleep_quality', 'Sleep quality (0-100)', (x) => String(Math.round(x))),
            ]} />
            <Section title="Hours of sleep"><BarsChart records={ctx.series('sleep_duration')} unit="h" domain={[0, 10]} refs={SLEEP_REFS} fmt={hoursFmt} lastLevel={ctx.assessment('sleep_duration')?.displayLevel} /></Section>
            <Section title="Sleep quality"><TrendChart records={ctx.series('sleep_quality')} band={band('sleep_quality')} domain={[0, 100]} lastLevel={ctx.assessment('sleep_quality')?.displayLevel} /></Section>
            <p className="text-xs text-slate-500 mt-1">Bars: neutral; the latest night takes the colour of its level. Lines: NASA plan 8.5 h (a goal, not a cut-off), 6 h and 4 h.</p>
          </>)}
          {t === 'alertness' && (<>
            <CompareRow periodLabel={ctx.periodLabel} items={[
              compareItem(ctx, 'sleepiness_kss', 'Sleepiness (KSS 1-9)', (x) => x.toFixed(1).replace('.0', '')),
              compareItem(ctx, 'fatigue_samn_perelli', 'Fatigue (Samn-Perelli 1-7)', (x) => x.toFixed(1).replace('.0', '')),
              compareItem(ctx, 'pvt_response_speed', 'Reaction time (≈)', (x) => `${Math.round(x)} ms`, 'ms', rtMs),
            ]} />
            <Section title="Sleepiness · KSS (1-9)"><ScaleHeat records={ctx.series('sleepiness_kss')} max={9} labels={KSS_LABELS} lastLevel={ctx.assessment('sleepiness_kss')?.displayLevel} /></Section>
            <Section title="Fatigue · Samn-Perelli (1-7)"><ScaleHeat records={ctx.series('fatigue_samn_perelli')} max={7} labels={SP_LABELS} lastLevel={ctx.assessment('fatigue_samn_perelli')?.displayLevel} /></Section>
            <Section title="Reaction check (PVT-B, every 4 days)"
              right={<button onClick={() => setPvtOpen(true)} className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-soft text-space-bg text-xs font-semibold rounded-lg px-3 py-1.5"><Play size={12} />Start 3-min check</button>}>
              <TrendChart records={ctx.series('pvt_response_speed')} band={band('pvt_response_speed')} fmt={(x) => `${x.toFixed(2)} /s (≈ ${Math.round(rtMs(x))} ms)`} lastLevel={ctx.assessment('pvt_response_speed')?.displayLevel} />
              <p className="text-xs text-slate-400 mt-1">Line: mean response speed (higher is faster){band('pvt_response_speed') ? ' · shaded: your usual range' : ''}.</p>
            </Section>
          </>)}
          {t === 'mind' && (<>
            <CompareRow periodLabel={ctx.periodLabel} items={[
              compareItem(ctx, 'stress', 'Stress (0-100)', (x) => String(Math.round(x))),
              compareItem(ctx, 'mood_score', 'Mood (0-100)', (x) => String(Math.round(x))),
            ]} />
            <Section title="Stress"><TrendChart records={ctx.series('stress')} band={band('stress')} domain={[0, 100]} lastLevel={ctx.assessment('stress')?.displayLevel} /></Section>
            <Section title="Mood"><TrendChart records={ctx.series('mood_score')} band={band('mood_score')} domain={[0, 100]} lastLevel={ctx.assessment('mood_score')?.displayLevel} /></Section>
            <p className="text-xs text-slate-500 mt-1">Shaded band: your usual range (mission days 1-7), when ready. No validated cut-off exists for these ratings. Mood and stress are visible only to you and your Crew Medical Officer.</p>
            <div className="mt-6"><SupportTools /></div>
          </>)}
        </>)}
      </TopicDetail>
    </div>
  );
}
