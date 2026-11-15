// Aba Isolation (Mind & Sleep), versão enxuta do protótipo aprovado.
// Tela inicial: resumo do dia + 4 indicadores. Detalhe por tópico só quando o astronauta abre.
import { BellRing, Brain, Gauge, Moon, Play, Timer } from 'lucide-react';
import { isolationMonitoring } from '../../shared/config/isolation.js';
import { AREA } from '../config/api';
import { useStore, dayKey } from '../store/useStore';
import { useArea } from './useArea';
import { AreaActions } from '../components/AlertActions';
import { KeyTiles, TodayHero, TopicLinks } from '../components/lean/Home';
import { CompareRow, TopicDetail, compareItem, useTopicState, type TopicDef } from '../components/lean/TopicDetail';
import { BarsChart, ScaleHeat, TrendChart, hoursFmt, sleepRefs } from '../components/charts';
import { PageHeader, Section } from '../components/ui';
import { SupportTools } from '../components/SupportTools';
import { ago, deltaText, fmtHours } from '../lib/format';
import { KSS_LABELS, REFERENCE, SP_LABELS } from '../lib/content';
import { fmtTen, toTen } from '../lib/scales';
import type { ApiRecord } from '../services/api';

// Humor, estresse e qualidade do sono: gravados de 0 a 100, mostrados de 0 a 10 (src/lib/scales.ts).
const ten = (rs: ApiRecord[]) => rs.map((r) => ({ ...r, value: toTen(Number(r.value)) }));
const tenBand = (b: { lower: number; upper: number } | null) => (b ? { lower: toTen(b.lower), upper: toTen(b.upper) } : null);

const TOPICS: TopicDef[] = [
  { id: 'sleep', label: 'Sleep', indicators: ['sleep_duration', 'sleep_quality'] },
  { id: 'alertness', label: 'Alertness', indicators: ['sleepiness_kss', 'fatigue_samn_perelli', 'pvt_response_speed', 'pvt_lapses'], also: ['pvt_false_starts'] },
  { id: 'mind', label: 'Mind', indicators: ['stress', 'mood_score'] },
];
// Réguas do gráfico de sono: os mesmos cortes das regras de shared/config/isolation.js.
const sleepRule = (id: string) => isolationMonitoring.sleep_duration.rules.find((r: any) => r.id === id)?.value as number;
const SLEEP_REFS = sleepRefs(REFERENCE.sleepPlanH, sleepRule('sleep_six_hours'), sleepRule('sleep_four_hours'));
const rtMs = (speed: number) => 1000 / speed; // velocidade média 1/RT → tempo aproximado em ms (só leitura)

