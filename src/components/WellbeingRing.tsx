import React from 'react';
import { useStore } from '../store/useStore';
import { SparkLine } from './SparkLine';
import { HeartHandshake, TrendingDown, Info } from 'lucide-react';
import { StatusPill } from './StatusPill';

export const WellbeingRing: React.FC = () => {
  const { isolationData, openMetricDetailModal } = useStore();
  const score = isolationData.who5Score;

  const radius = 56;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const handleOpenDetail = () => {
    openMetricDetailModal({
      title: 'Índice de Bem-Estar Emocional WHO-5',
      subtitle: 'Escala clínica validada pela Organização Mundial da Saúde adaptada para astronautas',
      value: `${score} / 100`,
      level: score < 50 ? 'red' : score < 70 ? 'yellow' : 'green',
      whyMeasure:
        'O isolamento extremo e a monotonia sensorial afetam neurotransmissores (serotonina e dopamina). Pontuações abaixo de 50 correlacionam-se com risco aumentado de depressão situacional em voo.',
      whatToDo:
        'Realizar sessão de respiração guiada ou utilizar o diário de voz privado. Manter interação no jantar coletivo da tripulação.',
    });
  };

  return (
    <div
      onClick={handleOpenDetail}
      className="p-5 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card hover:border-purple-500/50 transition-all cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400">
            <HeartHandshake size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Índice de Bem-Estar WHO-5
            </h3>
            <p className="text-[11px] text-space-400">
              Escala psicométrica de saúde mental
            </p>
          </div>
        </div>
        <StatusPill level={score < 50 ? 'red' : 'green'} size="sm" />
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Progress Ring */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg height={radius * 2} width={radius * 2} className="-rotate-90">
            <circle
              stroke="#1E293B"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            <circle
              stroke="#A855F7"
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

        {/* Trend and Clinical Note */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-space-300">
              Tendência 14 dias:
            </span>
            <SparkLine
              data={[74, 76, 75, 72, 70, 65, 62, 60, 64, 66, 68]}
              color="#A855F7"
              width={65}
              height={18}
            />
          </div>

          <p className="text-[11px] text-space-300 bg-space-900/80 p-2 rounded-lg border border-space-800 leading-relaxed">
            {isolationData.who5Trend}
          </p>

          <div className="flex items-center justify-between text-[10px] font-mono text-space-400">
            <span>Alerta crítico: &lt; 50 pts</span>
            <span className="text-astro-cyan group-hover:underline">Ver detalhes</span>
          </div>
        </div>
      </div>
    </div>
  );
};
