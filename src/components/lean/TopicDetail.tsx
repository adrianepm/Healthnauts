// Detalhe por tópico (do protótipo), genérico para todas as telas.
// Compara hoje com os últimos 7 dias (padrão) ou com um período escolhido; o período chama /history?from&to.
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { api, type ApiRecord, type Assessment, type DisplayLevel } from '../../services/api';
import type { AreaId } from '../../config/api';
import { DAY_MS, deltaText, fmtDay, mean, startOfToday } from '../../lib/format';
import { isFlagged } from '../../lib/levels';
import { info } from '../../lib/content';
import { More, Section, StatusPill, WhyBlock } from '../ui';
import { useStore } from '../../store/useStore';

/** `also`: outros indicadores mostrados no tópico (só para abrir o tópico certo a partir de ?indicator=). */
export interface TopicDef { id: string; label: string; indicators: string[]; also?: string[] }

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

/** Indicador pedido na URL (?indicator=<id>), vindo de "My panels" ou do corpo na Overview. */
export const useIndicatorParam = () => useSearchParams()[0].get('indicator');

const topicFor = (topics: TopicDef[], id: string | null) => (id ? topics.find((t) => t.indicators.includes(id) || t.also?.includes(id))?.id ?? null : null);

/** Tópico aberto na página. Com ?indicator=<id>, abre o tópico que mostra esse indicador (useIndicatorFocus rola até ele). */
export function useTopicState(topics: TopicDef[]) {
  const wanted = useIndicatorParam();
  const loc = useLocation();
  const [topic, setTopic] = useState<string | null>(() => topicFor(topics, wanted));
  useEffect(() => { const t = topicFor(topics, wanted); if (t) setTopic(t); }, [loc.key]);
  return [topic, setTopic] as const;
}

/**
 * Rola até o parâmetro pedido em ?indicator=<id> e põe o foco nele (marcado com data-indicator).
 * Prefere o que está no painel do tópico aberto; espera os dados carregarem (até 4 s). Fica no AppShell.
 */
export function useIndicatorFocus() {
  const wanted = useIndicatorParam();
  const loc = useLocation();
  useEffect(() => {
    if (!wanted) return;
    const sel = `[data-indicator~="${CSS.escape(wanted)}"]`;
    const until = Date.now() + 4000;
    let raf = 0;
    const find = () => {
      const panel = document.querySelector('[data-topic-panel]');
      // No painel: o gráfico (section) antes do cartão de comparação.
      const el = panel ? (panel.querySelector(`section${sel}`) ?? panel.querySelector(sel)) : document.querySelector(sel);
      if (el instanceof HTMLElement) {
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
        el.focus({ preventScroll: true });
        el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        el.classList.add('indicator-focus');
        window.setTimeout(() => el.classList.remove('indicator-focus'), 2500);
        return;
      }
      if (Date.now() < until) raf = requestAnimationFrame(find);
    };
    raf = requestAnimationFrame(find);
    return () => cancelAnimationFrame(raf);
  }, [wanted, loc.key]);
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
  // Esc fecha o detalhe.
  useEffect(() => {
    if (!topic) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onTopic(null); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [topic]);

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
            data-topic-panel className="relative w-full max-w-3xl h-full bg-space-bg border-l border-space-line overflow-y-auto overscroll-contain" role="dialog" aria-modal="true" aria-label={`${def.label} detail`}>
            <div className="sticky top-0 z-10 bg-space-bg border-b border-space-line px-4 md:px-6 pt-4 pb-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1">
                  {topics.map(({ id, label }) => (
                    <button key={id} onClick={() => onTopic(id)} className={`px-4 py-2 rounded-md text-sm ${id === topic ? 'bg-space-card2 text-slate-50 border border-space-strong' : 'text-slate-300 hover:text-slate-50 border border-transparent'}`}>{label}</button>
                  ))}
                </div>
                <button onClick={() => onTopic(null)} className="text-slate-300 hover:text-slate-50" aria-label="Close detail"><X aria-hidden="true" /></button>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
                <span className="text-slate-400">Compare today with:</span>
                <button onClick={() => setPeriod({ ...period, mode: '7d' })} className={btn(period.mode === '7d')}>Last 7 days</button>
                <button onClick={() => setPeriod({ ...period, mode: 'custom' })} className={btn(period.mode === 'custom')}>Choose period</button>
                {period.mode === 'custom' && (
                  <span className="inline-flex flex-wrap items-center gap-2">
                    {[14, 30].map((n) => (
                      <button key={n} onClick={() => setPeriod({ mode: 'custom', from: isoDay(today0 - n * DAY_MS), to: isoDay(today0 - DAY_MS) })} className="rounded-lg px-2 py-1 border border-space-line text-slate-300 hover:border-space-strong">{n} days</button>
                    ))}
                    <label className="text-slate-400">From <input type="date" value={period.from} max={period.to} onChange={(e) => e.target.value && setPeriod({ ...period, from: e.target.value })} className="field !w-auto !py-1 !px-2 ml-1" /></label>
                    <label className="text-slate-400">To <input type="date" value={period.to} min={period.from} max={isoDay(today0)} onChange={(e) => e.target.value && setPeriod({ ...period, to: e.target.value })} className="field !w-auto !py-1 !px-2 ml-1" /></label>
                  </span>
                )}
              </div>
            </div>

            <div className="px-4 md:px-6 pb-10">
              {flagged.length > 0 && (
                <Section title="What to do">
                  <ul className="space-y-2">
                    {flagged.map((a) => (
                      <li key={a.indicator + (a.recordedAt ?? '')} className="rounded-md border border-space-line bg-space-card2 p-3 text-sm text-slate-200">
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

export interface Cmp { label: string; today: string; avg: string; diff: string; level?: DisplayLevel; note?: string; indicator?: string }

/** Linha "hoje vs período" (do protótipo). O nível de cada item vem da avaliação da API. */
export function CompareRow({ items, periodLabel }: { items: Cmp[]; periodLabel: string }) {
  return (
    <Section title={`Today vs ${periodLabel}`}>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
        {items.map((c) => (
          <div key={c.label} data-indicator={c.indicator} className="rounded-md border border-space-line bg-space-card p-4">
            <span className="text-xs text-slate-400">{c.label}</span>
            <div className="flex items-center justify-between gap-2 mt-1"><p className="text-2xl font-medium font-mono">{c.today}</p>{c.level && <StatusPill level={c.level} small />}</div>
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
  return { label, indicator, today: last ? fmt(today) : '—', avg: prev.length ? fmt(avg) : '—', diff: deltaText(today, avg, kind),
    level: ctx.assessment(indicator)?.displayLevel, note: !prev.length ? 'No other value in this period.' : undefined };
}