export default function Isolation() {
  const d = useArea(AREA.isolation);
  const [topic, setTopic] = useTopicState(TOPICS);
  const { ui, setCheckinOpen, setPvtOpen } = useStore();
  if (!d.ready) return <p className="text-sm text-slate-400">Loading…</p>;
  const checkinDone = ui.checkins.includes(dayKey());
  const v = (id: string) => { const r = d.latest(id); return r ? Number(r.value) : NaN; };
  const band = (id: string) => { const b = d.a(id)?.baseline; return b?.status === 'ready' ? { lower: b.lower!, upper: b.upper! } : null; };
  const lastCheckin = d.latest('sleepiness_kss')?.recordedAt;

  const six = sleepRule('sleep_six_hours'); const four = sleepRule('sleep_four_hours');
  const rng = (b: { lower: number; upper: number } | null): [number, number] | null => (b ? [b.lower, b.upper] : null);
  const num = (x: number) => (Number.isFinite(x) ? x : null);

  return (
    <div className="space-y-5">
      <PageHeader title="Isolation" sub="Isolation and confinement · mind and sleep" />
      <TodayHero extra={<AreaActions areaId={AREA.isolation} indicator={d.summary!.headline.indicator} level={d.summary!.displayLevel} />} level={d.summary!.displayLevel} message={d.summary!.headline.message ?? ''} sub={`Last check-in ${ago(lastCheckin)}`}
        also={d.also(d.summary!.headline.indicator)}
        action={!checkinDone && (
          <button onClick={() => setCheckinOpen(true)} className="btn-ghost relative !py-2.5 !px-4">
            <BellRing size={16} className="text-slate-300" aria-hidden="true" />
            <span className="text-left"><span className="block font-semibold">Morning check-in</span><span className="block text-xs text-slate-300">Pending · about 1 min</span></span>
            <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-brand text-xs font-bold grid place-items-center text-space-bg" aria-hidden="true">1</span>
          </button>
        )} />
      <KeyTiles tiles={[
        { key: 'sleep', indicator: 'sleep_duration', title: 'Sleep last night', icon: Moon, value: fmtHours(v('sleep_duration')), level: d.a('sleep_duration')?.displayLevel ?? 'unavailable',
          compare: `${deltaText(v('sleep_duration'), d.avg7('sleep_duration'), 'hours')} vs 7-day avg`, onClick: () => setTopic('sleep'),
          note: `NASA plan ${REFERENCE.sleepPlanH} h · lines at ${six} h and ${four} h`,
          ruler: { min: 0, max: 10, value: num(v('sleep_duration')), band: rng(band('sleep_duration')), marks: [{ at: four, label: `${four} h`, priority: 3 }, { at: six, label: `${six} h`, priority: 2 }, { at: REFERENCE.sleepPlanH, label: `${REFERENCE.sleepPlanH} h`, priority: 1 }],
            label: `Sleep on a 0 to 10 hour scale with marks at ${four} h, ${six} h and the ${REFERENCE.sleepPlanH} h plan` } },
        { key: 'kss', indicator: 'sleepiness_kss', title: 'Sleepiness', icon: Gauge, value: Number.isFinite(v('sleepiness_kss')) ? v('sleepiness_kss') : '–', unit: 'KSS 1-9', level: d.a('sleepiness_kss')?.displayLevel ?? 'unavailable',
          compare: `${deltaText(v('sleepiness_kss'), d.avg7('sleepiness_kss'))} vs 7-day avg`, onClick: () => setTopic('alertness'),
          note: `Karolinska scale, 1 (very alert) to 9${band('sleepiness_kss') ? ' · shaded: your usual range' : ''}`,
          ruler: { min: 1, max: 9, value: num(v('sleepiness_kss')), band: rng(band('sleepiness_kss')), marks: [{ at: 1, label: '1' }, { at: 9, label: '9' }], label: 'Sleepiness on the 1 to 9 Karolinska scale' } },
        { key: 'pvt', indicator: 'pvt_response_speed', title: 'Reaction time', icon: Timer, value: Number.isFinite(v('pvt_response_speed')) ? String(Math.round(rtMs(v('pvt_response_speed')))) : '–', unit: Number.isFinite(v('pvt_response_speed')) ? 'ms' : undefined,
          level: d.a('pvt_response_speed')?.displayLevel ?? 'unavailable',
          compare: `≈ from mean speed · test ${ago(d.latest('pvt_response_speed')?.recordedAt)}`, onClick: () => setTopic('alertness') },
        { key: 'stress', indicator: 'stress', title: 'Stress', icon: Brain, value: Number.isFinite(v('stress')) ? fmtTen(v('stress')) : '–', unit: 'of 10', level: d.a('stress')?.displayLevel ?? 'unavailable',
          compare: `${deltaText(toTen(v('stress')), d.avg7('stress', toTen))} vs 7-day avg`, onClick: () => setTopic('mind'),
          note: `Scale 1 to 10${band('stress') ? ' · shaded: your usual range' : ''}`,
          ruler: { min: 1, max: 10, value: num(toTen(v('stress'))), band: rng(tenBand(band('stress'))), marks: [{ at: 1, label: '1' }, { at: 10, label: '10' }], label: 'Stress on a 1 to 10 scale; shaded: your usual range' } },
      ]} />
      <TopicLinks topics={TOPICS.map((t) => ({ id: t.id, label: t.label, level: d.worst(t.indicators) }))} onOpen={setTopic} />

      <TopicDetail areaId={AREA.isolation} topics={TOPICS} topic={topic} onTopic={setTopic} assessments={d.assessments}>
        {(t, ctx) => (<>
          {t === 'sleep' && (<>
            <CompareRow periodLabel={ctx.periodLabel} items={[
              compareItem(ctx, 'sleep_duration', 'Sleep duration', hoursFmt, 'hours'),
              compareItem(ctx, 'sleep_quality', 'Sleep quality (1-10)', (x) => String(Number(x.toFixed(1))), 'number', toTen),
            ]} />
            <Section indicator="sleep_duration" title="Hours of sleep"><BarsChart records={ctx.series('sleep_duration')} unit="h" domain={[0, 10]} refs={SLEEP_REFS} fmt={hoursFmt} lastLevel={ctx.assessment('sleep_duration')?.displayLevel} /></Section>
            <Section indicator="sleep_quality" title="Sleep quality"><TrendChart records={ten(ctx.series('sleep_quality'))} band={tenBand(band('sleep_quality'))} domain={[0, 10]} lastLevel={ctx.assessment('sleep_quality')?.displayLevel} /></Section>
            <p className="text-xs text-slate-300 mt-1">Bars: neutral; the latest night takes the colour of its level. Lines: NASA plan 8.5 h (a goal, not a cut-off), 6 h and 4 h.</p>
          </>)}
          {t === 'alertness' && (<>
            <CompareRow periodLabel={ctx.periodLabel} items={[
              compareItem(ctx, 'sleepiness_kss', 'Sleepiness (KSS 1-9)', (x) => x.toFixed(1).replace('.0', '')),
              compareItem(ctx, 'fatigue_samn_perelli', 'Fatigue (Samn-Perelli 1-7)', (x) => x.toFixed(1).replace('.0', '')),
              compareItem(ctx, 'pvt_response_speed', 'Reaction time (≈)', (x) => `${Math.round(x)} ms`, 'ms', rtMs),
            ]} />
            <Section indicator="sleepiness_kss" title="Sleepiness · KSS (1-9)"><ScaleHeat records={ctx.series('sleepiness_kss')} max={9} labels={KSS_LABELS} lastLevel={ctx.assessment('sleepiness_kss')?.displayLevel} /></Section>
            <Section indicator="fatigue_samn_perelli" title="Fatigue · Samn-Perelli (1-7)"><ScaleHeat records={ctx.series('fatigue_samn_perelli')} max={7} labels={SP_LABELS} lastLevel={ctx.assessment('fatigue_samn_perelli')?.displayLevel} /></Section>
            <Section indicator="pvt_response_speed pvt_lapses pvt_false_starts" title="Reaction check (PVT-B, every 4 days)"
              right={<button onClick={() => setPvtOpen(true)} className="btn-primary !text-xs !px-3 !py-1.5"><Play size={12} aria-hidden="true" />Start 3-min check</button>}>
              <TrendChart records={ctx.series('pvt_response_speed')} band={band('pvt_response_speed')} fmt={(x) => `${x.toFixed(2)} /s (≈ ${Math.round(rtMs(x))} ms)`} lastLevel={ctx.assessment('pvt_response_speed')?.displayLevel} />
              <p className="text-xs text-slate-400 mt-1">Line: mean response speed (higher is faster){band('pvt_response_speed') ? ' · shaded: your usual range' : ''}.</p>
            </Section>
          </>)}
          {t === 'mind' && (<>
            <CompareRow periodLabel={ctx.periodLabel} items={[
              compareItem(ctx, 'stress', 'Stress (1-10)', (x) => String(Number(x.toFixed(1))), 'number', toTen),
              compareItem(ctx, 'mood_score', 'Mood (1-10)', (x) => String(Number(x.toFixed(1))), 'number', toTen),
            ]} />
            <Section indicator="stress" title="Stress"><TrendChart records={ten(ctx.series('stress'))} band={tenBand(band('stress'))} domain={[0, 10]} lastLevel={ctx.assessment('stress')?.displayLevel} /></Section>
            <Section indicator="mood_score" title="Mood"><TrendChart records={ten(ctx.series('mood_score'))} band={tenBand(band('mood_score'))} domain={[0, 10]} lastLevel={ctx.assessment('mood_score')?.displayLevel} /></Section>
            <p className="text-xs text-slate-300 mt-1">Shaded band: your usual range (mission days 1-7), when ready. No validated cut-off exists for these ratings. Mood and stress are visible only to you and your Crew Medical Officer.</p>
            <div className="mt-6"><SupportTools /></div>
          </>)}
        </>)}
      </TopicDetail>
    </div>
  );
}
