import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusLevel } from '../types';
import { StatusPill } from './StatusPill';
import { ChevronRight, Info, Database } from 'lucide-react';
import { useStore } from '../store/useStore';

export interface AreaHazardData {
  id: string;
  areaId: string;
  title: string;
  subtitle: string;
  level: StatusLevel;
  route: string;
  dataStatus: 'available' | 'no_data';
  recordCount: number;
  lastRecordedAt: string | null;
  highlights?: any[];
  whyMeasure?: string;
  whatToDo?: string;
}

interface HazardCardProps {
  hazard: AreaHazardData;
}

export const HazardCard: React.FC<HazardCardProps> = ({ hazard }) => {
  const navigate = useNavigate();
  const { openMetricDetailModal } = useStore();

  const handleOpenInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    openMetricDetailModal({
      title: hazard.title,
      subtitle: `${hazard.subtitle} · Status dos dados: ${hazard.dataStatus === 'available' ? 'Disponível' : 'Sem dados'}`,
      value: `${hazard.recordCount} registros`,
      level: hazard.level,
      whyMeasure: hazard.whyMeasure || 'Monitoramento prioritário dos 5 perigos de voo espacial humano da NASA.',
      whatToDo: hazard.whatToDo || 'Acesse a tela dedicada para visualizar séries temporais, referências e lançar operações.',
      recordedAt: hazard.lastRecordedAt || undefined,
    });
  };

  const getBorderColor = () => {
    switch (hazard.level) {
      case 'red':
        return 'border-l-rose-500';
      case 'yellow':
        return 'border-l-amber-500';
      case 'green':
        return 'border-l-emerald-500';
      default:
        return 'border-l-slate-500';
    }
  };

  return (
    <div
      onClick={() => navigate(hazard.route)}
      className={`group relative p-3.5 rounded-xl bg-space-850/90 border border-space-700/80 border-l-4 ${getBorderColor()} hover:bg-space-800 transition-all cursor-pointer shadow-card`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-xs lg:text-sm text-white group-hover:text-astro-cyan transition-colors">
            {hazard.title}
          </h3>
          <button
            onClick={handleOpenInfo}
            className="p-1 rounded-md text-space-400 hover:text-white hover:bg-space-700 transition-colors"
            title="Detalhes do perigo aeroespacial"
          >
            <Info size={13} />
          </button>
        </div>
        <StatusPill level={hazard.level} size="sm" />
      </div>

      <p className="text-[11px] text-space-300 mb-2.5 leading-snug">{hazard.subtitle}</p>

      {/* Telemetry info & arrow */}
      <div className="flex items-center justify-between pt-1 border-t border-space-800/80 text-[10px] text-space-400 font-mono">
        <div className="flex items-center gap-2">
          <Database size={11} className="text-space-500" />
          <span>{hazard.recordCount} registros</span>
          {hazard.lastRecordedAt && (
            <span className="hidden sm:inline">
              · {new Date(hazard.lastRecordedAt).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-space-400 group-hover:text-astro-cyan transition-colors">
          <span className="font-sans font-semibold text-[11px]">Abrir área</span>
          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};
