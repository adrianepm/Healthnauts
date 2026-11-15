// Casca do app. Desktop (≥ 1024 px): barra lateral com marca, navegação, Demo e o aviso fixo; cabeçalho de uma linha.
// Celular: cabeçalho de uma linha (missão, atraso, Demo, sino) e barra inferior (Overview, Areas, Ground, Profile).
// O nível de cada área aparece sempre com ícone + nome (StatusPill). Nada aqui decide nível.
import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Brain, ChevronRight, FlaskConical, LayoutGrid, Orbit, Radiation, Radio, SatelliteDish, Shapes, User, Wind, type LucideIcon } from 'lucide-react';
import { useStore } from '../store/useStore';
import { AREA } from '../config/api';
import { worstLevel } from '../../shared/config/levels.js';
import { DAY_MS, fmtDuration } from '../lib/format';
import type { DisplayLevel } from '../services/api';
import { AlertBanner, EmergencyOverlay } from './AlertBanner';
import { DemoPanel, useSim } from './DemoPanel';
import { Modal, StatusPill } from './ui';
import { MorningCheckin } from './MorningCheckin';
import { PvtTest } from './PvtTest';
import { Toaster } from './Toaster';
import { useIndicatorFocus, useIndicatorParam } from './lean/TopicDetail';
import { AREA_PATH } from '../lib/content';
import { BrandMark, BrandName } from './Brand';
import { cn } from '../lib/utils';

interface Tab { to: string; label: string; icon: LucideIcon; area: string | null }
const OVERVIEW: Tab = { to: '/', label: 'Overview', icon: LayoutGrid, area: null };
const AREAS: Tab[] = [
  { to: '/isolation', label: 'Isolation', icon: Brain, area: AREA.isolation },
  { to: '/environment', label: 'Environment', icon: Wind, area: AREA.cabin },
  { to: '/radiation', label: 'Radiation', icon: Radiation, area: AREA.radiation },
  { to: '/gravity', label: 'Gravity', icon: Orbit, area: AREA.gravity },
  { to: '/distance', label: 'Distance', icon: Radio, area: AREA.distance },
];
const GROUND: Tab = { to: '/ground', label: 'Ground Control', icon: SatelliteDish, area: null };
const PROFILE: Tab = { to: '/profile', label: 'Profile', icon: User, area: null };
const FOOTER = 'This tool supports self-monitoring and crew medical decisions. It does not diagnose any condition.';

function useLevelOf() {
  const overview = useStore((s) => s.overview);
  return (area: string | null): DisplayLevel | null => {
    if (!area || !overview) return null;
    const a = overview.areas.find((x) => x.areaId === area);
    // Na gravidade o sinal vital tem nível próprio; a aba usa a mesma prioridade da API (worstLevel de shared/).
    if (area === AREA.gravity && a) return worstLevel([a.headline, { ...overview.vitalSigns, critical: true }]).displayLevel as DisplayLevel;
    return a?.displayLevel ?? null;
  };
}

/** Item da barra lateral. A barra do item ativo fica neutra quando o item está em Emergency (magenta nunca ao lado do vermelho). */
function SideItem({ tab, level }: { tab: Tab; level: DisplayLevel | null }) {
  const Icon = tab.icon;
  return (
    <NavLink to={tab.to} end={tab.to === '/'} className={({ isActive }) => cn('relative flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md px-3 py-2.5 text-sm transition-colors',
      isActive ? 'bg-space-card2 text-slate-50' : 'text-slate-300 hover:text-slate-50 hover:bg-space-card')}>
      {({ isActive }) => (<>
        {isActive && <span className={cn('absolute left-0 inset-y-2 w-[3px] rounded-r', level === 'emergency' ? 'bg-slate-50' : 'bg-brand')} aria-hidden="true" />}
        <Icon size={18} aria-hidden="true" className={isActive && level !== 'emergency' ? 'text-brand-soft' : ''} />
        <span className="flex-1">{tab.label}</span>
        {level && level !== 'normal' && <StatusPill level={level} small />}
      </>)}
    </NavLink>
  );
}

