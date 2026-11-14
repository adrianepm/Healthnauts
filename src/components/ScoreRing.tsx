import React from 'react';
import { useStore } from '../store/useStore';
import { SparkLine } from './SparkLine';
import { Activity, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';
import { StatusLevel } from '../types';

interface ScoreRingProps {
  apiScore?: number;
  apiWorstFactor?: string;
  apiLevel?: StatusLevel;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  apiScore,
  apiWorstFactor,
  apiLevel = 'green',
}) => {
  const { score: defaultScore, worstFactor: defaultWorst, openMetricDetailModal } = useStore();

  const score = apiScore !== undefined ? apiScore : defaultScore;
  const worstFactor = apiWorstFactor !== undefined ? apiWorstFactor : defaultWorst;
  const level = apiLevel;

  const radius = 54;
  const stroke = 9;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  const getRingColor = () => {
    switch (level) {
      case 'red':
        return '#EF4444';
      case 'yellow':
        return '#F59E0B';
      case 'green':
      default:
        return '#22C55E';
    }
  };

  const handleOpenDetail = () => {
    openMetricDetailModal({
      title: 'Pontuação Global de Prontidão (AstroScore)',
      subtitle: 'Algoritmo multicritério ponderado para espaço profundo',
      value: `${score} / 100`,
      level,
      whyMeasure:
        'Sintetiza variáveis das cinco áreas (radiação, sono/vigilância, atmosfera, hemodinâmica e distância) a partir dos retornos da API em um indicador sintético de prontidão da tripulação.',
      whatToDo:
        level === 'red'
          ? 'Avaliação de risco ativa detectada nas regras do back-end. Priorize a inspeção dos alertas da área correspondente e acione o canal médico.'
          : level === 'yellow'
          ? 'Regras de atenção acionadas. Revise as diretrizes da tripulação e contramedidas recomendadas.'
          : 'Estado nominal demonstrativo para as demandas operacionais da missão.',
    });
  };

  return (
    <div
      onClick={handleOpenDetail}
      className="p-5 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card hover:border-astro-cyan/40 transition-all cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg ${
              level === 'red'
                ? 'bg-rose-500/15 text-rose-400'
                : level === 'yellow'
                ? 'bg-amber-500/15 text-amber-400'
                : 'bg-emerald-500/15 text-emerald-400'
            }`}
          >
            <Activity size={18} />
          </div>
          <h2 className="text-sm font-bold tracking-wide text-white">
            Pontuação de Saúde & Prontidão
          </h2>
        </div>
        <span className="text-[11px] font-mono text-space-400 group-hover:text-astro-cyan transition-colors">
          Toque para detalhes
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Progress Ring */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg height={radius * 2} width={radius * 2} className="-rotate-90">
            {/* Background ring */}
            <circle
              stroke="#1E293B"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            {/* Progress ring with state color */}
            <circle
              stroke={getRingColor()}
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={`${circumference} ${circumference}`}
              style={{ strokeDashoffset }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-2xl font-black font-mono text-white tracking-tight">
              {score}
            </span>
            <span className="text-[10px] text-space-400 font-mono">/ 100</span>
          </div>
        </div>

        {/* Status text & Trend */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-xs font-bold border ${
                level === 'red'
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  : level === 'yellow'
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}
            >
              {level === 'red' ? 'ATENÇÃO CRÍTICA' : level === 'yellow' ? 'REVISÃO INDICADA' : 'ESTADO NOMINAL'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-space-300">
            <TrendingUp size={14} className="text-emerald-400" />
            <span>Telemetria agregada</span>
            <span className="font-mono font-bold text-astro-cyan">5 Áreas</span>
          </div>

          {/* Worst Factor highlight */}
          <div
            className={`flex items-center gap-1.5 p-2 rounded-lg border text-xs ${
              level === 'red'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                : level === 'yellow'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                : 'bg-space-900 border-space-750 text-space-300'
            }`}
          >
            {level === 'red' || level === 'yellow' ? (
              <AlertTriangle size={13} className="shrink-0" />
            ) : (
              <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
            )}
            <span className="text-[11px] truncate">
              {worstFactor}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
