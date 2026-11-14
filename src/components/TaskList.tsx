import React from 'react';
import { useStore } from '../store/useStore';
import { CheckSquare, Square, CheckCircle2, Clock, Sparkles } from 'lucide-react';

export const TaskList: React.FC = () => {
  const { tasks, toggleTask } = useStore();

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="rounded-2xl bg-space-850/90 border border-space-700/80 p-4 lg:p-5 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Tarefas de Hoje
            </h2>
            <p className="text-[11px] text-space-400">
              Rotina clínica & manutenção
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-astro-cyan bg-astro-cyan/10 px-2 py-0.5 rounded border border-astro-cyan/20">
          {completedCount} de {tasks.length}
        </span>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
              task.completed
                ? 'bg-space-900/40 border-space-800 text-space-400'
                : 'bg-space-900/90 border-space-700/70 hover:border-space-600 text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={`transition-colors ${
                  task.completed ? 'text-emerald-400' : 'text-space-500 hover:text-astro-cyan'
                }`}
              >
                {task.completed ? (
                  <CheckSquare size={18} className="fill-emerald-500/20" />
                ) : (
                  <Square size={18} />
                )}
              </button>
              <div>
                <p
                  className={`text-xs font-medium ${
                    task.completed ? 'line-through text-space-400' : 'text-slate-100'
                  }`}
                >
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-space-400">
                  <span>{task.category}</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5">
                    <Clock size={10} /> {task.timeEstimate}
                  </span>
                </div>
              </div>
            </div>

            <div
              className={`flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded ${
                task.completed
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-space-800 text-astro-cyan border border-space-700'
              }`}
            >
              <Sparkles size={11} />
              <span>+{task.xpReward} XP</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
