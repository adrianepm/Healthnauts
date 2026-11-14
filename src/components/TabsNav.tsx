import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  HeartHandshake,
  Satellite,
  Orbit,
  Wind,
} from 'lucide-react';

interface TabItem {
  id: string;
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
}

const TABS: TabItem[] = [
  { id: 'geral', name: 'Geral', path: '/', icon: LayoutDashboard },
  { id: 'radiacao', name: 'Radiação', path: '/radiacao', icon: ShieldAlert, badge: 'Alerta' },
  { id: 'isolamento', name: 'Isolamento', path: '/isolamento', icon: HeartHandshake },
  { id: 'distancia', name: 'Distância', path: '/distancia', icon: Satellite },
  { id: 'gravidade', name: 'Gravidade', path: '/gravidade', icon: Orbit, badge: 'Atenção' },
  { id: 'ambiente', name: 'Ambiente', path: '/ambiente', icon: Wind },
];

export const TabsNav: React.FC = () => {
  return (
    <nav className="w-full bg-space-900 border-b border-space-700/80 px-4">
      <div className="max-w-7xl mx-auto flex items-center overflow-x-auto no-scrollbar gap-1 py-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.id}
              to={tab.path}
              className={({ isActive }) =>
                `relative flex items-center gap-2 px-4 py-3 rounded-lg text-xs lg:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'text-astro-cyan bg-space-800/80'
                    : 'text-space-300 hover:text-white hover:bg-space-800/40'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={16}
                    className={`transition-colors ${
                      isActive ? 'text-astro-cyan' : 'text-space-400'
                    }`}
                  />
                  <span>{tab.name}</span>

                  {tab.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                        tab.badge === 'Alerta'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}

                  {/* Active Indicator Underline */}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-astro-cyan rounded-t-full shadow-[0_-1px_6px_#38bdf8]" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
