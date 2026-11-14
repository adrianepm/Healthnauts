import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { StatusPill } from './StatusPill';
import { X, HelpCircle, Activity, Stethoscope, ShieldAlert, BookOpen, Clock, Tag } from 'lucide-react';

export const MetricDetailModal: React.FC = () => {
  const { metricDetailModal, closeMetricDetailModal, setIsNewLogModalOpen } = useStore();

  if (!metricDetailModal) return null;

  const handleOpenNewLog = () => {
    closeMetricDetailModal();
    setIsNewLogModalOpen(true);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-space-850 border border-space-700 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-space-700/60 bg-space-800/80">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg lg:text-xl font-bold text-white tracking-wide">
                  {metricDetailModal.title}
                </h3>
                <StatusPill level={metricDetailModal.level} />
              </div>
              <p className="text-xs text-space-300 mt-1">{metricDetailModal.subtitle}</p>
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
          <div className="p-5 bg-gradient-to-r from-space-900 to-space-850 border-b border-space-700/50 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-space-400 font-mono">
                Valor Atual Registrado
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl lg:text-3xl font-extrabold text-white font-mono">
                  {metricDetailModal.value}
                </span>
                {metricDetailModal.unit && (
                  <span className="text-base font-medium text-space-300">
                    {metricDetailModal.unit}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {metricDetailModal.source && (
                <span className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-space-800 text-space-300 border border-space-700">
                  Origem: {metricDetailModal.source}
                </span>
              )}
              {metricDetailModal.scientificCategory && (
                <span className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-sky-500/15 text-astro-cyan border border-sky-500/30">
                  {metricDetailModal.scientificCategory}
                </span>
              )}
              <button
                onClick={handleOpenNewLog}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-space-750 hover:bg-space-700 text-astro-cyan text-xs font-semibold rounded-xl border border-astro-cyan/30 transition-all hover:shadow-glow-cyan"
              >
                <Activity size={14} />
                <span>Atualizar Medição</span>
              </button>
            </div>
          </div>

          {/* Content: Assessments, Rule, Physiology & Actions */}
          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Server Assessment and Guidance when available */}
            {metricDetailModal.ruleId && (
              <div className="p-3.5 rounded-xl bg-space-900/90 border border-space-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-astro-cyan">
                    <BookOpen size={16} />
                    <h4 className="font-semibold text-xs uppercase tracking-wide">
                      Regra e Critério Aplicado (Back-end)
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-space-400">
                    ID: {metricDetailModal.ruleId} (v{metricDetailModal.ruleVersion || 1})
                  </span>
                </div>
                {metricDetailModal.ruleSource && (
                  <div className="text-[11px] text-space-300 font-mono">
                    Fonte oficial: {typeof metricDetailModal.ruleSource === 'string' ? metricDetailModal.ruleSource : (metricDetailModal.ruleSource.edition || metricDetailModal.ruleSource.classification || JSON.stringify(metricDetailModal.ruleSource))}
                  </div>
                )}
                {metricDetailModal.limitation && (
                  <div className="p-2.5 rounded-lg bg-space-950/80 border border-space-800 text-[11px] text-space-400 leading-relaxed">
                    <strong className="text-space-300">Limitação do Modelo:</strong> {metricDetailModal.limitation}
                  </div>
                )}
              </div>
            )}

            {/* Por que medir isso */}
            <div className="p-3.5 rounded-xl bg-space-900/80 border border-space-700/70">
              <div className="flex items-center gap-2 text-astro-cyan mb-1.5">
                <HelpCircle size={16} />
                <h4 className="font-semibold text-xs uppercase tracking-wide">
                  Por que medir isso? (Fisiologia Espacial)
                </h4>
              </div>
              <p className="text-xs text-space-200 leading-relaxed whitespace-pre-line">
                {metricDetailModal.whyMeasure}
              </p>
            </div>

            {/* O que fazer */}
            <div className="p-3.5 rounded-xl bg-space-900/80 border border-amber-500/20">
              <div className="flex items-center gap-2 text-amber-400 mb-1.5">
                <Stethoscope size={16} />
                <h4 className="font-semibold text-xs uppercase tracking-wide">
                  Orientação da Missão / O que fazer
                </h4>
              </div>
              <p className="text-xs text-space-200 leading-relaxed whitespace-pre-line">
                {metricDetailModal.whatToDo}
              </p>
            </div>

            {/* Recorded timestamp info */}
            {metricDetailModal.recordedAt && (
              <div className="flex items-center gap-1.5 text-[10px] text-space-400 font-mono">
                <Clock size={12} />
                <span>Último registro horário UTC: {metricDetailModal.recordedAt}</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
