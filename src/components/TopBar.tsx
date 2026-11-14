import React from 'react';
import { useStore } from '../store/useStore';
import { EnvironmentMode } from '../types';
import {
  Compass,
  Radio,
  Flame,
  Award,
  PlusCircle,
  Play,
  RotateCw,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react';

export const TopBar: React.FC = () => {
  const {
    astronautId,
    setAstronautId,
    dataset,
    setDataset,
    environment,
    setEnvironment,
    missionDay,
    totalMissionDays,
    earthDelayMinutes,
    xpToday,
    xpGoalToday,
    level,
    streakDays,
    setIsNewLogModalOpen,
    setIsScenarioModalOpen,
    triggerRefresh,
  } = useStore();

  const environments: EnvironmentMode[] = ['Nave', 'Estação', 'Rover', 'Base'];
  const astronauts = ['astro_demo_001', 'astro_demo_002', 'astro_demo_003'];

  const xpProgressPercent = Math.min(100, Math.round((xpToday / xpGoalToday) * 100));

  return (
    <header className="sticky top-0 z-40 w-full bg-space-900/95 backdrop-blur-md border-b border-space-700/80 px-4 lg:px-6 py-2.5 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand, Team Identification & Mission Name */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-glow-cyan shrink-0">
            <Compass size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base lg:text-lg tracking-wider text-white">
                ASTRO<span className="text-astro-cyan">VIDA</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Black Belt's Team
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  dataset === 'simulated'
                    ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {dataset === 'simulated' ? 'SIMULADO' : 'REAL (SENSOR/MANUAL)'}
              </span>
            </div>
            <p className="text-[11px] text-space-400 font-medium hidden sm:block">
              Sistema Autônomo de Monitoramento de Saúde para Astronautas
            </p>
          </div>
        </div>

        {/* Center: Mission Day Context & Gamification Bar */}
        <div className="hidden lg:flex items-center gap-4 bg-space-850/80 px-4 py-1.5 rounded-xl border border-space-700/60">
          <div className="flex items-center gap-2 border-r border-space-700/80 pr-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-200">
              Missão Ares-1
            </span>
            <span className="text-xs font-mono text-astro-cyan">
              · Dia {missionDay} de {totalMissionDays}
            </span>
          </div>

          {/* Gamification streak & level */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20"
              title="Sequência de dias com check-ins concluídos"
            >
              <Flame size={13} className="fill-amber-400" />
              <span>{streakDays}d</span>
            </div>

            <div
              className="flex items-center gap-1 text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20"
              title="Nível de prontidão médica"
            >
              <Award size={13} />
              <span>Nível {level}</span>
            </div>

            <div className="flex items-center gap-2" title={`XP Hoje: ${xpToday} / ${xpGoalToday}`}>
              <div className="w-16 h-2 bg-space-800 rounded-full overflow-hidden border border-space-700">
                <div
                  className="h-full bg-gradient-to-r from-astro-cyan to-emerald-400 transition-all duration-300"
                  style={{ width: `${xpProgressPercent}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-space-300">
                {xpToday}xp
              </span>
            </div>
          </div>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2 lg:gap-2.5">
          {/* Astronaut Selector */}
          <div className="flex items-center gap-1 bg-space-800 border border-space-700 px-2 py-1.5 rounded-xl text-xs">
            <Database size={13} className="text-space-400 hidden sm:inline" />
            <select
              value={astronautId}
              onChange={(e) => setAstronautId(e.target.value)}
              className="bg-transparent text-white font-mono font-semibold focus:outline-none cursor-pointer text-xs"
              title="Selecione o astronauta"
            >
              {astronauts.map((astro) => (
                <option key={astro} value={astro} className="bg-space-850 text-white font-mono">
                  {astro}
                </option>
              ))}
            </select>
          </div>

          {/* Dataset Selector */}
          <div className="flex items-center gap-1 bg-space-800 border border-space-700 px-2 py-1.5 rounded-xl text-xs">
            <select
              value={dataset}
              onChange={(e) => setDataset(e.target.value as 'simulated' | 'real')}
              className="bg-transparent text-astro-cyan font-mono font-bold focus:outline-none cursor-pointer text-xs"
              title="Dataset consultado"
            >
              <option value="simulated" className="bg-space-850 text-white font-mono">
                simulated
              </option>
              <option value="real" className="bg-space-850 text-white font-mono">
                real (manual/sensor)
              </option>
            </select>
          </div>

          {/* Demo Scenarios Button */}
          <button
            onClick={() => setIsScenarioModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all"
            title="Abrir catálogo de cenários demonstrativos"
          >
            <Play size={13} className="fill-purple-300" />
            <span className="hidden sm:inline">Cenários</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={triggerRefresh}
            className="p-1.5 rounded-xl bg-space-800 hover:bg-space-750 text-space-300 hover:text-white border border-space-700 transition-colors"
            title="Atualizar dados da API"
          >
            <RotateCw size={14} />
          </button>

          {/* New Record Button */}
          <button
            onClick={() => setIsNewLogModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold shadow-glow-cyan transition-all transform active:scale-95"
          >
            <PlusCircle size={15} />
            <span className="hidden sm:inline">Novo Registro</span>
          </button>
        </div>
      </div>
    </header>
  );
};
