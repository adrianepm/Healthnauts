import React from 'react';
import { motion } from 'framer-motion';
import { BodyMap } from '../components/BodyMap';
import { GravitySelector } from '../components/GravitySelector';
import { BoneTrendChart } from '../components/BoneTrendChart';
import { ExerciseRings } from '../components/ExerciseRings';
import { QuickTestCards } from '../components/QuickTestCards';
import { StatusPill } from '../components/StatusPill';
import { Bone, Activity, Dumbbell, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';

export const Gravidade: React.FC = () => {
  const { openMetricDetailModal } = useStore();

  const lossSummary = [
    {
      id: 'bone-hip',
      name: 'Ossos (Colo do Fêmur / Quadril)',
      value: '-3,1%',
      level: 'red' as const,
      sub: 'Acima da taxa limite de -1,2%/mês',
      reason: 'Desmineralização acelerada por ausência de peso corpóreo nos membros inferiores.',
      action: 'Aumentar carga excêntrica no ARED para 140 kg em agachamento guiado.',
    },
    {
      id: 'muscle-legs',
      name: 'Músculo (Panturrilhas & Quadríceps)',
      value: '-6,0%',
      level: 'yellow' as const,
      sub: 'Atrofia sarcopênica leve de fibras tipo 1',
      reason: 'As fibras posturais lentas perdem volume por falta de contração isométrica antigravitacional contínua.',
      action: 'Sessão diária de 45 min no cicloergômetro com alta resistência e esteira T2.',
    },
    {
      id: 'heart-remodel',
      name: 'Coração (Remodelamento Miocárdico)',
      value: 'Ok (Nominal)',
      level: 'green' as const,
      sub: 'Volume sistólico e débito compensados',
      reason: 'A menor sobrecarga hidrostática causa adaptação fisiológica benigna do VE.',
      action: 'Manter intervalos aeróbicos de alta intensidade HIIT (4x4 min).',
    },
    {
      id: 'eyes-sans',
      name: 'Visão (Hipertensão Intracraniana / SANS)',
      value: 'Atenção Leve',
      level: 'yellow' as const,
      sub: 'Edema de papila grau 1 detectado',
      reason: 'Migração de fluidos para a cabeça gera pressão retrógrada no polo posterior ocular.',
      action: 'Sessão diária de 60 min com dispositivo de pressão negativa LBNP (-25 mmHg).',
    },
  ];

  const handleOpenDetail = (item: typeof lossSummary[0]) => {
    openMetricDetailModal({
      title: item.name,
      subtitle: item.sub,
      value: item.value,
      level: item.level,
      whyMeasure: item.reason,
      whatToDo: item.action,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Coluna Esquerda: BodyMap + Resumo de Perda Estimada */}
        <div className="lg:col-span-5 space-y-4">
          <BodyMap />

          {/* Quick Impact List */}
          <div className="p-4 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card space-y-2.5">
            <h3 className="text-xs font-bold text-space-300 uppercase tracking-wider font-mono">
              Impactos Fisiológicos do Campo Gravitacional
            </h3>
            {lossSummary.map((item) => (
              <div
                key={item.id}
                onClick={() => handleOpenDetail(item)}
                className="p-3 rounded-xl bg-space-900/90 border border-space-750 hover:border-space-600 transition-all cursor-pointer group flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-xs text-white group-hover:text-astro-cyan transition-colors">
                    {item.name}
                  </h4>
                  <p className="text-[10px] text-space-400 mt-0.5">{item.sub}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-white">
                    {item.value}
                  </span>
                  <StatusPill level={item.level} size="sm" showIcon={false} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna Direita: Seletor, Projeção Óssea, Anéis e Testes */}
        <div className="lg:col-span-7 space-y-5">
          <GravitySelector />
          <BoneTrendChart />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ExerciseRings />
            <QuickTestCards />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
