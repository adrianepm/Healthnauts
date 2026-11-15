// Ground Control (especificação 3.7): fila de relatórios para a Terra, simulada no mesmo navegador.
// Status, horários e a marca "not acknowledged" vêm de GET /ground-reports.
import { useState } from 'react';
import { Check, Radio, SatelliteDish, Send, WifiOff } from 'lucide-react';
import { useStore } from '../store/useStore';
import { api, type GroundReport } from '../services/api';
import { setEarthLink } from '../sim/link';
import { Card, PageHeader, StatusPill, SourcesList } from '../components/ui';
import { AREA_LABEL, info } from '../lib/content';
import { fmtDateTime, fmtDuration, fmtTime } from '../lib/format';
import { LEVEL_UI } from '../lib/levels';
import { NO_ACK_TEXT } from '../components/AlertBanner';
import { TickerValue } from '../components/magic/number-ticker';

const STEPS = ['QUEUED', 'SENT', 'RECEIVED', 'REPLIED'] as const;

/** Log do relatório: QUEUED → SENT → RECEIVED → REPLIED, com horário real ou esperado ("exp."). */
function Pipeline({ r }: { r: GroundReport }) {
  const t = r.transmission; const at = STEPS.indexOf(t.status);
  const when = [t.queuedAt, t.sentAt, t.receivedAt ?? t.expectedArrivalAt, t.repliedAt ?? t.expectedReplyAt];
  return (
    <ol className="relative grid grid-cols-4 mt-4" aria-label={`Transmission: ${t.status}`}>
      <span className="absolute left-[12.5%] right-[12.5%] top-3 h-px bg-space-strong" aria-hidden="true" />
      <span className="absolute left-[12.5%] top-3 h-px bg-slate-300" style={{ width: `${Math.max(0, at) * 25}%` }} aria-hidden="true" />
      {STEPS.map((s, i) => (
        <li key={s} className="relative flex flex-col items-center text-center gap-1">
          <span className={`z-10 grid place-items-center w-6 h-6 rounded-full border-2 ${i <= at ? 'border-slate-300 bg-slate-300 text-space-bg' : 'border-dashed border-space-strong bg-space-card'}`} aria-hidden="true">{i <= at && <Check size={13} strokeWidth={3} />}</span>
          <span className={`text-xs font-semibold ${i <= at ? 'text-slate-50' : 'text-slate-300'}`}>{s[0] + s.slice(1).toLowerCase()}<span className="sr-only">{i <= at ? ' (done)' : ' (pending)'}</span></span>
          <span className="text-xs font-mono text-slate-300">{when[i] ? `${i > at ? 'exp. ' : ''}${fmtTime(when[i])}` : '—'}</span>
        </li>
      ))}
    </ol>
  );
}

const ACK_TEXT: Record<string, string> = {
  acknowledged: 'Acknowledged on board', pending: 'Waiting for acknowledgement', not_acknowledged: 'Not acknowledged',
  resolved_before_acknowledgement: 'Resolved before acknowledgement', not_required: 'No acknowledgement required',
};

