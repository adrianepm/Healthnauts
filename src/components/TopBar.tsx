import React from 'react';
import { useStore } from '../store/useStore';
import { EnvironmentMode } from '../types';
import {
  Compass,
  Radio,
  Flame,
  Award,
  PlusCircle,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';

export const TopBar: React.FC = () => {
  const {
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
  } = useStore();

  const environments: EnvironmentMode[] = ['Nave', 'Estação', 'Rover', 'Base'];

  const xpProgressPercent = Math.min(100, Math.round((xpToday / xpGoalToday) * 100));

  return (
    <header className="sticky top-0 z-40 w-full bg-space-900/90 backdrop-blur-md border-b border-space-700/80 px-4 lg:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand & Mission Name */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-glow-cyan">
            <Compass size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base lg:text-lg tracking-wider text-white">
                ASTRO<span className="text-astro-cyan">VIDA</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-astro-cyan/15 text-astro-cyan border border-astro-cyan/30">
                OFFLINE
              </span>
            </div>
            <p className="text-[11px] text-space-400 font-medium hidden sm:block">
              Cirurgião de Bolso Autônomo
            </p>
          </div>
        </div>

        {/* Center: Mission Day Context & Gamification Bar */}
        <div className="hidden md:flex items-center gap-4 bg-space-850/80 px-4 py-1.5 rounded-xl border border-space-700/60">
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
              <span>Sequência {streakDays}d</span>
            </div>

            <div
              className="flex items-center gap-1 text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20"
              title="Nível de prontidão médica"
            >
              <Award size={13} />
              <span>Nível {level}</span>
            </div>

            <div className="flex items-center gap-2" title={`XP Hoje: ${xpToday} / ${xpGoalToday}`}>
              <div className="w-16 lg:w-24 h-2 bg-space-800 rounded-full overflow-hidden border border-space-700">
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

        {/* Right: Delay, Environment Selector & "Novo Registro" Button */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Comms Delay */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-space-800 border border-space-700 text-xs font-mono text-space-300"
            title="Atraso de propagação de sinal de rádio ida"
          >
            <Radio size={13} className="text-astro-cyan animate-pulse" />
            <span className="hidden sm:inline text-space-400">Atraso:</span>
            <span className="text-white font-semibold">
              {earthDelayMinutes < 1 ? '< 5s' : `${earthDelayMinutes} min`}
            </span>
          </div>

          {/* Environment Selector */}
          <div className="relative">
            <div className="flex items-center gap-1.5 bg-space-800 border border-space-700 px-2.5 py-1.5 rounded-xl text-xs">
              <Layers size={13} className="text-amber-400" />
              <span className="text-space-400 hidden sm:inline">Ambiente:</span>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as EnvironmentMode)}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer pr-1"
              >
                {environments.map((env) => (
                  <option key={env} value={env} className="bg-space-850 text-white">
                    {env}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* New Record Button */}
          <button
            onClick={() => setIsNewLogModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs lg:text-sm font-bold shadow-glow-cyan transition-all transform active:scale-95"
          >
            <PlusCircle size={16} />
            <span>Novo registro</span>
          </button>
        </div>
      </div>
    </header>
  );
};
