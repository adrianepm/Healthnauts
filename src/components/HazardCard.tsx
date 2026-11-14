import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MissionHazard } from '../types';
import { StatusPill } from './StatusPill';
import { ChevronRight, Info } from 'lucide-react';
import { useStore } from '../store/useStore';

interface HazardCardProps {
  hazard: MissionHazard;
}

export const HazardCard: React.FC<HazardCardProps> = ({ hazard }) => {
  const navigate = useNavigate();
  const { openMetricDetailModal } = useStore();

  const handleOpenInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    openMetricDetailModal({
      title: hazard.title,
      subtitle: hazard.subtitle,
      value: `${hazard.progress}%`,
      level: hazard.level,
      whyMeasure: hazard.whyMeasure,
      whatToDo: hazard.whatToDo,
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

  const getProgressColor = () => {
    switch (hazard.level) {
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
    <div
      onClick={() => navigate(hazard.route)}
      className={`group relative p-4 rounded-xl bg-space-850/90 border border-space-700/80 border-l-4 ${getBorderColor()} hover:bg-space-800 transition-all cursor-pointer shadow-card`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm text-white group-hover:text-astro-cyan transition-colors">
            {hazard.title}
          </h3>
          <button
            onClick={handleOpenInfo}
            className="p-1 rounded-md text-space-400 hover:text-white hover:bg-space-700 transition-colors"
            title="Por que medir isso? / O que fazer"
          >
            <Info size={14} />
          </button>
        </div>
        <StatusPill level={hazard.level} size="sm" />
      </div>

      <p className="text-xs text-space-300 mb-3">{hazard.subtitle}</p>

      {/* Progress Bar & Arrow */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-space-800 rounded-full overflow-hidden border border-space-700">
          <div
            className={`h-full ${getProgressColor()} transition-all duration-500`}
            style={{ width: `${hazard.progress}%` }}
          />
        </div>
        <span className="text-[11px] font-mono text-space-400">
          {hazard.progress}%
        </span>
        <ChevronRight
          size={16}
          className="text-space-400 group-hover:text-astro-cyan group-hover:translate-x-1 transition-all"
        />
      </div>
    </div>
  );
};
