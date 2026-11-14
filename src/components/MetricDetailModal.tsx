import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { StatusPill } from './StatusPill';
import { X, HelpCircle, Activity, Stethoscope, ChevronRight } from 'lucide-react';

export const MetricDetailModal: React.FC = () => {
  const { metricDetailModal, closeMetricDetailModal, setIsNewLogModalOpen } = useStore();

  if (!metricDetailModal) return null;

  const handleOpenNewLog = () => {
    closeMetricDetailModal();
    setIsNewLogModalOpen(true);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-space-850 border border-space-700 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-space-700/60 bg-space-800/80">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-white tracking-wide">
                  {metricDetailModal.title}
                </h3>
                <StatusPill level={metricDetailModal.level} />
              </div>
              <p className="text-sm text-space-300 mt-1">{metricDetailModal.subtitle}</p>
            </div>
            <button
              onClick={closeMetricDetailModal}
              className="p-2 text-space-400 hover:text-white rounded-lg hover:bg-space-700/50 transition-colors"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Metric Value Display */}
          <div className="p-6 bg-gradient-to-r from-space-900 to-space-850 border-b border-space-700/50 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-space-400 font-mono">
                Valor Atual Registrado
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-white font-mono">
                  {metricDetailModal.value}
                </span>
                {metricDetailModal.unit && (
                  <span className="text-lg font-medium text-space-300">
                    {metricDetailModal.unit}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleOpenNewLog}
              className="flex items-center gap-2 px-4 py-2 bg-space-700 hover:bg-space-600 text-astro-cyan text-sm font-semibold rounded-xl border border-astro-cyan/30 transition-all hover:shadow-glow-cyan"
            >
              <Activity size={16} />
              <span>Atualizar Medição</span>
            </button>
          </div>

          {/* Content: Why Measure & What to do */}
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Por que medir isso */}
            <div className="p-4 rounded-xl bg-space-900/80 border border-space-700/70">
              <div className="flex items-center gap-2 text-astro-cyan mb-2">
                <HelpCircle size={18} />
                <h4 className="font-semibold text-sm uppercase tracking-wide">
                  Por que medir isso? (Fisiologia Espacial)
                </h4>
              </div>
              <p className="text-sm text-space-200 leading-relaxed whitespace-pre-line">
                {metricDetailModal.whyMeasure}
              </p>
            </div>

            {/* O que fazer */}
            <div className="p-4 rounded-xl bg-space-900/80 border border-amber-500/20">
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <Stethoscope size={18} />
                <h4 className="font-semibold text-sm uppercase tracking-wide">
                  O que fazer (Protocolo Prático Imediato)
                </h4>
              </div>
              <p className="text-sm text-space-200 leading-relaxed whitespace-pre-line">
                {metricDetailModal.whatToDo}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 px-6 border-t border-space-700/60 bg-space-800/40 text-xs text-space-400">
            <span>AstroVida v1.0 · Suporte de Decisão Médica Autônomo</span>
            <button
              onClick={closeMetricDetailModal}
              className="px-4 py-2 bg-space-700 hover:bg-space-600 text-white rounded-lg transition-colors font-medium"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
