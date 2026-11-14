import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CommsLinkDiagram } from '../components/CommsLinkDiagram';
import { MedKitInventory } from '../components/MedKitInventory';
import { FlightSurgeonQueue } from '../components/FlightSurgeonQueue';
import { SymptomSearch } from '../components/SymptomSearch';
import { GuidedProtocolStepper } from '../components/GuidedProtocolStepper';
import { useStore } from '../store/useStore';
import { apiService, ApiAreaResponse, ApiHistoryResponse, ApiMissionResponse } from '../services/api';
import { WifiOff, RefreshCw, BookOpen, ShieldAlert, FileText } from 'lucide-react';

export const Distancia: React.FC = () => {
  const { astronautId, dataset, refreshTrigger, triggerRefresh, setIsReportModalOpen } = useStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [areaData, setAreaData] = useState<ApiAreaResponse | null>(null);
  const [historyData, setHistoryData] = useState<ApiHistoryResponse | null>(null);
  const [missionData, setMissionData] = useState<ApiMissionResponse | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    Promise.all([
      apiService.getArea('distance_from_earth', astronautId, dataset, controller.signal),
      apiService.getAreaHistory('distance_from_earth', { astronautId, dataset }, controller.signal),
      apiService.getMission(astronautId, dataset, controller.signal),
    ])
      .then(([area, hist, miss]) => {
        if (!isCancelled) {
          setAreaData(area);
          setHistoryData(hist);
          setMissionData(miss);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled && err.name !== 'AbortError') {
          setError(
            err.message ||
              'Falha ao carregar telemetria de distância da Terra. Verifique a API.'
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
        <h2 className="text-base font-bold text-white">Falha ao Consultar Distância</h2>
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      {/* Top: Comms Link Diagram & Medical Autonomy */}
      <div>
        <CommsLinkDiagram missionData={missionData} />
      </div>

      {/* Notice about Offline Reports */}
      <div className="p-4 rounded-xl bg-space-850 border border-space-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-space-200">
          <FileText size={16} className="text-astro-cyan" />
          <span>
            Relatórios clínicos locais preparados via endpoint <code>/operations/report</code> mantêm o estado <strong>deliveryStatus: "not_sent"</strong>.
          </span>
        </div>
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition-all shadow-md text-xs"
        >
          Preparar Novo Relatório
        </button>
      </div>

      {/* Middle: Medical Kit Inventory & Flight Surgeon Asynchronous Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6">
          <MedKitInventory />
        </div>
        <div className="lg:col-span-6">
          <FlightSurgeonQueue />
        </div>
      </div>

      {/* Base: Guided Offline Diagnosis (Symptom Search + Stepper) */}
      <div className="space-y-4">
        <SymptomSearch />
        <GuidedProtocolStepper />
      </div>

      {/* Standards & References */}
      <div className="p-4 rounded-xl bg-space-900 border border-space-750 text-xs text-space-400 space-y-1 font-mono">
        <div className="flex items-center gap-2 text-space-300 font-bold">
          <BookOpen size={14} className="text-astro-cyan" />
          <span>Referências de Atraso e Recursos de Bordo:</span>
        </div>
        <p>
          · Parisi et al. (NASA Ames, 2023). Comunicação: atraso de ida, disponibilidade e conjunção solar de Marte (simulação).
        </p>
        <p>
          · O atraso de ida e os inventários são contexto operacional; não representam medidas clínicas nem capacidade médica de tratamento hospitalar.
        </p>
      </div>
    </motion.div>
  );
};
