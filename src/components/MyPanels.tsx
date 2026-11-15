// "My panels" da Overview: até 10 indicadores escolhidos pela pessoa, mais graves primeiro.
// Lista disponível = catálogo de cada área (indicatorDefinitions do /areas/:id) + indicadores que a API avalia
// sem estar no catálogo (ex.: dose de carreira, NEWS2). Valor, unidade e nível vêm da API; seta = compare.ts.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownRight, ArrowRight, ArrowUpRight, ChevronRight, LayoutGrid, SlidersHorizontal } from 'lucide-react';
import { api, type ApiRecord, type AreaDetail, type Assessment, type DisplayLevel } from '../services/api';
import { AREA, type AreaId } from '../config/api';
import { useStore } from '../store/useStore';
import { AREA_LABEL, AREA_PATH, info } from '../lib/content';
import { DAY_MS, deltaText, fmtDuration, fmtHours, startOfToday } from '../lib/format';
import { weekCompare, type WeekCompare } from '../lib/compare';
import { DEFAULT_PANELS, MAX_PANELS, clearPanels, loadPanels, panelId, savePanels, sortPanels, togglePanel } from '../lib/panels';
import { Modal, StatusPill } from './ui';
import { groups } from '../../shared/config/research.js';

/** Sinais vitais ficam no cartão de sinais vitais da página Gravity (não em um tópico). */
const VITALS = new Set<string>((groups as any).gravity_fields.vital_signs);

const AREAS: AreaId[] = [AREA.isolation, AREA.gravity, AREA.cabin, AREA.radiation, AREA.distance];

interface Available { id: string; areaId: AreaId; indicator: string; label: string; unit: string | null; scaleMax?: number }
interface Panel extends Available { value: unknown; shown: string | null; level: DisplayLevel | null; week: WeekCompare | null; kind: 'hours' | 'number' }

/** Indicadores disponíveis por área: catálogo (sem os legados) + avaliados fora do catálogo. */
function available(details: Partial<Record<AreaId, AreaDetail>>): Available[] {
  return AREAS.flatMap((areaId) => {
    const d = details[areaId]; if (!d) return [];
    const defs = d.indicatorDefinitions.filter((x: any) => !x.deprecated);
    const ids = new Set(defs.map((x: any) => x.id));
    const extra = [...new Set(d.assessments.map((a) => a.indicator))].filter((i) => !ids.has(i));
    return [
      ...defs.map((x: any): Available => ({ id: panelId(areaId, x.id), areaId, indicator: x.id, label: x.label ?? info(x.id).label, unit: x.displayUnit ?? x.unit ?? null, scaleMax: x.scale?.max })),
      ...extra.map((i): Available => { const a = d.assessments.find((x) => x.indicator === i); return { id: panelId(areaId, i), areaId, indicator: i, label: info(i).label, unit: typeof a?.unit === 'string' ? a.unit : null }; }),
    ];
  });
}

const newest = (xs: Assessment[], indicator: string) => xs.filter((x) => x.indicator === indicator)
  .reduce<Assessment | undefined>((top, x) => !top || (Date.parse(x.recordedAt ?? '') || 0) > (Date.parse(top.recordedAt ?? '') || 0) ? x : top, undefined);

const num = (v: number) => (Number.isInteger(v) ? String(v) : Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2));

/** Texto do valor como a API devolveu: número com unidade, sim/não para escalas 0–1, texto ou lista. Ausente = null. */
function show(v: unknown, unit: string | null, scaleMax?: number): string | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return null;
    if (unit === 'h') return fmtHours(v);
    if (unit === 's') return fmtDuration(v);
    if (scaleMax === 1 && !unit) return v ? 'Yes' : 'No';
    return unit && unit !== 'count' ? `${num(v)} ${unit}` : num(v);
  }
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.length ? `${v.length} reported` : 'None';
  if (typeof v === 'object') {
    const parts = Object.values(v as Record<string, unknown>).filter((x): x is number => typeof x === 'number').map(num);
    return parts.length ? parts.join(' · ') : null;
  }
  return null;
}

