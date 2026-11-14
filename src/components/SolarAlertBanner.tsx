import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { SOLAR_ALERT_DETAILS } from '../mock/radiacao';
import { AlertTriangle, Clock, Shield, VolumeX, CheckCircle, ChevronRight, Zap } from 'lucide-react';

export const SolarAlertBanner: React.FC = () => {
  const {
    solarCountdownSeconds,
    tickSolarCountdown,
    isShelterProtocolActive,
    solarProtocolStep,
    startShelterProtocol,
    advanceShelterStep,
    silenceSolarAlert,
    isSolarSilenced,
  } = useStore();

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
          <VolumeX size={16} /> Alerta solar silenciado por 5 minutos
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
                {SOLAR_ALERT_DETAILS.title}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-rose-500 text-white animate-pulse">
                CRÍTICO
              </span>
            </div>
            <p className="text-xs text-rose-200/80 mt-0.5 font-medium">
              Fonte: {SOLAR_ALERT_DETAILS.source} · {SOLAR_ALERT_DETAILS.flareClass}
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

      {/* 4 Protocol Steps */}
      <div className="my-4">
        <span className="text-xs font-bold uppercase tracking-wider text-space-300 block mb-2">
          Protocolo Obrigatório de Abrigo ({isShelterProtocolActive ? `Etapa ${solarProtocolStep} de 4 em andamento` : 'Pendente de Início'}):
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {SOLAR_ALERT_DETAILS.protocolSteps.map((s) => {
            const isCompleted = isShelterProtocolActive && solarProtocolStep > s.step;
            const isCurrent = isShelterProtocolActive && solarProtocolStep === s.step;

            return (
              <div
                key={s.step}
                className={`p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                  isCompleted
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : isCurrent
                    ? 'bg-rose-950/40 border-rose-500/60 text-white shadow-glow-red'
                    : 'bg-space-900/60 border-space-700/60 text-space-300'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                    isCompleted
                      ? 'bg-emerald-500 text-space-950'
                      : isCurrent
                      ? 'bg-rose-500 text-white'
                      : 'bg-space-800 text-space-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle size={12} /> : s.step}
                </span>
                <div>
                  <h4 className="font-semibold text-xs leading-tight">{s.title}</h4>
                  <p className="text-[11px] text-space-400 mt-0.5 leading-snug">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-rose-500/30">
        <button
          onClick={silenceSolarAlert}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-space-800 hover:bg-space-700 text-space-300 hover:text-white text-xs font-semibold transition-colors border border-space-700"
        >
          <VolumeX size={14} />
          <span>Silenciar 5 min</span>
        </button>

        {!isShelterProtocolActive ? (
          <button
            onClick={startShelterProtocol}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs lg:text-sm shadow-glow-red transition-all transform active:scale-95"
          >
            <Shield size={16} />
            <span>Iniciar Protocolo de Abrigo</span>
          </button>
        ) : (
          <button
            onClick={advanceShelterStep}
            disabled={solarProtocolStep >= 4}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs lg:text-sm shadow-glow-green transition-all"
          >
            <span>
              {solarProtocolStep >= 4 ? 'Protocolo Concluído no Abrigo' : `Concluir Etapa ${solarProtocolStep} & Avançar`}
            </span>
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
