import React from 'react';
import { motion } from 'framer-motion';
import { ScoreRing } from '../components/ScoreRing';
import { HazardCard } from '../components/HazardCard';
import { VitalTile } from '../components/VitalTile';
import { BodyMap } from '../components/BodyMap';
import { TaskList } from '../components/TaskList';
import { AlertList } from '../components/AlertList';
import { useStore } from '../store/useStore';
import { MISSION_HAZARDS } from '../mock/vitais';

export const Geral: React.FC = () => {
  const { vitalSigns } = useStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* 3-Column Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Coluna Esquerda: Corpo Humano Interativo & Tarefas do Dia */}
        <div className="lg:col-span-4 space-y-5">
          <BodyMap />
          <TaskList />
        </div>

        {/* Coluna Central: Score Ring & 5 Perigos da Missão */}
        <div className="lg:col-span-4 space-y-5">
          <ScoreRing />

          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-space-300 uppercase tracking-wider font-mono">
                5 Perigos da Missão (NASA Biohazards)
              </h3>
              <span className="text-[10px] text-space-500 font-mono">
                Clique para navegar
              </span>
            </div>
            {MISSION_HAZARDS.map((hazard) => (
              <HazardCard key={hazard.id} hazard={hazard} />
            ))}
          </div>
        </div>

        {/* Coluna Direita: 6 Sinais Vitais & Alertas Priorizados */}
        <div className="lg:col-span-4 space-y-5">
          {/* 6 Vital Tiles (2x3 grid) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-space-300 uppercase tracking-wider font-mono">
                Sinais Vitais Fisiológicos (7 Dias)
              </h3>
              <span className="text-[10px] text-space-500 font-mono">
                6 Sensores
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {vitalSigns.map((vital) => (
                <VitalTile key={vital.id} vital={vital} />
              ))}
            </div>
          </div>

          <AlertList />
        </div>
      </div>
    </motion.div>
  );
};
