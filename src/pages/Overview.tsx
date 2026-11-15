// Overview: resumo do dia (TodayHero), corpo humano clicável (Isolation, sinais vitais, Gravity) e os cartões de
// Radiation, Environment e Distance com o valor principal que a API devolve. Nada aqui decide nível.
import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useSim } from '../components/DemoPanel';
import { TodayHero, type AlsoItem } from '../components/lean/Home';
import { BodyMap } from '../components/scene/BodyMap';
import { StatusPill } from '../components/ui';
import { MagicCard } from '../components/magic/magic-card';
import { sceneState } from '../components/scene/sceneMapping';
import { AREA } from '../config/api';
import { AREA_LABEL, AREA_PATH, info } from '../lib/content';
import { isFlagged } from '../lib/levels';
import { ago, fmtDuration } from '../lib/format';
import type { AreaSummary } from '../services/api';

const num = (v: unknown, digits: number) => (typeof v === 'number' && Number.isFinite(v) ? v.toFixed(digits) : null);

export default function Overview() {
  const o = useStore((s) => s.overview);
  const reports = useStore((s) => s.ground?.reports);
  const details = useStore((s) => s.details);
  const loadArea = useStore((s) => s.loadArea);
  const sim = useSim();
  // Radiation e Environment: o valor principal está no detalhe da área (o store passa a atualizá-lo no refresh).
  useEffect(() => { loadArea(AREA.radiation).catch(() => undefined); loadArea(AREA.cabin).catch(() => undefined); }, []);
  if (!o) return null;

  const m = sim.lastVitals?.measurements;
  const scene = sceneState({ overview: o, reports, now: Date.now(),
    live: m ? { heartRate: Number(m.heart_rate.value), respiratoryRate: Number(m.respiratory_rate.value) } : null });

  const also: AlsoItem[] = o.areas.filter((a) => isFlagged(a.displayLevel) && a.headline.indicator !== o.headline.indicator)
    .map((a) => ({ label: AREA_LABEL[a.areaId], level: a.displayLevel, message: a.headline.message ?? '' }));
  if (isFlagged(o.vitalSigns.displayLevel) && o.headline.indicator !== 'news2') also.unshift({ label: 'Vital signs', level: o.vitalSigns.displayLevel, message: o.vitalSigns.message ?? '' });

  const find = (id: string, indicator: string) => details[id as keyof typeof details]?.assessments.find((x) => x.indicator === indicator);
  const career = find(AREA.radiation, 'career_effective_dose');
  const co2 = find(AREA.cabin, 'co2_partial_pressure');
  const pct = num(career?.percentOfLimit, 1);
  const co2v = num(co2?.value, 2);
  const link = o.link;
  const delay = link.status === 'unavailable' ? 'No link' : link.oneWaySeconds == null ? null : fmtDuration(link.oneWaySeconds);

  const area = (id: string) => o.areas.find((a) => a.areaId === id);
  const cards: { id: string; title: string; value: string | null; unit?: string; sub: string }[] = [
    { id: AREA.radiation, title: 'Career dose', value: pct, unit: '% of limit', sub: career?.value !== undefined ? `${career.value} mSv` : '' },
    { id: AREA.cabin, title: 'CO₂ · 1 h avg', value: co2v, unit: 'mmHg', sub: '' },
    { id: AREA.distance, title: 'One-way delay', value: delay, sub: link.destination ? `Mission: ${link.destination}` : '' },
  ];

  return (
    <div className="space-y-5">
      <h1 className="sr-only">Overview</h1>
      <TodayHero level={o.overallDisplayLevel} message={o.headline.message ?? ''} sub={o.headline.indicator ? info(o.headline.indicator).label : undefined} also={also} />
      <div className="grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4 items-stretch">
        <BodyMap scene={scene} />
        <div className="grid gap-4">
          {cards.map((c) => { const a = area(c.id); return a ? <AreaCard key={c.id} a={a} {...c} /> : null; })}
        </div>
      </div>
    </div>
  );
}

function AreaCard({ a, title, value, unit, sub }: { a: AreaSummary; title: string; value: string | null; unit?: string; sub: string }) {
  let shown: ReactNode;
  if (value === null) shown = <span className="flex flex-wrap items-center gap-2"><span className="text-3xl font-medium">–</span><StatusPill level="unavailable" small /></span>;
  else shown = <span className="text-3xl font-medium tracking-tight text-slate-50">{value}{unit && <span className="text-base text-slate-400"> {unit}</span>}</span>;
  return (
    <MagicCard as={Link} to={AREA_PATH[a.areaId]} className="!p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{AREA_LABEL[a.areaId]}</span>
        <span className="flex items-center gap-2"><StatusPill level={a.displayLevel} small /><ChevronRight size={15} className="text-slate-400" aria-hidden="true" /></span>
      </div>
      <span className="text-xs text-slate-300">{title}</span>
      {shown}
      {sub && <span className="text-xs text-slate-300">{sub}</span>}
      <p className="text-xs text-slate-300 line-clamp-2">{a.headline.message}</p>
      <p className="text-xs text-slate-400 mt-auto">last data {ago(a.lastRecordedAt)}</p>
    </MagicCard>
  );
}
