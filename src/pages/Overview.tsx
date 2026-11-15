// Overview: Orbital HUD (os 5 perigos do RIDGE em órbitas) ou Simple view (resumo do dia + cartões por área).
// A escolha fica no localStorage (try/catch). Com prefers-reduced-motion abre direto em Simple view, sem animações.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { ChevronRight, LayoutGrid, ListChecks, Orbit } from 'lucide-react';
import { useStore } from '../store/useStore';
import { TodayHero, type AlsoItem } from '../components/lean/Home';
import { VitalsCard } from '../components/VitalsCard';
import { RoutineList } from '../components/Notifications';
import { Card, StatusPill } from '../components/ui';
import { MagicCard } from '../components/magic/magic-card';
import { BentoGrid } from '../components/magic/bento-grid';
import { OrbitalHud } from '../components/scene/OrbitalHud';
import { AREA_LABEL, AREA_PATH, info } from '../lib/content';
import { isFlagged } from '../lib/levels';
import { ago } from '../lib/format';

// Bento das 5 áreas em 6 colunas: 2 + 2 + 2 na primeira linha, 3 + 3 na segunda.
const AREA_SPAN = ['lg:col-span-2', 'lg:col-span-2', 'lg:col-span-2 sm:col-span-2', 'lg:col-span-3', 'lg:col-span-3'];

const VIEW_KEY = 'healthnauts:overview-view';
type ViewMode = 'scene' | 'simple';

function readView(): ViewMode | null {
  try { const v = localStorage.getItem(VIEW_KEY); return v === 'scene' || v === 'simple' ? v : null; } catch { return null; }
}
function saveView(v: ViewMode) {
  try { localStorage.setItem(VIEW_KEY, v); } catch { /* modo privado: vale só nesta sessão */ }
}

export default function Overview() {
  const reduced = !!useReducedMotion();
  const [mode, setMode] = useState<ViewMode>(() => readView() ?? (reduced ? 'simple' : 'scene'));
  const toggle = () => { const next = mode === 'scene' ? 'simple' : 'scene'; setMode(next); saveView(next); };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-sm text-slate-300">Overview · {mode === 'scene' ? 'Orbital HUD' : 'all areas'}</h1>
        <button type="button" onClick={toggle} className="btn-ghost" aria-pressed={mode === 'simple'}>
          {mode === 'scene' ? <><LayoutGrid size={16} aria-hidden="true" />Simple view</> : <><Orbit size={16} aria-hidden="true" />HUD view</>}
        </button>
      </div>
      {mode === 'scene' ? <OrbitalHud reduced={reduced} /> : <SimpleOverview />}
    </div>
  );
}

/** Overview enxuta em bento: resumo do dia, sinais vitais ao vivo, rotina e um cartão por área. */
function SimpleOverview() {
  const o = useStore((s) => s.overview);
  if (!o) return null;
  const also: AlsoItem[] = o.areas.filter((a) => isFlagged(a.displayLevel) && a.headline.indicator !== o.headline.indicator)
    .map((a) => ({ label: AREA_LABEL[a.areaId], level: a.displayLevel, message: a.headline.message ?? '' }));
  if (isFlagged(o.vitalSigns.displayLevel) && o.headline.indicator !== 'news2') also.unshift({ label: 'Vital signs', level: o.vitalSigns.displayLevel, message: o.vitalSigns.message ?? '' });

  return (
    <div className="space-y-5">
      <TodayHero level={o.overallDisplayLevel} message={o.headline.message ?? ''} sub={o.headline.indicator ? info(o.headline.indicator).label : undefined} also={also} />
      <BentoGrid className="lg:grid-cols-6">
        <div className="sm:col-span-2 lg:col-span-4 [&>div]:h-full [&_section.card]:h-full"><VitalsCard /></div>
        <Card className="sm:col-span-2 lg:col-span-2" title="Today's routine" sub="Pending items have a red dot" icon={<ListChecks size={18} />}><RoutineList /></Card>
        {o.areas.map((a, i) => (
          <MagicCard as={Link} key={a.areaId} to={AREA_PATH[a.areaId]} className={`!p-4 flex flex-col gap-2 ${AREA_SPAN[i] ?? 'lg:col-span-2'}`}>
            <div className="flex items-center justify-between"><span className="text-sm font-semibold">{AREA_LABEL[a.areaId]}</span><ChevronRight size={15} className="text-slate-400" aria-hidden="true" /></div>
            <StatusPill level={a.displayLevel} />
            <p className="text-xs text-slate-300 line-clamp-2">{a.headline.message}</p>
            <p className="text-xs text-slate-400 mt-auto">last data {ago(a.lastRecordedAt)}</p>
          </MagicCard>
        ))}
      </BentoGrid>
    </div>
  );
}
