import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Radio, Globe, Rocket, ShieldCheck, Clock, Signal, AlertTriangle } from 'lucide-react';
import { ApiMissionResponse } from '../services/api';

interface CommsLinkDiagramProps {
  missionData?: ApiMissionResponse | null;
}

export const CommsLinkDiagram: React.FC<CommsLinkDiagramProps> = ({ missionData }) => {
  const { commsInfo, setIsReportModalOpen } = useStore();

  const mission = missionData?.mission?.input;
  const calc = missionData?.mission?.calculation;

  const destination = mission?.destination || 'Mars';
  const activity = mission?.activity || 'routine';
  const commStatus = mission?.communication || 'delayed';
  const isSolarConjunction = Boolean(mission?.solarConjunction);

  const oneWaySeconds = mission?.oneWaySeconds !== null && mission?.oneWaySeconds !== undefined
    ? mission.oneWaySeconds
    : commsInfo.oneWayDelaySeconds;

  const estimatedResponseSeconds = calc?.estimatedResponseSeconds ?? (commStatus === 'unavailable' ? null : oneWaySeconds * 2 + 900);

  const [secondsRemaining, setSecondsRemaining] = useState(oneWaySeconds);

  useEffect(() => {
    setSecondsRemaining(oneWaySeconds);
  }, [oneWaySeconds]);

  useEffect(() => {
    if (oneWaySeconds <= 0) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev <= 1 ? oneWaySeconds : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [oneWaySeconds]);

  const mins = Math.floor(oneWaySeconds / 60);
  const secs = Math.round(oneWaySeconds % 60);

  const respMins = estimatedResponseSeconds !== null ? Math.floor(estimatedResponseSeconds / 60) : null;
  const respSecs = estimatedResponseSeconds !== null ? Math.round(estimatedResponseSeconds % 60) : null;

  return (
    <div className="p-5 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card">
      {/* Header and Telemetry badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/15 text-astro-cyan">
            <Radio size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Link de Comunicação & Contexto de Missão
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/15 text-astro-cyan border border-sky-500/30">
                Destino: {destination}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-space-300 bg-space-800 border border-space-700">
                Atividade: {activity}
              </span>
            </div>
            <p className="text-[11px] text-space-400 mt-0.5">
              Deep Space Network (DSN) · Parisi et al. (NASA Ames, 2023)
            </p>
          </div>
        </div>

        {/* Link Status & Report button */}
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold border ${
              commStatus === 'unavailable'
                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                : commStatus === 'delayed'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            }`}
          >
            <Signal size={13} />
            <span>ENLACE: {commStatus.toUpperCase()}</span>
          </span>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-3 py-1 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all"
          >
            Preparar Relatório Local (not_sent)
          </button>
        </div>
      </div>

      {isSolarConjunction && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          <span>
            <strong>Simulação de Conjunção Solar com Marte ativa:</strong> O Sol bloqueia o alinhamento de rádio direto com a Terra. Comunicação terrestre completamente indisponível. Operações exclusivamente autônomas.
          </span>
        </div>
      )}

      {/* Animated Orbit / Link Diagram */}
      <div className="relative p-6 rounded-xl bg-space-900 border border-space-700/70 overflow-hidden flex flex-col items-center justify-center">
        {/* Animated Radio Wave Packets */}
        <div className="w-full flex items-center justify-between relative px-4 lg:px-12 py-6">
          {/* Earth */}
          <div className="flex flex-col items-center z-10">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] border-2 border-sky-300">
              <Globe size={26} className="text-white animate-spin-slow" />
            </div>
            <span className="text-xs font-bold text-white mt-2">Terra (JSC / DSN)</span>
            <span className="text-[10px] font-mono text-space-400">Suporte de Solo</span>
          </div>

          {/* DSN Link Line with Traveling Data Packets */}
          <div className="flex-1 relative mx-6 h-1 bg-space-700 rounded-full flex items-center">
            {commStatus !== 'unavailable' && (
              <>
                <motion.div
                  className="absolute w-3 h-3 rounded-full bg-astro-cyan shadow-[0_0_10px_#38bdf8]"
                  animate={{ left: ['0%', '100%'] }}
                  transition={{ repeat: Infinity, duration: 4.5, ease: 'linear' }}
                />
                <motion.div
                  className="absolute w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_#22c55e]"
                  animate={{ right: ['0%', '100%'] }}
                  transition={{ repeat: Infinity, duration: 4.5, ease: 'linear', delay: 2.2 }}
                />
              </>
            )}
            {commStatus === 'unavailable' && (
              <div className="absolute inset-x-0 flex items-center justify-center">
                <span className="bg-space-950 px-2 py-0.5 rounded text-[10px] font-mono text-rose-400 border border-rose-500/40">
                  ENLACE INTERROMPIDO (OFFLINE)
                </span>
              </div>
            )}
          </div>

          {/* Spacecraft */}
          <div className="flex flex-col items-center z-10">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-glow-cyan border-2 border-astro-cyan">
              <Rocket size={24} className="text-white" />
            </div>
            <span className="text-xs font-bold text-white mt-2">Nave ({destination})</span>
            <span className="text-[10px] font-mono text-astro-cyan">Tripulação a Bordo</span>
          </div>
        </div>

        {/* Central delay counter overlay */}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-space-850 px-3 py-1.5 rounded-lg border border-space-750">
            <Clock size={13} className="text-amber-400" />
            <span className="text-space-400">Atraso de Ida (oneWaySeconds):</span>
            <span className="font-bold text-white">
              {commStatus === 'unavailable' ? 'Indisponível' : `${mins} min ${secs} s (${oneWaySeconds}s)`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-space-850 px-3 py-1.5 rounded-lg border border-space-750">
            <Clock size={13} className="text-sky-400" />
            <span className="text-space-400">Estimativa de Resposta do Solo:</span>
            <span className="font-bold text-white">
              {estimatedResponseSeconds !== null
                ? `${respMins} min ${respSecs} s`
                : 'Sem ETA (Enlace Indisponível)'}
            </span>
          </div>
        </div>

        {calc?.formula && (
          <div className="mt-2 text-[10px] text-space-400 font-mono text-center">
            Fórmula de planejamento: <code>{calc.formula}</code> · Processamento estimado: {calc.processingSeconds}s
          </div>
        )}
      </div>

      {/* Medical resources inventory if present */}
      {mission?.medicalResources && (
        <div className="mt-3 p-3 rounded-xl bg-space-900 border border-space-750 text-xs">
          <span className="text-astro-cyan font-bold block mb-1">
            Recursos Médicos a Bordo (onboard_medical_resources):
          </span>
          <p className="text-space-300 font-mono text-[11px]">{mission.medicalResources}</p>
        </div>
      )}
    </div>
  );
};
