// "Today's routine" da Overview: os mesmos lembretes do sino (useReminders), em tom neutro.
// Status só Ready, Done ou Later; nunca "atrasado". Cor da marca (violeta), nunca as cores de nível de alerta.
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Clock, ListChecks, Play } from 'lucide-react';
import { useReminders, type Reminder, type RoutineStatus } from './Notifications';

const STATUS_LABEL: Record<RoutineStatus, string> = { ready: 'Ready', done: 'Done', later: 'Later' };

function StatusChip({ status }: { status: RoutineStatus }) {
  const reduced = useReducedMotion();
  if (status === 'done') return (
    <span className="inline-flex items-center gap-1 rounded-full border border-space-line px-2 py-0.5 text-xs text-slate-200">
      <motion.span className="grid place-items-center w-4 h-4 rounded-full bg-brand text-space-bg" aria-hidden="true"
        initial={reduced ? false : { scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 0.3, ease: 'backOut' }}>
        <Check size={11} strokeWidth={3} />
      </motion.span>Done
    </span>
  );
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${status === 'ready' ? 'border-brand/60 text-brand-soft' : 'border-space-line text-slate-300'}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function TodayRoutine() {
  const items = useReminders();
  const today = items.filter((r) => r.status !== 'later');
  const done = today.filter((r) => r.status === 'done').length;
  const next = items.find((r) => r.status === 'ready');
  const pct = today.length ? Math.round((done / today.length) * 100) : 100;

  return (
    <section className="card !p-5" aria-labelledby="routine-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="routine-title" className="text-sm font-semibold inline-flex items-center gap-2"><ListChecks size={18} className="text-slate-300" aria-hidden="true" />Today's routine</h2>
        <div className="flex items-center gap-3 min-w-[200px] flex-1 sm:flex-none">
          <div className="h-2 flex-1 sm:w-40 rounded-full bg-white/10 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={today.length} aria-valuenow={done} aria-label="Routine done today">
            <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-sm text-slate-200 whitespace-nowrap">{done} of {today.length} done today</span>
        </div>
      </div>

      <div className="mt-4 grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4">
        {next ? <NextUp r={next} /> : (
          <div className="rounded-xl border border-space-line bg-white/[0.03] p-5 grid place-items-center text-center">
            <p className="text-lg font-semibold">All set for today</p>
            <p className="text-sm text-slate-300 mt-1">Nothing else is ready right now.</p>
          </div>
        )}
        <ul className="space-y-2">
          {items.map((r) => { const Icon = r.icon; return (
            <li key={r.id}>
              <button type="button" onClick={r.go} className="tap w-full flex items-center gap-3 rounded-xl border border-space-line bg-space-deep/60 hover:border-slate-500 px-3 py-2 text-left">
                <span className="w-9 h-9 shrink-0 rounded-lg bg-space-card grid place-items-center text-slate-300"><Icon size={16} aria-hidden="true" /></span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm text-slate-100">{r.title}</span>
                  <span className="block text-xs text-slate-300">{r.moment} · {r.sub}</span>
                </span>
                <StatusChip status={r.status} />
              </button>
            </li>
          ); })}
        </ul>
      </div>
    </section>
  );
}

function NextUp({ r }: { r: Reminder }) {
  const Icon = r.icon;
  return (
    <div className="rounded-xl border border-brand/40 bg-brand/[0.06] p-5 flex flex-col gap-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-brand-soft">Next up</span>
      <div className="flex items-start gap-3">
        <span className="w-11 h-11 shrink-0 rounded-xl bg-space-card grid place-items-center text-brand-soft"><Icon size={20} aria-hidden="true" /></span>
        <div>
          <p className="text-xl md:text-2xl font-semibold leading-snug">{r.title}</p>
          <p className="text-sm text-slate-300 mt-1 inline-flex flex-wrap items-center gap-x-2">
            <span>{r.moment}</span>
            {r.estimate && <span className="inline-flex items-center gap-1"><Clock size={13} aria-hidden="true" />{r.estimate}</span>}
          </p>
        </div>
      </div>
      <button type="button" onClick={r.go} className="btn-primary tap self-start"><Play size={14} aria-hidden="true" />Start<span className="sr-only">: {r.title}</span></button>
    </div>
  );
}
