// Overview, nesta ordem: resumo do dia (TodayHero compacto), barra da rotina, corpo clicável à esquerda e
// "My panels" à direita, e os cartões de Radiation, Environment e Distance. Nada aqui decide nível.
// Os cartões de área só mostram o valor principal quando ele não está em "My panels" (sem informação repetida).
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useSim } from '../components/DemoPanel';
import { TodayHero } from '../components/lean/Home';
import { BodyMap } from '../components/scene/BodyMap';
import { RoutineBar } from '../components/TodayRoutine';
import { MyPanels, useAllAreas } from '../components/MyPanels';
import { StatusPill } from '../components/ui';
import { MagicCard } from '../components/magic/magic-card';
import { indicatorHref, sceneState, todaySummary } from '../components/scene/sceneMapping';
import { AREA } from '../config/api';
import { AREA_LABEL, AREA_PATH, info } from '../lib/content';
import { ago, fmtDuration } from '../lib/format';
import { DEFAULT_PANELS, clearPanels, loadPanels, panelId, savePanels } from '../lib/panels';
import type { AreaSummary } from '../services/api';

const num = (v: unknown, digits: number) => (typeof v === 'number' && Number.isFinite(v) ? v.toFixed(digits) : null);

export default function Overview() {
  const o = useStore((s) => s.overview);
  const reports = useStore((s) => s.ground?.reports);
  const details = useAllAreas();
  const sim = useSim();
  const [chosen, setChosen] = useState<string[]>(() => loadPanels());
  const choose = (next: string[]) => { setChosen(next); if (next.join() === DEFAULT_PANELS.join()) clearPanels(); else savePanels(next); };
  if (!o) return null;

  const m = sim.lastVitals?.measurements;
  const scene = sceneState({ overview: o, reports, now: Date.now(),
    live: m ? { heartRate: Number(m.heart_rate.value), respiratoryRate: Number(m.respiratory_rate.value) } : null });
  const today = todaySummary(o, (id) => AREA_LABEL[id] ?? id);

  const find = (id: string, indicator: string) => details[id as keyof typeof details]?.assessments.find((x) => x.indicator === indicator);
  const career = find(AREA.radiation, 'career_effective_dose');
  const co2 = find(AREA.cabin, 'co2_partial_pressure');
  const link = o.link;
  const delay = link.status === 'unavailable' ? 'No link' : link.oneWaySeconds == null ? null : fmtDuration(link.oneWaySeconds);
  const area = (id: string) => o.areas.find((a) => a.areaId === id);
  const cards: { id: string; indicator: string; title: string; value: string | null; unit?: string; sub: string }[] = [
    { id: AREA.radiation, indicator: 'career_effective_dose', title: 'Career dose', value: num(career?.percentOfLimit, 1), unit: '% of limit', sub: career?.value !== undefined ? `${career.value} mSv` : '' },
    { id: AREA.cabin, indicator: 'co2_partial_pressure', title: 'CO₂ · 1 h avg', value: num(co2?.value, 2), unit: 'mmHg', sub: '' },
    { id: AREA.distance, indicator: 'communication_delay', title: 'One-way delay', value: delay, sub: link.destination ? `Mission: ${link.destination}` : '' },
  ];

  return (
    <div className="space-y-4">
      <h1 className="sr-only">Overview</h1>
      <TodayHero compact level={today.level} message={today.message} sub={today.indicator ? info(today.indicator).label : undefined}
        also={today.also.map((i) => ({ label: i.label, level: i.level, message: i.message }))} />
      <RoutineBar />
      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <BodyMap scene={scene} />
        <MyPanels chosen={chosen} onChange={choose} />
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {cards.map((c) => { const a = area(c.id); return a ? <AreaCard key={c.id} a={a} {...c} inPanels={chosen.includes(panelId(c.id, c.indicator))} /> : null; })}
      </div>
    </div>
  );
}

function AreaCard({ a, indicator, title, value, unit, sub, inPanels }: {
  a: AreaSummary; indicator: string; title: string; value: string | null; unit?: string; sub: string; inPanels: boolean;
}) {
  return (
    <MagicCard as={Link} to={indicatorHref(AREA_PATH[a.areaId], inPanels ? a.headline.indicator : indicator)} className="!p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{AREA_LABEL[a.areaId]}</span>
        <span className="flex items-center gap-2"><StatusPill level={a.displayLevel} small /><ChevronRight size={15} className="text-slate-400" aria-hidden="true" /></span>
      </div>
      {/* Valor principal só quando não está em My panels. */}
      {!inPanels && (<>
        <span className="text-xs text-slate-300">{title}</span>
        {value === null
          ? <span className="flex flex-wrap items-center gap-2"><span className="text-2xl font-medium">–</span><StatusPill level="unavailable" small /></span>
          : <span className="text-2xl font-medium tracking-tight text-slate-50">{value}{unit && <span className="text-sm text-slate-400"> {unit}</span>}</span>}
        {sub && <span className="text-xs text-slate-300">{sub}</span>}
      </>)}
      <p className="text-xs text-slate-300 line-clamp-2">{a.headline.message}</p>
      <p className="text-xs text-slate-400 mt-auto">last data {ago(a.lastRecordedAt)}</p>
    </MagicCard>
  );
}
