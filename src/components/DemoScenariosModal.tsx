import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { apiService, ApiScenarioItem } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Compass,
  ArrowRight,
  Database,
  ShieldAlert,
  Moon,
  Activity,
  Radio,
  Gauge,
} from 'lucide-react';

export const DemoScenariosModal: React.FC = () => {
  const navigate = useNavigate();
  const {
    isScenarioModalOpen,
    setIsScenarioModalOpen,
    astronautId,
    dataset,
    setDataset,
    triggerRefresh,
  } = useStore();

  const [scenarios, setScenarios] = useState<ApiScenarioItem[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('high-co2');
  const [loadingList, setLoadingList] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [feedback, setFeedback] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isScenarioModalOpen) return;
    setLoadingList(true);
    setError(null);
    const controller = new AbortController();

    apiService
      .getScenarios(controller.signal)
      .then((res) => {
        setScenarios(res.scenarios || []);
        if (res.scenarios?.length && !res.scenarios.some((s) => s.id === selectedScenario)) {
          setSelectedScenario(res.scenarios[0].id);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Erro ao carregar cenários.');
        }
      })
      .finally(() => setLoadingList(false));

    return () => controller.abort();
  }, [isScenarioModalOpen]);

  if (!isScenarioModalOpen) return null;

  const handleRunScenario = async () => {
    if (executing || !selectedScenario) return;
    setExecuting(true);
    setError(null);
    setFeedback(null);

    const runId = `run-${Date.now()}`;
    try {
      const res = await apiService.runScenario(selectedScenario, astronautId, runId);
      setFeedback(res);
      // Ensure dataset is simulated if running simulated scenario
      if (dataset !== 'simulated') {
        setDataset('simulated');
      }
      triggerRefresh();
    } catch (err: any) {
      setError(err.message || 'Falha ao executar cenário.');
    } finally {
      setExecuting(false);
    }
  };

  const getAreaRoute = (areaId?: string) => {
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
        return '/';
    }
  };

  const getScenarioIcon = (id: string) => {
    switch (id) {
      case 'high-co2':
        return <Gauge className="text-amber-400" size={20} />;
      case 'solar-event':
        return <ShieldAlert className="text-rose-400" size={20} />;
      case 'poor-sleep':
        return <Moon className="text-indigo-400" size={20} />;
      case 'fitness-change':
        return <Activity className="text-emerald-400" size={20} />;
      case 'offline-report':
        return <Radio className="text-sky-400" size={20} />;
      default:
        return <Compass className="text-space-300" size={20} />;
    }
  };

  const currentItem = scenarios.find((s) => s.id === selectedScenario);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-space-850 border border-space-700 rounded-2xl shadow-2xl overflow-hidden p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-space-700/60 mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-astro-cyan/15 text-astro-cyan border border-astro-cyan/30">
                <Compass size={22} />
              </div>
              <div>
                <h3 className="text-base lg:text-lg font-bold text-white tracking-wide">
                  Cenários Demonstrativos Oficiais (API Back-end)
                </h3>
                <p className="text-xs text-space-300">
                  Exercícios de contingência simulados conforme especificações de pesquisa da missão
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsScenarioModalOpen(false)}
              className="p-1.5 text-space-400 hover:text-white rounded-lg hover:bg-space-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Dataset & Astronaut Indicator */}
          <div className="mb-4 p-3 rounded-xl bg-space-900/90 border border-space-750 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Database size={15} className="text-astro-cyan" />
              <span className="text-space-400 font-mono">Astronauta:</span>
              <span className="font-mono font-bold text-white">{astronautId}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                DADOS SIMULADOS (DATASET: SIMULATED)
              </span>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Scenarios List */}
          {loadingList ? (
            <div className="p-8 text-center text-space-400 text-xs flex items-center justify-center gap-2 font-mono">
              <RefreshCw size={16} className="animate-spin text-astro-cyan" />
              Carregando catálogo de cenários do back-end...
            </div>
          ) : (
            <div className="space-y-2.5 mb-5 max-h-[38vh] overflow-y-auto pr-1">
              {scenarios.map((sc) => {
                const isSelected = selectedScenario === sc.id;
                return (
                  <div
                    key={sc.id}
                    onClick={() => {
                      setSelectedScenario(sc.id);
                      setFeedback(null);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-space-750/90 border-astro-cyan shadow-glow-cyan'
                        : 'bg-space-900/70 border-space-750 hover:bg-space-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-space-850 border border-space-700">
                        {getScenarioIcon(sc.id)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{sc.label}</h4>
                        <span className="text-[10px] font-mono text-space-400">
                          ID: {sc.id} · Área: {sc.areaId}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-astro-cyan bg-astro-cyan/10 px-2 py-0.5 rounded border border-astro-cyan/20">
                        Simulação
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Execution Feedback */}
          {feedback && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-space-200 space-y-2">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} /> Cenário executado e persistido no servidor!
                </span>
                <span className="font-mono text-[10px]">{feedback.operation?.id}</span>
              </div>
              <p className="text-[11px] text-space-300">
                Registros gerados: <strong>{feedback.operation?.recordIds?.length || 0}</strong>.
                {feedback.operation?.calculation?.reportId && (
                  <span className="block mt-0.5 text-astro-cyan">
                    Relatório local preparado (não enviado): <strong>{feedback.operation.calculation.reportId}</strong>.
                  </span>
                )}
              </p>
              {currentItem && (
                <button
                  type="button"
                  onClick={() => {
                    setIsScenarioModalOpen(false);
                    navigate(getAreaRoute(currentItem.areaId));
                  }}
                  className="mt-1 flex items-center gap-1 text-xs font-bold text-astro-cyan hover:underline"
                >
                  <span>Ver dados e avaliações na tela {currentItem.areaId}</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-space-700/60">
            <span className="text-[11px] text-space-400">
              Cada execução usa ID único e não duplica cliques.
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsScenarioModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-space-300 hover:text-white rounded-xl hover:bg-space-800"
              >
                Fechar
              </button>
              <button
                type="button"
                disabled={executing || loadingList}
                onClick={handleRunScenario}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl shadow-glow-cyan transition-all disabled:opacity-50"
              >
                {executing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Executando...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} className="fill-white" />
                    <span>Acionar Cenário</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
