// Lembretes da rotina ("caixa de remédio") e sino com bolinha vermelha (do protótipo).
// Lembrete não é nível: só diz o que falta fazer hoje.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ClipboardCheck, Dumbbell, Scale, Timer, type LucideIcon } from 'lucide-react';
import { pvtCollection } from '../../shared/config/isolation.js';
import { dayKey, useStore } from '../store/useStore';
import { DAY_MS } from '../lib/format';
import { REFERENCE } from '../lib/content';
import { AREA } from '../config/api';

export interface Reminder { id: string; icon: LucideIcon; title: string; sub: string; done: boolean; go: () => void }

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
  return [
    { id: 'checkin', icon: ClipboardCheck, title: 'Morning check-in', sub: checkinDone ? 'Done today' : 'Pending · about 1 min', done: checkinDone, go: () => { nav('/isolation'); setCheckinOpen(true); } },
    { id: 'pvt', icon: Timer, title: 'Reaction check (PVT-B)', sub: pvtDays >= PVT_EVERY_DAYS ? `Due today · every ${PVT_EVERY_DAYS} days · 3 min` : `Next in ${Math.ceil(PVT_EVERY_DAYS - pvtDays)} days`, done: pvtDays < PVT_EVERY_DAYS, go: () => { nav('/isolation'); setPvtOpen(true); } },
    { id: 'exercise', icon: Dumbbell, title: 'Exercise today', sub: `${Math.round(exerciseToday)} of ${REFERENCE.exercisePlanMin} min logged`, done: exerciseToday >= REFERENCE.exercisePlanMin, go: () => nav('/gravity') },
    { id: 'weigh', icon: Scale, title: 'Weekly weigh-in', sub: daysSince(lastMass) >= WEIGH_EVERY_DAYS ? 'Due this week' : 'Done this week', done: daysSince(lastMass) < WEIGH_EVERY_DAYS, go: () => nav('/gravity') },
  ];
}

export function Notifications() {
  const [open, setOpen] = useState(false);
  const pending = useReminders().filter((r) => !r.done);
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

/** Rotina do dia no Overview: pendente = bolinha vermelha. */
export function RoutineList() {
  const items = useReminders();
  return (
    <ul className="space-y-2">
      {items.map(({ id, icon: Icon, title, sub, done, go }) => (
        <li key={id}>
          <button onClick={go} className="w-full flex items-center gap-3 rounded-xl border border-space-line bg-space-deep/60 hover:border-slate-500 p-3 text-left">
            <span className="relative w-9 h-9 rounded-lg bg-space-card grid place-items-center text-slate-300"><Icon size={16} />{!done && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500" />}</span>
            <span className="flex-1"><span className="block text-sm text-slate-100">{title}</span><span className="block text-xs text-slate-400">{sub}</span></span>
            <span className={`chip normal-case ${done ? 'border-space-line text-slate-500' : 'border-red-500/40 text-red-300'}`}>{done ? 'Done' : 'To do'}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
