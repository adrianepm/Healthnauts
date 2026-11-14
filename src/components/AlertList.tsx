import React from 'react';
import { useStore } from '../store/useStore';
import { StatusPill } from './StatusPill';
import { AlertOctagon, PhoneCall, ArrowRight, Bell, ShieldCheck, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ApiAssessment } from '../services/api';

interface AlertListProps {
  apiAlerts?: ApiAssessment[];
  inObservation?: (ApiAssessment & { since: string })[];
  loading?: boolean;
}

export const AlertList: React.FC<AlertListProps> = ({
  apiAlerts,
  inObservation,
  loading = false,
}) => {
  const navigate = useNavigate();
  const { alerts: fallbackAlerts, setIsSurgeonModalOpen, openMetricDetailModal } = useStore();

  const activeAlerts = apiAlerts !== undefined ? apiAlerts : fallbackAlerts as any[];

  const getAreaRoute = (areaId?: string, indicator?: string) => {
    switch (areaId) {
      case 'radiation':
        return '/radiacao';
      case 'isolation_confinement':
        return '/isolamento';
      case 'gravity_fields':
        return '/gravidade';
      case 'hostile_closed_environment':
        return '/ambiente';
      case 'distance_from_earth':
        return '/distancia';
      default:
        if (indicator?.includes('co2')) return '/ambiente';
        if (indicator?.includes('solar') || indicator?.includes('dose')) return '/radiacao';
        if (indicator?.includes('sleep') || indicator?.includes('pvt')) return '/isolamento';
        return '/gravidade';
    }
  };

  const handleOpenAlertDetail = (alert: any) => {
    openMetricDetailModal({
      title: alert.title || `Alerta: ${alert.indicator || 'Monitoramento Clínico'}`,
      subtitle: alert.subtitle || alert.message || 'Alerta gerado pelo motor de avaliação oficial',
      value: alert.value !== undefined ? String(alert.value) : (alert.level === 'risk' ? 'Risco' : 'Atenção'),
      unit: alert.unit || undefined,
      level: alert.level || 'yellow',
      whyMeasure: alert.rule?.source?.edition || alert.rule?.id || 'Protocolo de segurança aeroespacial da missão.',
      whatToDo: alert.message || 'Revisar telemetria com a tripulação e acionar contramedidas a bordo.',
      ruleId: alert.rule?.id,
      ruleVersion: alert.rule?.version,
      ruleSource: alert.rule?.source,
      limitation: alert.limitation,
      scientificCategory: alert.scientificCategory,
      status: alert.status,
      quality: alert.quality,
      recordedAt: alert.recordedAt || alert.evaluatedAt,
      source: alert.source,
    });
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
              Alertas Priorizados (API)
            </h2>
            <p className="text-[11px] text-space-400">
              Notificações de telemetria clínica & telemedicina
            </p>
          </div>
        </div>
        <span
          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
            activeAlerts.length > 0
              ? 'text-amber-400 bg-amber-500/15 border-amber-500/30'
              : 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
          }`}
        >
          {loading ? 'CARREGANDO...' : `${activeAlerts.length} ATIVOS`}
        </span>
      </div>

      {/* Emergency Surgeon Action Button */}
      <button
        onClick={() => setIsSurgeonModalOpen(true)}
        className="w-full mb-3 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-glow-red transition-all transform active:scale-98"
      >
        <PhoneCall size={14} />
        <span>Canal Assíncrono com Cirurgião de Voo</span>
      </button>

      {/* Empty State */}
      {!loading && activeAlerts.length === 0 && (
        <div className="p-4 rounded-xl bg-space-900/80 border border-space-750 text-center space-y-1">
          <div className="flex justify-center text-emerald-400 mb-1">
            <ShieldCheck size={24} />
          </div>
          <span className="text-xs font-bold text-white block">
            Sem alertas ativos no momento
          </span>
          <p className="text-[11px] text-space-400">
            Nenhuma regra demonstrativa disparou nível de risco ou atenção.
          </p>
        </div>
      )}

      {/* Alerts list */}
      <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
        {activeAlerts.map((alert: any, idx: number) => {
          const isRisk = alert.level === 'risk';
          const title = alert.title || alert.indicator || `Alerta #${idx + 1}`;
          const message = alert.message || alert.subtitle || 'Avaliação prioritária indicada pelo back-end';
          const areaRoute = getAreaRoute(alert.areaId, alert.indicator);

          return (
            <div
              key={alert.id || idx}
              onClick={() => handleOpenAlertDetail(alert)}
              className={`p-3 rounded-xl border text-xs transition-all cursor-pointer group hover:border-space-500 ${
                isRisk
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                  : 'bg-space-900/90 border-space-700/80 text-space-200'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-bold text-white text-xs truncate group-hover:text-astro-cyan transition-colors">
                  {title}
                </span>
                <span className="text-[10px] text-space-400 font-mono shrink-0">
                  {alert.evaluatedAt || alert.recordedAt ? new Date(alert.evaluatedAt || alert.recordedAt).toLocaleTimeString() : 'Ativo'}
                </span>
              </div>
              <p className="text-space-300 text-[11px] mb-2 leading-relaxed">
                {message}
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-space-800/80">
                <span className="text-[10px] font-mono text-space-400">
                  {alert.rule?.id || alert.source || 'Regra ativa'}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(areaRoute);
                  }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-astro-cyan hover:underline"
                >
                  <span>Ver na tela</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* In Observation section if present */}
      {inObservation && inObservation.length > 0 && (
        <div className="mt-3 pt-3 border-t border-space-700/60">
          <div className="flex items-center justify-between text-[11px] font-mono text-space-400 mb-1.5">
            <span className="flex items-center gap-1 text-amber-400">
              <Clock size={12} /> Em Observação Contínua ({inObservation.length})
            </span>
          </div>
          <div className="space-y-1">
            {inObservation.slice(0, 3).map((obs, i) => (
              <div key={i} className="text-[10px] text-space-300 font-mono truncate">
                · {obs.indicator} (desde {new Date(obs.since).toLocaleDateString()})
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
