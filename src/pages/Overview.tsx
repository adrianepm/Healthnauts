// Overview: resumo do dia de todas as áreas, sinais vitais ao vivo e a rotina com bolinha vermelha.
import { Link } from 'react-router-dom';
import { ChevronRight, ListChecks } from 'lucide-react';
import { useStore } from '../store/useStore';
import { TodayHero, type AlsoItem } from '../components/lean/Home';
import { VitalsCard } from '../components/VitalsCard';
import { RoutineList } from '../components/Notifications';
import { Card, StatusPill } from '../components/ui';
import { AREA_LABEL, AREA_PATH, info } from '../lib/content';
import { isFlagged } from '../lib/levels';
import { ago } from '../lib/format';

export default function Overview() {
  const o = useStore((s) => s.overview);
  if (!o) return null;
  const also: AlsoItem[] = o.areas.filter((a) => isFlagged(a.displayLevel) && a.headline.indicator !== o.headline.indicator)
    .map((a) => ({ label: AREA_LABEL[a.areaId], level: a.displayLevel, message: a.headline.message ?? '' }));
  if (isFlagged(o.vitalSigns.displayLevel) && o.headline.indicator !== 'news2') also.unshift({ label: 'Vital signs', level: o.vitalSigns.displayLevel, message: o.vitalSigns.message ?? '' });

  return (
    <div className="space-y-5">
      <h1 className="text-sm text-slate-400">Overview · all areas</h1>
      <TodayHero level={o.overallDisplayLevel} message={o.headline.message ?? ''} sub={o.headline.indicator ? info(o.headline.indicator).label : undefined} also={also} />
      <div className="grid lg:grid-cols-[2fr_1fr] gap-5">
        <VitalsCard />
        <Card title="Today's routine" sub="Pending items have a red dot" icon={<ListChecks size={18} />}><RoutineList /></Card>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {o.areas.map((a) => (
          <Link key={a.areaId} to={AREA_PATH[a.areaId]} className="card !p-4 hover:border-slate-500 transition-colors flex flex-col gap-2">
            <div className="flex items-center justify-between"><span className="text-sm font-semibold">{AREA_LABEL[a.areaId]}</span><ChevronRight size={15} className="text-slate-500" /></div>
            <StatusPill level={a.displayLevel} />
            <p className="text-xs text-slate-300 line-clamp-3">{a.headline.message}</p>
            <p className="text-xs text-slate-500 mt-auto">{a.summary} · last data {ago(a.lastRecordedAt)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
