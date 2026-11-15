// Astronaut Profile (3.8): referências pré-missão, faixas pessoais, lista "em observação" e histórico de alertas.
import { Award, History, ListChecks, User, Ruler } from 'lucide-react';
import { levelOfXp, useStore } from '../store/useStore';
import { AREA } from '../config/api';
import { Card, PageHeader, StatusPill } from '../components/ui';
import { AREA_LABEL, info } from '../lib/content';
import { fmtDateTime } from '../lib/format';
import { ASTRONAUT_ID } from '../config/api';

const ACK: Record<string, string> = { acknowledged: 'Acknowledged', pending: 'Pending', not_acknowledged: 'Not acknowledged', resolved_before_acknowledgement: 'Resolved first', not_required: '—' };
const fmtVal = (v: any, unit: any) => typeof v === 'number' ? `${Number(v.toFixed(2))}${typeof unit === 'string' ? ' ' + unit : ''}` : v && typeof v === 'object' ? Object.values(v).join(' / ') : '—';

export default function Profile() {
  const mission = useStore((s) => s.mission); const alerts = useStore((s) => s.alerts); const iso = useStore((s) => s.details[AREA.isolation]);
  const baselines = (iso?.assessments ?? []).filter((a) => a.baseline);
  const history = [...(alerts?.notifications ?? [])].sort((a, b) => Date.parse(b.shownAt) - Date.parse(a.shownAt));

  return (
    <div className="space-y-5">
      <PageHeader title="Profile" sub="Astronaut profile, personal ranges and alert history" />
      <XpCard />
      <Card title={`Astronaut ${ASTRONAUT_ID}`} sub={mission ? `Mission ${mission.input.destination} · started ${fmtDateTime(mission.input.startedAt)} · activity ${mission.input.activity}` : 'No mission context'} icon={<User size={18} />}>
        <PreFlight />
      </Card>

      <Card title="Personal ranges" sub="Mean ± 2 SD of the first 7 mission days (team proposal), SD floor of 5 points on 0-100 scales" icon={<Ruler size={18} />}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-left text-slate-300"><th className="py-1.5 font-medium">Parameter</th><th className="font-medium">Status</th><th className="font-medium text-right">Mean</th><th className="font-medium text-right">Range</th><th className="font-medium text-right">Samples</th></tr></thead>
            <tbody>{baselines.map((a) => { const b = a.baseline!; return (
              <tr key={a.indicator} className="border-t border-space-line text-slate-200">
                <td className="py-1.5">{info(a.indicator).label}</td><td>{b.status === 'ready' ? 'Ready' : b.status === 'collecting' ? 'Collecting' : 'Insufficient'}</td>
                <td className="font-mono text-right">{typeof b.mean === 'number' ? b.mean.toFixed(2) : '—'}</td><td className="font-mono text-right whitespace-nowrap">{b.status === 'ready' ? `${b.lower!.toFixed(2)} – ${b.upper!.toFixed(2)}` : '—'}</td><td className="font-mono text-right">{b.sampleCount ?? '—'}</td>
              </tr>); })}</tbody>
          </table>
        </div>
      </Card>

      <Card title="In observation" sub="Parameters that reached Caution or above" icon={<ListChecks size={18} />}>
        {!(alerts?.inObservation.length) ? <p className="text-sm text-slate-400">Nothing in observation.</p> : (
          <ul className="space-y-2">{alerts!.inObservation.map((o: any) => (
            <li key={o.id} className="flex flex-wrap items-center gap-2 text-sm"><StatusPill level={o.displayLevel ?? o.level} small /><span>{AREA_LABEL[o.areaId]} · {info(o.indicator).label}</span><span className="text-xs text-slate-300">since <span className="font-mono">{fmtDateTime(o.since)}</span></span></li>
          ))}</ul>
        )}
      </Card>

      <Card title="Alert history" sub="Caution or above · acknowledgement status from the onboard service" icon={<History size={18} />}>
        {!history.length ? <p className="text-sm text-slate-400">No alerts yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-slate-300"><th className="py-1.5 font-medium">Shown</th><th>Level</th><th>Parameter</th><th>Value</th><th>Message</th><th>Acknowledgement</th><th>Status</th></tr></thead>
              <tbody>{history.map((a) => (
                <tr key={a.id} className="border-t border-space-line text-slate-200 align-top">
                  <td className="py-1.5 pr-3 whitespace-nowrap font-mono">{fmtDateTime(a.shownAt)}</td><td><StatusPill level={a.peakLevel} small /></td>
                  <td>{info(a.indicator).label}</td><td className="whitespace-nowrap font-mono">{fmtVal(a.value, a.unit)}</td><td className="min-w-[16rem]">{a.message}</td>
                  <td className="whitespace-nowrap">{ACK[a.acknowledgementStatus]}{a.acknowledgedAt ? ` · ${fmtDateTime(a.acknowledgedAt)}` : ''}</td>
                  <td className="whitespace-nowrap">{a.active ? 'Active' : `Resolved ${fmtDateTime(a.resolvedAt)}`}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function PreFlight() {
  const refs = useStore((s) => s.missionRefs);
  if (!refs?.length) return <p className="text-sm text-slate-400">No pre-flight references recorded.</p>;
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      {refs.map((r: any) => (
        <div key={r.id} className="rounded-md border border-space-line bg-space-card2 px-3 py-2.5">
          <p className="text-xs text-slate-300">Pre-flight · {info(r.input.indicator).label.replace(/ \(.*\)/, '')}</p>
          <p className="text-xl font-medium mt-0.5"><span className="font-mono">{r.input.value}</span><span className="text-sm font-normal text-slate-300 ml-1">{r.input.unit}</span></p>
          <p className="text-xs text-slate-500">{r.input.method} · {fmtDateTime(r.input.recordedAt)}</p>
        </div>
      ))}
    </div>
  );
}

/** Nível e XP da rotina (gamificação), fora do cabeçalho para não competir com o estado de saúde. */
function XpCard() {
  const xp = useStore((s) => s.ui.xp);
  return (
    <section className="card !py-3 flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Routine progress">
      <span className="inline-flex items-center gap-2 text-sm font-medium"><Award size={18} aria-hidden="true" className="text-brand-soft" />Routine level <span className="font-mono">{levelOfXp(xp)}</span></span>
      <span className="flex-1 min-w-[8rem] h-1.5 rounded-full bg-space-card2 overflow-hidden" role="progressbar" aria-label="XP to the next level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={xp % 100}>
        <span className="block h-full bg-brand" style={{ width: `${xp % 100}%` }} />
      </span>
      <span className="text-sm text-slate-300"><span className="font-mono text-slate-100">{xp}</span> XP · earned by morning check-ins and reaction checks</span>
    </section>
  );
}
