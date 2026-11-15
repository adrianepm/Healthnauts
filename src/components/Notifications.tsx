// Lembretes da rotina ("caixa de remédio") e sino com bolinha vermelha (do protótipo).
// Lembrete não é nível: só diz o que falta fazer hoje. O cartão da Overview fica em TodayRoutine.tsx.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ClipboardCheck, Dumbbell, Scale, Timer, type LucideIcon } from 'lucide-react';
import { pvtCollection } from '../../shared/config/isolation.js';
import { dayKey, useStore } from '../store/useStore';
import { DAY_MS, startOfToday } from '../lib/format';
import { REFERENCE } from '../lib/content';
import { AREA } from '../config/api';

/** Status neutro da rotina: nunca "atrasado". Later = ainda não é a vez (ex.: PVT-B a cada 4 dias). */
export type RoutineStatus = 'ready' | 'done' | 'later';
export interface Reminder {
  id: string; icon: LucideIcon; title: string; sub: string; status: RoutineStatus;
  moment: 'Morning' | 'Today' | 'This week';
  /** Tempo estimado que o app já informa (check-in ~1 min, PVT-B 3 min, plano de exercício). */
  estimate?: string; go: () => void;
}

const PVT_EVERY_DAYS: number = (pvtCollection.schedule.find((s: any) => s.kind === 'interval') as { days?: number } | undefined)?.days ?? 4;
const WEIGH_EVERY_DAYS = 7;

export function useReminders(): Reminder[] {
  const nav = useNavigate();
  const ui = useStore((s) => s.ui); const details = useStore((s) => s.details); const exerciseToday = useStore((s) => s.exerciseToday);
  const setCheckinOpen = useStore((s) => s.setCheckinOpen); const setPvtOpen = useStore((s) => s.setPvtOpen);
  const latest = (area: string, id: string) => (details as any)[area]?.latestRecords?.find((r: any) => r.indicator === id)?.recordedAt as string | undefined;
  const lastPvt = latest(AREA.isolation, 'pvt_response_speed'); const lastMass = latest(AREA.gravity, 'body_mass');
  const daysSince = (iso?: string) => iso ? (Date.now() - Date.parse(iso)) / DAY_MS : Infinity;
  const checkinDone = ui.checkins.includes(dayKey());
  const pvtDays = daysSince(lastPvt);
  const pvtToday = !!lastPvt && Date.parse(lastPvt) >= startOfToday();
  const pvt: RoutineStatus = pvtDays >= PVT_EVERY_DAYS ? 'ready' : pvtToday ? 'done' : 'later';
  const plan = REFERENCE.exercisePlanMin;
  const weighed = daysSince(lastMass) < WEIGH_EVERY_DAYS;
  // MorningCheckin e PvtTest ficam montados no AppShell: "Start" abre a tarefa direto, sem trocar de página.
  return [
    { id: 'checkin', icon: ClipboardCheck, title: 'Morning check-in', moment: 'Morning', estimate: 'About 1 min',
      sub: checkinDone ? 'Done today' : 'Sleep, mood and stress · about 1 min', status: checkinDone ? 'done' : 'ready', go: () => setCheckinOpen(true) },
    { id: 'pvt', icon: Timer, title: 'Reaction check (PVT-B)', moment: 'Today', estimate: '3 min',
      sub: pvt === 'later' ? `Next in ${Math.ceil(PVT_EVERY_DAYS - pvtDays)} days · every ${PVT_EVERY_DAYS} days` : `Every ${PVT_EVERY_DAYS} days · 3 min`, status: pvt, go: () => setPvtOpen(true) },
    { id: 'exercise', icon: Dumbbell, title: 'Exercise today', moment: 'Today', estimate: `Plan about ${plan} min`,
      sub: `${Math.round(exerciseToday)} of ${plan} min logged`, status: exerciseToday >= plan ? 'done' : 'ready', go: () => nav('/gravity', { state: { focus: 'exercise' } }) },
    { id: 'weigh', icon: Scale, title: 'Weekly weigh-in', moment: 'This week',
      sub: weighed ? 'Done this week' : 'Once a week', status: weighed ? 'done' : 'ready', go: () => nav('/gravity', { state: { focus: 'weigh' } }) },
  ];
}

export function Notifications() {
  const [open, setOpen] = useState(false);
  const pending = useReminders().filter((r) => r.status === 'ready');
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative w-10 h-10 rounded-xl border border-space-line grid place-items-center hover:border-slate-500" aria-label={`Reminders: ${pending.length} pending`}>
        <Bell size={18} />
        {pending.length > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-red-600 text-xs font-bold grid place-items-center text-white">{pending.length}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-space-line bg-space-deep shadow-xl p-2 z-50">
          {pending.length === 0 ? <p className="text-sm text-slate-400 p-3">You're all caught up.</p> : pending.map(({ id, icon: Icon, title, sub, go }) => (
            <button key={id} onClick={() => { go(); setOpen(false); }} className="w-full flex items-center gap-3 rounded-lg p-3 hover:bg-space-card text-left">
              <span className="relative"><Icon size={18} className="text-slate-300" /><span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500" /></span>
              <span><span className="block text-sm">{title}</span><span className="block text-xs text-slate-400">{sub}</span></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
