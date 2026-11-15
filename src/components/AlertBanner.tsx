// Alertas ativos (Caution ou acima) no topo de todas as telas, com Acknowledge em Warning e Emergency (2.3).
// Tudo vem de GET /alerts: prazo, escalonamento e resolução são calculados pela API a cada consulta.
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Siren } from 'lucide-react';
import { useStore } from '../store/useStore';
import { toast } from '../store/toast';
import type { Alert } from '../services/api';
import { LEVEL_UI, severity } from '../lib/levels';
import { acknowledgement } from '../../shared/config/levels.js';
import { AREA_LABEL, info } from '../lib/content';
import { fmtTime } from '../lib/format';
import { StatusPill } from './ui';

/** Texto obrigatório da especificação 2.3. */
export const NO_ACK_TEXT = 'No acknowledgement does not mean loss of consciousness.';
const NOT_ACK_TEXT = 'Not acknowledged in time · sent to the Crew Medical Officer and a second crew member';

function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}

const secondsLeft = (iso: string | null, now: number) => (iso ? Math.round((Date.parse(iso) - now) / 1000) : null);
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const countdown = (iso: string | null, now: number) => {
  const s = secondsLeft(iso, now);
  if (s === null) return '';
  return s <= 0 ? 'deadline passed' : `${clock(s)} left`;
};

function AckStatus({ a, now }: { a: Alert; now: number }) {
  const ack = useStore((s) => s.acknowledge); const [busy, setBusy] = useState(false);
  if (!a.requiresAcknowledgement) return null;
  const go = async () => { setBusy(true); try { await ack(a.id); toast.success('Alert acknowledged'); } catch (e) { toast.error(e); } finally { setBusy(false); } };
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {a.acknowledgementStatus === 'acknowledged'
        ? <span className="text-slate-200">Acknowledged at <span className="font-mono">{fmtTime(a.acknowledgedAt)}</span> · stays active until the condition returns to normal</span>
        : <>
          <button onClick={go} disabled={busy} className="rounded-md bg-slate-50 text-space-bg font-semibold px-3 py-1.5 hover:bg-white disabled:opacity-60">Acknowledge</button>
          {a.acknowledgementStatus === 'not_acknowledged'
            ? <span className="text-slate-100">{NOT_ACK_TEXT}</span>
            : <span className="text-slate-200 font-mono">{countdown(a.acknowledgeBy, now)}</span>}
        </>}
      {a.groundReportId && <span className="text-slate-300">· Ground report <span className="font-mono">{a.groundReportId.slice(3, 11)}</span></span>}
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
          <div key={a.id} className="relative overflow-hidden rounded-lg border bg-space-card pl-5 pr-4 py-3 flex flex-wrap items-start justify-between gap-3" style={{ borderColor: c + '80' }}>
            <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: c }} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs"><StatusPill level={a.level} small /><span className="text-slate-300">{AREA_LABEL[a.areaId]} · {info(a.indicator).label} · since <span className="font-mono">{fmtTime(a.shownAt)}</span></span></div>
              <p className="text-sm text-slate-50 mt-1">{a.message}</p>
            </div>
            <AckStatus a={a} now={now} />
          </div>
        );
      })}
      {needsAck && <p className="text-xs text-slate-300">{NO_ACK_TEXT} The device may be far away, switched off or offline.</p>}
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

const DEEP = '#14060A'; // fundo opaco da Emergency
const PALE = '#FECACA'; // texto secundário sobre o fundo da Emergency

/**
 * Tela cheia para Emergency ainda não confirmado. Fundo 100% opaco (nada da tela de baixo aparece), um cartão por alerta,
 * contagem regressiva grande e, no celular, o botão Acknowledge fixo embaixo. O foco vai para o botão ao abrir.
 */
