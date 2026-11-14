import React from 'react';
import { useStore } from '../store/useStore';
import { KitItem } from '../types';
import { StatusPill } from './StatusPill';
import { BriefcaseMedical, AlertTriangle, Info, MapPin } from 'lucide-react';

export const MedKitInventory: React.FC = () => {
  const { kitInventory, openMetricDetailModal } = useStore();

  const handleOpenDetail = (item: KitItem) => {
    openMetricDetailModal({
      title: item.name,
      subtitle: `Categoria: ${item.category} · ${item.location}`,
      value: `${item.stockPercent}%`,
      unit: `(${item.quantity})`,
      level: item.level,
      whyMeasure: item.whyCrucial,
      whatToDo:
        item.level === 'red'
          ? 'ESTOQUE CRÍTICO: Iniciar racionamento imediato. Acionar o gerador eletrolítico a bordo ou solicitar prioridade de sintetização por bioimpressora molecular.'
          : item.level === 'yellow'
          ? 'ESTOQUE EM ALERTA: Monitorar uso nas próximas 72 horas e preparar protocolo de reposição planejada.'
          : 'Estoque nominal seguro para a fase atual da missão.',
    });
  };

  const getBarColor = (level: string) => {
    switch (level) {
      case 'red':
        return 'bg-rose-500';
      case 'yellow':
        return 'bg-amber-500';
      case 'green':
        return 'bg-emerald-500';
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
            <BriefcaseMedical size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Kit Médico a Bordo (Estoque Crítico)
            </h3>
            <p className="text-[11px] text-space-400">
              Farmácia e insumos essenciais de emergência
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-space-400 bg-space-800 px-2 py-0.5 rounded border border-space-700">
          6 CATEGORIAS
        </span>
      </div>

      <div className="space-y-3.5">
        {kitInventory.map((item) => (
          <div
            key={item.id}
            onClick={() => handleOpenDetail(item)}
            className="p-3 rounded-xl bg-space-900/80 border border-space-750 hover:border-space-600 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2 truncate">
                <span className="font-semibold text-xs text-white group-hover:text-astro-cyan transition-colors truncate">
                  {item.name}
                </span>
                <span className="text-[10px] text-space-400 font-mono hidden sm:inline">
                  {item.quantity}
                </span>
              </div>
              <StatusPill level={item.level} size="sm" />
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-2.5">
              <div className="flex-1 h-2 bg-space-800 rounded-full overflow-hidden border border-space-700">
                <div
                  className={`h-full ${getBarColor(item.level)} transition-all duration-500`}
                  style={{ width: `${item.stockPercent}%` }}
                />
              </div>
              <span className="font-mono text-xs font-bold text-space-200 min-w-[2.5rem] text-right">
                {item.stockPercent}%
              </span>
            </div>

            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-space-800 text-[10px] text-space-400">
              <span className="flex items-center gap-1 truncate">
                <MapPin size={11} className="text-astro-cyan shrink-0" />
                <span className="truncate">{item.location}</span>
              </span>
              <span className="text-astro-cyan shrink-0 font-medium">Toque para detalhes</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