export default function GroundControl() {
  const ground = useStore((s) => s.ground); const refresh = useStore((s) => s.refresh);
  const [busy, setBusy] = useState(false); const [note, setNote] = useState('');
  if (!ground) return null;
  const { link, reports } = ground;
  const toggle = async () => { setBusy(true); try { await setEarthLink(link.status === 'unavailable'); await refresh(); } finally { setBusy(false); } };
  const manual = async () => {
    if (!note.trim()) return;
    setBusy(true);
    try { await api.groundReport([{ recordedAt: new Date().toISOString(), description: note.trim() }]); setNote(''); await refresh(); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Ground Control" sub="Reports to the flight surgeon on Earth · simulated in this browser" />
      <Card title="Earth link" sub="Simulation in the same browser: GitHub Pages does not send real telemetry between devices." icon={<SatelliteDish size={18} />}
        right={<button onClick={toggle} disabled={busy} className="btn-ghost text-xs">{link.status === 'unavailable' ? <><Radio size={14} aria-hidden="true" />Restore Earth link</> : <><WifiOff size={14} aria-hidden="true" />Simulate link loss</>}</button>}>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="rounded-md border border-space-line bg-space-card2 px-3 py-2.5"><dt className="text-xs text-slate-300">Mission</dt><dd className="text-lg font-semibold">{link.destination ?? "—"}</dd></div>
          <div className="rounded-md border border-space-line bg-space-card2 px-3 py-2.5"><dt className="text-xs text-slate-300">Link status</dt><dd className="text-lg font-semibold capitalize">{link.status}</dd></div>
          <div className="rounded-md border border-space-line bg-space-card2 px-3 py-2.5"><dt className="text-xs text-slate-300">One-way delay</dt><dd className="text-lg font-semibold">{link.status === "unavailable" ? "—" : <TickerValue value={fmtDuration(link.oneWaySeconds)} />}</dd></div>
          <div className="rounded-md border border-space-line bg-space-card2 px-3 py-2.5"><dt className="text-xs text-slate-300">Expected reply</dt><dd className="text-lg font-semibold">{link.status === "unavailable" ? "—" : <TickerValue value={fmtDuration(link.estimatedResponseSeconds)} />}</dd></div>
        </dl>
        {link.message && <p className="mt-3 text-sm rounded-md border border-space-line p-3 text-slate-100">{link.message}</p>}
        <p className="text-xs text-slate-300 mt-2">Reply = sent + 2 × one-way delay + 15 min to review (team proposal).</p>
        <SourcesList ids={['s15', 's16']} />
      </Card>

      <Card title="Reports to the flight surgeon" sub="Warning and Emergency create a report automatically. Newest first." icon={<Send size={18} />}>
        {reports.length === 0 && <p className="text-sm text-slate-300">No reports yet.</p>}
        <ul className="space-y-3">
          {reports.map((r) => (
            <li key={r.id} className="relative overflow-hidden rounded-md border border-space-line bg-space-card2/50 pl-5 pr-4 py-4">
              {r.level && <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: LEVEL_UI[r.level].color }} aria-hidden="true" />}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {r.level ? <StatusPill level={r.level} small /> : <span className="chip">Manual</span>}
                {r.immediate && <span className="chip text-slate-100">Immediate</span>}
                {r.notAcknowledged && <span className="chip font-semibold text-slate-50 border-slate-300">Not acknowledged</span>}
                <span className="text-slate-300">Occurred <span className="font-mono">{fmtDateTime(r.createdAt)}</span> · {r.mission.destination ?? '—'}</span>
                <span className="font-mono text-slate-300 ml-auto">{r.id.slice(0, 14)}</span>
              </div>
              <Pipeline r={r} />
              <p className="text-sm text-slate-100 mt-4">{r.transmission.reply ?? r.transmission.message}</p>
              {r.parameters.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {r.parameters.map((p) => (
                    <li key={p.alertId} className="text-xs text-slate-200 flex flex-wrap items-center gap-2">
                      <StatusPill level={p.level} small />{AREA_LABEL[p.areaId]} · {info(p.indicator).label}
                      <span className="text-slate-300">· measured <span className="font-mono">{fmtTime(p.measuredAt)}</span> · received <span className="font-mono">{fmtTime(p.receivedAt)}</span></span>
                    </li>
                  ))}
                </ul>
              )}
              {r.actions.length > 0 && <p className="text-xs text-slate-300 mt-2">Actions: {r.actions.map((a) => a.description).join(' · ')}</p>}
              {r.acknowledgement.status !== 'not_required' && (
                <p className="text-xs mt-2 text-slate-300">On board: <span className="text-slate-100">{ACK_TEXT[r.acknowledgement.status] ?? r.acknowledgement.status}</span>
                  {r.notAcknowledged && <> · {NO_ACK_TEXT}</>}</p>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-5 pt-4 border-t border-space-line">
          <label htmlFor="manual-report" className="text-sm font-medium text-slate-100">Manual report</label>
          <p id="manual-report-hint" className="text-xs text-slate-300">Describe an action taken on board. It goes to Earth with the next transmission.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <input id="manual-report" aria-describedby="manual-report-hint" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Crew moved to the shelter at 14:05" className="field flex-1 min-w-[12rem]" maxLength={2000} autoComplete="off" />
            <button onClick={manual} disabled={busy || !note.trim()} className="btn-primary">Send manual report</button>
          </div>
        </div>
        <p className="text-xs text-slate-300 mt-2">Reports carry only parameters at Caution or above. Mood and stress are never sent.</p>
      </Card>
    </div>
  );
}
