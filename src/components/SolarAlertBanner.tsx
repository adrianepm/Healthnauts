import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { AlertTriangle, Clock, Shield, VolumeX, CheckCircle, ChevronRight, Zap, Play } from 'lucide-react';
import { ApiAssessment } from '../services/api';

interface SolarAlertBannerProps {
  solarAssessment?: ApiAssessment | null;
}

export const SolarAlertBanner: React.FC<SolarAlertBannerProps> = ({
  solarAssessment,
}) => {
  const {
    solarCountdownSeconds,
    tickSolarCountdown,
    isShelterProtocolActive,
    solarProtocolStep,
    startShelterProtocol,
    advanceShelterStep,
    silenceSolarAlert,
    isSolarSilenced,
    setIsScenarioModalOpen,
  } = useStore();

  const isServerActive = Boolean(solarAssessment && solarAssessment.level === 'attention');
  const isSimulation = true;

  // Active countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      tickSolarCountdown();
    }, 1000);
    return () => clearInterval(timer);
  }, [tickSolarCountdown]);

  if (isSolarSilenced) {
    return (
      <div className="p-3.5 rounded-2xl bg-space-850/80 border border-space-700 flex items-center justify-between text-xs text-space-300">
        <span className="flex items-center gap-2 text-amber-400 font-semibold">
          <VolumeX size={16} /> Alerta solar simulado silenciado por 5 minutos
        </span>
        <span className="font-mono text-space-400">
          Pico em {Math.floor(solarCountdownSeconds / 60)}m {solarCountdownSeconds % 60}s
        </span>
      </div>
    );
  }

  const hours = Math.floor(solarCountdownSeconds / 3600);
  const minutes = Math.floor((solarCountdownSeconds % 3600) / 60);
  const seconds = solarCountdownSeconds % 60;
  const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-rose-950/80 via-space-850 to-space-900 border-2 border-rose-500/60 shadow-glow-red p-5 relative overflow-hidden">
      {/* Decorative pulse indicator */}
      <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-rose-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm lg:text-base font-extrabold text-white tracking-wide uppercase">
                Evento Solar Simulado (SPE / Tempestade de Prótons)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-purple-600 text-white">
                SIMULADO
              </span>
              {isServerActive && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-rose-500 text-white animate-pulse">
                  ATIVO NO SERVIDOR
                </span>
              )}
            </div>
            <p className="text-xs text-rose-200/80 mt-0.5 font-medium">
              Fonte: GOES Simulado · Radiação de Alta Energia · Exercício de Contingência
            </p>
          </div>
        </div>

        {/* Live Functional Countdown */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-space-950/80 border border-rose-500/50">
          <Clock size={16} className="text-rose-400 animate-spin-slow" />
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-rose-300/80 block">
              Pico Estimado Em
            </span>
            <span className="text-lg lg:text-xl font-black font-mono text-rose-400 tracking-wider">
              {formattedTime}
            </span>
          </div>
        </div>
      </div>

      {/* Action / Shelter Protocol Stepper */}
      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-rose-200">
            <Shield size={16} className="text-rose-400" />
            <span className="font-semibold">
              Protocolo de Proteção Radiológica: Abrigo no Módulo B (Storm Shelter)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={silenceSolarAlert}
              className="text-xs text-rose-300 hover:text-white flex items-center gap-1 font-mono px-2 py-1 rounded bg-rose-900/40 hover:bg-rose-900/70 border border-rose-700/50"
            >
              <VolumeX size={13} /> Silenciar (5m)
            </button>
            <button
              onClick={() => setIsScenarioModalOpen(true)}
              className="text-xs text-purple-300 hover:text-white flex items-center gap-1 font-mono px-2.5 py-1 rounded bg-purple-900/40 hover:bg-purple-900/70 border border-purple-700/50"
            >
              <Play size={11} className="fill-purple-300" /> Acionar via Cenário
            </button>
          </div>
        </div>

        {/* 4 Protocol Steps */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          {[
            { step: 1, title: '1. Suspender EVA', desc: 'Recolher tripulação externa imediatamente.' },
            { step: 2, title: '2. Deslocamento', desc: 'Mover ao Módulo B (tanques de água no entorno).' },
            { step: 3, title: '3. Dosimetria', desc: 'Fixar dosímetros e registrar contadores pessoais.' },
            { step: 4, title: '4. Concluído', desc: 'Aguardar liberação do cirurgião de voo.' },
          ].map((s) => {
            const isDone = isShelterProtocolActive && solarProtocolStep > s.step;
            const isCurrent = isShelterProtocolActive && solarProtocolStep === s.step;

            return (
              <div
                key={s.step}
                className={`p-2.5 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : isCurrent
                    ? 'bg-rose-900/60 border-rose-400 text-white shadow-glow-red'
                    : 'bg-space-900/60 border-space-750 text-space-400'
                }`}
              >
                <div className="flex items-center justify-between font-bold mb-1">
                  <span>{s.title}</span>
                  {isDone && <CheckCircle size={14} className="text-emerald-400" />}
                </div>
                <p className="text-[11px] leading-tight opacity-90">{s.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Stepper Buttons */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-space-400 font-mono">
            {isShelterProtocolActive
              ? `Passo ${solarProtocolStep} de 4 em execução (+20 XP por avanço)`
              : 'Protocolo de abrigo em espera preventiva'}
          </span>

          {!isShelterProtocolActive ? (
            <button
              onClick={startShelterProtocol}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg transition-all"
            >
              <span>Iniciar Protocolo de Abrigo</span>
              <ChevronRight size={14} />
            </button>
          ) : solarProtocolStep < 4 ? (
            <button
              onClick={advanceShelterStep}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition-all"
            >
              <span>Confirmar Passo {solarProtocolStep} Concluído</span>
              <ChevronRight size={14} />
            </button>
          ) : (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30">
              <CheckCircle size={14} /> Protocolo Integralmente Cumprido (+60 XP)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
