import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { apiService, ApiError } from '../services/api';
import { Moon, Clock, X, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export const SleepEpisodeModal: React.FC = () => {
  const {
    isSleepModalOpen,
    setIsSleepModalOpen,
    astronautId,
    dataset,
    triggerRefresh,
    addXP,
  } = useStore();

  const now = new Date();
  const yesterday = new Date(now.getTime() - 8 * 3600000);

  // Default to yesterday 22:30 and today 06:30 with timezone
  const toLocalIso = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [bedTime, setBedTime] = useState(toLocalIso(yesterday));
  const [wakeTime, setWakeTime] = useState(toLocalIso(now));
  const [latencyMinutes, setLatencyMinutes] = useState(15);
  const [awakeMinutes, setAwakeMinutes] = useState(20);
  const [source, setSource] = useState<'manual' | 'sensor' | 'simulated'>(
    dataset === 'simulated' ? 'simulated' : 'manual'
  );

  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<{ message: string; fields?: Record<string, string> } | null>(null);

  if (!isSleepModalOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setError(null);
    setResult(null);

    // Format timestamps with local ISO offset
    const getIsoWithOffset = (dtStr: string) => {
      const d = new Date(dtStr);
      return d.toISOString();
    };

    const episodeId = `sleep-${Date.now()}`;
    const payload = {
      astronautId,
      episodeId,
      source,
      bedAt: getIsoWithOffset(bedTime),
      wakeAt: getIsoWithOffset(wakeTime),
      sleepLatencyMinutes: Number(latencyMinutes),
      awakeMinutes: Number(awakeMinutes),
    };

    try {
      const res = await apiService.saveSleepEpisode(payload);
      setResult(res);
      addXP(35);
      triggerRefresh();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError({ message: err.message, fields: err.fields });
      } else {
        setError({ message: err.message || 'Erro ao registrar sono no servidor.' });
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
              <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                <Moon size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">
                  Registrar Episódio de Sono (Cálculo no Servidor)
                </h3>
                <p className="text-xs text-space-300">
                  O servidor calcula a duração líquida e persiste componentes auditáveis
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSleepModalOpen(false)}
              className="p-1.5 text-space-400 hover:text-white rounded-lg hover:bg-space-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{error.message}</span>
            </div>
          )}

          {result && (
            <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} /> Episódio calculado pelo servidor!
                </span>
                <span className="font-mono text-[10px]">{result.replayed ? 'Replay (200 OK)' : 'Novo (201 Created)'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-500/20">
                <div>
                  <span className="text-[10px] text-space-400 font-mono">DURAÇÃO LÍQUIDA CALCULADA:</span>
                  <div className="text-xl font-bold font-mono text-white">
                    {result.operation?.calculation?.durationHours} horas
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-space-400 font-mono">TEMPO NA CAMA:</span>
                  <div className="text-sm font-bold font-mono text-space-200">
                    {result.operation?.calculation?.timeInBedMinutes} min
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Horário de deitar */}
              <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                <label className="block text-[11px] font-medium text-space-300 mb-1">
                  Horário de Deitar (bedAt)
                </label>
                <input
                  type="datetime-local"
                  required
                  value={bedTime}
                  onChange={(e) => setBedTime(e.target.value)}
                  className="w-full bg-space-800 border border-space-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-astro-cyan focus:outline-none"
                />
                {error?.fields?.bedAt && (
                  <span className="text-[10px] text-rose-400 mt-1 block">{error.fields.bedAt}</span>
                )}
              </div>

              {/* Horário de levantar */}
              <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                <label className="block text-[11px] font-medium text-space-300 mb-1">
                  Horário de Levantar (wakeAt)
                </label>
                <input
                  type="datetime-local"
                  required
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full bg-space-800 border border-space-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-astro-cyan focus:outline-none"
                />
                {error?.fields?.wakeAt && (
                  <span className="text-[10px] text-rose-400 mt-1 block">{error.fields.wakeAt}</span>
                )}
              </div>

              {/* Latência de sono */}
              <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                <label className="block text-[11px] font-medium text-space-300 mb-1">
                  Latência para Dormir (minutos)
                </label>
                <input
                  type="number"
                  min={0}
                  max={600}
                  required
                  value={latencyMinutes}
                  onChange={(e) => setLatencyMinutes(Number(e.target.value))}
                  className="w-full bg-space-800 border border-space-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-astro-cyan focus:outline-none"
                />
                {error?.fields?.sleepLatencyMinutes && (
                  <span className="text-[10px] text-rose-400 mt-1 block">{error.fields.sleepLatencyMinutes}</span>
                )}
              </div>

              {/* Minutos acordado durante a noite */}
              <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                <label className="block text-[11px] font-medium text-space-300 mb-1">
                  Tempo Acordado à Noite (WASO min)
                </label>
                <input
                  type="number"
                  min={0}
                  max={600}
                  required
                  value={awakeMinutes}
                  onChange={(e) => setAwakeMinutes(Number(e.target.value))}
                  className="w-full bg-space-800 border border-space-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-astro-cyan focus:outline-none"
                />
                {error?.fields?.awakeMinutes && (
                  <span className="text-[10px] text-rose-400 mt-1 block">{error.fields.awakeMinutes}</span>
                )}
              </div>
            </div>

            {/* Origem dos dados */}
            <div className="p-3 rounded-xl bg-space-900 border border-space-750 flex items-center justify-between text-xs">
              <span className="text-space-300">Origem do dado (source):</span>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as any)}
                className="bg-space-800 border border-space-600 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none"
              >
                <option value="manual">Manual (registro próprio)</option>
                <option value="sensor">Sensor (dispositivo vestível)</option>
                <option value="simulated">Simulado (demonstração)</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-space-700/60">
              <button
                type="button"
                onClick={() => setIsSleepModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-space-300 hover:text-white rounded-xl hover:bg-space-800"
              >
                Fechar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Calculando...</span>
                  </>
                ) : (
                  <span>Enviar para Cálculo</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
