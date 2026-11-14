import React from 'react';
import { VitalSign } from '../types';
import { SparkLine } from './SparkLine';
import { StatusPill } from './StatusPill';
import { useStore } from '../store/useStore';
import { formatTrend } from '../lib/status';

interface VitalTileProps {
  vital: VitalSign;
}

export const VitalTile: React.FC<VitalTileProps> = ({ vital }) => {
  const { openMetricDetailModal } = useStore();
  const trendInfo = formatTrend(vital.trend);

  const getStatusColor = () => {
    switch (vital.level) {
      case 'red':
        return '#EF4444';
      case 'yellow':
        return '#F59E0B';
      case 'green':
        return '#22C55E';
      default:
        return '#64748B';
    }
  };

  const handleOpenDetail = () => {
    openMetricDetailModal({
      title: vital.name,
      subtitle: vital.statusText,
      value: String(vital.value),
      unit: vital.unit,
      level: vital.level,
      whyMeasure: vital.whyMeasure,
      whatToDo: vital.whatToDo,
    });
  };

  return (
    <div
      onClick={handleOpenDetail}
      className="p-3.5 rounded-xl bg-space-850/90 border border-space-700/80 hover:border-astro-cyan/50 hover:bg-space-800 transition-all cursor-pointer group shadow-card"
    >
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <span className="text-xs font-semibold text-space-200 group-hover:text-white transition-colors truncate">
          {vital.name}
        </span>
        <StatusPill level={vital.level} size="sm" showIcon={false} />
      </div>

      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-lg lg:text-xl font-bold font-mono text-white">
            {vital.value}
          </span>
          <span className="text-xs font-medium text-space-400">
            {vital.unit}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono">
          <span className={trendInfo.class}>{trendInfo.arrow}</span>
          <span className="text-space-400 text-[10px]">{trendInfo.text}</span>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-space-700/50 flex items-center justify-between">
        <span className="text-[10px] text-space-400 font-mono">Últimos 7 dias</span>
        <SparkLine
          data={vital.history7d}
          color={getStatusColor()}
          width={70}
          height={20}
        />
      </div>
    </div>
  );
};
