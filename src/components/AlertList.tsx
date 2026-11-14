import React from 'react';
import { useStore } from '../store/useStore';
import { StatusPill } from './StatusPill';
import { AlertOctagon, PhoneCall, ArrowRight, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AlertList: React.FC = () => {
  const navigate = useNavigate();
  const { alerts, setIsSurgeonModalOpen } = useStore();

  const handleActionClick = (alertId: string, alertAction?: string) => {
    if (alertAction === 'Contatar cirurgião de voo') {
      setIsSurgeonModalOpen(true);
    } else if (alertAction === 'Iniciar Protocolo de Abrigo') {
      navigate('/radiacao');
    } else if (alertAction === 'Verificar Sensores da Cabine') {
      navigate('/ambiente');
    }
  };

  return (
    <div className="rounded-2xl bg-space-850/90 border border-space-700/80 p-4 lg:p-5 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
            <Bell size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Alertas Priorizados
            </h2>
            <p className="text-[11px] text-space-400">
              Notificações de telemetria clínica
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
          {alerts.length} ATIVOS
        </span>
      </div>

      {/* Emergency Surgeon Action Button */}
      <button
        onClick={() => setIsSurgeonModalOpen(true)}
        className="w-full mb-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-glow-red transition-all transform active:scale-98"
      >
        <PhoneCall size={16} />
        <span>Contatar Cirurgião de Voo (Canal Prioritário)</span>
      </button>

      {/* Alerts list */}
      <div className="space-y-2.5">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-3 rounded-xl border text-xs transition-all ${
              alert.level === 'red'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                : 'bg-space-900/90 border-space-700/80 text-space-200'
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="font-bold text-white text-xs truncate">
                {alert.title}
              </span>
              <span className="text-[10px] text-space-400 font-mono shrink-0">
                {alert.timestamp}
              </span>
            </div>
            <p className="text-space-300 text-[11px] mb-2 leading-relaxed">
              {alert.subtitle}
            </p>

            {alert.actionText && (
              <div className="flex justify-end">
                <button
                  onClick={() => handleActionClick(alert.id, alert.actionText)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-astro-cyan hover:underline"
                >
                  <span>{alert.actionText}</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
