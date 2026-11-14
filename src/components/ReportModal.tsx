import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { apiService, ApiError } from '../services/api';
import { FileText, X, CheckCircle2, AlertTriangle, RefreshCw, Send, Plus, Trash2, Clock } from 'lucide-react';

export const ReportModal: React.FC = () => {
  const {
    isReportModalOpen,
    setIsReportModalOpen,
    astronautId,
    dataset,
    triggerRefresh,
    addXP,
  } = useStore();

  const [actions, setActions] = useState<{ recordedAt: string; description: string }[]>([
    {
      recordedAt: new Date().toISOString(),
      description: 'Tripulação realizou automonitoramento rotineiro e revisou parâmetros vitais a bordo.',
    },
  ]);
  const [newDesc, setNewDesc] = useState('');

  const [saving, setSaving] = useState(false);
  const [reportResult, setReportResult] = useState<any | null>(null);
  const [error, setError] = useState<{ message: string; fields?: Record<string, string> } | null>(null);

  if (!isReportModalOpen) return null;

  const handleAddAction = () => {
    if (!newDesc.trim()) return;
    setActions((prev) => [
      ...prev,
      {
        recordedAt: new Date().toISOString(),
        description: newDesc.trim(),
      },
    ]);
    setNewDesc('');
  };

  const handleRemoveAction = (index: number) => {
    setActions((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePrepareReport = async () => {
    if (saving) return;

    setSaving(true);
    setError(null);
    setReportResult(null);

    const id = `report-${Date.now()}`;
    const payload = {
      astronautId,
      id,
      source: (dataset === 'simulated' ? 'simulated' : 'manual') as 'manual' | 'sensor' | 'simulated',
      actions,
    };

    try {
      const res = await apiService.saveOperation('distance_from_earth', 'report', payload);
      setReportResult(res.operation?.calculation || res);
      addXP(30);
      triggerRefresh();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError({ message: err.message, fields: err.fields });
      } else {
        setError({ message: err.message || 'Erro ao preparar relatório.' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-space-850 border border-space-700 rounded-2xl shadow-2xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-space-700/60 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-500/15 text-astro-cyan border border-astro-cyan/30">
                <FileText size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">
                  Preparação Local de Relatório Clínico (Telemedicina)
                </h3>
                <p className="text-xs text-space-300">
                  Consolidação autônoma de telemetria, tendências e ações em estado não enviado
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsReportModalOpen(false)}
              className="p-1.5 text-space-400 hover:text-white rounded-lg hover:bg-space-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mb-4 p-3 rounded-xl bg-space-900 border border-space-750 text-xs text-space-300 leading-relaxed">
            <span className="text-amber-400 font-bold block mb-1">
              Aviso de Comunicação & Autonomia Médica:
            </span>
            O relatório é gerado e retido localmente no estado <code className="bg-space-800 px-1 py-0.5 rounded text-amber-300 font-mono">not_sent</code>. Devido ao atraso ou indisponibilidade de enlace de rádio no espaço profundo, <strong>a equipe médica na Terra NÃO é notificada automaticamente</strong>.
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{error.message}</span>
            </div>
          )}

          {reportResult && (
            <div className="mb-4 p-4 rounded-xl bg-space-900 border border-space-700 text-xs space-y-3">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 size={16} /> Relatório Preparado Localmente!
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  deliveryStatus: {reportResult.deliveryStatus || 'not_sent'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div>Preparado em: {reportResult.preparedAt || new Date().toISOString()}</div>
                <div>Status do enlace: {reportResult.communication?.status || 'disponível'}</div>
              </div>

              {/* Evaluated rules */}
              {reportResult.evaluations?.length > 0 && (
                <div className="pt-2 border-t border-space-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-space-400 block font-mono">
                    Regras Disparadas ({reportResult.evaluations.length}):
                  </span>
                  {reportResult.evaluations.map((ev: any, idx: number) => (
                    <div key={idx} className="p-2 rounded bg-space-850 font-mono text-[10px] text-space-300">
                      <strong>{ev.indicator}</strong>: {ev.message}
                    </div>
                  ))}
                </div>
              )}

              {/* Actions snapshot */}
              {reportResult.actions?.length > 0 && (
                <div className="pt-2 border-t border-space-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-space-400 block font-mono">
                    Ações Documentadas:
                  </span>
                  {reportResult.actions.map((act: any, idx: number) => (
                    <div key={idx} className="text-[11px] text-space-300 pl-2 border-l border-astro-cyan">
                      {act.description}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Log form */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-space-200 block">
              Ações Clínicas e Operacionais Tomadas a Bordo:
            </span>

            <div className="space-y-2">
              {actions.map((act, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-space-900 border border-space-750 text-xs"
                >
                  <div className="flex-1 pr-2">
                    <p className="text-space-200">{act.description}</p>
                    <span className="text-[10px] text-space-500 font-mono">{act.recordedAt}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAction(idx)}
                    className="p-1 text-space-500 hover:text-rose-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add action */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Descreva nova ação tomada (ex: administrado analgésico, isolamento acústico...)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddAction()}
                className="flex-1 bg-space-900 border border-space-750 rounded-xl px-3 py-2 text-xs text-white focus:border-astro-cyan focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddAction}
                className="px-3 py-2 bg-space-750 hover:bg-space-700 text-astro-cyan rounded-xl text-xs font-bold border border-astro-cyan/30"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-5 border-t border-space-700/60 mt-5">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-space-300 hover:text-white rounded-xl hover:bg-space-800"
            >
              Fechar
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handlePrepareReport}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-lg transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Preparando...</span>
                </>
              ) : (
                <span>Preparar Relatório Local (not_sent)</span>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
