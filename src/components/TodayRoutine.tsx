// Next up da Overview: a próxima tarefa com Start e a trilha das 4 tarefas da rotina (Done / Ready / Later).
// A lista completa fica no painel do sino. Rotina não é nível de alerta: usa a cor da marca e neutros, nunca as cores de nível.
import { Check, Clock, Play } from 'lucide-react';
import { routineProgress, useReminders, type RoutineStatus } from './Notifications';
import { cn } from '../lib/utils';

const SHORT: Record<string, string> = { checkin: 'Check-in', pvt: 'Reaction check', exercise: 'Exercise', weigh: 'Weigh-in' };
const WORD: Record<RoutineStatus, string> = { done: 'Done', ready: 'Ready', later: 'Later' };

function Node({ status, next }: { status: RoutineStatus; next: boolean }) {
  return (
    <span className={cn('relative z-10 grid place-items-center w-6 h-6 rounded-full border-2 bg-space-card',
      status === 'done' ? 'border-slate-300 bg-slate-300 text-space-bg' : status === 'ready' ? (next ? 'border-brand' : 'border-slate-300') : 'border-dashed border-space-strong')} aria-hidden="true">
      {status === 'done' && <Check size={13} strokeWidth={3} />}
      {status === 'ready' && next && <span className="w-2 h-2 rounded-full bg-brand" />}
    </span>
  );
}

export function RoutineBar() {
  const items = useReminders();
  const { done, total, next } = routineProgress(items);
  return (
    <section aria-labelledby="routine-title" className="card !py-3 grid gap-x-6 gap-y-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] md:items-center">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex-1 min-w-[10rem]">
          <h2 id="routine-title" className="text-xs font-semibold text-brand-soft">Next up</h2>
          {next
            ? <p className="text-base font-semibold text-slate-50 leading-snug">{next.title}{next.estimate && <span className="ml-2 inline-flex items-center gap-1 text-sm font-normal text-slate-300"><Clock size={14} aria-hidden="true" />{next.estimate}</span>}</p>
            : <p className="text-base font-semibold text-slate-50">All done for today</p>}
        </div>
        {next && <button type="button" onClick={next.go} className="btn-primary"><Play size={14} aria-hidden="true" />Start<span className="sr-only">: {next.title}</span></button>}
      </div>
      <div>
        <ol className="relative grid grid-cols-4" aria-label={`Today's routine: ${done} of ${total} done`}>
          <span className="absolute left-[12.5%] right-[12.5%] top-3 h-px bg-space-strong" aria-hidden="true" />
          {items.map((r) => (
            <li key={r.id} className="flex flex-col items-center gap-1 text-center">
              <Node status={r.status} next={r.id === next?.id} />
              <span className={cn('text-xs leading-tight', r.id === next?.id ? 'text-slate-50 font-medium' : 'text-slate-300')}>{SHORT[r.id] ?? r.title}</span>
              <span className="sr-only">{WORD[r.status]}</span>
            </li>
          ))}
        </ol>
        <p className="mt-1.5 text-xs text-slate-300 text-center md:text-right"><span className="font-mono">{done}</span> of <span className="font-mono">{total}</span> done today</p>
      </div>
    </section>
  );
}
