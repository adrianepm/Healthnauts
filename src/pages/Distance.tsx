// Distance from Earth: contexto da missão, atraso de comunicação e recursos a bordo.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Radio, SatelliteDish } from 'lucide-react';
import { AREA } from '../config/api';
import { useStore } from '../store/useStore';
import { useArea } from './useArea';
import { AreaActions } from '../components/AlertActions';
import { KeyTiles, TodayHero } from '../components/lean/Home';
import { Card, More, PageHeader, SourcesList, StatusPill, WhyBlock } from '../components/ui';
import { TickerValue } from '../components/magic/number-ticker';
import { DESTINATIONS } from '../lib/content';
import { fmtDuration } from '../lib/format';
import { setMissionDestination } from '../sim/link';

export default function Distance() {
  const d = useArea(AREA.distance);
  const link = useStore((s) => s.overview?.link); const mission = useStore((s) => s.mission); const ground = useStore((s) => s.ground);
  const refresh = useStore((s) => s.refresh);
  const [busy, setBusy] = useState(false);
  if (!d.ready || !link) return <p className="text-sm text-slate-400">Loading…</p>;
  const queued = ground?.reports.filter((r) => r.transmission.status === 'QUEUED').length ?? 0;
  const comm = d.a('communication_delay');
  const current = DESTINATIONS.find((x) => x.name === link.destination);
  // Seletor "Mission: ISS · Moon · Mars" (especificação 3.7): grava novo contexto pela operação de missão.
  const choose = async (x: (typeof DESTINATIONS)[number]) => {
    if (busy || x.name === link.destination) return;
    setBusy(true);
    try { await setMissionDestination(x.name, x.demoOneWaySeconds); await refresh(); } finally { setBusy(false); }
  };

  const off = link.status === 'unavailable';
  return (
    <div className="space-y-5">
      <PageHeader title="Distance" sub="Distance from Earth · communication and autonomy" />
      <TodayHero extra={<AreaActions areaId={AREA.distance} indicator={d.summary!.headline.indicator} level={d.summary!.displayLevel} />} level={d.summary!.displayLevel} label="Earth link" message={link.message ?? d.summary!.headline.message ?? ''} also={d.also(d.summary!.headline.indicator)} />

      {/* Linha nave → Terra com o tempo de luz de ida e a resposta esperada. */}
      <section className="card" data-indicator="communication_delay" aria-labelledby="link-title">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="link-title" className="card-title">One-way delay</h2>
            <p className="card-sub mt-0.5">Mission {link.destination ?? '—'}{current ? ` · range ${current.delay}` : ''}</p>
          </div>
          <StatusPill level={comm?.displayLevel ?? 'unavailable'} />
        </div>
        <p className="mt-4 text-5xl font-medium tracking-tight text-slate-50 leading-none">{off ? 'No link' : <TickerValue value={fmtDuration(link.oneWaySeconds)} />}</p>
        <div className="mt-6" role="img" aria-label={off ? 'No contact between the spacecraft and Earth' : `Signal takes ${fmtDuration(link.oneWaySeconds)} each way; expected reply in ${fmtDuration(link.estimatedResponseSeconds)}`}>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-100 shrink-0">{link.destination ?? 'Spacecraft'}</span>
            <div className="relative flex-1 h-6">
              <span className={`absolute inset-x-0 top-1/2 -translate-y-1/2 border-t ${off ? 'border-dashed border-space-strong' : 'border-slate-300'}`} />
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-slate-50" />
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-slate-50" />
              {!off && <span className="signal-dot absolute top-1/2 -translate-y-1/2 -ml-1 w-2 h-2 rounded-full bg-brand" aria-hidden="true" />}
            </div>
            <span className="text-sm font-medium text-slate-100 shrink-0">Earth</span>
          </div>
          <p className="mt-2 text-center text-xs text-slate-300">{off ? 'No contact: reports wait in the queue and the onboard procedure applies.' : <>Light time each way <span className="text-slate-100">{fmtDuration(link.oneWaySeconds)}</span> · reply expected in <span className="text-slate-100">{fmtDuration(link.estimatedResponseSeconds)}</span></>}</p>
        </div>
        <div role="group" aria-label="Mission" className="mt-5 pt-4 border-t border-space-line flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-300">Mission</span>
          {DESTINATIONS.map((x) => (
            <button key={x.name} type="button" disabled={busy} aria-pressed={x.name === link.destination} onClick={() => choose(x)}
              className={`btn-ghost !py-1.5 ${x.name === link.destination ? '!border-brand !text-brand-soft' : ''}`}>{x.name}</button>
          ))}
        </div>
        <p className="text-xs text-slate-300 mt-2">Simulated mission context. The demo uses one delay inside each range of the specification (ISS 0.3 s, Moon 10 s, Mars 8 min).</p>
      </section>

      <KeyTiles tiles={[
        { key: 'reply', title: 'Expected ground reply', icon: Radio, value: off ? '—' : fmtDuration(link.estimatedResponseSeconds), compare: '2 × delay + 15 min to review' },
        { key: 'queue', title: 'Reports waiting', icon: SatelliteDish, value: String(queued), compare: queued ? 'Queued until the link returns' : 'Nothing queued' },
        { key: 'kit', indicator: 'onboard_medical_resources', title: 'Onboard resources', icon: Package, value: <span className="block text-base font-normal leading-snug text-slate-100">{mission?.input.medicalResources ?? '—'}</span>, compare: 'Operational context, not a clinical measure' },
      ]} />
      <Card title="Destinations" sub="One-way delay and evacuation, section 3.7 of the specification">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-300 text-xs"><th className="py-1.5 font-medium">Destination</th><th className="font-medium">One-way delay</th><th className="font-medium">Evacuation</th></tr></thead>
            <tbody>{DESTINATIONS.map((x) => (
              <tr key={x.name} className={`border-t border-space-line ${x.name === link.destination ? 'text-slate-50 bg-space-card2' : 'text-slate-300'}`}><td className="py-2 pl-1 font-semibold">{x.name}{x.name === link.destination ? ' (current)' : ''}</td><td>{x.delay}</td><td>{x.evacuation}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <p className="text-xs text-slate-300 mt-3">Mars solar conjunction: about 2 weeks without contact every ~2 years. NASA needs medical decision support that works without contact with Earth; this module is a prototype of that.</p>
        <SourcesList ids={['s14', 's16', 's17']} />
      </Card>
      <Link to="/ground" className="btn-ghost w-fit"><SatelliteDish size={16} aria-hidden="true" />Open Ground Control</Link>
      <More title="Why measure this? · Sources"><WhyBlock ids={['communication_delay']} /></More>
    </div>
  );
}
