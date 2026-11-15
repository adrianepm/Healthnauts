// Ground Control (especificação 3.7): fila de relatórios para a Terra, simulada no mesmo navegador.
// Status, horários e a marca "not acknowledged" vêm de GET /ground-reports.
import { useState } from 'react';
import { Check, Radio, SatelliteDish, Send, WifiOff } from 'lucide-react';
import { useStore } from '../store/useStore';
import { api, type GroundReport } from '../services/api';
import { setEarthLink } from '../sim/link';
import { Card, StatusPill, SourcesList } from '../components/ui';
import { AREA_LABEL, info } from '../lib/content';
import { fmtDateTime, fmtDuration, fmtTime } from '../lib/format';
import { LEVEL_UI } from '../lib/levels';
import { NO_ACK_TEXT } from '../components/AlertBanner';

const STEPS = ['QUEUED', 'SENT', 'RECEIVED', 'REPLIED'] as const;

function Pipeline({ r }: { r: GroundReport }) {
  const t = r.transmission; const at = STEPS.indexOf(t.status);
  const when = [t.queuedAt, t.sentAt, t.receivedAt ?? t.expectedArrivalAt, t.repliedAt ?? t.expectedReplyAt];
  return (
    <ol className="grid grid-cols-4 gap-1 mt-3">
      {STEPS.map((s, i) => (
        <li key={s} className={`rounded-lg border px-2 py-1.5 text-[11px] ${i <= at ? 'border-sky-400/60 bg-sky-400/10 text-sky-200' : 'border-space-line text-slate-500'}`}>
          <span className="flex items-center gap-1 font-semibold">{i <= at && <Check size={11} />}{s}</span>
          <span className="block font-mono">{when[i] ? `${i > at ? 'exp. ' : ''}${fmtTime(when[i])}` : '—'}</span>
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
      <h1 className="text-sm text-slate-400">Ground Control · simulated in this browser</h1>
      <Card title="Earth link" sub="Simulation in the same browser: GitHub Pages does not send real telemetry between devices." icon={<SatelliteDish size={18} />}
        right={<button onClick={toggle} disabled={busy} className="btn-ghost text-xs">{link.status === 'unavailable' ? <><Radio size={13} />Restore link</> : <><WifiOff size={13} />No Earth link</>}</button>}>
        <div className="grid sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-space-line p-3"><p className="text-[11px] text-slate-400">Mission</p><p className="text-lg font-semibold">{link.destination ?? '—'}</p></div>
          <div className="rounded-xl border border-space-line p-3"><p className="text-[11px] text-slate-400">Link status</p><p className="text-lg font-semibold capitalize">{link.status}</p></div>
          <div className="rounded-xl border border-space-line p-3"><p className="text-[11px] text-slate-400">Current one-way delay</p><p className="text-lg font-semibold">{fmtDuration(link.oneWaySeconds)}</p></div>
          <div className="rounded-xl border border-space-line p-3"><p className="text-[11px] text-slate-400">Expected reply</p><p className="text-lg font-semibold">{link.status === 'unavailable' ? '—' : fmtDuration(link.estimatedResponseSeconds)}</p></div>
        </div>
        {link.message && <p className="mt-3 text-sm rounded-xl border p-3" style={{ color: LEVEL_UI.advisory.color, borderColor: LEVEL_UI.advisory.color + '55' }}>{link.message}</p>}
        <p className="text-[11px] text-slate-500 mt-2">Reply = sent + 2 × one-way delay + 15 min to review (team proposal).</p>
        <SourcesList ids={['s15', 's16']} />
      </Card>

      <Card title="Reports to the flight surgeon" sub="Warning and Emergency create a report automatically. Newest first." icon={<Send size={18} />}>
        {reports.length === 0 && <p className="text-sm text-slate-400">No reports yet.</p>}
        <ul className="space-y-3">
          {reports.map((r) => (
            <li key={r.id} className="rounded-xl border border-space-line p-4" style={r.level ? { borderColor: LEVEL_UI[r.level].color + '66' } : undefined}>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {r.level ? <StatusPill level={r.level} small /> : <span className="chip border-space-line text-slate-400">Manual</span>}
                {r.immediate && <span className="chip border-red-500/50 text-red-300">Immediate</span>}
                <span className="text-slate-400">Occurred {fmtDateTime(r.createdAt)} · {r.mission.destination ?? '—'}</span>
                <span className="font-mono text-slate-500">{r.id.slice(0, 14)}</span>
                {r.notAcknowledged && <span className="chip border-orange-500/60 text-orange-300">not acknowledged</span>}
              </div>
              <Pipeline r={r} />
              <p className="text-sm text-slate-200 mt-3">{r.transmission.reply ?? r.transmission.message}</p>
              {r.parameters.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {r.parameters.map((p) => (
                    <li key={p.alertId} className="text-xs text-slate-300 flex flex-wrap items-center gap-2">
                      <StatusPill level={p.level} small />{AREA_LABEL[p.areaId]} · {info(p.indicator).label}
                      <span className="text-slate-500">· measured {fmtTime(p.measuredAt)} · received {fmtTime(p.receivedAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
              {r.actions.length > 0 && <p className="text-xs text-slate-400 mt-2">Actions: {r.actions.map((a) => a.description).join(' · ')}</p>}
              {r.acknowledgement.status !== 'not_required' && (
                <p className="text-xs mt-2 text-slate-400">On board: <span className="text-slate-200">{ACK_TEXT[r.acknowledgement.status] ?? r.acknowledgement.status}</span>
                  {r.notAcknowledged && <> · {NO_ACK_TEXT}</>}</p>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Describe an action taken on board…" className="field flex-1 min-w-[12rem]" maxLength={2000} />
          <button onClick={manual} disabled={busy || !note.trim()} className="btn-primary">Send manual report</button>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">Reports carry only parameters at Caution or above. Mood and stress are never sent.</p>
      </Card>
    </div>
  );
}
