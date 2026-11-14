import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { MOCK_GRAVITY_DATA } from '../mock/gravidade';
import { StatusPill } from './StatusPill';
import { X, CheckCircle2, Play, Activity, Sparkles, RefreshCw } from 'lucide-react';

export const QuickTestModal: React.FC = () => {
  const { activeQuickTestId, setActiveQuickTestId, addXP } = useStore();
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (!activeQuickTestId) return null;

  const test = MOCK_GRAVITY_DATA.quickTests.find((t) => t.id === activeQuickTestId);
  if (!test) return null;

  const handleStartTest = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setCompleted(true);
      addXP(25);
    }, 2000);
  };

  const handleClose = () => {
    setActiveQuickTestId(null);
    setCompleted(false);
    setIsRunning(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-space-850 border border-space-700 rounded-2xl shadow-2xl overflow-hidden p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-space-700/60 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{test.title}</h3>
                <StatusPill level={test.level} size="sm" />
              </div>
              <p className="text-xs text-space-300 mt-0.5">Última realização: {test.lastDone}</p>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 text-space-400 hover:text-white rounded-lg hover:bg-space-700"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-space-900/80 border border-space-700/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-astro-cyan block mb-1">
                Instruções de Coleta
              </span>
              <p className="text-xs text-space-200 leading-relaxed">{test.instruction}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-space-900/80 border border-space-700/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-space-400 block mb-2">
                Métricas & Resultados Anteriores
              </span>
              <div className="space-y-2">
                {test.measurements.map((m, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-1 border-b border-space-800 last:border-none">
                    <span className="text-space-300">{m.label}</span>
                    <span className="font-mono font-bold text-white">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {completed && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 size={16} />
                <span>Teste executado e sincronizado com sucesso! +25 XP</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-5 border-t border-space-700/60 mt-4">
            <span className="text-xs text-space-400">
              Protocolo de Medicina Espacial #AGY-GRAV
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs text-space-300 hover:text-white rounded-lg hover:bg-space-700/50"
              >
                Fechar
              </button>
              <button
                type="button"
                disabled={isRunning}
                onClick={handleStartTest}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-astro-cyan hover:bg-sky-400 text-space-950 font-bold text-xs transition-all shadow-glow-cyan disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Processando Coleta...
                  </>
                ) : (
                  <>
                    <Play size={14} /> Executar Teste Agora
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
