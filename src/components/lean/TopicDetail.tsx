// Detalhe por tópico (do protótipo), genérico para todas as telas.
// Compara hoje com os últimos 7 dias (padrão) ou com um período escolhido; o período chama /history?from&to.
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { api, type ApiRecord, type Assessment, type DisplayLevel } from '../../services/api';
import type { AreaId } from '../../config/api';
import { DAY_MS, deltaText, fmtDay, mean, startOfToday } from '../../lib/format';
import { isFlagged } from '../../lib/levels';
import { info } from '../../lib/content';
import { More, Section, StatusPill, WhyBlock } from '../ui';
import { useStore } from '../../store/useStore';

export interface TopicDef { id: string; label: string; indicators: string[] }

export interface TopicCtx {
  /** Registros do período escolhido (antes de hoje). */
  compare: ApiRecord[];
  /** Registros de hoje. */
  today: ApiRecord[];
  /** Período + hoje, em ordem, para os gráficos. */
  chart: ApiRecord[];
  periodLabel: string;
  assessment: (indicator: string) => Assessment | undefined;
  series: (indicator: string, from?: ApiRecord[]) => ApiRecord[];
}

type Period = { mode: '7d' | 'custom'; from: string; to: string }; // datas YYYY-MM-DD
const isoDay = (ms: number) => new Date(ms - new Date(ms).getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const dayStart = (d: string) => new Date(d + 'T00:00:00').getTime();

export function TopicDetail({ areaId, topics, topic, onTopic, assessments, children }: {
  areaId: AreaId; topics: TopicDef[]; topic: string | null; onTopic: (t: string | null) => void;
  assessments: Assessment[]; children: (topic: string, ctx: TopicCtx) => ReactNode;
}) {
  const today0 = startOfToday();
  const [period, setPeriod] = useState<Period>({ mode: '7d', from: isoDay(today0 - 14 * DAY_MS), to: isoDay(today0 - DAY_MS) });
  const [records, setRecords] = useState<ApiRecord[] | null>(null);
  const version = useStore((s) => s.version);
  useEffect(() => { if (!topic) setPeriod((p) => ({ ...p, mode: '7d' })); }, [topic]);

  const range = period.mode === '7d' ? { from: today0 - 7 * DAY_MS, to: today0 } : { from: dayStart(period.from), to: dayStart(period.to) + DAY_MS };
  useEffect(() => {
    if (!topic) return;
    let live = true;
    api.history(areaId, new Date(Math.min(range.from, today0)), new Date(Date.now() + 60000))
      .then((h) => { if (live) setRecords(h.records); }).catch(() => { if (live) setRecords([]); });
    return () => { live = false; };
  }, [topic, areaId, range.from, range.to, version]);

  const ctx = useMemo<TopicCtx | null>(() => {
    if (!records) return null;
    const t = Date.parse;
    const compare = records.filter((r) => t(r.recordedAt) >= range.from && t(r.recordedAt) < Math.min(range.to, today0));
    const today = records.filter((r) => t(r.recordedAt) >= today0);
    const periodLabel = period.mode === '7d' ? 'last 7 days' : `${fmtDay(new Date(range.from).toISOString())} to ${fmtDay(new Date(range.to - 1).toISOString())}`;
    return { compare, today, chart: [...compare, ...today], periodLabel,
      assessment: (id) => assessments.find((a) => a.indicator === id),
      series: (id, from = [...compare, ...today]) => from.filter((r) => r.indicator === id) };
  }, [records, range.from, range.to, assessments, period.mode]);

  const def = topics.find((x) => x.id === topic);
  const flagged = def ? assessments.filter((a) => def.indicators.includes(a.indicator) && isFlagged(a.displayLevel)) : [];
  const unavailable = def ? assessments.filter((a) => def.indicators.includes(a.indicator) && a.displayLevel === 'unavailable' && a.status !== 'not_applicable') : [];
  const btn = (on: boolean) => `rounded-lg px-3 py-1.5 border ${on ? 'border-brand text-brand-soft bg-brand/10' : 'border-space-line text-slate-300'}`;

  return (
    <AnimatePresence>
      {topic && def && (
        <motion.div className="fixed inset-0 z-50 flex justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60" onClick={() => onTopic(null)} />
          <motion.aside initial={{ x: 60 }} animate={{ x: 0 }} exit={{ x: 60 }} transition={{ duration: 0.25 }}
            className="relative w-full max-w-3xl h-full bg-space-deep border-l border-space-line overflow-y-auto">
            <div className="sticky top-0 z-10 bg-space-deep/95 backdrop-blur border-b border-space-line px-6 pt-5 pb-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1">
                  {topics.map(({ id, label }) => (
                    <button key={id} onClick={() => onTopic(id)} className={`px-4 py-2 rounded-xl text-sm ${id === topic ? 'bg-space-card text-white border border-space-line' : 'text-slate-400 hover:text-slate-200'}`}>{label}</button>
                  ))}
                </div>
                <button onClick={() => onTopic(null)} className="text-slate-400 hover:text-white" aria-label="Close"><X /></button>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
                <span className="text-slate-400">Compare today with:</span>
                <button onClick={() => setPeriod({ ...period, mode: '7d' })} className={btn(period.mode === '7d')}>Last 7 days</button>
                <button onClick={() => setPeriod({ ...period, mode: 'custom' })} className={btn(period.mode === 'custom')}>Choose period</button>
                {period.mode === 'custom' && (
                  <span className="inline-flex flex-wrap items-center gap-2">
                    {[14, 30].map((n) => (
                      <button key={n} onClick={() => setPeriod({ mode: 'custom', from: isoDay(today0 - n * DAY_MS), to: isoDay(today0 - DAY_MS) })} className="rounded-lg px-2 py-1 border border-space-line text-slate-300 hover:border-slate-500">{n} days</button>
                    ))}
                    <label className="text-slate-400">From <input type="date" value={period.from} max={period.to} onChange={(e) => e.target.value && setPeriod({ ...period, from: e.target.value })} className="bg-space-card border border-space-line rounded-md px-1.5 py-1 text-slate-200" /></label>
                    <label className="text-slate-400">To <input type="date" value={period.to} min={period.from} max={isoDay(today0)} onChange={(e) => e.target.value && setPeriod({ ...period, to: e.target.value })} className="bg-space-card border border-space-line rounded-md px-1.5 py-1 text-slate-200" /></label>
                  </span>
                )}
              </div>
            </div>

            <div className="px-6 pb-10">
              {flagged.length > 0 && (
                <Section title="What to do">
                  <ul className="space-y-2">
                    {flagged.map((a) => (
                      <li key={a.indicator + (a.recordedAt ?? '')} className="rounded-xl border border-space-line bg-white/[0.03] p-3 text-sm text-slate-200">
                        <div className="mb-1 flex items-center gap-2"><StatusPill level={a.displayLevel} small /><span className="text-xs text-slate-400">{info(a.indicator).label}</span></div>
                        {a.message}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
              {unavailable.length > 0 && (
                <ul className="mt-4 space-y-1">
                  {unavailable.map((a) => <li key={a.indicator} className="text-xs text-slate-400 flex items-center gap-2"><StatusPill level="unavailable" small />{info(a.indicator).label}: {a.message}</li>)}
                </ul>
              )}
              {ctx ? children(topic, ctx) : <p className="mt-6 text-sm text-slate-400">Loading…</p>}
              <More title="Why measure this? · Sources"><WhyBlock ids={def.indicators} /></More>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export interface Cmp { label: string; today: string; avg: string; diff: string; level?: DisplayLevel; note?: string }

/** Linha "hoje vs período" (do protótipo). O nível de cada item vem da avaliação da API. */
export function CompareRow({ items, periodLabel }: { items: Cmp[]; periodLabel: string }) {
  return (
    <Section title={`Today vs ${periodLabel}`}>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
        {items.map((c) => (
          <div key={c.label} className="rounded-xl border border-space-line bg-space-card p-4">
            <span className="text-xs text-slate-400">{c.label}</span>
            <div className="flex items-center justify-between gap-2 mt-1"><p className="text-2xl font-semibold">{c.today}</p>{c.level && <StatusPill level={c.level} small />}</div>
            <p className="text-xs text-slate-400 mt-1"><span className="font-mono text-slate-200">{c.diff}</span> vs {periodLabel} <span className="text-slate-500">(avg {c.avg})</span></p>
            {c.note && <p className="text-xs text-slate-500 mt-1">{c.note}</p>}
          </div>
        ))}
      </div>
    </Section>
  );
}

/** Monta um item de comparação: último valor do indicador vs média do período. */
export function compareItem(ctx: TopicCtx, indicator: string, label: string, fmt: (v: number) => string, kind: 'hours' | 'number' | 'ms' = 'number', map: (v: number) => number = (v) => v): Cmp {
  const all = ctx.series(indicator);
  const last = all.at(-1);
  const prev = ctx.series(indicator, ctx.compare).filter((r) => r !== last).map((r) => map(Number(r.value)));
  const today = last ? map(Number(last.value)) : NaN; const avg = mean(prev);
  return { label, today: last ? fmt(today) : '—', avg: prev.length ? fmt(avg) : '—', diff: deltaText(today, avg, kind),
    level: ctx.assessment(indicator)?.displayLevel, note: !prev.length ? 'No other value in this period.' : undefined };
}
