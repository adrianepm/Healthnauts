import React from 'react';
import { useStore } from '../store/useStore';
import { Orbit, Compass, Sparkles } from 'lucide-react';

export const GravitySelector: React.FC = () => {
  const { currentGravity, setGravity, addXP } = useStore();

  const options: { id: '0g' | '0.16g' | '0.38g' | '1g'; label: string; sub: string }[] = [
    { id: '0g', label: '0 g', sub: 'Microgravidade (Nave)' },
    { id: '0.16g', label: '0,16 g', sub: 'Gravidade Lunar' },
    { id: '0.38g', label: '0,38 g', sub: 'Superfície de Marte' },
    { id: '1g', label: '1 g', sub: 'Padrão Terrestre' },
  ];

  const handleSelect = (g: '0g' | '0.16g' | '0.38g' | '1g') => {
    setGravity(g);
    addXP(10);
  };

  return (
    <div className="p-4 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/15 text-astro-cyan">
            <Orbit size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Gravidade do Ambiente Atual
            </h3>
            <p className="text-[11px] text-space-400">
              Recalcula dinamicamente curvas e metas fisiológicas
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {options.map((opt) => {
          const isSelected = currentGravity === opt.id;

          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className={`p-3 rounded-xl border text-center transition-all ${
                isSelected
                  ? 'bg-space-750 border-astro-cyan text-white shadow-glow-cyan'
                  : 'bg-space-900 border-space-800 text-space-300 hover:text-white hover:bg-space-800'
              }`}
            >
              <span className="text-base font-black font-mono block text-astro-cyan">
                {opt.label}
              </span>
              <span className="text-[10px] text-space-400 block mt-0.5">
                {opt.sub}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
