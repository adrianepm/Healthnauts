// Distance from Earth: contexto da missão, atraso de comunicação e recursos a bordo.
import { Link } from 'react-router-dom';
import { Clock, Package, Radio, SatelliteDish } from 'lucide-react';
import { AREA } from '../config/api';
import { useStore } from '../store/useStore';
import { useArea } from './useArea';
import { KeyTiles, TodayHero } from '../components/lean/Home';
import { Card, More, SourcesList, WhyBlock } from '../components/ui';
import { DESTINATIONS } from '../lib/content';
import { fmtDuration } from '../lib/format';

export default function Distance() {
  const d = useArea(AREA.distance);
  const link = useStore((s) => s.overview?.link); const mission = useStore((s) => s.mission); const ground = useStore((s) => s.ground);
  if (!d.ready || !link) return <p className="text-sm text-slate-400">Loading…</p>;
  const queued = ground?.reports.filter((r) => r.transmission.status === 'QUEUED').length ?? 0;
  const comm = d.a('communication_delay');

  return (
    <div className="space-y-5">
      <h1 className="text-sm text-slate-400">Distance from Earth · communication and autonomy</h1>
      <TodayHero level={d.summary!.displayLevel} label="Earth link" message={link.message ?? d.summary!.headline.message ?? ''} also={d.also(d.summary!.headline.indicator)} />
      <KeyTiles tiles={[
        { key: 'delay', title: 'One-way delay', icon: Clock, value: link.status === 'unavailable' ? 'No link' : fmtDuration(link.oneWaySeconds), level: comm?.displayLevel ?? 'unavailable', compare: `Mission: ${link.destination ?? '—'} · ${link.status}` },
        { key: 'reply', title: 'Expected ground reply', icon: Radio, value: link.status === 'unavailable' ? '—' : fmtDuration(link.estimatedResponseSeconds), compare: '2 × delay + 15 min to review' },
        { key: 'queue', title: 'Reports waiting', icon: SatelliteDish, value: String(queued), compare: queued ? 'Queued until the link returns' : 'Nothing queued' },
        { key: 'kit', title: 'Onboard resources', icon: Package, value: <span className="text-base font-normal text-slate-200">{mission?.input.medicalResources ?? '—'}</span>, compare: 'Operational context, not a clinical measure' },
      ]} />
      <Card title="Destinations" sub="One-way delay and evacuation, section 3.7 of the specification">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-400 text-xs"><th className="py-1">Destination</th><th>One-way delay</th><th>Evacuation</th></tr></thead>
            <tbody>{DESTINATIONS.map((x) => (
              <tr key={x.name} className={`border-t border-space-line ${x.name === link.destination ? 'text-slate-50 bg-white/[0.04]' : 'text-slate-300'}`}><td className="py-2 font-semibold">{x.name}{x.name === link.destination ? ' (current)' : ''}</td><td>{x.delay}</td><td>{x.evacuation}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-2">Mars solar conjunction: about 2 weeks without contact every ~2 years. NASA needs medical decision support that works without contact with Earth; this module is a prototype of that.</p>
        <SourcesList ids={['s14', 's16', 's17']} />
      </Card>
      <Link to="/ground" className="btn-ghost w-fit"><SatelliteDish size={14} />Open Ground Control</Link>
      <More title="Why measure this? · Sources"><WhyBlock ids={['communication_delay']} /></More>
    </div>
  );
}
