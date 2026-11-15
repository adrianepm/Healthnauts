// Alertas ativos (Caution ou acima) no topo de todas as telas, com Acknowledge em Warning e Emergency (2.3).
// Tudo vem de GET /alerts: prazo, escalonamento e resolução são calculados pela API a cada consulta.
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Siren } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Alert } from '../services/api';
import { LEVEL_UI, severity } from '../lib/levels';
import { acknowledgement } from '../../shared/config/levels.js';
import { AREA_LABEL, info } from '../lib/content';
import { fmtTime } from '../lib/format';
import { StatusPill } from './ui';

/** Texto obrigatório da especificação 2.3. */
export const NO_ACK_TEXT = 'No acknowledgement does not mean loss of consciousness.';

function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}

const countdown = (iso: string | null, now: number) => {
  if (!iso) return '';
  const s = Math.round((Date.parse(iso) - now) / 1000);
  if (s <= 0) return 'deadline passed';
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} left`;
};

function AckStatus({ a, now }: { a: Alert; now: number }) {
  const ack = useStore((s) => s.acknowledge); const [busy, setBusy] = useState(false);
  if (!a.requiresAcknowledgement) return null;
  const go = async () => { setBusy(true); try { await ack(a.id); } finally { setBusy(false); } };
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {a.acknowledgementStatus === 'acknowledged'
        ? <span className="text-slate-300">Acknowledged at {fmtTime(a.acknowledgedAt)} · stays active until the condition returns to normal</span>
        : <>
          <button onClick={go} disabled={busy} className="rounded-lg bg-white text-slate-950 font-semibold px-3 py-1.5 hover:bg-slate-200 disabled:opacity-60">Acknowledge</button>
          {a.acknowledgementStatus === 'not_acknowledged'
            ? <span className="text-orange-300">Not acknowledged in time · sent to the Crew Medical Officer and a second crew member</span>
            : <span className="text-slate-300 font-mono">{countdown(a.acknowledgeBy, now)}</span>}
        </>}
      {a.groundReportId && <span className="text-slate-400">· Ground report {a.groundReportId.slice(3, 11)}</span>}
    </div>
  );
}

export function AlertBanner() {
  const active = useStore((s) => s.alerts?.active ?? []);
  const now = useNow();
  if (!active.length) return null;
  const sorted = [...active].sort((a, b) => severity(b.level) - severity(a.level));
  const needsAck = sorted.some((a) => a.requiresAcknowledgement);
  return (
    <div className="space-y-2 mb-5" role="alert">
      {sorted.map((a) => {
        const c = LEVEL_UI[a.level].color;
        return (
          <div key={a.id} className="rounded-xl border p-3 flex flex-wrap items-start justify-between gap-3" style={{ borderColor: c + '88', background: c + '14' }}>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs"><StatusPill level={a.level} small /><span className="text-slate-400">{AREA_LABEL[a.areaId]} · {info(a.indicator).label} · since {fmtTime(a.shownAt)}</span></div>
              <p className="text-sm text-slate-100 mt-1">{a.message}</p>
            </div>
            <AckStatus a={a} now={now} />
          </div>
        );
      })}
      {needsAck && <p className="text-xs text-slate-400">{NO_ACK_TEXT} The device may be far away, switched off or offline.</p>}
    </div>
  );
}

/** Bipe simples enquanto o Emergency não é confirmado (especificação 2.1: tela cheia + som). */
function useAlarm(on: boolean) {
  const ctx = useRef<AudioContext | null>(null);
  useEffect(() => {
    if (!on) return;
    const beep = () => {
      try {
        ctx.current ??= new AudioContext();
        const o = ctx.current.createOscillator(); const g = ctx.current.createGain();
        o.frequency.value = 880; g.gain.value = 0.08; o.connect(g); g.connect(ctx.current.destination);
        o.start(); o.stop(ctx.current.currentTime + 0.25);
      } catch { /* sem áudio: segue só visual */ }
    };
    beep(); const t = setInterval(beep, 1500);
    return () => clearInterval(t);
  }, [on]);
}

/** Tela cheia para Emergency ainda não confirmado. */
export function EmergencyOverlay() {
  const active = useStore((s) => s.alerts?.active ?? []);
  const ground = useStore((s) => s.ground);
  const ack = useStore((s) => s.acknowledge);
  const now = useNow();
  const [busy, setBusy] = useState(false);
  const open = active.filter((a) => a.level === 'emergency' && a.requiresAcknowledgement && a.acknowledgementStatus !== 'acknowledged');
  useAlarm(open.length > 0);
  const report = ground?.reports.find((r) => r.id === open[0]?.groundReportId);
  const go = async () => { setBusy(true); try { for (const a of open) await ack(a.id); } finally { setBusy(false); } };
  return (
    <AnimatePresence>
      {open.length > 0 && (
        <motion.div className="fixed inset-0 z-[100] bg-red-950/95 grid place-items-center p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="alertdialog" aria-modal="true">
          <div className="max-w-2xl w-full text-center">
            <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="mx-auto w-20 h-20 rounded-full bg-red-500 grid place-items-center"><Siren size={40} className="text-white" /></motion.div>
            <p className="mt-5 text-sm font-semibold tracking-widest text-red-200">EMERGENCY</p>
            <div className="mt-3 space-y-3">
              {open.map((a) => (
                <div key={a.id}>
                  <p className="text-xs text-red-200/80">{AREA_LABEL[a.areaId]} · {info(a.indicator).label}</p>
                  <p className="text-2xl md:text-3xl font-bold text-white leading-snug">{a.message}</p>
                </div>
              ))}
            </div>
            <button onClick={go} disabled={busy} className="mt-8 w-full max-w-sm rounded-2xl bg-white text-red-700 text-lg font-bold py-4 hover:bg-red-50 disabled:opacity-60">Acknowledge</button>
            <p className="mt-3 text-sm text-red-100 font-mono">
              {open[0].acknowledgementStatus === 'not_acknowledged'
                ? 'Not acknowledged in time · sent to the Crew Medical Officer and a second crew member'
                : `Acknowledge within ${acknowledgement.deadlineMs.emergency / 60000} minutes · ${countdown(open[0].acknowledgeBy, now)}`}
            </p>
            <p className="mt-6 text-base font-semibold text-white">{NO_ACK_TEXT}</p>
            <p className="text-sm text-red-100/80">The device may be far away, switched off or offline.</p>
            {report && <p className="mt-4 text-xs text-red-100/80">Immediate ground report {report.transmission.status.toLowerCase()} · {report.transmission.message}</p>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
