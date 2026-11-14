import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { apiService, ApiError } from '../services/api';
import { Wind, X, CheckCircle2, AlertTriangle, RefreshCw, Gauge } from 'lucide-react';

export const AtmosphereModal: React.FC = () => {
  const {
    isAtmosphereModalOpen,
    setIsAtmosphereModalOpen,
    astronautId,
    dataset,
    triggerRefresh,
    addXP,
  } = useStore();

  const [location, setLocation] = useState('cabin-deck-a');
  const [environment, setEnvironment] = useState<'nominal_cabin' | 'off_nominal_cabin' | 'suit'>('nominal_cabin');
  const [pressureVal, setPressureVal] = useState(760);
  const [pressureUnit, setPressureUnit] = useState<'mmHg' | 'kPa' | 'psia'>('mmHg');
  const [co2Ppm, setCo2Ppm] = useState(1200);
  const [oxygenFraction, setOxygenFraction] = useState(0.21);

  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<{ message: string; fields?: Record<string, string> } | null>(null);

  if (!isAtmosphereModalOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setError(null);
    setResult(null);

    const id = `atmo-${Date.now()}`;
    const payload = {
      astronautId,
      id,
      source: (dataset === 'simulated' ? 'simulated' : 'manual') as 'manual' | 'sensor' | 'simulated',
      location,
      environment,
      recordedAt: new Date().toISOString(),
      pressure: {
        value: Number(pressureVal),
        unit: pressureUnit,
      },
      co2Ppm: Number(co2Ppm),
      oxygenFraction: Number(oxygenFraction),
    };

    try {
      const res = await apiService.saveOperation('hostile_closed_environment', 'atmosphere', payload);
      setResult(res);
      addXP(30);
      triggerRefresh();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError({ message: err.message, fields: err.fields });
      } else {
        setError({ message: err.message || 'Erro ao registrar atmosfera.' });
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
                <Wind size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">
                  Registro Composto da Atmosfera da Cabine
                </h3>
                <p className="text-xs text-space-300">
                  Cálculo no servidor de pressões parciais de CO2, O2 e oxigênio inspirado (PIO2)
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsAtmosphereModalOpen(false)}
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
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} /> Conversão gasosa calculada pelo servidor:
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-500/20 font-mono text-[11px]">
                <div>Pressão Absoluta: <strong>{result.operation?.calculation?.pressureMmHg?.toFixed(1)} mmHg</strong></div>
                <div>ppCO₂: <strong>{result.operation?.calculation?.partialCo2?.toFixed(2)} mmHg</strong></div>
                <div>ppO₂: <strong>{result.operation?.calculation?.partialO2?.toFixed(1)} mmHg</strong></div>
                <div>PIO₂ Inspirado: <strong>{result.operation?.calculation?.inspiredO2?.toFixed(1) ?? '—'} mmHg</strong></div>
              </div>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                <label className="block text-[11px] font-medium text-space-300 mb-1">
                  Local / Módulo (location)
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
                  Ambiente
                </label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value as any)}
                  className="w-full bg-space-800 border border-space-600 rounded px-2 py-1.5 text-xs text-white font-mono"
                >
                  <option value="nominal_cabin">nominal_cabin (cabine nominal)</option>
                  <option value="off_nominal_cabin">off_nominal_cabin</option>
                  <option value="suit">suit (traje EVA)</option>
                </select>
              </div>
            </div>

            {/* Pressão */}
            <div className="p-3 rounded-xl bg-space-900 border border-space-750">
              <label className="block text-[11px] font-medium text-space-300 mb-1">
                Pressão Total Absoluta da Cabine
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  required
                  value={pressureVal}
                  onChange={(e) => setPressureVal(Number(e.target.value))}
                  className="w-full bg-space-800 border border-space-600 rounded px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                />
                <select
                  value={pressureUnit}
                  onChange={(e) => setPressureUnit(e.target.value as any)}
                  className="bg-space-800 border border-space-600 rounded px-2 py-1.5 text-xs text-white font-mono"
                >
                  <option value="mmHg">mmHg</option>
                  <option value="kPa">kPa</option>
                  <option value="psia">psia</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* CO2 ppm */}
              <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                <label className="block text-[11px] font-medium text-space-300 mb-1">
                  CO₂ Concentração (ppm)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100000}
                  required
                  value={co2Ppm}
                  onChange={(e) => setCo2Ppm(Number(e.target.value))}
                  className="w-full bg-space-800 border border-space-600 rounded px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                />
              </div>

              {/* Fração O2 */}
              <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                <label className="block text-[11px] font-medium text-space-300 mb-1">
                  Fração de O₂ (0 a 1)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  max={1}
                  required
                  value={oxygenFraction}
                  onChange={(e) => setOxygenFraction(Number(e.target.value))}
                  className="w-full bg-space-800 border border-space-600 rounded px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                />
                <span className="text-[10px] text-space-400 mt-0.5 block font-mono">
                  {(oxygenFraction * 100).toFixed(0)}% O₂
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-space-700/60">
              <button
                type="button"
                onClick={() => setIsAtmosphereModalOpen(false)}
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
                    <span>Calculando...</span>
                  </>
                ) : (
                  <span>Registrar Atmosfera</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
