import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { apiService, ApiError } from '../services/api';
import { ShieldCheck, X, CheckCircle2, AlertTriangle, RefreshCw, Activity } from 'lucide-react';

const EVA_SYMPTOMS_LIST = [
  { id: 'itching', label: 'Coceira cutânea (itching)' },
  { id: 'muscle_joint_pain', label: 'Dor articular ou muscular (muscle_joint_pain)' },
  { id: 'rash', label: 'Erupção cutânea / Manchas (rash)' },
  { id: 'numbness_weakness', label: 'Dormência ou fraqueza muscular (numbness_weakness)' },
  { id: 'thinking_speech_change', label: 'Alteração cognitiva ou na fala (thinking_speech_change)' },
  { id: 'dizziness_balance_hearing', label: 'Tontura, perda de equilíbrio ou audição (dizziness_balance_hearing)' },
  { id: 'breathlessness_chest_pain', label: 'Falta de ar ou dor torácica (breathlessness_chest_pain)' },
];

export const PostEvaModal: React.FC = () => {
  const {
    isPostEvaModalOpen,
    setIsPostEvaModalOpen,
    astronautId,
    dataset,
    triggerRefresh,
    addXP,
  } = useStore();

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<{ message: string; fields?: Record<string, string> } | null>(null);

  if (!isPostEvaModalOpen) return null;

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setError(null);
    setResult(null);

    const now = new Date();
    const evaEndedAt = new Date(now.getTime() - 3600000).toISOString(); // 1h ago
    const recordedAt = now.toISOString();
    const id = `posteva-${Date.now()}`;

    const payload = {
      astronautId,
      id,
      source: (dataset === 'simulated' ? 'simulated' : 'manual') as 'manual' | 'sensor' | 'simulated',
      evaEndedAt,
      recordedAt,
      symptoms: selectedSymptoms,
    };

    try {
      const res = await apiService.saveOperation('hostile_closed_environment', 'post_eva', payload);
      setResult(res);
      addXP(25);
      triggerRefresh();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError({ message: err.message, fields: err.fields });
      } else {
        setError({ message: err.message || 'Erro ao registrar checklist pós-EVA.' });
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
          className="relative w-full max-w-lg bg-space-850 border border-space-700 rounded-2xl shadow-2xl overflow-hidden p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-space-700/60 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">
                  Checklist de Sintomas Pós-EVA (Descompressão)
                </h3>
                <p className="text-xs text-space-300">
                  Rastreio pós-atividade extraveicular conforme protocolos de segurança da tripulação
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsPostEvaModalOpen(false)}
              className="p-1.5 text-space-400 hover:text-white rounded-lg hover:bg-space-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mb-4 p-2.5 rounded-lg bg-space-900 border border-space-750 text-[11px] text-space-300 leading-relaxed">
            <em>Qualquer sintoma relatado sugere atenção demonstrativa da tripulação. Esta ferramenta não atribui diagnóstico de doença descompressiva (DCS).</em>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{error.message}</span>
            </div>
          )}

          {result && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} /> Checklist registrado no servidor!
                </span>
                <span className="font-mono text-[10px]">{result.operation?.id}</span>
              </div>
              <p className="text-[11px] text-space-200">
                Sintomas reportados: <strong>{selectedSymptoms.length ? selectedSymptoms.join(', ') : 'Nenhum sintoma (assintomático)'}</strong>
              </p>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-space-200 block mb-1">
                Selecione os sintomas percebidos após o término da EVA:
              </span>
              {EVA_SYMPTOMS_LIST.map((sym) => {
                const isChecked = selectedSymptoms.includes(sym.id);
                return (
                  <label
                    key={sym.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-amber-500/15 border-amber-500/40 text-white'
                        : 'bg-space-900 border-space-750 text-space-300 hover:bg-space-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSymptom(sym.id)}
                      className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                    />
                    <span>{sym.label}</span>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-space-700/60">
              <button
                type="button"
                onClick={() => setIsPostEvaModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-space-300 hover:text-white rounded-xl hover:bg-space-800"
              >
                Fechar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-lg transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <span>Registrar Checklist</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
