import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { apiService, ApiError } from '../services/api';
import { Activity, X, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export const PostureModal: React.FC = () => {
  const {
    isPostureModalOpen,
    setIsPostureModalOpen,
    astronautId,
    dataset,
    triggerRefresh,
    addXP,
  } = useStore();

  const [activity, setActivity] = useState<'routine' | 'post_landing'>('routine');
  const [supineSys, setSupineSys] = useState(116);
  const [supineDia, setSupineDia] = useState(74);
  const [supineHr, setSupineHr] = useState(62);

  const [stand1Sys, setStand1Sys] = useState(110);
  const [stand1Dia, setStand1Dia] = useState(78);
  const [stand1Hr, setStand1Hr] = useState(84);

  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<{ message: string; fields?: Record<string, string> } | null>(null);

  if (!isPostureModalOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setError(null);
    setResult(null);

    const now = Date.now();
    const t0 = new Date(now - 180000).toISOString(); // supine
    const tStand = new Date(now - 120000).toISOString(); // standAt
    const t1 = new Date(now - 60000).toISOString(); // standing 1 min
    const id = `posture-${Date.now()}`;

    const payload = {
      astronautId,
      id,
      source: (dataset === 'simulated' ? 'simulated' : 'manual') as 'manual' | 'sensor' | 'simulated',
      supervised: true,
      activity,
      standAt: tStand,
      samples: [
        {
          position: 'supine' as const,
          recordedAt: t0,
          systolic: Math.round(supineSys),
          diastolic: Math.round(supineDia),
          heartRate: Math.round(supineHr),
        },
        {
          position: 'standing' as const,
          recordedAt: t1,
          systolic: Math.round(stand1Sys),
          diastolic: Math.round(stand1Dia),
          heartRate: Math.round(stand1Hr),
        },
      ],
    };

    try {
      const res = await apiService.saveOperation('gravity_fields', 'posture', payload);
      setResult(res);
      addXP(30);
      triggerRefresh();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError({ message: err.message, fields: err.fields });
      } else {
        setError({ message: err.message || 'Erro ao registrar teste postural.' });
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
              <div className="p-2 rounded-xl bg-sky-500/15 text-astro-cyan border border-astro-cyan/30">
                <Activity size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">
                  Teste Ortostático Supervisionado (Postura)
                </h3>
                <p className="text-xs text-space-300">
                  Avaliação supervisionada da resposta hemodinâmica à posição ortostática
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsPostureModalOpen(false)}
              className="p-1.5 text-space-400 hover:text-white rounded-lg hover:bg-space-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mb-4 p-2.5 rounded-lg bg-space-900 border border-space-750 text-[11px] text-space-300">
            <strong>Contexto supervisionado:</strong> Os registros são descritivos. O back-end calcula a diferença em relação à posição supina de referência, sem emitir diagnósticos clínicos.
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{error.message}</span>
            </div>
          )}

          {result && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} /> Diferenças hemodinâmicas calculadas no servidor:
                </span>
              </div>
              {result.operation?.calculation?.differences?.map((d: any, idx: number) => (
                <div key={idx} className="p-2 rounded bg-space-900/80 font-mono text-[11px] space-y-0.5">
                  <div>Variação Sistólica: <strong>{d.systolicMmHg > 0 ? `+${d.systolicMmHg}` : d.systolicMmHg} mmHg</strong></div>
                  <div>Variação Diastólica: <strong>{d.diastolicMmHg > 0 ? `+${d.diastolicMmHg}` : d.diastolicMmHg} mmHg</strong></div>
                  <div>Variação FC: <strong>{d.heartRateBpm > 0 ? `+${d.heartRateBpm}` : d.heartRateBpm} bpm</strong></div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="p-3 rounded-xl bg-space-900 border border-space-750 flex items-center justify-between text-xs">
              <span className="text-space-300">Atividade:</span>
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value as any)}
                className="bg-space-800 border border-space-600 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none"
              >
                <option value="routine">routine (rotina)</option>
                <option value="post_landing">post_landing (pós-pouso)</option>
              </select>
            </div>

            {/* Supina */}
            <div className="p-3 rounded-xl bg-space-900 border border-space-750 space-y-2">
              <span className="text-xs font-bold text-astro-cyan block">1. Amostra Supina de Referência (Deitado)</span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-space-400 font-mono block">SISTÓLICA</label>
                  <input
                    type="number"
                    value={supineSys}
                    onChange={(e) => setSupineSys(Number(e.target.value))}
                    className="w-full bg-space-800 border border-space-600 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-space-400 font-mono block">DIASTÓLICA</label>
                  <input
                    type="number"
                    value={supineDia}
                    onChange={(e) => setSupineDia(Number(e.target.value))}
                    className="w-full bg-space-800 border border-space-600 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-space-400 font-mono block">FC (BPM)</label>
                  <input
                    type="number"
                    value={supineHr}
                    onChange={(e) => setSupineHr(Number(e.target.value))}
                    className="w-full bg-space-800 border border-space-600 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Em pé */}
            <div className="p-3 rounded-xl bg-space-900 border border-space-750 space-y-2">
              <span className="text-xs font-bold text-emerald-400 block">2. Amostra em Pé (Standing)</span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-space-400 font-mono block">SISTÓLICA</label>
                  <input
                    type="number"
                    value={stand1Sys}
                    onChange={(e) => setStand1Sys(Number(e.target.value))}
                    className="w-full bg-space-800 border border-space-600 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-space-400 font-mono block">DIASTÓLICA</label>
                  <input
                    type="number"
                    value={stand1Dia}
                    onChange={(e) => setStand1Dia(Number(e.target.value))}
                    className="w-full bg-space-800 border border-space-600 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-space-400 font-mono block">FC (BPM)</label>
                  <input
                    type="number"
                    value={stand1Hr}
                    onChange={(e) => setStand1Hr(Number(e.target.value))}
                    className="w-full bg-space-800 border border-space-600 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-space-700/60">
              <button
                type="button"
                onClick={() => setIsPostureModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-space-300 hover:text-white rounded-xl hover:bg-space-800"
              >
                Fechar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-lg transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <span>Registrar Teste Supervisionado</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
