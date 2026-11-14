import React from 'react';
import { useStore } from '../store/useStore';
import { Utensils, Camera, Plus, Droplets, Sparkles, Check } from 'lucide-react';
import { StatusPill } from './StatusPill';

export const NutritionRings: React.FC = () => {
  const { atmosphereData, setIsMealLogModalOpen, openMetricDetailModal } = useStore();
  const n = atmosphereData.nutrition;

  const items = [
    {
      id: 'calories',
      name: 'Calorias',
      current: `${n.caloriesPercent}%`,
      percent: n.caloriesPercent,
      level: 'green' as const,
      color: '#22C55E',
      sub: '2.184 / 2.800 kcal',
      why: 'Metabolismo basal acelerado pelo estresse gravitacional e treino diário.',
      what: 'Meta diária bem encaminhada para a rotina da tarde.',
    },
    {
      id: 'hydration',
      name: 'Hidratação',
      current: `${n.hydrationPercent}%`,
      percent: n.hydrationPercent,
      level: 'yellow' as const,
      color: '#F59E0B',
      sub: '1,56 / 2,6 L',
      why: 'A perda volêmica em 0g reduz o reflexo de sede, predispondo a cálculos renais e hipotensão postural.',
      what: 'Ingerir mais 500 mL de eletrólitos antes do treino resistivo de força.',
    },
    {
      id: 'protein',
      name: 'Proteína',
      current: `${n.proteinPercent}%`,
      percent: n.proteinPercent,
      level: 'green' as const,
      color: '#22C55E',
      sub: '93 / 110 g',
      why: 'Síntese de actina e miosina para conter o catabolismo muscular nos membros inferiores.',
      what: 'Ingestão ótima com base no café da manhã enriquecido com soro de leite.',
    },
    {
      id: 'vitD',
      name: 'Vit. D / Cálcio',
      current: `${n.vitDPercent}%`,
      percent: n.vitDPercent,
      level: 'red' as const,
      color: '#EF4444',
      sub: '400 / 1.000 UI',
      why: 'Ausência total de raios ultravioleta solares na cabine fechada bloqueia a conversão cutânea de pré-vitamina D3.',
      what: 'Tomar a cápsula de suplementação vitamínica diária no dispenser nutricional.',
    },
  ];

  const handleOpenDetail = (it: typeof items[0]) => {
    openMetricDetailModal({
      title: `Nutrição Espacial: ${it.name}`,
      subtitle: it.sub,
      value: it.current,
      level: it.level,
      whyMeasure: it.why,
      whatToDo: it.what,
    });
  };

  return (
    <div className="p-5 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
            <Utensils size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Nutrição & Hidratação de Hoje
            </h3>
            <p className="text-[11px] text-space-400">
              Metabolismo & suplementação micronutricional
            </p>
          </div>
        </div>

        {/* Photo Meal Log Button */}
        <button
          onClick={() => setIsMealLogModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-space-800 hover:bg-space-700 text-astro-cyan text-xs font-bold border border-astro-cyan/30 transition-all hover:shadow-glow-cyan"
        >
          <Camera size={14} />
          <span>Registrar Refeição</span>
        </button>
      </div>

      {/* 4 Nutrition Rings */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {items.map((item) => {
          const radius = 28;
          const stroke = 5;
          const normalizedRadius = radius - stroke;
          const circumference = normalizedRadius * 2 * Math.PI;
          const strokeDashoffset = circumference - (item.percent / 100) * circumference;

          return (
            <div
              key={item.id}
              onClick={() => handleOpenDetail(item)}
              className="p-3 rounded-xl bg-space-900/80 border border-space-750 hover:border-space-600 transition-all cursor-pointer flex flex-col items-center text-center group"
            >
              <div className="relative w-16 h-16 flex items-center justify-center my-1">
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
                    stroke={item.color}
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
                <div className="absolute flex flex-col items-center">
                  <span className="text-xs font-black font-mono text-white">
                    {item.percent}%
                  </span>
                </div>
              </div>

              <span className="font-bold text-xs text-white group-hover:text-astro-cyan transition-colors mt-1">
                {item.name}
              </span>
              <span className="text-[10px] text-space-400 font-mono truncate max-w-full">
                {item.sub.split('/')[0].trim()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
