import React from 'react';
import { StatusLevel } from '../types';
import { SparkLine } from './SparkLine';
import { StatusPill } from './StatusPill';
import { useStore } from '../store/useStore';
import { formatTrend } from '../lib/status';
import { ApiRecord } from '../services/api';

export interface VitalTileData {
  id: string;
  name: string;
  value: number | string | null;
  unit: string | null;
  level: StatusLevel;
  statusText?: string;
  trend?: 'up' | 'down' | 'stable' | 'increase' | 'decrease' | 'unchanged' | null;
  history?: number[];
  recordedAt?: string | null;
  whyMeasure?: string;
  whatToDo?: string;
  ruleId?: string;
  ruleVersion?: number;
  ruleSource?: any;
  limitation?: string;
  scientificCategory?: string;
  source?: string;
}

interface VitalTileProps {
  vital: VitalTileData;
}

export const VitalTile: React.FC<VitalTileProps> = ({ vital }) => {
  const { openMetricDetailModal } = useStore();
  const trendInfo = formatTrend(vital.trend || 'stable');

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
      subtitle: vital.statusText || 'Telemetria biomédica oficial',
      value: vital.value !== null && vital.value !== undefined ? String(vital.value) : 'Sem dado',
      unit: vital.unit || undefined,
      level: vital.level,
      whyMeasure: vital.whyMeasure || 'Parâmetro vital de monitoramento contínuo da saúde do astronauta.',
      whatToDo: vital.whatToDo || 'Avaliação conforme os limiares demonstrativos e regras oficiais do back-end.',
      ruleId: vital.ruleId,
      ruleVersion: vital.ruleVersion,
      ruleSource: vital.ruleSource,
      limitation: vital.limitation,
      scientificCategory: vital.scientificCategory,
      recordedAt: vital.recordedAt || undefined,
      source: vital.source,
    });
  };

  const displayVal = vital.value !== null && vital.value !== undefined ? vital.value : '—';

  return (
    <div
      onClick={handleOpenDetail}
      className="p-3 rounded-xl bg-space-850/90 border border-space-700/80 hover:border-astro-cyan/50 hover:bg-space-800 transition-all cursor-pointer group shadow-card flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="text-xs font-semibold text-space-200 group-hover:text-white transition-colors truncate">
            {vital.name}
          </span>
          <StatusPill level={vital.level} size="sm" showIcon={false} />
        </div>

        <div className="flex items-baseline justify-between mt-1">
          <div className="flex items-baseline gap-1">
            <span className="text-base lg:text-lg font-bold font-mono text-white">
              {displayVal}
            </span>
            {vital.unit && (
              <span className="text-[11px] font-medium text-space-400 font-mono">
                {vital.unit}
              </span>
            )}
          </div>
          {vital.trend && (
            <div className="flex items-center gap-1 text-[11px] font-mono">
              <span className={trendInfo.class}>{trendInfo.arrow}</span>
              <span className="text-space-400 text-[10px] hidden sm:inline">{trendInfo.text}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 pt-1.5 border-t border-space-700/50 flex items-center justify-between text-[10px] font-mono text-space-400">
        <span>{vital.recordedAt ? new Date(vital.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sem registro'}</span>
        {vital.history && vital.history.length > 1 ? (
          <SparkLine
            data={vital.history}
            color={getStatusColor()}
            width={60}
            height={16}
          />
        ) : (
          <span className="text-space-500">API v1</span>
        )}
      </div>
    </div>
  );
};
