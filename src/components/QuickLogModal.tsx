import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { X, Camera, Activity, Sliders, CheckCircle2, Scan, Eye, HeartPulse, RefreshCw } from 'lucide-react';

export const QuickLogModal: React.FC = () => {
  const { isNewLogModalOpen, setIsNewLogModalOpen, updateVitalSign, addXP } = useStore();

  const [activeTab, setActiveTab] = useState<'vitals' | 'camera' | 'sliders'>('vitals');

  // Form states
  const [systolic, setSystolic] = useState(118);
  const [diastolic, setDiastolic] = useState(76);
  const [heartRate, setHeartRate] = useState(62);
  const [glucose, setGlucose] = useState(102);
  const [temperature, setTemperature] = useState(36.7);
  const [spo2, setSpo2] = useState(98);

  // Sliders state
  const [fatigueLevel, setFatigueLevel] = useState(25);
  const [headacheLevel, setHeadacheLevel] = useState(10);
  const [vestibularDiscomfort, setVestibularDiscomfort] = useState(15);

  // Camera simulation state
  const [cameraType, setCameraType] = useState<'skin' | 'eyes' | 'ultrasound'>('eyes');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  if (!isNewLogModalOpen) return null;

  const handleStartScan = () => {
    setIsScanning(true);
    setScanResult(null);
    setTimeout(() => {
      setIsScanning(false);
      if (cameraType === 'eyes') {
        setScanResult('Disco óptico nítido. Sem dobras coroidais graves. Escavação fisiológica 0,3. Sem progressão de SANS.');
      } else if (cameraType === 'skin') {
        setScanResult('Dermatoscopia IA: Eritema macular superficial não infeccioso. pH cutâneo 5,8. Indicado hidratante neutro.');
      } else {
        setScanResult('Ultrassom Modo-B: Volemia caval normal. Sem colapso inspiratório acentuado. Diâmetro ONSD 4,8 mm (normal).');
      }
      addXP(15);
    }, 2200);
  };

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    updateVitalSign('bp', `${systolic}/${diastolic}`);
    updateVitalSign('hr', heartRate);
    updateVitalSign('glucose', glucose, glucose > 100 ? 'yellow' : 'green');
    updateVitalSign('temp', temperature);
    addXP(30);
    setIsNewLogModalOpen(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-space-850 border border-space-700 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-space-700/60 bg-space-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-astro-cyan/15 text-astro-cyan">
                <Activity size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-wide">
                  Novo Registro Médico
                </h3>
                <p className="text-xs text-space-300">
                  Entrada de telemetria fisiológica e biométrica local
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsNewLogModalOpen(false)}
              className="p-2 text-space-400 hover:text-white rounded-lg hover:bg-space-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-space-700/60 bg-space-900/60 p-2 gap-2">
            <button
              onClick={() => setActiveTab('vitals')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'vitals'
                  ? 'bg-space-750 text-astro-cyan shadow-sm border border-astro-cyan/30'
                  : 'text-space-300 hover:bg-space-800'
              }`}
            >
              <HeartPulse size={16} />
              <span>Sinais Vitais</span>
            </button>
            <button
              onClick={() => setActiveTab('camera')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'camera'
                  ? 'bg-space-750 text-astro-cyan shadow-sm border border-astro-cyan/30'
                  : 'text-space-300 hover:bg-space-800'
              }`}
            >
              <Camera size={16} />
              <span>Câmera & Exame Óptico</span>
            </button>
            <button
              onClick={() => setActiveTab('sliders')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'sliders'
                  ? 'bg-space-750 text-astro-cyan shadow-sm border border-astro-cyan/30'
                  : 'text-space-300 hover:bg-space-800'
              }`}
            >
              <Sliders size={16} />
              <span>Sintomas Rápidos</span>
            </button>
          </div>

          {/* Tab 1: Vitals */}
          {activeTab === 'vitals' && (
            <form onSubmit={handleSaveVitals} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {/* Pressão Arterial */}
                <div className="p-3.5 rounded-xl bg-space-900/80 border border-space-700/80">
                  <label className="block text-xs font-medium text-space-300 mb-1">
                    Pressão Arterial (Sistólica / Diastólica)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={systolic}
                      onChange={(e) => setSystolic(Number(e.target.value))}
                      className="w-full bg-space-800 border border-space-600 rounded-lg px-3 py-1.5 text-white font-mono font-bold text-center focus:border-astro-cyan focus:outline-none"
                    />
                    <span className="text-space-400 font-bold">/</span>
                    <input
                      type="number"
                      value={diastolic}
                      onChange={(e) => setDiastolic(Number(e.target.value))}
                      className="w-full bg-space-800 border border-space-600 rounded-lg px-3 py-1.5 text-white font-mono font-bold text-center focus:border-astro-cyan focus:outline-none"
                    />
                    <span className="text-xs text-space-400 font-mono">mmHg</span>
                  </div>
                </div>

                {/* FC */}
                <div className="p-3.5 rounded-xl bg-space-900/80 border border-space-700/80">
                  <label className="block text-xs font-medium text-space-300 mb-1">
                    Frequência Cardíaca
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={heartRate}
                      onChange={(e) => setHeartRate(Number(e.target.value))}
                      className="w-full bg-space-800 border border-space-600 rounded-lg px-3 py-1.5 text-white font-mono font-bold text-center focus:border-astro-cyan focus:outline-none"
                    />
                    <span className="text-xs text-space-400 font-mono">bpm</span>
                  </div>
                </div>

                {/* Glicose */}
                <div className="p-3.5 rounded-xl bg-space-900/80 border border-space-700/80">
                  <label className="block text-xs font-medium text-space-300 mb-1">
                    Glicemia Capilar (Jejum)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={glucose}
                      onChange={(e) => setGlucose(Number(e.target.value))}
                      className="w-full bg-space-800 border border-space-600 rounded-lg px-3 py-1.5 text-white font-mono font-bold text-center focus:border-astro-cyan focus:outline-none"
                    />
                    <span className="text-xs text-space-400 font-mono">mg/dL</span>
                  </div>
                </div>

                {/* Temperatura */}
                <div className="p-3.5 rounded-xl bg-space-900/80 border border-space-700/80">
                  <label className="block text-xs font-medium text-space-300 mb-1">
                    Temperatura Timpânica
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(Number(e.target.value))}
                      className="w-full bg-space-800 border border-space-600 rounded-lg px-3 py-1.5 text-white font-mono font-bold text-center focus:border-astro-cyan focus:outline-none"
                    />
                    <span className="text-xs text-space-400 font-mono">°C</span>
                  </div>
                </div>

                {/* SpO2 */}
                <div className="p-3.5 rounded-xl bg-space-900/80 border border-space-700/80 col-span-2">
                  <label className="block text-xs font-medium text-space-300 mb-1">
                    Saturação Periférica de Oxigênio (SpO2)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={90}
                      max={100}
                      value={spo2}
                      onChange={(e) => setSpo2(Number(e.target.value))}
                      className="w-full accent-astro-cyan"
                    />
                    <span className="text-lg font-mono font-bold text-astro-cyan min-w-[3.5rem] text-right">
                      {spo2} %
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-space-700/60">
                <span className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> +30 XP ao salvar registro
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewLogModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-space-300 hover:text-white rounded-lg hover:bg-space-700/50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-astro-cyan text-space-950 rounded-xl hover:bg-sky-400 transition-all shadow-glow-cyan"
                  >
                    Salvar Registros
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Tab 2: Camera Simulation */}
          {activeTab === 'camera' && (
            <div className="p-6 space-y-4">
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => { setCameraType('eyes'); setScanResult(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    cameraType === 'eyes' ? 'bg-astro-cyan/20 text-astro-cyan border border-astro-cyan/40' : 'bg-space-800 text-space-300'
                  }`}
                >
                  Fundo de Olho (SANS)
                </button>
                <button
                  onClick={() => { setCameraType('skin'); setScanResult(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    cameraType === 'skin' ? 'bg-astro-cyan/20 text-astro-cyan border border-astro-cyan/40' : 'bg-space-800 text-space-300'
                  }`}
                >
                  Dermatoscopia (Pele)
                </button>
                <button
                  onClick={() => { setCameraType('ultrasound'); setScanResult(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    cameraType === 'ultrasound' ? 'bg-astro-cyan/20 text-astro-cyan border border-astro-cyan/40' : 'bg-space-800 text-space-300'
                  }`}
                >
                  Sonda Ultrassom (Veia Cava)
                </button>
              </div>

              {/* Camera Viewfinder */}
              <div className="relative aspect-video rounded-xl bg-space-950 border border-space-700 overflow-hidden flex flex-col items-center justify-center">
                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

                {/* Laser scan animation when scanning */}
                {isScanning && (
                  <motion.div
                    className="absolute inset-x-0 h-1 bg-astro-cyan shadow-[0_0_15px_#38bdf8]"
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  />
                )}

                {/* Camera Center Target */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full border border-dashed border-astro-cyan/40 flex items-center justify-center">
                    {cameraType === 'eyes' && <Eye size={36} className="text-astro-cyan/80 animate-pulse-subtle" />}
                    {cameraType === 'skin' && <Scan size={36} className="text-amber-400/80 animate-pulse-subtle" />}
                    {cameraType === 'ultrasound' && <Activity size={36} className="text-emerald-400/80 animate-pulse-subtle" />}
                  </div>
                  <span className="mt-3 text-xs font-mono text-space-300 uppercase tracking-widest">
                    {isScanning ? 'Processando IA BioScan...' : 'Posicione o sensor óptico'}
                  </span>
                </div>

                <div className="absolute top-3 left-3 text-[10px] font-mono text-space-400 bg-space-900/80 px-2 py-0.5 rounded border border-space-700">
                  CAMERA SENSOR ID: AGY-CAM-74 · FPS: 60
                </div>
              </div>

              {/* Scan result display */}
              {scanResult && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-space-200">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
                    <CheckCircle2 size={15} /> Diagnóstico Instantâneo IA:
                  </div>
                  <p>{scanResult}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isScanning}
                  onClick={handleStartScan}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-astro-cyan text-space-950 font-bold text-xs hover:bg-sky-400 transition-all shadow-glow-cyan disabled:opacity-50"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Escaneando...
                    </>
                  ) : (
                    <>
                      <Scan size={14} /> Capturar e Analisar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Sliders */}
          {activeTab === 'sliders' && (
            <div className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-space-300">Nível de Fadiga Física</span>
                    <span className="font-mono text-astro-cyan">{fatigueLevel} / 100</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={fatigueLevel}
                    onChange={(e) => setFatigueLevel(Number(e.target.value))}
                    className="w-full accent-astro-cyan"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-space-300">Intensidade de Cefaleia (Dor de Cabeça)</span>
                    <span className="font-mono text-amber-400">{headacheLevel} / 100</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={headacheLevel}
                    onChange={(e) => setHeadacheLevel(Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-space-300">Desconforto Vestibular / Cinetose Espacial</span>
                    <span className="font-mono text-rose-400">{vestibularDiscomfort} / 100</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={vestibularDiscomfort}
                    onChange={(e) => setVestibularDiscomfort(Number(e.target.value))}
                    className="w-full accent-rose-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-space-700/60">
                <span className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> +20 XP ao registrar sintomas
                </span>
                <button
                  type="button"
                  onClick={() => {
                    addXP(20);
                    setIsNewLogModalOpen(false);
                  }}
                  className="px-5 py-2 text-xs font-bold bg-astro-cyan text-space-950 rounded-xl hover:bg-sky-400 transition-all shadow-glow-cyan"
                >
                  Concluir Registro
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
