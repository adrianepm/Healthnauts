import React from 'react';
import { useStore } from '../store/useStore';
import { Sparkles, CheckSquare, Square, CheckCircle2, ShieldCheck } from 'lucide-react';

export const HygieneChecklist: React.FC = () => {
  const { atmosphereData, toggleHygieneTask } = useStore();
  const tasks = atmosphereData.hygieneTasks;

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="p-5 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/15 text-astro-cyan">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Rotina de Higiene & Descontaminação
            </h3>
            <p className="text-[11px] text-space-400">
              Controle ambiental microbiológico da cabine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-astro-cyan bg-astro-cyan/10 px-2 py-0.5 rounded border border-astro-cyan/20">
            Meta: {completedCount} de {tasks.length}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => toggleHygieneTask(task.id)}
            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
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
                  <CheckSquare size={17} className="fill-emerald-500/20" />
                ) : (
                  <Square size={17} />
                )}
              </button>
              <div>
                <p
                  className={`text-xs font-medium ${
                    task.completed ? 'line-through text-space-400' : 'text-slate-100'
                  }`}
                >
                  {task.name}
                </p>
                <span className="text-[10px] text-space-400 font-mono">
                  {task.interval}
                </span>
              </div>
            </div>

            <div
              className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded ${
                task.completed
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-space-800 text-astro-cyan border border-space-700'
              }`}
            >
              <Sparkles size={10} />
              <span>+{task.xp} XP</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
