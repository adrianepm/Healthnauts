import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { MEDICAL_PROTOCOLS } from '../mock/kit';
import { Search, Stethoscope, ChevronRight, CheckCircle2 } from 'lucide-react';
import { StatusPill } from './StatusPill';

export const SymptomSearch: React.FC = () => {
  const { selectedProtocol, setSelectedProtocol } = useStore();
  const [query, setQuery] = useState('');

  const filtered = MEDICAL_PROTOCOLS.filter((p) => {
    const q = query.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-3">
      {/* Search Input Bar */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-space-400"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar sintoma ou procedimento offline... ex.: dor no peito, dente, visão, ultrassom"
          className="w-full bg-space-900 border border-space-700 rounded-xl pl-10 pr-4 py-2.5 text-xs lg:text-sm text-white placeholder-space-500 focus:outline-none focus:border-astro-cyan transition-colors"
        />
      </div>

      {/* Suggested Protocol Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-space-400 font-mono">Protocolos Recomendados:</span>
        {MEDICAL_PROTOCOLS.map((p) => {
          const isSelected = selectedProtocol?.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedProtocol(p)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-astro-cyan text-space-950 shadow-glow-cyan font-bold'
                  : 'bg-space-850 hover:bg-space-800 text-space-300 border border-space-750'
              }`}
            >
              <Stethoscope size={13} />
              <span>{p.name.split('(')[0].trim()}</span>
              {isSelected && <CheckCircle2 size={12} />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
