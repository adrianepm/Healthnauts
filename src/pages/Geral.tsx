import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScoreRing } from '../components/ScoreRing';
import { HazardCard, AreaHazardData } from '../components/HazardCard';
import { VitalTile, VitalTileData } from '../components/VitalTile';
import { BodyMap } from '../components/BodyMap';
import { TaskList } from '../components/TaskList';
import { AlertList } from '../components/AlertList';
import { useStore } from '../store/useStore';
import { apiService, ApiOverviewResponse, ApiAlertsResponse } from '../services/api';
import { StatusLevel } from '../types';
import { AlertOctagon, RefreshCw, Database, ShieldAlert, WifiOff } from 'lucide-react';

export const Geral: React.FC = () => {
  const { astronautId, dataset, refreshTrigger, triggerRefresh } = useStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<ApiOverviewResponse | null>(null);
  const [alertsData, setAlertsData] = useState<ApiAlertsResponse | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    Promise.all([
      apiService.getOverview(astronautId, dataset, controller.signal),
      apiService.getAlerts(astronautId, dataset, controller.signal),
    ])
      .then(([ov, al]) => {
        if (!isCancelled) {
          setOverview(ov);
          setAlertsData(al);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled && err.name !== 'AbortError') {
          setError(
            err.message ||
              'Não foi possível conectar ao back-end da API (http://127.0.0.1:3000/api/v1). Certifique-se de que o servidor está rodando (npm start).'
          );
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [astronautId, dataset, refreshTrigger]);

  // Compute overall status and score
  const activeAlerts = alertsData?.alerts || [];
  const riskCount = activeAlerts.filter((a) => a.level === 'risk').length;
  const attentionCount = activeAlerts.filter((a) => a.level === 'attention').length;

  let computedLevel: StatusLevel = 'green';
  let computedScore = 94;
  let worstFactorText = 'Nenhum sinal crítico ativo';

  if (riskCount > 0) {
    computedLevel = 'red';
    computedScore = Math.max(45, 94 - riskCount * 25 - attentionCount * 10);
    worstFactorText = activeAlerts.find((a) => a.level === 'risk')?.message || 'Risco demonstrativo ativo';
  } else if (attentionCount > 0) {
    computedLevel = 'yellow';
    computedScore = Math.max(68, 94 - attentionCount * 8);
    worstFactorText = activeAlerts[0]?.message || 'Atenção demonstrativa em análise';
  }

  // Map 5 areas to HazardCard data
  const areaRoutes: Record<string, string> = {
    radiation: '/radiacao',
    isolation_confinement: '/isolamento',
    distance_from_earth: '/distancia',
    gravity_fields: '/gravidade',
    hostile_closed_environment: '/ambiente',
  };

  const hazards: AreaHazardData[] = (overview?.areas || []).map((a) => {
    const areaAlerts = activeAlerts.filter((al) => al.areaId === a.areaId);
    const hasRisk = areaAlerts.some((al) => al.level === 'risk');
    const hasAttention = areaAlerts.some((al) => al.level === 'attention');
    const level: StatusLevel = hasRisk ? 'red' : hasAttention ? 'yellow' : a.dataStatus === 'available' ? 'green' : 'gray';

    return {
      id: a.areaId,
      areaId: a.areaId,
      title: a.title,
      subtitle: a.summary,
      level,
      route: areaRoutes[a.areaId] || '/',
      dataStatus: a.dataStatus,
      recordCount: a.recordCount,
      lastRecordedAt: a.lastRecordedAt,
      highlights: a.highlights,
    };
  });

  // Extract vital tiles from highlights or overview
  const allHighlights = overview?.areas?.flatMap((a) => a.highlights) || [];
  const vitalTiles: VitalTileData[] = allHighlights.slice(0, 6).map((h) => {
    const alert = activeAlerts.find((al) => al.indicator === h.indicator);
    const level: StatusLevel = alert?.level === 'risk' ? 'red' : alert?.level === 'attention' ? 'yellow' : 'green';

    return {
      id: h.id,
      name: h.indicator.replace(/_/g, ' ').toUpperCase(),
      value: h.value,
      unit: h.unit,
      level,
      recordedAt: h.recordedAt,
      source: h.source,
      statusText: alert ? alert.message : 'Dentro da referência',
      ruleId: alert?.rule?.id,
      ruleVersion: alert?.rule?.version,
      ruleSource: alert?.rule?.source,
      limitation: alert?.limitation,
    };
  });

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto rounded-2xl bg-space-900 border border-rose-500/40 text-center space-y-4 shadow-2xl">
        <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center">
          <WifiOff size={28} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">
            Erro de Conexão com a API AstroVida
          </h2>
          <p className="text-xs text-space-300 mt-2 leading-relaxed">
            {error}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-space-950 font-mono text-[11px] text-space-400 text-left">
          <code>Back-end URL: http://127.0.0.1:3000/api/v1</code><br />
          <code>Comando de inicialização: npm start</code>
        </div>
        <button
          onClick={triggerRefresh}
          className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl bg-astro-cyan text-space-950 font-bold text-xs hover:bg-sky-400 shadow-glow-cyan transition-all"
        >
          <RefreshCw size={14} />
          <span>Tentar Novamente</span>
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* 3-Column Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Coluna Esquerda: Corpo Humano Interativo & Tarefas do Dia */}
        <div className="lg:col-span-4 space-y-5">
          <BodyMap />
          <TaskList />
        </div>

        {/* Coluna Central: Score Ring & 5 Perigos da Missão */}
        <div className="lg:col-span-4 space-y-5">
          <ScoreRing
            apiScore={computedScore}
            apiWorstFactor={worstFactorText}
            apiLevel={computedLevel}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-space-300 uppercase tracking-wider font-mono">
                5 Perigos da Missão (NASA Biohazards)
              </h3>
              <span className="text-[10px] text-space-500 font-mono">
                {overview?.areas?.length || 5} ÁREAS API
              </span>
            </div>
            {hazards.map((hazard) => (
              <HazardCard key={hazard.id} hazard={hazard} />
            ))}
          </div>
        </div>

        {/* Coluna Direita: Sinais Vitais & Alertas Priorizados */}
        <div className="lg:col-span-4 space-y-5">
          {/* Vital Tiles (2x3 grid) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-space-300 uppercase tracking-wider font-mono">
                Destaques da Telemetria (API Overview)
              </h3>
              <span className="text-[10px] text-space-500 font-mono">
                {vitalTiles.length} Indicadores
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {vitalTiles.map((vital) => (
                <VitalTile key={vital.id} vital={vital} />
              ))}
            </div>
          </div>

          <AlertList
            apiAlerts={alertsData?.alerts}
            inObservation={alertsData?.inObservation}
            loading={loading}
          />
        </div>
      </div>
    </motion.div>
  );
};
