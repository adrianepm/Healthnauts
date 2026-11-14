import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { apiService, ApiError, ApiAssessment } from '../services/api';
import { Smile, Meh, Frown, Laugh, Heart, Sparkles, Check, RefreshCw, AlertTriangle, Info } from 'lucide-react';

interface MoodCheckinProps {
  assessments?: ApiAssessment[];
}

export const MoodCheckin: React.FC<MoodCheckinProps> = ({ assessments = [] }) => {
  const { astronautId, dataset, triggerRefresh, addXP } = useStore();

  const [moodScore, setMoodScore] = useState(70);
  const [stress, setStress] = useState(25);
  const [sleepQuality, setSleepQuality] = useState(75);
  const [sleepinessKss, setSleepinessKss] = useState(3);
  const [fatigueSamn, setFatigueSamn] = useState(2);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Find server assessments for baseline statuses
  const moodAss = assessments.find((a) => a.indicator === 'mood_score');
  const stressAss = assessments.find((a) => a.indicator === 'stress');
  const sleepAss = assessments.find((a) => a.indicator === 'sleep_quality');
  const kssAss = assessments.find((a) => a.indicator === 'sleepiness_kss');
  const samnAss = assessments.find((a) => a.indicator === 'fatigue_samn_perelli');

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setErrorMsg(null);
    setSavedSuccess(false);

    const now = new Date().toISOString();
    const source: 'manual' | 'simulated' = dataset === 'simulated' ? 'simulated' : 'manual';
    const records = [
      { indicator: 'mood_score', value: Number(moodScore), unit: null, recordedAt: now, source },
      { indicator: 'stress', value: Number(stress), unit: null, recordedAt: now, source },
      { indicator: 'sleep_quality', value: Number(sleepQuality), unit: null, recordedAt: now, source },
      { indicator: 'sleepiness_kss', value: Math.round(sleepinessKss), unit: null, recordedAt: now, source },
      { indicator: 'fatigue_samn_perelli', value: Math.round(fatigueSamn), unit: null, recordedAt: now, source },
    ];

    try {
      await apiService.saveRecords('isolation_confinement', astronautId, records);
      setSavedSuccess(true);
      addXP(30);
      triggerRefresh();
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg(err.message || 'Erro ao salvar check-in psicológico.');
      }
    } finally {
      setSaving(false);
    }
  };

  const renderBaselineStatus = (ass?: ApiAssessment) => {
    if (!ass) return <span className="text-[10px] text-space-500 font-mono">Sem baseline</span>;
    if (ass.status === 'stale') return <span className="text-[10px] text-space-400 font-mono">Dado antigo (stale)</span>;
    if (ass.status === 'baseline_collecting') return <span className="text-[10px] text-indigo-400 font-mono">Coletando baseline (7d)</span>;
    if (ass.level === 'attention') return <span className="text-[10px] text-amber-400 font-mono font-bold">Fora da baseline pessoal</span>;
    return <span className="text-[10px] text-emerald-400 font-mono">Dentro da baseline (±2 DP)</span>;
  };

  return (
    <div className="p-5 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400">
            <Heart size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Check-in Psicológico Oficial (20 Segundos)
            </h3>
            <p className="text-[11px] text-space-400">
              Escalas científicas: mood_score (0-100), stress (0-100), KSS (1-9), Samn-Perelli (1-7)
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-purple-400 bg-purple-500/15 px-2 py-0.5 rounded border border-purple-500/30">
          DIÁRIO UTC
        </span>
      </div>

      {errorMsg && (
        <div className="mb-4 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle size={15} />
          <span>{errorMsg}</span>
        </div>
      )}

      {savedSuccess && (
        <div className="mb-4 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <Check size={15} />
          <span>Check-in registrado no servidor e baseline atualizada com sucesso! +30 XP</span>
        </div>
      )}

      {/* Sliders */}
      <div className="space-y-3.5 mb-5">
        {/* Humor */}
        <div className="p-3 rounded-xl bg-space-900 border border-space-750">
          <div className="flex justify-between items-center text-xs font-medium mb-1">
            <span className="text-space-200 font-semibold">Humor Percebido (mood_score: 0–100)</span>
            <div className="flex items-center gap-2">
              {renderBaselineStatus(moodAss)}
              <span className="font-mono text-astro-cyan font-bold">{moodScore} / 100</span>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={moodScore}
            onChange={(e) => setMoodScore(Number(e.target.value))}
            className="w-full accent-astro-cyan"
          />
          <div className="flex justify-between text-[10px] text-space-500 font-mono mt-0.5">
            <span>0 (Menos positivo)</span>
            <span>Distinto do humor legado 1–5</span>
            <span>100 (Mais positivo)</span>
          </div>
        </div>

        {/* Estresse */}
        <div className="p-3 rounded-xl bg-space-900 border border-space-750">
          <div className="flex justify-between items-center text-xs font-medium mb-1">
            <span className="text-space-200 font-semibold">Intensidade de Estresse (stress: 0–100)</span>
            <div className="flex items-center gap-2">
              {renderBaselineStatus(stressAss)}
              <span className="font-mono text-amber-400 font-bold">{stress} / 100</span>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={stress}
            onChange={(e) => setStress(Number(e.target.value))}
            className="w-full accent-amber-400"
          />
        </div>

        {/* Sonolência KSS */}
        <div className="p-3 rounded-xl bg-space-900 border border-space-750">
          <div className="flex justify-between items-center text-xs font-medium mb-1">
            <span className="text-space-200 font-semibold">Sonolência — Referência KSS (1 a 9)</span>
            <div className="flex items-center gap-2">
              {renderBaselineStatus(kssAss)}
              <span className="font-mono text-purple-400 font-bold">{sleepinessKss}</span>
            </div>
          </div>
          <input
            type="range"
            min={1}
            max={9}
            step={1}
            value={sleepinessKss}
            onChange={(e) => setSleepinessKss(Number(e.target.value))}
            className="w-full accent-purple-400"
          />
          <div className="flex justify-between text-[10px] text-space-500 font-mono mt-0.5">
            <span>1 (Menor sonolência)</span>
            <span>Rótulos próprios resumidos · Confirmação de uso pendente</span>
            <span>9 (Maior sonolência)</span>
          </div>
        </div>

        {/* Fadiga Samn-Perelli */}
        <div className="p-3 rounded-xl bg-space-900 border border-space-750">
          <div className="flex justify-between items-center text-xs font-medium mb-1">
            <span className="text-space-200 font-semibold">Fadiga — Referência Samn-Perelli (1 a 7)</span>
            <div className="flex items-center gap-2">
              {renderBaselineStatus(samnAss)}
              <span className="font-mono text-rose-400 font-bold">{fatigueSamn}</span>
            </div>
          </div>
          <input
            type="range"
            min={1}
            max={7}
            step={1}
            value={fatigueSamn}
            onChange={(e) => setFatigueSamn(Number(e.target.value))}
            className="w-full accent-rose-400"
          />
          <div className="flex justify-between text-[10px] text-space-500 font-mono mt-0.5">
            <span>1 (Menor fadiga)</span>
            <span>Substitui escala antiga 1–5</span>
            <span>7 (Maior fadiga)</span>
          </div>
        </div>
      </div>

      {/* Action button */}
      <div className="flex items-center justify-between pt-3 border-t border-space-700/60">
        <span className="text-xs text-space-400 font-mono">
          Baseline pessoal exige 7 dias UTC de histórico.
        </span>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-all disabled:opacity-50"
        >
          {saving ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>Salvando no Servidor...</span>
            </>
          ) : (
            <>
              <Check size={14} />
              <span>Salvar Check-in Psicológico</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
