import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { apiService, ApiError } from '../services/api';
import {
  X,
  HeartPulse,
  Wind,
  Smile,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Activity,
  Sliders,
} from 'lucide-react';

export const QuickLogModal: React.FC = () => {
  const {
    isNewLogModalOpen,
    setIsNewLogModalOpen,
    astronautId,
    dataset,
    triggerRefresh,
    addXP,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'vitals' | 'atmosphere' | 'mind' | 'symptoms'>('vitals');
  const [source, setSource] = useState<'manual' | 'sensor' | 'simulated'>(
    dataset === 'simulated' ? 'simulated' : 'manual'
  );

  // Vitals form
  const [systolic, setSystolic] = useState(118);
  const [diastolic, setDiastolic] = useState(76);
  const [heartRate, setHeartRate] = useState(72);
  const [respiratoryRate, setRespiratoryRate] = useState(15);
  const [spo2, setSpo2] = useState(98);
  const [temperature, setTemperature] = useState(36.7);
  const [supplementalOxygen, setSupplementalOxygen] = useState(false);
  const [consciousness, setConsciousness] = useState<'A' | 'C' | 'V' | 'P' | 'U'>('A');

  // Atmosphere form
  const [atmoLocation, setAtmoLocation] = useState('cabin-deck-a');
  const [pressureVal, setPressureVal] = useState(760);
  const [co2Ppm, setCo2Ppm] = useState(1200);
  const [oxygenFraction, setOxygenFraction] = useState(0.21);

  // Mind & Sleep form (catalog: mood_score 0-100, stress 0-100, sleep_quality 0-100, sleepiness_kss 1-9, fatigue_samn_perelli 1-7)
  const [moodScore, setMoodScore] = useState(70);
  const [stress, setStress] = useState(25);
  const [sleepQuality, setSleepQuality] = useState(75);
  const [sleepinessKss, setSleepinessKss] = useState(3);
  const [fatigueSamn, setFatigueSamn] = useState(2);

  // Gravity Symptoms form
  const [motionSickness, setMotionSickness] = useState(0);
  const [headache, setHeadache] = useState(0);
  const [dizziness, setDizziness] = useState(false);
  const [nearFainting, setNearFainting] = useState(false);
  const [visionChange, setVisionChange] = useState(false);
  const [amslerChange, setAmslerChange] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (!isNewLogModalOpen) return null;

  const handleClose = () => {
    setIsNewLogModalOpen(false);
    setSuccessMsg(null);
    setErrorMsg(null);
    setFieldErrors({});
  };

  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setErrorMsg(null);
    setFieldErrors({});
    setSuccessMsg(null);

    const now = new Date().toISOString();
    const id = `vitals-${Date.now()}`;
    const payload = {
      astronautId,
      id,
      source,
      activity: 'routine',
      spo2Scale: 1,
      recordedAt: now,
      measurements: {
        heart_rate: { value: Math.round(heartRate), unit: 'bpm', recordedAt: now },
        blood_pressure_systolic: { value: Math.round(systolic), unit: 'mmHg', recordedAt: now },
        blood_pressure_diastolic: { value: Math.round(diastolic), unit: 'mmHg', recordedAt: now },
        respiratory_rate: { value: Math.round(respiratoryRate), unit: 'breaths/min', recordedAt: now },
        spo2: { value: Math.round(spo2), unit: '%', recordedAt: now },
        body_temperature: { value: Number(temperature.toFixed(1)), unit: 'Cel', recordedAt: now },
        supplemental_oxygen: { value: supplementalOxygen, unit: null, recordedAt: now },
        consciousness: { value: consciousness, unit: null, recordedAt: now },
      },
    };

    try {
      const res = await apiService.saveOperation('gravity_fields', 'vitals', payload);
      setSuccessMsg(`Sinais vitais gravados com sucesso! Escore NEWS2: ${res.operation?.calculation?.score ?? 'calculado'}`);
      addXP(30);
      triggerRefresh();
      setTimeout(handleClose, 1800);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
        setFieldErrors(err.fields || {});
      } else {
        setErrorMsg(err.message || 'Erro ao gravar sinais vitais.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAtmosphere = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setErrorMsg(null);
    setFieldErrors({});
    setSuccessMsg(null);

    const now = new Date().toISOString();
    const id = `atmo-${Date.now()}`;
    const payload = {
      astronautId,
      id,
      source,
      location: atmoLocation,
      environment: 'nominal_cabin',
      recordedAt: now,
      pressure: { value: Number(pressureVal), unit: 'mmHg' },
      co2Ppm: Number(co2Ppm),
      oxygenFraction: Number(oxygenFraction),
    };

    try {
      const res = await apiService.saveOperation('hostile_closed_environment', 'atmosphere', payload);
      setSuccessMsg(`Atmosfera registrada! ppCO2 calculada: ${res.operation?.calculation?.partialCo2?.toFixed(2)} mmHg`);
      addXP(25);
      triggerRefresh();
      setTimeout(handleClose, 1800);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
        setFieldErrors(err.fields || {});
      } else {
        setErrorMsg(err.message || 'Erro ao registrar atmosfera.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveMind = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setErrorMsg(null);
    setFieldErrors({});
    setSuccessMsg(null);

    const now = new Date().toISOString();
    const records = [
      { indicator: 'mood_score', value: Number(moodScore), unit: null, recordedAt: now, source },
      { indicator: 'stress', value: Number(stress), unit: null, recordedAt: now, source },
      { indicator: 'sleep_quality', value: Number(sleepQuality), unit: null, recordedAt: now, source },
      { indicator: 'sleepiness_kss', value: Math.round(sleepinessKss), unit: null, recordedAt: now, source },
      { indicator: 'fatigue_samn_perelli', value: Math.round(fatigueSamn), unit: null, recordedAt: now, source },
    ];

    try {
      await apiService.saveRecords('isolation_confinement', astronautId, records);
      setSuccessMsg('Check-in psicológico salvo no servidor com sucesso!');
      addXP(30);
      triggerRefresh();
      setTimeout(handleClose, 1800);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
        setFieldErrors(err.fields || {});
      } else {
        setErrorMsg(err.message || 'Erro ao salvar check-in.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSymptoms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setErrorMsg(null);
    setFieldErrors({});
    setSuccessMsg(null);

    const now = new Date().toISOString();
    const records = [
      { indicator: 'motion_sickness', value: Math.round(motionSickness), unit: null, recordedAt: now, source },
      { indicator: 'headache', value: Math.round(headache), unit: null, recordedAt: now, source },
      { indicator: 'dizziness', value: dizziness ? 1 : 0, unit: null, recordedAt: now, source },
      { indicator: 'near_fainting', value: nearFainting ? 1 : 0, unit: null, recordedAt: now, source },
      { indicator: 'vision_change', value: visionChange ? 1 : 0, unit: null, recordedAt: now, source },
      { indicator: 'amsler_change', value: amslerChange ? 1 : 0, unit: null, recordedAt: now, source },
    ];

    try {
      await apiService.saveRecords('gravity_fields', astronautId, records);
      setSuccessMsg('Autorrelato de sintomas registrado no servidor com sucesso!');
      addXP(25);
      triggerRefresh();
      setTimeout(handleClose, 1800);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
        setFieldErrors(err.fields || {});
      } else {
        setErrorMsg(err.message || 'Erro ao registrar sintomas.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-space-850 border border-space-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-space-700/60 bg-space-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-astro-cyan/15 text-astro-cyan">
                <Activity size={22} />
              </div>
              <div>
                <h3 className="text-base lg:text-lg font-bold text-white tracking-wide">
                  Novo Registro Médico & Operacional
                </h3>
                <p className="text-xs text-space-300">
                  Transmissão direta para o back-end oficial (AstroVida API)
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-space-400 hover:text-white rounded-lg hover:bg-space-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Source selection & Dataset notice */}
          <div className="px-5 py-2.5 bg-space-900 border-b border-space-750 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-space-400">Origem da entrada (source):</span>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as any)}
                className="bg-space-800 border border-space-600 rounded px-2 py-0.5 text-xs text-white font-mono focus:outline-none"
              >
                <option value="manual">manual (registro tripulação)</option>
                <option value="sensor">sensor (dispositivo/telemetria)</option>
                <option value="simulated">simulated (demonstração)</option>
              </select>
            </div>
            <span className="text-[10px] text-space-400 font-mono">
              Astronauta: <strong>{astronautId}</strong>
            </span>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="m-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="m-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-space-700/60 bg-space-900/60 p-2 gap-2">
            <button
              onClick={() => setActiveTab('vitals')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'vitals'
                  ? 'bg-space-750 text-astro-cyan shadow-sm border border-astro-cyan/30'
                  : 'text-space-300 hover:bg-space-800'
              }`}
            >
              <HeartPulse size={15} />
              <span>Sinais Vitais</span>
            </button>
            <button
              onClick={() => setActiveTab('atmosphere')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'atmosphere'
                  ? 'bg-space-750 text-astro-cyan shadow-sm border border-astro-cyan/30'
                  : 'text-space-300 hover:bg-space-800'
              }`}
            >
              <Wind size={15} />
              <span>Atmosfera</span>
            </button>
            <button
              onClick={() => setActiveTab('mind')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'mind'
                  ? 'bg-space-750 text-astro-cyan shadow-sm border border-astro-cyan/30'
                  : 'text-space-300 hover:bg-space-800'
              }`}
            >
              <Smile size={15} />
              <span>Check-in Mente</span>
            </button>
            <button
              onClick={() => setActiveTab('symptoms')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'symptoms'
                  ? 'bg-space-750 text-astro-cyan shadow-sm border border-astro-cyan/30'
                  : 'text-space-300 hover:bg-space-800'
              }`}
            >
              <Sliders size={15} />
              <span>Sintomas</span>
            </button>
          </div>

          {/* TAB 1: VITALS */}
          {activeTab === 'vitals' && (
            <form onSubmit={handleSaveVitals} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                  <label className="block text-[11px] font-medium text-space-300 mb-1">
                    Pressão Arterial
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      required
                      value={systolic}
                      onChange={(e) => setSystolic(Number(e.target.value))}
                      className="w-full bg-space-800 border border-space-600 rounded px-2 py-1 text-xs text-white font-mono text-center"
                    />
                    <span className="text-space-400">/</span>
                    <input
                      type="number"
                      required
                      value={diastolic}
                      onChange={(e) => setDiastolic(Number(e.target.value))}
                      className="w-full bg-space-800 border border-space-600 rounded px-2 py-1 text-xs text-white font-mono text-center"
                    />
                    <span className="text-[10px] text-space-400 font-mono">mmHg</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                  <label className="block text-[11px] font-medium text-space-300 mb-1">
                    Frequência Cardíaca
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      required
                      value={heartRate}
                      onChange={(e) => setHeartRate(Number(e.target.value))}
                      className="w-full bg-space-800 border border-space-600 rounded px-2.5 py-1 text-xs text-white font-mono"
                    />
                    <span className="text-[10px] text-space-400 font-mono">bpm</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                  <label className="block text-[11px] font-medium text-space-300 mb-1">
                    Freq. Respiratória
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      required
                      value={respiratoryRate}
                      onChange={(e) => setRespiratoryRate(Number(e.target.value))}
                      className="w-full bg-space-800 border border-space-600 rounded px-2.5 py-1 text-xs text-white font-mono"
                    />
                    <span className="text-[10px] text-space-400 font-mono">resp/min</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                  <label className="block text-[11px] font-medium text-space-300 mb-1">
                    SpO2 (Escala 1)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={50}
                      max={100}
                      required
                      value={spo2}
                      onChange={(e) => setSpo2(Number(e.target.value))}
                      className="w-full bg-space-800 border border-space-600 rounded px-2.5 py-1 text-xs text-white font-mono"
                    />
                    <span className="text-[10px] text-space-400 font-mono">%</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                  <label className="block text-[11px] font-medium text-space-300 mb-1">
                    Temperatura Corporal
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={temperature}
                      onChange={(e) => setTemperature(Number(e.target.value))}
                      className="w-full bg-space-800 border border-space-600 rounded px-2.5 py-1 text-xs text-white font-mono"
                    />
                    <span className="text-[10px] text-space-400 font-mono">°C</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                  <label className="block text-[11px] font-medium text-space-300 mb-1">
                    Consciência (ACVPU)
                  </label>
                  <select
                    value={consciousness}
                    onChange={(e) => setConsciousness(e.target.value as any)}
                    className="w-full bg-space-800 border border-space-600 rounded px-2 py-1 text-xs text-white font-mono"
                  >
                    <option value="A">A (Alerta)</option>
                    <option value="C">C (Confuso)</option>
                    <option value="V">V (Voz)</option>
                    <option value="P">P (Dor)</option>
                    <option value="U">U (Inconsciente)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold bg-astro-cyan text-space-950 rounded-xl hover:bg-sky-400 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Gravando...' : 'Salvar Sinais Vitais (NEWS2)'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ATMOSPHERE */}
          {activeTab === 'atmosphere' && (
            <form onSubmit={handleSaveAtmosphere} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                  <label className="block text-[11px] font-medium text-space-300 mb-1">
                    Localização (location)
                  </label>
                  <input
                    type="text"
                    required
                    value={atmoLocation}
                    onChange={(e) => setAtmoLocation(e.target.value)}
                    className="w-full bg-space-800 border border-space-600 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                  <label className="block text-[11px] font-medium text-space-300 mb-1">
                    Pressão Absoluta (mmHg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={pressureVal}
                    onChange={(e) => setPressureVal(Number(e.target.value))}
                    className="w-full bg-space-800 border border-space-600 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                  <label className="block text-[11px] font-medium text-space-300 mb-1">
                    CO₂ (ppm)
                  </label>
                  <input
                    type="number"
                    required
                    value={co2Ppm}
                    onChange={(e) => setCo2Ppm(Number(e.target.value))}
                    className="w-full bg-space-800 border border-space-600 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                  <label className="block text-[11px] font-medium text-space-300 mb-1">
                    Fração O₂ (0 a 1)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={1}
                    required
                    value={oxygenFraction}
                    onChange={(e) => setOxygenFraction(Number(e.target.value))}
                    className="w-full bg-space-800 border border-space-600 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl transition-all disabled:opacity-50"
                >
                  {submitting ? 'Gravando...' : 'Salvar Atmosfera'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: MIND & SLEEP CHECK-IN */}
          {activeTab === 'mind' && (
            <form onSubmit={handleSaveMind} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-space-300">Humor (mood_score):</span>
                    <span className="font-mono text-astro-cyan font-bold">{moodScore} / 100</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={moodScore}
                    onChange={(e) => setMoodScore(Number(e.target.value))}
                    className="w-full accent-astro-cyan"
                  />
                </div>

                <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-space-300">Estresse (stress):</span>
                    <span className="font-mono text-amber-400 font-bold">{stress} / 100</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={stress}
                    onChange={(e) => setStress(Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>

                <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-space-300">Qualidade Sono (sleep_quality):</span>
                    <span className="font-mono text-indigo-400 font-bold">{sleepQuality} / 100</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={sleepQuality}
                    onChange={(e) => setSleepQuality(Number(e.target.value))}
                    className="w-full accent-indigo-400"
                  />
                </div>

                <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-space-300">Sonolência KSS (1 a 9):</span>
                    <span className="font-mono text-purple-400 font-bold">{sleepinessKss}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={9}
                    step={1}
                    value={sleepinessKss}
                    onChange={(e) => setSleepinessKss(Number(e.target.value))}
                    className="w-full accent-purple-400"
                  />
                </div>

                <div className="p-3 rounded-xl bg-space-900 border border-space-750 col-span-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-space-300">Fadiga Samn-Perelli (1 a 7):</span>
                    <span className="font-mono text-rose-400 font-bold">{fatigueSamn}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={7}
                    step={1}
                    value={fatigueSamn}
                    onChange={(e) => setFatigueSamn(Number(e.target.value))}
                    className="w-full accent-rose-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : 'Salvar Check-in Psicológico'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: GRAVITY SYMPTOMS */}
          {activeTab === 'symptoms' && (
            <form onSubmit={handleSaveSymptoms} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                  <label className="block text-[11px] font-medium text-space-300 mb-1">
                    Enjoo de Movimento (motion_sickness: 0–20)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={motionSickness}
                    onChange={(e) => setMotionSickness(Number(e.target.value))}
                    className="w-full bg-space-800 border border-space-600 rounded px-2.5 py-1 text-xs text-white font-mono"
                  />
                </div>

                <div className="p-3 rounded-xl bg-space-900 border border-space-750">
                  <label className="block text-[11px] font-medium text-space-300 mb-1">
                    Cefaleia / Dor de Cabeça (headache: 0–10)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={headache}
                    onChange={(e) => setHeadache(Number(e.target.value))}
                    className="w-full bg-space-800 border border-space-600 rounded px-2.5 py-1 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2 p-3 rounded-xl bg-space-900 border border-space-750">
                <span className="text-xs font-bold text-space-200 block mb-1">Sintomas Binários (0 ou 1):</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dizziness}
                      onChange={(e) => setDizziness(e.target.checked)}
                      className="accent-astro-cyan rounded"
                    />
                    <span className="text-space-300">Tontura (dizziness)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nearFainting}
                      onChange={(e) => setNearFainting(e.target.checked)}
                      className="accent-astro-cyan rounded"
                    />
                    <span className="text-space-300">Quase desmaio (near_fainting)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visionChange}
                      onChange={(e) => setVisionChange(e.target.checked)}
                      className="accent-astro-cyan rounded"
                    />
                    <span className="text-space-300">Mudança visual (vision_change)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={amslerChange}
                      onChange={(e) => setAmslerChange(e.target.checked)}
                      className="accent-astro-cyan rounded"
                    />
                    <span className="text-space-300">Grelha de Amsler alterada</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : 'Salvar Sintomas (Autorrelato)'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
