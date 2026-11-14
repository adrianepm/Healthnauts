import React from 'react';
import { useStore } from '../store/useStore';
import { ShieldAlert, Zap, AlertTriangle, HelpCircle } from 'lucide-react';
import { StatusPill } from './StatusPill';
import { ApiAssessment, ApiRecord } from '../services/api';
import { StatusLevel } from '../types';

interface DoseGaugeProps {
  careerAssessment?: ApiAssessment | null;
  latestAccumulated?: ApiRecord | null;
  latestRate?: ApiRecord | null;
}

export const DoseGauge: React.FC<DoseGaugeProps> = ({
  careerAssessment,
  latestAccumulated,
  latestRate,
}) => {
  const { openMetricDetailModal } = useStore();

  const maxBudget = 600; // NASA career limit in mSv
  const careerValue = careerAssessment?.value; // number or null
  const hasCareerData = careerAssessment?.status === 'assessed' && typeof careerValue === 'number';

  const percentUsed = hasCareerData ? Math.round((careerValue / maxBudget) * 100) : 0;
  const statusLevel: StatusLevel = careerAssessment?.level === 'risk'
    ? 'red'
    : careerAssessment?.level === 'attention'
    ? 'yellow'
    : hasCareerData
    ? 'green'
    : 'gray';

  const radius = 80;
  const stroke = 14;
  const normalizedRadius = radius - stroke;
  const arcLength = Math.PI * normalizedRadius;
  const strokeDashoffset = arcLength - (Math.min(100, Math.max(0, percentUsed)) / 100) * arcLength;

  const handleOpenDetail = () => {
    openMetricDetailModal({
      title: 'Dose Efetiva de Carreira em Voo Espacial',
      subtitle: 'NASA-STD-3001 Vol. 1 Rev. C, §4.8 / V1 4030 (< 600 mSv)',
      value: hasCareerData ? `${careerValue} mSv` : 'Insuficiente',
      unit: `de ${maxBudget} mSv`,
      level: statusLevel,
      whyMeasure:
        'A dose efetiva de carreira avalia a exposição acumulada a radiação ionizante ao longo da vida profissional do astronauta para controle do risco induzido de mortalidade por câncer (REID).',
      whatToDo:
        careerAssessment?.status === 'insufficient_data'
          ? 'Avaliação de carreira requer histórico prévio atestado e contabilidade contínua de missão com metodologia NASA_Q. Limites por órgão permanecem inativos nesta API.'
          : careerAssessment?.message || 'Acompanhar contador dosimétrico e dosímetros pessoais de peito.',
      ruleId: careerAssessment?.rule?.id || 'spaceflight_career_dose',
      ruleVersion: careerAssessment?.rule?.version || 1,
      ruleSource: careerAssessment?.rule?.source,
      limitation: careerAssessment?.limitation || 'Regras de órgão inativas. Bandas de 75% e 90% são demonstrativas.',
      scientificCategory: careerAssessment?.scientificCategory || undefined,
      status: careerAssessment?.status,
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
              Dose de Carreira Espacial
            </h2>
            <p className="text-[11px] text-space-400">
              Limite de carreira NASA (&lt; 600 mSv)
            </p>
          </div>
        </div>
        <StatusPill level={statusLevel} size="sm" />
      </div>

      <div className="flex flex-col items-center justify-center my-1">
        {/* Semicircle Gauge SVG */}
        <div className="relative w-48 h-28 flex items-end justify-center overflow-hidden">
          <svg viewBox="0 0 180 100" className="w-full h-full overflow-visible">
            <path
              d="M 10 90 A 80 80 0 0 1 170 90"
              fill="none"
              stroke="#1E293B"
              strokeWidth={stroke}
              strokeLinecap="round"
            />
            {hasCareerData && (
              <path
                d="M 10 90 A 80 80 0 0 1 170 90"
                fill="none"
                stroke={statusLevel === 'red' ? '#EF4444' : statusLevel === 'yellow' ? '#F59E0B' : '#22C55E'}
                strokeWidth={stroke}
                strokeDasharray={`${arcLength} ${arcLength}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            )}
          </svg>

          <div className="absolute bottom-1 flex flex-col items-center text-center">
            {hasCareerData ? (
              <>
                <span className="text-2xl font-black font-mono text-white tracking-tight">
                  {careerValue}{' '}
                  <span className="text-xs font-normal text-space-300">mSv</span>
                </span>
                <span className="text-[10px] text-space-400 font-mono">
                  {percentUsed}% de {maxBudget} mSv máx
                </span>
              </>
            ) : (
              <>
                <span className="text-sm font-bold font-mono text-space-300">
                  Dados Insuficientes
                </span>
                <span className="text-[10px] text-space-500 font-mono">
                  Histórico NASA_Q pendente
                </span>
              </>
            )}
          </div>
        </div>

        {/* Counter and rate */}
        <div className="w-full mt-3 pt-3 border-t border-space-700/60 grid grid-cols-2 gap-2 text-center text-xs">
          <div className="p-2 rounded-lg bg-space-900/80 border border-space-800">
            <span className="text-space-400 text-[10px] block font-mono">
              TAXA DE DOSE
            </span>
            <span className="text-xs font-bold font-mono text-white">
              {latestRate ? `${latestRate.value} ${latestRate.unit || 'uSv/h'}` : '12 uSv/h'}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-space-900/80 border border-space-800">
            <span className="text-space-400 text-[10px] block font-mono">
              CONTADOR ACUMULADO
            </span>
            <span className="text-xs font-bold font-mono text-white">
              {latestAccumulated ? `${latestAccumulated.value} ${latestAccumulated.unit || 'uSv'}` : '140 uSv'}
            </span>
          </div>
        </div>

        {/* Inactive organ limits disclaimer */}
        <div className="mt-2 text-[10px] text-space-500 font-mono text-center">
          Limites por órgão inativos na API · Sem conversão inventada no cliente
        </div>
      </div>
    </div>
  );
};
