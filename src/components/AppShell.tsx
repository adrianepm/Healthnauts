// Casca do app (do protótipo): topo com missão, atraso, XP e sino; abas com o nível de cada área; rodapé fixo.
import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Award, Brain, Compass, Gauge, LayoutGrid, Orbit, Radiation, Radio, SatelliteDish, User, Wind } from 'lucide-react';
import { useStore, levelOfXp } from '../store/useStore';
import { AREA } from '../config/api';
import { LEVEL_UI } from '../lib/levels';
import { worstLevel } from '../../shared/config/levels.js';
import { DAY_MS, fmtDuration } from '../lib/format';
import type { DisplayLevel } from '../services/api';
import { Notifications } from './Notifications';
import { AlertBanner, EmergencyOverlay } from './AlertBanner';
import { DemoPanel, useSim } from './DemoPanel';
import { StatusPill } from './ui';
import { MorningCheckin } from './MorningCheckin';
import { PvtTest } from './PvtTest';

const TABS = [
  { to: '/', label: 'Overview', icon: LayoutGrid, area: null },
  { to: '/isolation', label: 'Isolation', icon: Brain, area: AREA.isolation },
  { to: '/environment', label: 'Environment', icon: Wind, area: AREA.cabin },
  { to: '/radiation', label: 'Radiation', icon: Radiation, area: AREA.radiation },
  { to: '/gravity', label: 'Gravity', icon: Orbit, area: AREA.gravity },
  { to: '/distance', label: 'Distance', icon: Radio, area: AREA.distance },
  { to: '/ground', label: 'Ground Control', icon: SatelliteDish, area: null },
  { to: '/profile', label: 'Profile', icon: User, area: null },
];

export function AppShell({ children }: { children: ReactNode }) {
  const overview = useStore((s) => s.overview); const mission = useStore((s) => s.mission); const xp = useStore((s) => s.ui.xp);
  const s = useSim();
  const levelOf = (area: string | null): DisplayLevel | null => {
    if (!area || !overview) return null;
    const a = overview.areas.find((x) => x.areaId === area);
    // Na gravidade o sinal vital tem nível próprio; a aba usa a mesma prioridade da API (worstLevel de shared/).
    if (area === AREA.gravity && a) return worstLevel([a.headline, { ...overview.vitalSigns, critical: true }]).displayLevel as DisplayLevel;
    return a?.displayLevel ?? null;
  };
  const day = mission ? Math.floor((Date.now() - Date.parse(mission.input.startedAt)) / DAY_MS) + 1 : null;
  const link = overview?.link;

  return (
    <div className="min-h-screen pb-16">
      <EmergencyOverlay />
      <header className="border-b border-space-line bg-space-bg/95 sticky top-0 z-40 backdrop-blur">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand text-space-bg grid place-items-center" aria-hidden="true"><Compass size={20} /></div>
              <div>
                <p className="font-bold tracking-wide text-lg">Health<span className="text-brand-soft">nauts</span> <span className="chip border-brand/40 text-brand-soft ml-1">Onboard</span></p>
                <p className="text-xs text-slate-400">Autonomous crew health monitor</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {mission && <span className="chip border-space-line text-slate-300 normal-case text-xs py-1">Mission {mission.input.destination} · Day {day}</span>}
              <span className={`chip normal-case text-xs py-1 ${s.on ? 'border-space-line text-slate-200' : 'border-space-line text-slate-400'}`}>Live sensor {s.on ? 'on' : 'off'}</span>
              <span className="chip border-brand/40 text-brand-soft normal-case text-xs py-1 inline-flex items-center gap-1"><Award size={12} />Level {levelOfXp(xp)}</span>
              <span className="w-20 h-1.5 rounded bg-space-line overflow-hidden"><span className="block h-full bg-brand" style={{ width: `${xp % 100}%` }} /></span>
              <span className="text-slate-400 font-mono">{xp} XP</span>
              <Notifications />
            </div>
          </div>
          {link && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="chip border-space-line text-slate-300 normal-case text-xs py-1.5 inline-flex items-center gap-1"><Gauge size={12} />Current one-way delay: <b>{link.status === 'unavailable' ? 'no link' : fmtDuration(link.oneWaySeconds)}</b></span>
              {link.status === 'unavailable' && <span className="chip normal-case text-xs py-1.5 border-space-line text-slate-100">No contact with Earth</span>}
            </div>
          )}
          <nav className="flex gap-1 mt-3 overflow-x-auto">
            {TABS.map(({ to, label, icon: Icon, area }) => {
              const lv = levelOf(area);
              return (
                <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `inline-flex items-center gap-2 px-3 md:px-4 py-3 text-sm border-b-2 whitespace-nowrap ${isActive ? 'border-brand text-brand-soft' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <Icon size={16} aria-hidden="true" />{label}
                  {lv && lv !== 'normal' && <StatusPill level={lv} small />}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="max-w-[1280px] mx-auto px-4 md:px-6 py-6">
        <AlertBanner />
        {children}
      </main>
      <footer className="fixed bottom-0 inset-x-0 z-30 border-t border-space-line bg-space-bg/95 backdrop-blur">
        <p className="max-w-[1280px] mx-auto px-4 md:px-6 py-2.5 pr-28 text-xs text-slate-400">
          {overview?.footer ?? 'This tool supports self-monitoring and crew medical decisions. It does not diagnose any condition.'} Simulated data · Space Apps 2026.
        </p>
      </footer>
      <DemoPanel />
      <MorningCheckin />
      <PvtTest />
    </div>
  );
}
