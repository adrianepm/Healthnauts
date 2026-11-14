import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MoodCheckin } from '../components/MoodCheckin';
import { WellbeingRing } from '../components/WellbeingRing';
import { SleepBars } from '../components/SleepBars';
import { CircadianRing } from '../components/CircadianRing';
import { SocialBars } from '../components/SocialBars';
import { SupportToolList } from '../components/SupportToolList';
import { useStore } from '../store/useStore';
import { apiService, ApiAreaResponse, ApiHistoryResponse } from '../services/api';
import { WifiOff, RefreshCw, BookOpen, Clock, Zap } from 'lucide-react';

export const Isolamento: React.FC = () => {
  const { astronautId, dataset, refreshTrigger, triggerRefresh, setIsSleepModalOpen, setIsPvtModalOpen } = useStore();

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
      apiService.getArea('isolation_confinement', astronautId, dataset, controller.signal),
      apiService.getAreaHistory('isolation_confinement', { astronautId, dataset }, controller.signal),
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
              'Falha ao carregar dados de isolamento e sono. Verifique a conexão com a API.'
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
        <h2 className="text-base font-bold text-white">Falha ao Consultar Isolamento</h2>
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

  const assessments = areaData?.assessments || areaData?.monitoring || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      {/* Quick Action Banner */}
      <div className="p-3.5 rounded-2xl bg-space-850/80 border border-space-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-space-300 font-medium">
            Monitoramento de Sono, Fadiga & Vigilância Psicomotora (PVT-B)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSleepModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md"
          >
            <Clock size={13} />
            <span>Lançar Episódio de Sono</span>
          </button>
          <button
            onClick={() => setIsPvtModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all shadow-md"
          >
            <Zap size={13} />
            <span>Executar Teste PVT-B (3 min)</span>
          </button>
        </div>
      </div>

      {/* Top: Mood Check-in & WHO-5 Wellbeing Ring */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <MoodCheckin assessments={assessments} />
        </div>
        <div className="lg:col-span-5">
          <WellbeingRing />
        </div>
      </div>

      {/* Middle: Sleep Duration Bars from API History & 24h Circadian Ring */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6">
          <SleepBars
            records={historyData?.records || areaData?.latestRecords || []}
            isSimulated={dataset === 'simulated'}
          />
        </div>
        <div className="lg:col-span-6">
          <CircadianRing />
        </div>
      </div>

      {/* Base: Social Contact & Support Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6">
          <SocialBars />
        </div>
        <div className="lg:col-span-6">
          <SupportToolList />
        </div>
      </div>

      {/* Notes & Limitations */}
      <div className="p-4 rounded-xl bg-space-900 border border-space-750 text-xs text-space-400 space-y-1 font-mono">
        <div className="flex items-center gap-2 text-space-300 font-bold">
          <BookOpen size={14} className="text-astro-cyan" />
          <span>Critérios de Avaliação e Limitações do Modelo:</span>
        </div>
        <p>
          · Sono: Jones et al. (2022). Regras v1: &le;6 h (aviso), &le;4 h e 3 noites curtas &le;6 h (atenção). 8,5 h é oportunidade de sono.
        </p>
        <p>
          · Baseline pessoal (estresse, humor, qualidade): 7 dias UTC, média &plusmn; 2 DP amostrais. Exige 7 dias com variabilidade.
        </p>
        <p>
          · PVT-B: Basner et al. (2011). Velocidade média (1/s) dos inversos, lapsos &ge; 355 ms e falsos inícios &lt; 100 ms calculados pelo servidor.
        </p>
      </div>
    </motion.div>
  );
};
