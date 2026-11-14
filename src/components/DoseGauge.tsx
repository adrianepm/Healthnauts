import React from 'react';
import { useStore } from '../store/useStore';
import { ShieldAlert, Zap, AlertTriangle } from 'lucide-react';
import { StatusPill } from './StatusPill';

export const DoseGauge: React.FC = () => {
  const { cumulativeDose, dailyRadiationRate, openMetricDetailModal } = useStore();

  const maxBudget = 600;
  const percentUsed = Math.round((cumulativeDose / maxBudget) * 100);
  const statusLevel = percentUsed > 80 ? 'red' : percentUsed >= 50 ? 'yellow' : 'green';

  const radius = 80;
  const stroke = 14;
  const normalizedRadius = radius - stroke;
  // Semicircle arc: circumference = PI * radius
  const arcLength = Math.PI * normalizedRadius;
  const strokeDashoffset = arcLength - (percentUsed / 100) * arcLength;

  const handleOpenDetail = () => {
    openMetricDetailModal({
      title: 'Dose Cumulativa de Radiação Ionizante',
      subtitle: 'Exposição a Raios Cósmicos Galácticos (GCR) e Vento Solar',
      value: `${cumulativeDose} mSv`,
      unit: `de ${maxBudget} mSv`,
      level: statusLevel,
      whyMeasure:
        'A exposição prolongada a íons pesados causa quebras de dupla fita no DNA, elevando o risco de câncer ao longo da vida e danificando a microvasculatura retiniana e cerebral.',
      whatToDo:
        'Mantenha monitoramento diário do dosímetro pessoal de peito (TLD/OSL). Durante eventos de prótons solares, permaneça no interior do Módulo B cercado pelos tanques de água.',
    });
  };

  return (
    <div
      onClick={handleOpenDetail}
      className="p-5 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card hover:border-amber-500/50 transition-all cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
            <Zap size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Dose Acumulada da Missão
            </h2>
            <p className="text-[11px] text-space-400">
              Orçamento radiológico total
            </p>
          </div>
        </div>
        <StatusPill level={statusLevel} size="sm" />
      </div>

      <div className="flex flex-col items-center justify-center my-1">
        {/* Semicircle Gauge SVG */}
        <div className="relative w-48 h-28 flex items-end justify-center overflow-hidden">
          <svg
            viewBox="0 0 180 100"
            className="w-full h-full overflow-visible"
          >
            {/* Background Arc */}
            <path
              d="M 10 90 A 80 80 0 0 1 170 90"
              fill="none"
              stroke="#1E293B"
              strokeWidth={stroke}
              strokeLinecap="round"
            />
            {/* Value Arc */}
            <path
              d="M 10 90 A 80 80 0 0 1 170 90"
              fill="none"
              stroke="#F59E0B"
              strokeWidth={stroke}
              strokeDasharray={`${arcLength} ${arcLength}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          <div className="absolute bottom-1 flex flex-col items-center text-center">
            <span className="text-2xl font-black font-mono text-white tracking-tight">
              {cumulativeDose}{' '}
              <span className="text-xs font-normal text-space-300">mSv</span>
            </span>
            <span className="text-[10px] text-space-400 font-mono">
              de {maxBudget} mSv máx
            </span>
          </div>
        </div>

        {/* Rate & Budget used */}
        <div className="w-full mt-3 pt-3 border-t border-space-700/60 grid grid-cols-2 gap-2 text-center text-xs">
          <div className="p-2 rounded-lg bg-space-900/80 border border-space-800">
            <span className="text-space-400 text-[10px] block font-mono">
              TAXA ATUAL
            </span>
            <span className="font-mono font-bold text-amber-400">
              {dailyRadiationRate} mSv/dia
            </span>
          </div>

          <div className="p-2 rounded-lg bg-space-900/80 border border-space-800">
            <span className="text-space-400 text-[10px] block font-mono">
              ORÇAMENTO
            </span>
            <span className="font-mono font-bold text-amber-400">
              {percentUsed}% usado
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