function BottomItem({ to, label, icon: Icon, active, onClick }: { to?: string; label: string; icon: LucideIcon; active: boolean; onClick?: () => void }) {
  const cls = cn('flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[56px] text-xs', active ? 'text-brand-soft' : 'text-slate-300');
  const inner = <><Icon size={20} aria-hidden="true" /><span>{label}</span></>;
  return to
    ? <NavLink to={to} end={to === '/'} className={cls} aria-current={active ? 'page' : undefined}>{inner}</NavLink>
    : <button type="button" onClick={onClick} className={cls} aria-haspopup="dialog" aria-current={active ? 'page' : undefined}>{inner}</button>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const overview = useStore((s) => s.overview); const mission = useStore((s) => s.mission);
  const active = useStore((s) => s.alerts?.active ?? []);
  const s = useSim();
  const levelOf = useLevelOf();
  const { pathname } = useLocation();
  const [demo, setDemo] = useState(false);
  const [areasOpen, setAreasOpen] = useState(false);
  useIndicatorFocus();
  // Detalhe de um indicador com alerta aberto por qualquer caminho (alerta, corpo, painel): o pulso do "Needs attention" para.
  const wanted = useIndicatorParam(); const markSeen = useStore((s) => s.markSeen);
  useEffect(() => {
    if (!wanted) return;
    const ids = active.filter((a) => a.indicator === wanted && AREA_PATH[a.areaId] === pathname).map((a) => a.id);
    if (ids.length) markSeen(ids);
  }, [wanted, pathname, active]);
  useEffect(() => { setAreasOpen(false); setDemo(false); }, [pathname]);

  // Emergency ativa: a marca vira neutra em todo o app (src/index.css, :root[data-emergency]).
  const emergency = active.some((a) => a.level === 'emergency');
  useEffect(() => {
    document.documentElement.toggleAttribute('data-emergency', emergency);
    return () => document.documentElement.removeAttribute('data-emergency');
  }, [emergency]);

  const day = mission ? Math.floor((Date.now() - Date.parse(mission.input.startedAt)) / DAY_MS) + 1 : null;
  const link = overview?.link;
  const delay = !link ? null : link.status === 'unavailable' ? 'No contact with Earth' : `One-way delay ${fmtDuration(link.oneWaySeconds)}`;
  const inArea = AREAS.some((t) => t.to === pathname);

  return (
    <div className="min-h-screen">
      <EmergencyOverlay />

      {/* Barra lateral (desktop) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64 flex-col border-r border-space-line bg-space-bg">
        <div className="flex items-center gap-3 px-5 h-16 border-b border-space-line"><BrandMark /><BrandName /></div>
        <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          <div className="space-y-0.5"><SideItem tab={OVERVIEW} level={null} /></div>
          <div>
            <p className="eyebrow px-3 mb-1.5">Hazards (RIDGE)</p>
            <div className="space-y-0.5">{AREAS.map((t) => <SideItem key={t.to} tab={t} level={levelOf(t.area)} />)}</div>
          </div>
          <div className="space-y-0.5"><SideItem tab={GROUND} level={null} /><SideItem tab={PROFILE} level={null} /></div>
        </nav>
        <div className="px-4 pb-4 pt-3 border-t border-space-line space-y-3">
          <button type="button" onClick={() => setDemo(!demo)} aria-expanded={demo} className="btn-ghost w-full"><FlaskConical size={16} aria-hidden="true" />Demo scenarios</button>
          <p className="text-xs text-slate-300">{overview?.footer ?? FOOTER} Simulated data · Space Apps 2026.</p>
        </div>
      </aside>

      <div className="lg:pl-64">
        {/* Cabeçalho de uma linha */}
        <header className="sticky top-0 z-40 h-14 border-b border-space-line bg-space-bg/95 backdrop-blur-sm">
          <div className="max-w-[1200px] mx-auto h-full px-4 md:px-6 flex items-center gap-3">
            <span className="lg:hidden"><BrandMark size={28} /></span>
            <p className="flex-1 min-w-0 flex items-center gap-x-3 text-sm text-slate-300 whitespace-nowrap overflow-hidden">
              {mission && <span className="text-slate-100 font-medium">{mission.input.destination} · Day <span className="font-mono">{day}</span></span>}
              {delay && <span className="truncate"><span className="hidden sm:inline">{delay}</span><span className="sm:hidden">{link?.status === 'unavailable' ? 'No link' : <span className="font-mono">{fmtDuration(link?.oneWaySeconds)}</span>}</span></span>}
              <span className="hidden md:inline">Live sensor {s.on ? 'on' : 'off'}</span>
            </p>
            <button type="button" onClick={() => setDemo(!demo)} aria-expanded={demo} aria-label="Demo scenarios" className="lg:hidden w-11 h-11 rounded-md border border-space-line grid place-items-center text-slate-200"><FlaskConical size={18} aria-hidden="true" /></button>
          </div>
        </header>

        <main className="max-w-[1200px] mx-auto px-4 md:px-6 pt-5 pb-28 lg:pb-12">
          <AlertBanner />
          {children}
          {/* Aviso fixo da especificação 2.2: no celular fica no fim de cada tela, sem cobrir o conteúdo. */}
          <p className="lg:hidden mt-8 pt-4 border-t border-space-line text-xs text-slate-300">{overview?.footer ?? FOOTER} Simulated data · Space Apps 2026.</p>
        </main>
      </div>

      {/* Barra inferior (celular) */}
      <nav aria-label="Main" className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-space-line bg-space-bg/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
        <div className="flex">
          <BottomItem to="/" label="Overview" icon={LayoutGrid} active={pathname === '/'} />
          <BottomItem label="Areas" icon={Shapes} active={inArea} onClick={() => setAreasOpen(true)} />
          <BottomItem to="/ground" label="Ground" icon={SatelliteDish} active={pathname === '/ground'} />
          <BottomItem to="/profile" label="Profile" icon={User} active={pathname === '/profile'} />
        </div>
      </nav>
      <Modal open={areasOpen} onClose={() => setAreasOpen(false)} title="Areas" sub="The five RIDGE hazards">
        <ul className="space-y-2">
          {AREAS.map((t) => { const lv = levelOf(t.area); const Icon = t.icon; return (
            <li key={t.to}>
              <NavLink to={t.to} className={({ isActive }) => cn('card card-link !py-3 !px-4 flex items-center gap-3', isActive && 'border-space-strong')}>
                <Icon size={18} aria-hidden="true" className="text-slate-300" />
                <span className="flex-1 text-sm font-medium">{t.label}</span>
                {lv && <StatusPill level={lv} small />}
                <ChevronRight size={16} aria-hidden="true" className="text-slate-300" />
              </NavLink>
            </li>); })}
        </ul>
      </Modal>

      <DemoPanel open={demo} onClose={() => setDemo(false)} />
      <MorningCheckin />
      <PvtTest />
      <Toaster />
    </div>
  );
}