export function MyPanels() {
  const details = useStore((s) => s.details);
  const loadArea = useStore((s) => s.loadArea);
  const version = useStore((s) => s.version);
  const nav = useNavigate();
  const [chosen, setChosen] = useState<string[]>(() => loadPanels());
  const [open, setOpen] = useState(false);
  const [week, setWeek] = useState<ApiRecord[]>([]);

  useEffect(() => { AREAS.forEach((id) => loadArea(id).catch(() => undefined)); }, []);
  useEffect(() => {
    let live = true;
    const from = new Date(startOfToday() - 7 * DAY_MS); const to = new Date(Date.now() + 60000);
    Promise.all(AREAS.map((id) => api.history(id, from, to).then((h) => h.records).catch(() => [] as ApiRecord[])))
      .then((all) => { if (live) setWeek(all.flat()); });
    return () => { live = false; };
  }, [version]);

  const list = useMemo(() => available(details), [details]);
  const panels = useMemo(() => {
    const today0 = startOfToday();
    const made = chosen.map((id) => list.find((x) => x.id === id)).filter((x): x is Available => !!x).map((x): Panel => {
      const d = details[x.areaId];
      const a = d ? newest(d.assessments, x.indicator) : undefined;
      const rec = d?.latestRecords.find((r) => r.indicator === x.indicator);
      const value = rec?.value ?? a?.value ?? a?.observedValue;
      const shown = show(value, x.unit, x.scaleMax);
      // Sem valor: "–" com Unavailable. Com valor, o nível é o da avaliação da API (null = a API não avalia esse indicador).
      const level: DisplayLevel | null = shown === null ? 'unavailable' : a?.displayLevel ?? null;
      const kind = x.unit === 'h' ? 'hours' : 'number';
      return { ...x, value, shown, level, kind, week: x.scaleMax === 1 && !x.unit ? null : weekCompare(value, week, x.indicator, today0) };
    });
    return sortPanels(made, chosen);
  }, [chosen, list, details, week]);

  const openPanel = (p: Panel) => nav(AREA_PATH[p.areaId], { state: { topicFor: p.indicator, ...(p.areaId === AREA.gravity && VITALS.has(p.indicator) ? { focus: 'vitals' } : {}) } });

  return (
    <section aria-labelledby="panels-title" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="panels-title" className="text-sm font-semibold inline-flex items-center gap-2"><LayoutGrid size={18} className="text-slate-300" aria-hidden="true" />My panels</h2>
          <p className="text-xs text-slate-300 mt-0.5">Most important first · arrow compares with the last 7 days</p>
        </div>
        <button type="button" className="btn-ghost tap" onClick={() => setOpen(true)} aria-haspopup="dialog"><SlidersHorizontal size={16} aria-hidden="true" />Customize</button>
      </div>
      {panels.length === 0 ? (
        <p className="card !p-5 text-sm text-slate-300">No panels chosen. Use Customize to add up to {MAX_PANELS}.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {panels.map((p) => <li key={p.id}><PanelCard p={p} onOpen={() => openPanel(p)} /></li>)}
        </ul>
      )}
      <Customize open={open} onClose={() => setOpen(false)} list={list} chosen={chosen}
        onSave={(next) => { setChosen(next); if (next.join() === DEFAULT_PANELS.join()) clearPanels(); else savePanels(next); setOpen(false); }} />
    </section>
  );
}

function Arrow({ p }: { p: Panel }) {
  const w = p.week;
  if (!w) return <span className="text-xs text-slate-400">No 7-day average yet</span>;
  const Icon = w.direction === 'up' ? ArrowUpRight : w.direction === 'down' ? ArrowDownRight : ArrowRight;
  const word = w.direction === 'up' ? 'Higher than' : w.direction === 'down' ? 'Lower than' : 'Same as';
  const avg = show(w.avg, p.unit, p.scaleMax) ?? '–';
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-300">
      <Icon size={14} aria-hidden="true" className="text-slate-200" />
      <span className="sr-only">{word} the 7-day average ({avg}):</span>
      <span className="font-mono text-slate-200">{deltaText(p.value as number, w.avg, p.kind)}</span>
      <span aria-hidden="true">vs 7-day avg</span>
    </span>
  );
}

function PanelCard({ p, onOpen }: { p: Panel; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="card !p-4 w-full h-full text-left flex flex-col gap-2 hover:border-slate-500">
      <span className="flex items-start justify-between gap-2">
        <span className="text-sm text-slate-200 leading-snug">{p.label}<span className="sr-only"> · {AREA_LABEL[p.areaId]}</span></span>
        <ChevronRight size={15} className="text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
      </span>
      <span className="text-2xl font-medium tracking-tight text-slate-50 line-clamp-2 break-words">{p.shown ?? '–'}</span>
      <span className="flex flex-wrap items-center gap-2">
        {p.level ? <StatusPill level={p.level} small /> : <span className="rounded-full border border-space-line px-1.5 py-0.5 text-xs text-slate-300">Not assessed</span>}
      </span>
      {p.shown !== null && <Arrow p={p} />}
    </button>
  );
}

function Customize({ open, onClose, list, chosen, onSave }: {
  open: boolean; onClose: () => void; list: Available[]; chosen: string[]; onSave: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState(chosen);
  useEffect(() => { if (open) setDraft(chosen); }, [open]);
  const full = draft.length >= MAX_PANELS;
  return (
    <Modal open={open} onClose={onClose} title="Customize my panels" sub={`Choose up to ${MAX_PANELS} indicators from the onboard catalog`} wide>
      <p className="text-sm text-slate-200" aria-live="polite"><span className="font-mono">{draft.length}/{MAX_PANELS}</span> selected{full ? ' · limit reached' : ''}</p>
      <div className="mt-3 max-h-[55vh] overflow-y-auto pr-1 space-y-4">
        {AREAS.map((areaId, gi) => {
          const items = list.filter((x) => x.areaId === areaId);
          if (!items.length) return null;
          return (
            <fieldset key={areaId}>
              <legend className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">{AREA_LABEL[areaId]}</legend>
              <div className="grid sm:grid-cols-2 gap-1.5">
                {items.map((x, i) => {
                  const on = draft.includes(x.id); const disabled = !on && full;
                  return (
                    <label key={x.id} className={`tap flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${on ? 'border-brand/60 bg-brand/10 text-slate-50' : 'border-space-line text-slate-200'} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input type="checkbox" className="accent-brand w-4 h-4" checked={on} disabled={disabled} onChange={() => setDraft(togglePanel(draft, x.id))}
                        {...(gi === 0 && i === 0 ? { 'data-autofocus': true } : {})} />
                      <span>{x.label}{x.unit && x.unit !== 'count' ? <span className="text-slate-300"> · {x.unit}</span> : null}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <button type="button" className="btn-ghost tap" onClick={() => setDraft([...DEFAULT_PANELS])}>Reset to default</button>
        <span className="flex gap-2">
          <button type="button" className="btn-ghost tap" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary tap" onClick={() => onSave(draft)}>Save</button>
        </span>
      </div>
    </Modal>
  );
}
