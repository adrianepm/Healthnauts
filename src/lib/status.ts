import { StatusLevel, StatusInfo } from '../types';

export const STATUS_CONFIG: Record<StatusLevel, StatusInfo> = {
  green: {
    level: 'green',
    color: '#22C55E',
    label: 'Dentro do esperado · Siga a rotina',
    iconName: 'CheckCircle',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/40',
    bgClass: 'bg-emerald-500/10',
  },
  yellow: {
    level: 'yellow',
    color: '#F59E0B',
    label: 'Tendência ruim ou limite próximo · Aja hoje',
    iconName: 'AlertTriangle',
    badgeClass: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/40',
    bgClass: 'bg-amber-500/10',
  },
  red: {
    level: 'red',
    color: '#EF4444',
    label: 'Fora do limite · Aja agora e avise o cirurgião',
    iconName: 'AlertOctagon',
    badgeClass: 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-glow-red animate-pulse-subtle',
    textClass: 'text-rose-400',
    borderClass: 'border-rose-500/50',
    bgClass: 'bg-rose-500/15',
  },
  gray: {
    level: 'gray',
    color: '#64748B',
    label: 'Sem medição recente · Medição pendente',
    iconName: 'HelpCircle',
    badgeClass: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
    textClass: 'text-slate-400',
    borderClass: 'border-slate-500/40',
    bgClass: 'bg-slate-500/10',
  },
};

export function getStatusInfo(level: StatusLevel): StatusInfo {
  return STATUS_CONFIG[level] || STATUS_CONFIG.gray;
}

/**
 * Determine status level for numeric metric evaluated as "lower is better" (e.g. CO2, radiation)
 */
export function evaluateLowerIsBetter(value: number, warnThreshold: number, critThreshold: number): StatusLevel {
  if (value >= critThreshold) return 'red';
  if (value >= warnThreshold) return 'yellow';
  return 'green';
}

/**
 * Determine status level for numeric metric evaluated as "higher is better" (e.g. oxygen, sleep, stock)
 */
export function evaluateHigherIsBetter(value: number, critThreshold: number, warnThreshold: number): StatusLevel {
  if (value < critThreshold) return 'red';
  if (value < warnThreshold) return 'yellow';
  return 'green';
}

/**
 * Determine status level for numeric metric with optimal range (e.g. Heart Rate, Blood Pressure sys, Temp)
 */
export function evaluateRange(value: number, minWarn: number, minCrit: number, maxWarn: number, maxCrit: number): StatusLevel {
  if (value <= minCrit || value >= maxCrit) return 'red';
  if (value <= minWarn || value >= maxWarn) return 'yellow';
  return 'green';
}

export function formatTrend(trend: 'up' | 'down' | 'stable'): { text: string; arrow: string; class: string } {
  switch (trend) {
    case 'up':
      return { text: 'Subindo', arrow: '↑', class: 'text-amber-400' };
    case 'down':
      return { text: 'Descendo', arrow: '↓', class: 'text-emerald-400' };
    case 'stable':
    default:
      return { text: 'Estável', arrow: '→', class: 'text-slate-400' };
  }
}
