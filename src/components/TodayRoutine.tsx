// Barra fina da rotina na Overview: "Next up: <tarefa> · <tempo>" + Start + progresso na cor da marca.
// A lista completa (Ready / Done / Later) fica no painel do sino. x e y contam os mesmos itens dessa lista.
import { CircleCheck, Clock, Play } from 'lucide-react';
import { routineProgress, useReminders } from './Notifications';

export function RoutineBar() {
  const items = useReminders();
  const { done, total, next } = routineProgress(items);
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <section aria-label="Today's routine" className="card !py-2.5 !px-4 flex flex-wrap items-center gap-x-4 gap-y-2">
      {next ? (
        <>
          <p className="text-sm text-slate-100 flex-1 min-w-[12rem] inline-flex flex-wrap items-center gap-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-soft">Next up</span>
            <span className="font-semibold">{next.title}</span>
            {next.estimate && <span className="inline-flex items-center gap-1 text-slate-300"><Clock size={13} aria-hidden="true" />{next.estimate}</span>}
          </p>
          <button type="button" onClick={next.go} className="btn-primary tap !py-1.5"><Play size={14} aria-hidden="true" />Start<span className="sr-only">: {next.title}</span></button>
        </>
      ) : (
        <p className="text-sm text-slate-300 flex-1 inline-flex items-center gap-2"><CircleCheck size={15} className="text-brand-soft" aria-hidden="true" />All done for today</p>
      )}
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-24 rounded-full bg-white/10 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="Routine done today">
          <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-slate-300 whitespace-nowrap">{done} of {total} done today</span>
      </div>
    </section>
  );
}
