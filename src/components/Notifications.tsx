// Lembretes da rotina ("caixa de remédio") e sino com bolinha vermelha (do protótipo).
// Lembrete não é nível: só diz o que fazer hoje. O sino fica na barra Next up da Overview (TodayRoutine.tsx) e abre a
// lista completa (Ready / Done / Later). Bolinha vermelha = itens Ready de hoje; Later não entra na conta de hoje.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Bell, Check, ClipboardCheck, Dumbbell, Scale, Timer, type LucideIcon } from 'lucide-react';
import { pvtCollection } from '../../shared/config/isolation.js';
import { dayKey, useStore } from '../store/useStore';
import { DAY_MS, startOfToday } from '../lib/format';
import { REFERENCE } from '../lib/content';
import { AREA } from '../config/api';

/** Status neutro da rotina: nunca "atrasado". Later = não é para hoje (ex.: PVT-B a cada 4 dias, pesagem semanal já feita). */
export type RoutineStatus = 'ready' | 'done' | 'later';
export interface Reminder {
  id: string; icon: LucideIcon; title: string; sub: string; status: RoutineStatus;
  moment: 'Morning' | 'Today' | 'This week';
  /** Tempo estimado que o app já informa (check-in ~1 min, PVT-B 3 min, plano de exercício). */
  estimate?: string;
  /** Só em Later: quando a tarefa volta, ex.: "in 3 days". */
  returnsIn?: string;
  go: () => void;
}

const PVT_EVERY_DAYS: number = (pvtCollection.schedule.find((s: any) => s.kind === 'interval') as { days?: number } | undefined)?.days ?? 4;
const WEIGH_EVERY_DAYS = 7;
const inDays = (d: number) => `in ${d} day${d > 1 ? 's' : ''}`;
/** Dias de calendário até a tarefa voltar: (dia do último registro + intervalo) − hoje. Sem registro: 0 (é para hoje). */
const daysUntil = (iso: string | undefined, every: number) => iso
  ? Math.round((new Date(iso).setHours(0, 0, 0, 0) + every * DAY_MS - startOfToday()) / DAY_MS) : 0;

export function useReminders(): Reminder[] {
  const nav = useNavigate();
  const ui = useStore((s) => s.ui); const details = useStore((s) => s.details); const exerciseToday = useStore((s) => s.exerciseToday);
  const setCheckinOpen = useStore((s) => s.setCheckinOpen); const setPvtOpen = useStore((s) => s.setPvtOpen);
  const latest = (area: string, id: string) => (details as any)[area]?.latestRecords?.find((r: any) => r.indicator === id)?.recordedAt as string | undefined;
  const lastPvt = latest(AREA.isolation, 'pvt_response_speed'); const lastMass = latest(AREA.gravity, 'body_mass');
  const isToday = (iso?: string) => !!iso && Date.parse(iso) >= startOfToday();
  const checkinDone = ui.checkins.includes(dayKey());
  // PVT-B: feito hoje = Done; chegou o dia (a cada 4 dias de calendário) = Ready; senão Later, com a volta.
  const pvtIn = daysUntil(lastPvt, PVT_EVERY_DAYS);
  const pvt: RoutineStatus = isToday(lastPvt) ? 'done' : pvtIn <= 0 ? 'ready' : 'later';
  // Pesagem semanal: feita hoje = Done; feita há menos de 7 dias de calendário = Later; senão Ready.
  const massIn = daysUntil(lastMass, WEIGH_EVERY_DAYS);
  const weigh: RoutineStatus = isToday(lastMass) ? 'done' : massIn > 0 ? 'later' : 'ready';
  const plan = REFERENCE.exercisePlanMin;
  // MorningCheckin e PvtTest ficam montados no AppShell: "Start" abre a tarefa direto, sem trocar de página.
  return [
    { id: 'checkin', icon: ClipboardCheck, title: 'Morning check-in', moment: 'Morning', estimate: 'About 1 min',
      sub: checkinDone ? 'Done today' : 'Sleep, mood and stress · about 1 min', status: checkinDone ? 'done' : 'ready', go: () => setCheckinOpen(true) },
    { id: 'pvt', icon: Timer, title: 'Reaction check (PVT-B)', moment: 'Today', estimate: '3 min',
      sub: pvt === 'done' ? 'Done today' : `Every ${PVT_EVERY_DAYS} days · 3 min`, status: pvt,
      returnsIn: pvt === 'later' ? inDays(pvtIn) : undefined, go: () => setPvtOpen(true) },
    { id: 'exercise', icon: Dumbbell, title: 'Exercise today', moment: 'Today', estimate: `Plan about ${plan} min`,
      sub: `${Math.round(exerciseToday)} of ${plan} min logged`, status: exerciseToday >= plan ? 'done' : 'ready', go: () => nav('/gravity', { state: { focus: 'exercise' } }) },
    { id: 'weigh', icon: Scale, title: 'Weekly weigh-in', moment: 'This week',
      sub: weigh === 'done' ? 'Done today' : weigh === 'later' ? 'Done this week' : 'Once a week', status: weigh,
      returnsIn: weigh === 'later' ? inDays(massIn) : undefined, go: () => nav('/gravity', { state: { focus: 'weigh' } }) },
  ];
}

