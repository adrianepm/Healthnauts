import React from 'react';
import { MOCK_GRAVITY_DATA } from '../mock/gravidade';
import { Dumbbell, Activity, Check } from 'lucide-react';
import { useStore } from '../store/useStore';

export const ExerciseRings: React.FC = () => {
  const { openMetricDetailModal } = useStore();
  const rings = MOCK_GRAVITY_DATA.exerciseRings;

  const handleOpenDetail = (ring: typeof rings[0]) => {
    openMetricDetailModal({
      title: `Contramedida Gravitacional: ${ring.name}`,
      subtitle: `Metas semanais de sobrecarga mecânica`,
      value: `${ring.current} de ${ring.target}`,
      unit: ring.unit,
      level: ring.current >= ring.target ? 'green' : 'yellow',
      whyMeasure:
        'A estimulação mecânica piezoelétrica nos osteoblastos através do ARED e esteira T2 é o único método não farmacológico eficaz para frear a reabsorção óssea e manter a força das pernas.',
      whatToDo:
        'Completar as sessões pendentes na janela das 17:00 às 19:30 UTC. Mantenha hidratação prévia com eletrólitos.',
    });
  };

  return (
    <div className="p-5 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/15 text-astro-cyan">
            <Dumbbell size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Exercício Desta Semana
            </h3>
            <p className="text-[11px] text-space-400">
              Contramedidas ativas contra atrofia
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-space-400 bg-space-800 px-2 py-0.5 rounded border border-space-700">
          SEMANA 27
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {rings.map((ring) => {
          const percent = Math.min(100, Math.round((ring.current / ring.target) * 100));
          const radius = 32;
          const stroke = 6;
          const normalizedRadius = radius - stroke;
          const circumference = normalizedRadius * 2 * Math.PI;
          const strokeDashoffset = circumference - (percent / 100) * circumference;

          return (
            <div
              key={ring.id}
              onClick={() => handleOpenDetail(ring)}
              className="p-3 rounded-xl bg-space-900/80 border border-space-750 hover:border-space-600 transition-all cursor-pointer flex flex-col items-center text-center group"
            >
              {/* SVG Ring */}
              <div className="relative w-20 h-20 flex items-center justify-center my-1">
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
                    stroke={ring.color}
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
                  <span className="text-sm font-black font-mono text-white">
                    {ring.current}/{ring.target}
                  </span>
                </div>
              </div>

              <span className="font-bold text-xs text-white group-hover:text-astro-cyan transition-colors mt-1">
                {ring.name.split(' ')[0]}
              </span>
              <span className="text-[10px] text-space-400 font-mono">
                {percent}% meta
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
