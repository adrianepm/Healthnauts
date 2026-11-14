import React from 'react';
import { useStore } from '../store/useStore';
import { SparkLine } from './SparkLine';
import { Activity, TrendingUp, AlertTriangle } from 'lucide-react';

export const ScoreRing: React.FC = () => {
  const { score, worstFactor, openMetricDetailModal } = useStore();

  const radius = 54;
  const stroke = 9;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const handleOpenDetail = () => {
    openMetricDetailModal({
      title: 'Pontuação Global de Saúde (AstroScore)',
      subtitle: 'Algoritmo multicritério ponderado para espaço profundo',
      value: `${score} / 100`,
      level: 'green',
      whyMeasure:
        'Sintetiza variáveis hemodinâmicas, radiológicas, sono, humor, densidade óssea e atmosfera em um único índice de prontidão biológica.',
      whatToDo:
        'Estado ótimo para as demandas operacionais da missão. Foco primário na manutenção da rotina de contra-medidas ósseas (ARED).',
    });
  };

  return (
    <div
      onClick={handleOpenDetail}
      className="p-5 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card hover:border-astro-cyan/40 transition-all cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
            <Activity size={18} />
          </div>
          <h2 className="text-sm font-bold tracking-wide text-white">
            Pontuação de Saúde
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
            {/* Progress ring with gradient */}
            <circle
              stroke="#22C55E"
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
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Estado geral: BOM
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-space-300">
            <TrendingUp size={14} className="text-emerald-400" />
            <span>vs. semana passada</span>
            <span className="font-mono font-bold text-emerald-400">+3 pts</span>
            <div className="hidden sm:block ml-auto">
              <SparkLine data={[78, 79, 79, 81, 80, 81, 82]} color="#22C55E" width={60} height={20} />
            </div>
          </div>

          {/* Worst Factor highlight */}
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs">
            <AlertTriangle size={13} className="text-rose-400 shrink-0" />
            <span className="text-space-300 text-[11px]">Pior fator hoje:</span>
            <span className="font-semibold text-rose-300 text-[11px] truncate">
              {worstFactor}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