/** Contagem só das tarefas de HOJE (Later fica de fora). "All done for today" só quando done === total. */
export function routineProgress(items: Reminder[]) {
  const today = items.filter((r) => r.status !== 'later');
  return { done: today.filter((r) => r.status === 'done').length, total: today.length, next: today.find((r) => r.status === 'ready') ?? null };
}

const STATUS_LABEL: Record<RoutineStatus, string> = { ready: 'Ready', done: 'Done', later: 'Later' };

/** Status neutro, na cor da marca (nunca as cores de nível de alerta). Done com um check animado curto. */
export function StatusChip({ status }: { status: RoutineStatus }) {
  const reduced = useReducedMotion();
  if (status === 'done') return (
    <span className="inline-flex items-center gap-1 rounded-full border border-space-line px-2 py-0.5 text-xs text-slate-200 whitespace-nowrap">
      <motion.span className="grid place-items-center w-4 h-4 rounded-full bg-brand text-space-bg" aria-hidden="true"
        initial={reduced ? false : { scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 0.3, ease: 'backOut' }}>
        <Check size={11} strokeWidth={3} />
      </motion.span>Done
    </span>
  );
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs whitespace-nowrap ${status === 'ready' ? 'border-brand/60 text-brand-soft' : 'border-space-line text-slate-300'}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

const GROUPS: { status: RoutineStatus; label: string }[] = [
  { status: 'ready', label: 'Ready' }, { status: 'done', label: 'Done' }, { status: 'later', label: 'Later' },
];

/**
 * Sino da rotina (fica na barra Next up da Overview). Bolinha vermelha = tarefas Ready de hoje.
 * Ao clicar abre a lista completa em grupos Ready / Done / Later. Fecha com Esc ou clique fora.
 */
export function Notifications() {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const items = useReminders();
  const pending = items.filter((r) => r.status === 'ready');
  const { done, total } = routineProgress(items);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const click = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    window.addEventListener('keydown', key); window.addEventListener('mousedown', click);
    return () => { window.removeEventListener('keydown', key); window.removeEventListener('mousedown', click); };
  }, [open]);
  return (
    <div className="relative" ref={box}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="true" className="relative w-11 h-11 rounded-md border border-space-line grid place-items-center hover:border-space-strong hover:bg-space-card2 text-slate-200"
        aria-label={`Today's routine: ${pending.length} ready`}>
        <Bell size={18} aria-hidden="true" />
        {pending.length > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-[#DC2626] text-xs font-bold grid place-items-center text-white" aria-hidden="true">{pending.length}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-md border border-space-strong bg-space-card shadow-2xl shadow-black/60 p-2 z-50">
          <p className="px-3 pt-2 pb-1 text-xs text-slate-300">Today's routine · <span className="font-mono">{done}</span> of <span className="font-mono">{total}</span> done today</p>
          {GROUPS.map(({ status, label }) => {
            const list = items.filter((r) => r.status === status);
            if (!list.length) return null;
            return (
              <div key={status} className="mt-1">
                <p className="px-3 pt-2 text-xs font-medium text-slate-300">{label}</p>
                <ul>
                  {list.map(({ id, icon: Icon, title, sub, moment, returnsIn, go }) => (
                    <li key={id}>
                      <button type="button" onClick={() => { go(); setOpen(false); }} className="w-full flex items-center gap-3 rounded-md p-3 hover:bg-space-card2 text-left">
                        <Icon size={18} className="text-slate-300 shrink-0" aria-hidden="true" />
                        <span className="flex-1 min-w-0"><span className="block text-sm">{title}</span><span className="block text-xs text-slate-300">{status === 'later' && returnsIn ? `Back ${returnsIn} · ${sub}` : `${moment} · ${sub}`}</span></span>
                        <StatusChip status={status} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
