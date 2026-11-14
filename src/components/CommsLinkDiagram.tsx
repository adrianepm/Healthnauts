import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Radio, Globe, Rocket, ShieldCheck, Clock, Signal } from 'lucide-react';

export const CommsLinkDiagram: React.FC = () => {
  const { commsInfo } = useStore();
  const [secondsRemaining, setSecondsRemaining] = useState(commsInfo.oneWayDelaySeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev <= 1 ? commsInfo.oneWayDelaySeconds : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [commsInfo.oneWayDelaySeconds]);

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;

  return (
    <div className="p-5 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card">
      {/* Header and Telemetry badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/15 text-astro-cyan">
            <Radio size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Diagrama de Telemetria & Link de Comunicação
            </h3>
            <p className="text-[11px] text-space-400">
              Distância: {commsInfo.distanceKmMillion} milhões de km · Deep Space Network (DSN)
            </p>
          </div>
        </div>

        {/* Autonomy Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-sky-500/10 border border-astro-cyan/30 text-xs">
          <ShieldCheck size={15} className="text-astro-cyan shrink-0" />
          <span className="font-bold text-white">Nível 3 de Autonomia Médica</span>
          <span className="text-[10px] text-astro-cyan font-mono">(Decisão a Bordo)</span>
        </div>
      </div>

      {/* Animated Orbit / Link Diagram */}
      <div className="relative p-6 rounded-xl bg-space-900 border border-space-700/70 overflow-hidden flex flex-col items-center justify-center">
        {/* Animated Radio Wave Packets */}
        <div className="w-full flex items-center justify-between relative px-4 lg:px-12 py-6">
          {/* Earth */}
          <div className="flex flex-col items-center z-10">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] border-2 border-sky-300">
              <Globe size={26} className="text-white animate-spin-slow" />
            </div>
            <span className="text-xs font-bold text-white mt-2">Terra (JSC)</span>
            <span className="text-[10px] font-mono text-space-400">Estação de Controle</span>
          </div>

          {/* DSN Link Line with Traveling Data Packets */}
          <div className="flex-1 relative mx-6 h-1 bg-space-700 rounded-full flex items-center">
            {/* Packet 1 (Earth -> Ship) */}
            <motion.div
              className="absolute w-3 h-3 rounded-full bg-astro-cyan shadow-[0_0_10px_#38bdf8]"
              animate={{ left: ['0%', '100%'] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: 'linear' }}
            />
            {/* Packet 2 (Ship -> Earth) */}
            <motion.div
              className="absolute w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_#22c55e]"
              animate={{ right: ['0%', '100%'] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: 'linear', delay: 2.2 }}
            />
          </div>

          {/* Spacecraft Ares-1 */}
          <div className="flex flex-col items-center z-10">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-glow-cyan border-2 border-astro-cyan">
              <Rocket size={24} className="text-white" />
            </div>
            <span className="text-xs font-bold text-white mt-2">Ares-1 (Nave)</span>
            <span className="text-[10px] font-mono text-astro-cyan">Você a Bordo</span>
          </div>
        </div>

        {/* Central delay counter overlay */}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-space-850 px-3 py-1.5 rounded-lg border border-space-750">
            <Clock size={13} className="text-amber-400" />
            <span className="text-space-400">Atraso Ida:</span>
            <span className="font-bold text-white">8 min 14 s</span>
          </div>
          <div className="flex items-center gap-1.5 bg-space-850 px-3 py-1.5 rounded-lg border border-space-750">
            <Clock size={13} className="text-rose-400" />
            <span className="text-space-400">Ida e Volta:</span>
            <span className="font-bold text-white">16 min 28 s</span>
          </div>
          <div className="flex items-center gap-1.5 bg-space-850 px-3 py-1.5 rounded-lg border border-space-750">
            <Signal size={13} className="text-emerald-400" />
            <span className="text-space-400">Próxima Janela DSN:</span>
            <span className="font-bold text-emerald-400">{commsInfo.nextCommsWindow}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
