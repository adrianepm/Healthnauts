import { StatusLevel, StatusInfo } from '../types';
import { ApiAssessment } from '../services/api';

export const STATUS_CONFIG: Record<StatusLevel, StatusInfo> = {
  green: {
    level: 'green',
    color: '#22C55E',
    label: 'Sem sinal demonstrativo · Dentro da referência',
    iconName: 'CheckCircle',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/40',
    bgClass: 'bg-emerald-500/10',
  },
  yellow: {
    level: 'yellow',
    color: '#F59E0B',
    label: 'Atenção demonstrativa · Revisar com a tripulação',
    iconName: 'AlertTriangle',
    badgeClass: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/40',
    bgClass: 'bg-amber-500/10',
  },
  red: {
    level: 'red',
    color: '#EF4444',
    label: 'Risco demonstrativo · Avaliação prioritária',
    iconName: 'AlertOctagon',
    badgeClass: 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-glow-red animate-pulse-subtle',
    textClass: 'text-rose-400',
    borderClass: 'border-rose-500/50',
    bgClass: 'bg-rose-500/15',
  },
  gray: {
    level: 'gray',
    color: '#64748B',
    label: 'Dados insuficientes ou avaliação inativa',
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

export function assessmentToStatus(assessment?: ApiAssessment | null): {
  level: StatusLevel;
  statusText: string;
  badgeClass: string;
  iconName: 'CheckCircle' | 'AlertTriangle' | 'AlertOctagon' | 'HelpCircle';
} {
  if (!assessment) {
    return {
      level: 'gray',
      statusText: 'Sem dados',
      badgeClass: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
      iconName: 'HelpCircle',
    };
  }

  if (assessment.level === 'risk') {
    return {
      level: 'red',
      statusText: assessment.scientificCategory ? `Risco (${assessment.scientificCategory})` : 'Risco demonstrativo',
      badgeClass: 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-glow-red',
      iconName: 'AlertOctagon',
    };
  }

  if (assessment.level === 'attention') {
    return {
      level: 'yellow',
      statusText: assessment.scientificCategory ? `Atenção (${assessment.scientificCategory})` : 'Atenção demonstrativa',
      badgeClass: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
      iconName: 'AlertTriangle',
    };
  }

  switch (assessment.status) {
    case 'stale':
      return {
        level: 'gray',
        statusText: 'Dado antigo (stale)',
        badgeClass: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
        iconName: 'HelpCircle',
      };
    case 'insufficient_data':
      return {
        level: 'gray',
        statusText: 'Dados insuficientes',
        badgeClass: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
        iconName: 'HelpCircle',
      };
    case 'baseline_collecting':
      return {
        level: 'gray',
        statusText: 'Coletando baseline',
        badgeClass: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
        iconName: 'HelpCircle',
      };
    case 'baseline_insufficient':
      return {
        level: 'gray',
        statusText: 'Baseline insuficiente',
        badgeClass: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
        iconName: 'HelpCircle',
      };
    case 'not_applicable':
      return {
        level: 'gray',
        statusText: 'Recorded — automatic assessment unavailable',
        badgeClass: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
        iconName: 'HelpCircle',
      };
    case 'assessed':
    case 'no_demonstrative_signal':
    default:
      return {
        level: 'green',
        statusText: assessment.scientificCategory ? `Nominal (${assessment.scientificCategory})` : 'Nominal demonstrativo',
        badgeClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
        iconName: 'CheckCircle',
      };
  }
}

export function formatTrend(trend: 'up' | 'down' | 'stable' | 'increase' | 'decrease' | 'unchanged' | null): {
  text: string;
  arrow: string;
  class: string;
} {
  switch (trend) {
    case 'up':
    case 'increase':
      return { text: 'Subindo', arrow: '↑', class: 'text-amber-400' };
    case 'down':
    case 'decrease':
      return { text: 'Descendo', arrow: '↓', class: 'text-emerald-400' };
    case 'stable':
    case 'unchanged':
    default:
      return { text: 'Estável', arrow: '→', class: 'text-slate-400' };
  }
}
