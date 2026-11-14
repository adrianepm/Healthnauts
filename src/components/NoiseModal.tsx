import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { apiService, ApiError } from '../services/api';
import { Volume2, X, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export const NoiseModal: React.FC = () => {
  const {
    isNoiseModalOpen,
    setIsNoiseModalOpen,
    astronautId,
    dataset,
    triggerRefresh,
    addXP,
  } = useStore();

  const [location, setLocation] = useState('cabin-deck-a');
  const [context, setContext] = useState('routine');
  const [method, setMethod] = useState('dosimeter-sound-level');
  const [durationMins, setDurationMins] = useState(15);
  const [dba, setDba] = useState(62.5);

  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<{ message: string; fields?: Record<string, string> } | null>(null);

  if (!isNoiseModalOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setError(null);
    setResult(null);

    const now = Date.now();
    const periodStart = new Date(now - durationMins * 60000).toISOString();
    const recordedAt = new Date(now).toISOString();
    const id = `noise-${Date.now()}`;

    const payload = {
      astronautId,
      id,
      source: (dataset === 'simulated' ? 'simulated' : 'manual') as 'manual' | 'sensor' | 'simulated',
      location,
      context,
      method,
      periodStart,
      recordedAt,
      dba: Number(dba),
    };

    try {
      const res = await apiService.saveOperation('hostile_closed_environment', 'noise', payload);
      setResult(res);
      addXP(20);
      triggerRefresh();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError({ message: err.message, fields: err.fields });
      } else {
        setError({ message: err.message || 'Erro ao registrar medição de ruído.' });
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
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Volume2 size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">
                  Medição Acústica de Ruído da Cabine (dBA)
                </h3>
                <p className="text-xs text-space-300">
                  Registro sonométrico para monitoramento de exposição ambiental
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsNoiseModalOpen(false)}
              className="p-1.5 text-space-400 hover:text-white rounded-lg hover:bg-space-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mb-4 p-2.5 rounded-lg bg-space-900 border border-space-750 text-[11px] text-space-300">
            <strong>Limitação do Modelo:</strong> O valor em dBA é gravado no histórico, porém curvas NC de conforto acústico exigem medição em bandas de oitava (classificação automática inativa).
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
                  <CheckCircle2 size={16} /> Medição de ruído registrada no servidor!
                </span>
                <span className="font-mono text-[10px]">{result.operation?.id}</span>
              </div>
              <p className="text-[11px] text-space-300">
                Duração da medição preservada: <strong>{result.operation?.calculation?.durationSeconds} segundos</strong>.
                <span className="block mt-0.5 text-space-400">
                  Status: <em>{result.operation?.calculation?.limitation}</em>
                </span>
              </p>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                <label className="block text-[11px] font-medium text-space-300 mb-1">
                  Local (location)
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-space-800 border border-space-600 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                <label className="block text-[11px] font-medium text-space-300 mb-1">
                  Contexto / Atividade
                </label>
                <input
                  type="text"
                  required
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="w-full bg-space-800 border border-space-600 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                <label className="block text-[11px] font-medium text-space-300 mb-1">
                  Duração da Amostra (min)
                </label>
                <input
                  type="number"
                  min={1}
                  max={1440}
                  required
                  value={durationMins}
                  onChange={(e) => setDurationMins(Number(e.target.value))}
                  className="w-full bg-space-800 border border-space-600 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                <label className="block text-[11px] font-medium text-space-300 mb-1">
                  Nível de Ruído (dBA)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={160}
                  required
                  value={dba}
                  onChange={(e) => setDba(Number(e.target.value))}
                  className="w-full bg-space-800 border border-space-600 rounded px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-space-700/60">
              <button
                type="button"
                onClick={() => setIsNoiseModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-space-300 hover:text-white rounded-xl hover:bg-space-800"
              >
                Fechar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-lg transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>Registrar Medição</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
