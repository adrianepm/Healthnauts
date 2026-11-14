import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AirGauges } from '../components/AirGauges';
import { CabinSensorMap } from '../components/CabinSensorMap';
import { Co2Chart } from '../components/Co2Chart';
import { NutritionRings } from '../components/NutritionRings';
import { HygieneChecklist } from '../components/HygieneChecklist';
import { useStore } from '../store/useStore';
import { apiService, ApiAreaResponse, ApiHistoryResponse } from '../services/api';
import { WifiOff, RefreshCw, BookOpen, Wind } from 'lucide-react';

export const Ambiente: React.FC = () => {
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
      apiService.getArea('hostile_closed_environment', astronautId, dataset, controller.signal),
      apiService.getAreaHistory('hostile_closed_environment', { astronautId, dataset }, controller.signal),
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
              'Falha ao carregar parâmetros de ambiente e atmosfera da cabine.'
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
        <h2 className="text-base font-bold text-white">Falha ao Consultar Ambiente</h2>
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

  const latestRecords = areaData?.latestRecords || [];
  const assessments = areaData?.assessments || [];
  const co2Assessment = assessments.find((a) => a.indicator === 'co2_partial_pressure') || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      {/* Top: 4 Atmospheric Air Gauges with distinction between ppm and mmHg */}
      <div>
        <AirGauges
          latestRecords={latestRecords}
          assessments={assessments}
        />
      </div>

      {/* Middle: Cabin Sensors 2x2 Map & 24h CO2 Area Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6">
          <CabinSensorMap />
        </div>
        <div className="lg:col-span-6">
          <Co2Chart
            records={historyData?.records || latestRecords}
            assessment={co2Assessment}
          />
        </div>
      </div>

      {/* Base: Nutrition and Hydration Rings & Hygiene Routine Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6">
          <NutritionRings />
        </div>
        <div className="lg:col-span-6">
          <HygieneChecklist />
        </div>
      </div>

      {/* Normas e Limitações */}
      <div className="p-4 rounded-xl bg-space-900 border border-space-750 text-xs text-space-400 space-y-1 font-mono">
        <div className="flex items-center gap-2 text-space-300 font-bold">
          <BookOpen size={14} className="text-astro-cyan" />
          <span>Diretrizes e Regras Inativas do Ambiente de Cabine:</span>
        </div>
        <p>
          · NASA-STD-3001 Vol. 2 Rev. D §6.2.1.3 / V2 6004: ppCO₂ ponderado no tempo &le; 3 mmHg em janela de 1 hora.
        </p>
        <p>
          · Ruído acústico (V2 6077–6080): Curvas NC dependem de espectro em bandas de oitava (classificação automática inativa para dBA).
        </p>
        <p>
          · Conforto térmico (V2 6012/6013): Polígono oficial temperatura/umidade pendente de modelo de escoamento de ar.
        </p>
      </div>
    </motion.div>
  );
};