export function EmergencyOverlay() {
  const active = useStore((s) => s.alerts?.active ?? []);
  const ground = useStore((s) => s.ground);
  const ack = useStore((s) => s.acknowledge);
  const now = useNow();
  const reduced = useReducedMotion();
  const [busy, setBusy] = useState(false);
  const desk = useRef<HTMLButtonElement>(null); const phone = useRef<HTMLButtonElement>(null);
  const open = active.filter((a) => a.level === 'emergency' && a.requiresAcknowledgement && a.acknowledgementStatus !== 'acknowledged');
  const isOpen = open.length > 0;
  useAlarm(isOpen);
  useEffect(() => {
    if (!isOpen) return;
    const t = window.setTimeout(() => (window.matchMedia('(min-width: 768px)').matches ? desk : phone).current?.focus(), 50);
    const html = document.documentElement; const prev = html.style.overflow; html.style.overflow = 'hidden';
    return () => { window.clearTimeout(t); html.style.overflow = prev; };
  }, [isOpen]);
  const report = ground?.reports.find((r) => r.id === open[0]?.groundReportId);
  const go = async () => {
    setBusy(true);
    try { for (const a of open) await ack(a.id); toast.success(open.length > 1 ? 'Alerts acknowledged' : 'Alert acknowledged'); } catch (e) { toast.error(e); } finally { setBusy(false); }
  };
  const red = LEVEL_UI.emergency.color;
  const left = secondsLeft(open[0]?.acknowledgeBy ?? null, now);
  const late = open[0]?.acknowledgementStatus === 'not_acknowledged';
  const minutes = acknowledgement.deadlineMs.emergency / 60000;
  const btn = 'w-full rounded-lg bg-white text-lg font-bold py-4 hover:bg-[#FEE2E2] disabled:opacity-70';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-[100] flex flex-col overscroll-contain" style={{ background: DEEP }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          role="alertdialog" aria-modal="true" aria-labelledby="emergency-title" aria-describedby="emergency-body">
          <div className="h-1.5 shrink-0" style={{ background: red }} aria-hidden="true" />
          <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-6 pb-36 md:pb-10">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-4">
                <motion.span className="w-14 h-14 shrink-0 rounded-full grid place-items-center" style={{ background: red }}
                  animate={reduced ? undefined : { boxShadow: [`0 0 0 0 ${red}99`, `0 0 0 14px ${red}00`] }} transition={{ repeat: Infinity, duration: 1.2 }}>
                  <Siren size={28} style={{ color: DEEP }} aria-hidden="true" />
                </motion.span>
                <div>
                  <h2 id="emergency-title" className="text-2xl font-semibold tracking-tight text-white">Emergency</h2>
                  <p className="text-sm" style={{ color: PALE }}>{open.length > 1 ? `${open.length} vehicle safety conditions` : 'Vehicle safety condition'} · follow the onboard procedure</p>
                </div>
              </div>

              <ul id="emergency-body" className="mt-6 space-y-3">
                {open.map((a) => (
                  <li key={a.id} className="rounded-lg border bg-black/40 p-4" style={{ borderColor: red + '99' }}>
                    <p className="text-xs" style={{ color: PALE }}>{AREA_LABEL[a.areaId]} · {info(a.indicator).label} · since <span className="font-mono">{fmtTime(a.shownAt)}</span></p>
                    <p className="mt-1.5 text-lg md:text-xl font-semibold leading-snug text-white">{a.message}</p>
                  </li>
                ))}
              </ul>

              <div className="mt-6 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
                <div className="rounded-lg border border-white/25 px-4 py-3 text-center sm:text-left">
                  <p className="text-xs" style={{ color: PALE }}>{late ? 'Deadline passed' : `Acknowledge within ${minutes} minutes`}</p>
                  <p className="font-mono text-4xl font-semibold text-white">{late || left === null || left <= 0 ? '0:00' : clock(left)}<span className="sr-only"> left</span></p>
                </div>
                <div className="text-sm">
                  {late && <p className="font-semibold text-white mb-1">{NOT_ACK_TEXT}</p>}
                  <p className="font-semibold text-white">{NO_ACK_TEXT}</p>
                  <p style={{ color: PALE }}>The device may be far away, switched off or offline.</p>
                </div>
              </div>
              {report && <p className="mt-5 text-sm" style={{ color: PALE }}>Immediate ground report {report.transmission.status.toLowerCase()} · {report.transmission.message}</p>}

              <div className="hidden md:block mt-8 max-w-sm">
                <button ref={desk} onClick={go} disabled={busy} className={btn} style={{ color: DEEP }}>Acknowledge</button>
              </div>
            </div>
          </div>
          {/* Celular: botão fixo embaixo, sempre visível. */}
          <div className="md:hidden fixed inset-x-0 bottom-0 border-t border-white/20 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]" style={{ background: DEEP }}>
            <button ref={phone} onClick={go} disabled={busy} className={btn} style={{ color: DEEP }}>Acknowledge</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
