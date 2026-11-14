import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DoseGauge } from '../components/DoseGauge';
import { SolarAlertBanner } from '../components/SolarAlertBanner';
import { DoseRateChart } from '../components/DoseRateChart';
import { SymptomChecklist } from '../components/SymptomChecklist';
import { ShipZoneMap } from '../components/ShipZoneMap';
import { useStore } from '../store/useStore';
import { apiService, ApiAreaResponse, ApiHistoryResponse, ApiRecord, ApiAssessment } from '../services/api';
import { WifiOff, RefreshCw, ShieldAlert, BookOpen } from 'lucide-react';

export const Radiacao: React.FC = () => {
  const { astronautId, dataset, refreshTrigger, triggerRefresh } = useStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [areaData, setAreaData] = useState<ApiAreaResponse | null>(null);
  const [historyData, setHistoryData] = useState<ApiHistoryResponse | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    Promise.all([
      apiService.getArea('radiation', astronautId, dataset, controller.signal),
      apiService.getAreaHistory('radiation', { astronautId, dataset }, controller.signal),
    ])
      .then(([area, hist]) => {
        if (!isCancelled) {
          setAreaData(area);
          setHistoryData(hist);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled && err.name !== 'AbortError') {
          setError(
            err.message ||
              'Falha ao carregar telemetria de radiação. Verifique a conexão com o servidor.'
          );
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [astronautId, dataset, refreshTrigger]);

  if (error) {
    return (
      <div className="p-8 max-w-xl mx-auto rounded-2xl bg-space-900 border border-rose-500/40 text-center space-y-4 shadow-2xl">
        <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center">
          <WifiOff size={24} />
        </div>
        <h2 className="text-base font-bold text-white">Falha ao Consultar Radiação</h2>
        <p className="text-xs text-space-300">{error}</p>
        <button
          onClick={triggerRefresh}
          className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-astro-cyan text-space-950 font-bold text-xs"
        >
          <RefreshCw size={14} /> Tentar Novamente
        </button>
      </div>
    );
  }

  // Find assessments from API
  const careerAssessment = areaData?.assessments?.find(
    (a) => a.indicator === 'career_effective_dose'
  ) || null;

  const solarAssessment = areaData?.assessments?.find(
    (a) => a.indicator === 'solar_event_simulated'
  ) || null;

  const latestAccumulated = areaData?.latestRecords?.find(
    (r) => r.indicator === 'accumulated_dose' || r.indicator === 'radiation_counter'
  ) || null;

  const latestRate = areaData?.latestRecords?.find(
    (r) => r.indicator === 'dose_rate' || r.indicator === 'radiation_increment'
  ) || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      {/* Top Section: Dose Gauge & Solar Alert Banner with live countdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4">
          <DoseGauge
            careerAssessment={careerAssessment}
            latestAccumulated={latestAccumulated}
            latestRate={latestRate}
          />
        </div>
        <div className="lg:col-span-8">
          <SolarAlertBanner solarAssessment={solarAssessment} />
        </div>
      </div>

      {/* Middle Section: Dose Rate Chart & Symptoms Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <DoseRateChart
            records={historyData?.records || areaData?.latestRecords || []}
            isSimulated={dataset === 'simulated'}
          />
        </div>
        <div className="lg:col-span-5">
          <SymptomChecklist />
        </div>
      </div>

      {/* Base Section: Ship Protection Zones Map */}
      <div>
        <ShipZoneMap />
      </div>

      {/* Reference Standards & Limitations */}
      <div className="p-4 rounded-xl bg-space-900 border border-space-750 text-xs text-space-400 space-y-1 font-mono">
        <div className="flex items-center gap-2 text-space-300 font-bold">
          <BookOpen size={14} className="text-astro-cyan" />
          <span>Diretrizes e Limitações do Modelo Radiológico:</span>
        </div>
        <p>
          · NASA-STD-3001 Vol. 1 Rev. C, §4.8 (V1 4030). Grandeza de carreira: dose efetiva espacial acumulada &lt; 600 mSv.
        </p>
        <p>
          · Leituras de contadores dosimétricos não são somadas no cliente. Limites de órgãos (V1 4031/4033) permanecem inativos na API.
        </p>
      </div>
    </motion.div>
  );
};
