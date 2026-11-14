import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BodyMap } from '../components/BodyMap';
import { GravitySelector } from '../components/GravitySelector';
import { BoneTrendChart } from '../components/BoneTrendChart';
import { ExerciseRings } from '../components/ExerciseRings';
import { QuickTestCards } from '../components/QuickTestCards';
import { StatusPill } from '../components/StatusPill';
import { useStore } from '../store/useStore';
import { StatusLevel } from '../types';
import { apiService, ApiAreaResponse, ApiHistoryResponse, ApiAssessment } from '../services/api';
import {
  Bone,
  Activity,
  Dumbbell,
  AlertTriangle,
  WifiOff,
  RefreshCw,
  HeartPulse,
  Scale,
  Eye,
  Plus,
  BookOpen,
} from 'lucide-react';

export const Gravidade: React.FC = () => {
  const {
    astronautId,
    dataset,
    refreshTrigger,
    triggerRefresh,
    openMetricDetailModal,
    setIsVitalsModalOpen,
    setIsPostureModalOpen,
  } = useStore();

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
      apiService.getArea('gravity_fields', astronautId, dataset, controller.signal),
      apiService.getAreaHistory('gravity_fields', { astronautId, dataset }, controller.signal),
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
              'Falha ao consultar parâmetros de campos gravitacionais e sinais vitais.'
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
        <h2 className="text-base font-bold text-white">Falha ao Consultar Gravidade</h2>
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

  // Find server assessments
  const assessments = areaData?.assessments || [];
  const news2Assessment = assessments.find((a) => a.rule?.id === 'news2_scale_1' || a.indicator === 'news2');
  const aerobicAss = assessments.find((a) => a.indicator === 'aerobic_capacity');
  const strengthAss = assessments.find((a) => a.indicator === 'muscle_strength');
  const massAss = assessments.find((a) => a.indicator === 'body_mass');
  const vo2Ass = assessments.find((a) => a.indicator === 'vo2max');
  const postureAss = assessments.find((a) => a.indicator === 'posture');

  const toStatusLevel = (ass?: ApiAssessment | null): StatusLevel =>
    ass?.level === 'risk' ? 'red' : ass?.level === 'attention' ? 'yellow' : ass?.status === 'assessed' ? 'green' : 'gray';

  const handleOpenDetail = (title: string, sub: string, val: string, level: StatusLevel, why: string, action: string, ass?: ApiAssessment) => {
    openMetricDetailModal({
      title,
      subtitle: sub,
      value: val,
      level: level || 'green',
      whyMeasure: why,
      whatToDo: action,
      ruleId: ass?.rule?.id,
      ruleVersion: ass?.rule?.version,
      ruleSource: ass?.rule?.source,
      limitation: ass?.limitation,
      scientificCategory: ass?.scientificCategory || undefined,
      status: ass?.status,
      recordedAt: ass?.recordedAt || undefined,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      {/* Action Banner: NEWS2 & Posture Test Launchers */}
      <div className="p-4 rounded-2xl bg-space-850/90 border border-space-700/80 flex flex-wrap items-center justify-between gap-3 text-xs shadow-card">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
            <HeartPulse size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">
                NEWS2 & Avaliações Hemodinâmicas por Posição
              </span>
              {news2Assessment && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/15 text-astro-cyan border border-sky-500/30">
                  NEWS2: {news2Assessment.score ?? '—'} pts ({news2Assessment.scientificCategory || news2Assessment.status})
                </span>
              )}
            </div>
            <p className="text-[11px] text-space-400">
              National Early Warning Score 2 (Escala 1 hospitalar demonstrativa) e teste ortostático supervisionado
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsVitalsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md text-xs"
          >
            <Plus size={13} />
            <span>Registrar Vitais (NEWS2)</span>
          </button>
          <button
            onClick={() => setIsPostureModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition-all shadow-md text-xs"
          >
            <Activity size={13} />
            <span>Teste de Postura</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Coluna Esquerda: BodyMap + Resumo de Aptidão & Comparação Pré-Missão */}
        <div className="lg:col-span-5 space-y-4">
          <BodyMap />

          {/* Fitness & Pre-flight comparison indicators */}
          <div className="p-4 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-space-300 uppercase tracking-wider font-mono">
                Aptidão Física & Comparação Pré-Voo
              </h3>
              <span className="text-[10px] text-space-500 font-mono">NASA-STD-3001</span>
            </div>

            {/* Aerobic Capacity */}
            <div
              onClick={() =>
                handleOpenDetail(
                  'Capacidade Aeróbica',
                  'V1 4003: corte oficial de 80% do pré-missão',
                  aerobicAss?.percentOfReference ? `${aerobicAss.percentOfReference.toFixed(1)}% da ref.` : 'Coleta ativa',
                  toStatusLevel(aerobicAss),
                  'Capacidade cardiovascular máxima sob exercício resistivo.',
                  'Manter sessões de cicloergômetro.',
                  aerobicAss
                )
              }
              className="p-3 rounded-xl bg-space-900 border border-space-750 hover:border-space-600 cursor-pointer flex items-center justify-between"
            >
              <div>
                <h4 className="font-bold text-xs text-white">Capacidade Aeróbica (aerobic_capacity)</h4>
                <p className="text-[10px] text-space-400 mt-0.5">
                  Ref. Pré-missão (&ge;80%): {aerobicAss?.percentOfReference ? `${aerobicAss.percentOfReference.toFixed(1)}%` : 'Coleta em andamento'}
                </p>
              </div>
              <StatusPill level={toStatusLevel(aerobicAss)} size="sm" showIcon={false} />
            </div>

            {/* Muscle Strength */}
            <div
              onClick={() =>
                handleOpenDetail(
                  'Força Muscular',
                  'V1 4024: corte oficial de 80% do pré-missão',
                  strengthAss?.percentOfReference ? `${strengthAss.percentOfReference.toFixed(1)}% da ref.` : 'Coleta ativa',
                  toStatusLevel(strengthAss),
                  'Força isométrica e dinâmica medida em Newton (N).',
                  'Treino com dispositivo resistivo ARED.',
                  strengthAss
                )
              }
              className="p-3 rounded-xl bg-space-900 border border-space-750 hover:border-space-600 cursor-pointer flex items-center justify-between"
            >
              <div>
                <h4 className="font-bold text-xs text-white">Força Muscular (muscle_strength)</h4>
                <p className="text-[10px] text-space-400 mt-0.5">
                  Ref. Pré-missão (&ge;80%): {strengthAss?.percentOfReference ? `${strengthAss.percentOfReference.toFixed(1)}%` : 'Coleta em andamento'}
                </p>
              </div>
              <StatusPill level={toStatusLevel(strengthAss)} size="sm" showIcon={false} />
            </div>

            {/* Body Mass */}
            <div
              onClick={() =>
                handleOpenDetail(
                  'Massa Corporal',
                  'Comparação descritiva de massa relativa',
                  massAss?.percentOfReference ? `${massAss.percentOfReference.toFixed(1)}%` : 'Coleta ativa',
                  toStatusLevel(massAss),
                  'Aferição em kg através do oscilador de massa SLAMMD.',
                  'Comparação descritiva sem bandas rígidas de 3% ou 5%.',
                  massAss
                )
              }
              className="p-3 rounded-xl bg-space-900 border border-space-750 hover:border-space-600 cursor-pointer flex items-center justify-between"
            >
              <div>
                <h4 className="font-bold text-xs text-white">Massa Corporal (body_mass)</h4>
                <p className="text-[10px] text-space-400 mt-0.5">
                  Diferença descritiva: {massAss?.difference !== null && massAss?.difference !== undefined ? `${massAss.difference > 0 ? '+' : ''}${massAss.difference} kg` : 'Calculada pelo servidor'}
                </p>
              </div>
              <StatusPill level={toStatusLevel(massAss)} size="sm" showIcon={false} />
            </div>

            {/* VO2max EVA Context */}
            <div
              onClick={() =>
                handleOpenDetail(
                  'VO2max em Contexto EVA',
                  'V1 4001 / V1 4002: microgravidade &ge;32.9 ou superfície &ge;36.5 mL/kg/min',
                  vo2Ass?.observedValue ? `${vo2Ass.observedValue} mL/kg/min` : 'Contextual',
                  toStatusLevel(vo2Ass),
                  'Consumo máximo de oxigênio específico para caminhada espacial.',
                  'A ferramenta não emite autorização médica de EVA.',
                  vo2Ass
                )
              }
              className="p-3 rounded-xl bg-space-900 border border-space-750 hover:border-space-600 cursor-pointer flex items-center justify-between"
            >
              <div>
                <h4 className="font-bold text-xs text-white">VO₂max EVA (vo2max)</h4>
                <p className="text-[10px] text-space-400 mt-0.5">
                  {vo2Ass?.scientificCategory ? `Status: ${vo2Ass.scientificCategory}` : 'Exige contexto explícito de atividade EVA'}
                </p>
              </div>
              <StatusPill level={toStatusLevel(vo2Ass)} size="sm" showIcon={false} />
            </div>
          </div>
        </div>

        {/* Coluna Direita: Seletor, Gráficos, Exercício e Testes */}
        <div className="lg:col-span-7 space-y-5">
          <GravitySelector />
          <BoneTrendChart />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ExerciseRings />
            <QuickTestCards />
          </div>
        </div>
      </div>

      {/* Standards & Scientific Limitations */}
      <div className="p-4 rounded-xl bg-space-900 border border-space-750 text-xs text-space-400 space-y-1 font-mono">
        <div className="flex items-center gap-2 text-space-300 font-bold">
          <BookOpen size={14} className="text-astro-cyan" />
          <span>Normas Oficiais & Limitações dos Modelos de Gravidade:</span>
        </div>
        <p>
          · NASA-STD-3001 Vol. 1 Rev. C: V1 4003 (aeróbico &ge;80%), V1 4024 (força &ge;80%), V1 4001/4002 (VO₂max EVA). Proposta de 90% inativa.
        </p>
        <p>
          · Sintomas vestibulares, cefaleia e Amsler são autorrelatos de autovigilância; não medem acuidade nem diagnosticam SANS ou descondicionamento.
        </p>
        <p>
          · Sinais vitais por posição: comparação descritiva supervisionada em relação à amostra supina, sem protocolo diagnóstico de POTS ou prescrição médica.
        </p>
      </div>
    </motion.div>
  );
};
