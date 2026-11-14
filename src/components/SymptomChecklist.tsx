import React from 'react';
import { useStore } from '../store/useStore';
import { ClipboardCheck, Sparkles, Check } from 'lucide-react';

export const SymptomChecklist: React.FC = () => {
  const { radiationSymptoms, updateRadiationSymptom, addXP } = useStore();

  const handleSelect = (symptomId: string, option: string) => {
    updateRadiationSymptom(symptomId, option);
    addXP(5);
  };

  return (
    <div className="p-5 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/15 text-astro-cyan">
            <ClipboardCheck size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Autoavaliação de Sintomas de Radiação
            </h3>
            <p className="text-[11px] text-space-400">
              Sinais clínicos da Síndrome Aguda da Radiação (ARS)
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-space-400 bg-space-800 px-2 py-0.5 rounded border border-space-700">
          5 ITENS
        </span>
      </div>

      <div className="space-y-3">
        {radiationSymptoms.map((sym) => (
          <div
            key={sym.id}
            className="p-3 rounded-xl bg-space-900/80 border border-space-700/60"
          >
            <span className="text-xs font-semibold text-slate-200 block mb-2">
              {sym.name}
            </span>

            <div className="flex flex-wrap gap-1.5">
              {sym.options.map((opt) => {
                const isSelected = sym.selected === opt;
                const isWarning = opt.includes('Moderad') || opt.includes('Grave') || opt.includes('Extrema') || opt.includes('Névoa');

                return (
                  <button
                    key={opt}
                    onClick={() => handleSelect(sym.id, opt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                      isSelected
                        ? isWarning
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-glow-red font-bold'
                          : 'bg-astro-cyan/20 text-astro-cyan border border-astro-cyan/40 font-bold'
                        : 'bg-space-800 text-space-400 hover:text-white hover:bg-space-750'
                    }`}
                  >
                    {isSelected && <Check size={12} />}
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
