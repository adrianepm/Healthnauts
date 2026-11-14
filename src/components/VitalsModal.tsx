import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { apiService, ApiError } from '../services/api';
import { HeartPulse, X, CheckCircle2, AlertTriangle, RefreshCw, Activity, ShieldCheck } from 'lucide-react';

export const VitalsModal: React.FC = () => {
  const {
    isVitalsModalOpen,
    setIsVitalsModalOpen,
    astronautId,
    dataset,
    triggerRefresh,
    addXP,
  } = useStore();

  const [activity, setActivity] = useState<'routine' | 'exercise' | 'eva' | 'landing' | 'post_landing' | 'post_eva' | 'transit'>('routine');
  const [heartRate, setHeartRate] = useState(72);
  const [systolic, setSystolic] = useState(118);
  const [diastolic, setDiastolic] = useState(76);
  const [respiratoryRate, setRespiratoryRate] = useState(15);
  const [spo2, setSpo2] = useState(98);
  const [temperature, setTemperature] = useState(36.7);
  const [supplementalOxygen, setSupplementalOxygen] = useState(false);
  const [consciousness, setConsciousness] = useState<'A' | 'C' | 'V' | 'P' | 'U'>('A');

  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<{ message: string; fields?: Record<string, string> } | null>(null);

  if (!isVitalsModalOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setError(null);
    setResult(null);

    const now = new Date();
    const recordedAt = now.toISOString();
    const id = `vitals-${Date.now()}`;

    const payload = {
      astronautId,
      id,
      source: (dataset === 'simulated' ? 'simulated' : 'manual') as 'manual' | 'sensor' | 'simulated',
      activity,
      spo2Scale: 1,
      recordedAt,
      measurements: {
        heart_rate: { value: Math.round(heartRate), unit: 'bpm', recordedAt },
        blood_pressure_systolic: { value: Math.round(systolic), unit: 'mmHg', recordedAt },
        blood_pressure_diastolic: { value: Math.round(diastolic), unit: 'mmHg', recordedAt },
        respiratory_rate: { value: Math.round(respiratoryRate), unit: 'breaths/min', recordedAt },
        spo2: { value: Math.round(spo2), unit: '%', recordedAt },
        body_temperature: { value: Number(temperature.toFixed(1)), unit: 'Cel', recordedAt },
        supplemental_oxygen: { value: supplementalOxygen, unit: null, recordedAt },
        consciousness: { value: consciousness, unit: null, recordedAt },
      },
    };

    try {
      const res = await apiService.saveOperation('gravity_fields', 'vitals', payload);
      setResult(res);
      addXP(35);
      triggerRefresh();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError({ message: err.message, fields: err.fields });
      } else {
        setError({ message: err.message || 'Erro ao registrar sinais vitais.' });
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
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <HeartPulse size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">
                  Avaliação Integrada de Sinais Vitais & NEWS2
                </h3>
                <p className="text-xs text-space-300">
                  Operação biomédica calculada no servidor com escore National Early Warning Score 2
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsVitalsModalOpen(false)}
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
                  <CheckCircle2 size={16} /> Escore NEWS2 Calculado pelo Servidor:
                </span>
                <span className="font-mono text-[10px]">
                  {result.operation?.calculation?.scientificCategory?.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-500/20">
                <div>
                  <span className="text-[10px] text-space-400 font-mono">PONTUAÇÃO TOTAL:</span>
                  <div className="text-2xl font-bold font-mono text-white">
                    {result.operation?.calculation?.score ?? '—'} <span className="text-xs font-normal text-space-400">pontos</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-space-400 font-mono">CATEGORIA CIENTÍFICA:</span>
                  <div className="text-sm font-bold text-space-200">
                    {result.operation?.calculation?.scientificCategory}
                  </div>
                </div>
              </div>
              {result.operation?.calculation?.limitation && (
                <div className="text-[10px] text-space-400 pt-1">
                  <em>Nota: {result.operation.calculation.limitation}</em>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            {/* Atividade */}
            <div className="p-3 rounded-xl bg-space-900 border border-space-750 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-space-300">Contexto da Atividade:</span>
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value as any)}
                className="bg-space-800 border border-space-600 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none"
              >
                <option value="routine">routine (rotina)</option>
                <option value="exercise">exercise (exercício físico)</option>
                <option value="eva">eva (atividade extraveicular)</option>
                <option value="landing">landing (pouso)</option>
                <option value="post_landing">post_landing (pós-pouso)</option>
                <option value="post_eva">post_eva (pós-EVA)</option>
                <option value="transit">transit (trânsito)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Pressão Arterial */}
              <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                <label className="block text-[11px] font-medium text-space-300 mb-1">
                  Pressão Arterial (Sistólica / Diastólica)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    required
                    value={systolic}
                    onChange={(e) => setSystolic(Number(e.target.value))}
                    className="w-full bg-space-800 border border-space-600 rounded-lg px-2 py-1.5 text-xs text-white font-mono font-bold text-center"
                    placeholder="Sistólica"
                  />
                  <span className="text-space-400 font-bold">/</span>
                  <input
                    type="number"
                    required
                    value={diastolic}
                    onChange={(e) => setDiastolic(Number(e.target.value))}
                    className="w-full bg-space-800 border border-space-600 rounded-lg px-2 py-1.5 text-xs text-white font-mono font-bold text-center"
                    placeholder="Diastólica"
                  />
                  <span className="text-[10px] text-space-400 font-mono">mmHg</span>
                </div>
              </div>

              {/* Frequência Cardíaca */}
              <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                <label className="block text-[11px] font-medium text-space-300 mb-1">
                  Frequência Cardíaca (heart_rate)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    required
                    value={heartRate}
                    onChange={(e) => setHeartRate(Number(e.target.value))}
                    className="w-full bg-space-800 border border-space-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                  />
                  <span className="text-[10px] text-space-400 font-mono">bpm</span>
                </div>
              </div>

              {/* Frequência Respiratória */}
              <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                <label className="block text-[11px] font-medium text-space-300 mb-1">
                  Frequência Respiratória (respiratory_rate)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    required
                    value={respiratoryRate}
                    onChange={(e) => setRespiratoryRate(Number(e.target.value))}
                    className="w-full bg-space-800 border border-space-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                  />
                  <span className="text-[10px] text-space-400 font-mono">resp/min</span>
                </div>
              </div>

              {/* SpO2 */}
              <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                <label className="block text-[11px] font-medium text-space-300 mb-1">
                  Saturação de Oxigênio (spo2 · Escala 1)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={50}
                    max={100}
                    required
                    value={spo2}
                    onChange={(e) => setSpo2(Number(e.target.value))}
                    className="w-full bg-space-800 border border-space-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                  />
                  <span className="text-[10px] text-space-400 font-mono">%</span>
                </div>
              </div>

              {/* Temperatura Corporal */}
              <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                <label className="block text-[11px] font-medium text-space-300 mb-1">
                  Temperatura Corporal (body_temperature)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min={25}
                    max={45}
                    required
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="w-full bg-space-800 border border-space-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                  />
                  <span className="text-[10px] text-space-400 font-mono">°C</span>
                </div>
              </div>

              {/* Consciência ACVPU */}
              <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                <label className="block text-[11px] font-medium text-space-300 mb-1">
                  Consciência (Escala ACVPU)
                </label>
                <select
                  value={consciousness}
                  onChange={(e) => setConsciousness(e.target.value as any)}
                  className="w-full bg-space-800 border border-space-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                >
                  <option value="A">A — Alerta (Alert)</option>
                  <option value="C">C — Confuso (Confused)</option>
                  <option value="V">V — Responde a Voz (Voice)</option>
                  <option value="P">P — Responde a Dor (Pain)</option>
                  <option value="U">U — Não responde (Unresponsive)</option>
                </select>
              </div>
            </div>

            {/* Oxigênio suplementar */}
            <div className="p-3 rounded-xl bg-space-900 border border-space-750 flex items-center justify-between text-xs">
              <span className="text-space-300">Uso de Oxigênio Suplementar (supplemental_oxygen):</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={supplementalOxygen}
                  onChange={(e) => setSupplementalOxygen(e.target.checked)}
                  className="w-4 h-4 rounded accent-astro-cyan cursor-pointer"
                />
                <span className="text-white font-semibold font-mono">
                  {supplementalOxygen ? 'SIM (+2 pts NEWS2)' : 'NÃO'}
                </span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-space-700/60">
              <button
                type="button"
                onClick={() => setIsVitalsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-space-300 hover:text-white rounded-xl hover:bg-space-800"
              >
                Fechar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Calculando NEWS2...</span>
                  </>
                ) : (
                  <span>Registrar e Calcular NEWS2</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
