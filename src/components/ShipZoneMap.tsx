import React from 'react';
import { useStore } from '../store/useStore';
import { MOCK_RADIATION } from '../mock/radiacao';
import { getThresholds } from '../lib/thresholds';
import { StatusPill } from './StatusPill';
import { Shield, MapPin, Info, ArrowRight } from 'lucide-react';

export const ShipZoneMap: React.FC = () => {
  const { environment, activeShipZoneId, setActiveShipZoneId } = useStore();
  const zones = MOCK_RADIATION.zones;
  const thresholds = getThresholds(environment);

  const selectedZone = zones.find((z) => z.id === activeShipZoneId) || zones[2];

  const getZoneFillColor = (zoneId: string, level: string) => {
    const isSelected = activeShipZoneId === zoneId;
    if (level === 'red') return isSelected ? '#EF4444' : '#EF444450';
    if (level === 'yellow') return isSelected ? '#F59E0B' : '#F59E0B50';
    if (level === 'green') return isSelected ? '#22C55E' : '#22C55E50';
    return '#64748B50';
  };

  return (
    <div className="p-5 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/15 text-astro-cyan">
            <Shield size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Mapa de Zonas de Proteção Radiológica da Nave
            </h3>
            <p className="text-[11px] text-space-400">
              Taxa de atenuação por compartimento estrutural
            </p>
          </div>
        </div>

        {/* Dynamic Tip based on Environment Mode */}
        <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20 max-w-md">
          <Info size={14} className="shrink-0" />
          <span className="truncate">{thresholds.radiation.tip}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* SVG Spacecraft Blueprint */}
        <div className="lg:col-span-8 bg-space-900/90 border border-space-700 rounded-xl p-4 flex flex-col items-center justify-center">
          <svg
            viewBox="0 0 700 240"
            className="w-full h-auto max-h-[220px] select-none"
          >
            {/* Nosecone - Cockpit (Cabine de comando) */}
            <g
              className="cursor-pointer transition-all hover:opacity-90"
              onClick={() => setActiveShipZoneId('cockpit')}
            >
              <polygon
                points="120,40 180,70 180,170 120,200 40,120"
                fill={getZoneFillColor('cockpit', 'red')}
                stroke="#EF4444"
                strokeWidth="2"
              />
              <text x="110" y="115" fill="#FFFFFF" fontSize="11" fontWeight="bold" textAnchor="middle">
                Cabine Comando
              </text>
              <text x="110" y="132" fill="#FECDD3" fontSize="9" fontFamily="monospace" textAnchor="middle">
                3,4 mSv/h · Menos Blindada
              </text>
            </g>

            {/* Module A: Tripulação & Dormitórios */}
            <g
              className="cursor-pointer transition-all hover:opacity-90"
              onClick={() => setActiveShipZoneId('module-a')}
            >
              <rect
                x="190"
                y="65"
                width="140"
                height="110"
                rx="8"
                fill={getZoneFillColor('module-a', 'yellow')}
                stroke="#F59E0B"
                strokeWidth="2"
              />
              <text x="260" y="115" fill="#FFFFFF" fontSize="11" fontWeight="bold" textAnchor="middle">
                Módulo A · Tripulação
              </text>
              <text x="260" y="132" fill="#FDE68A" fontSize="9" fontFamily="monospace" textAnchor="middle">
                1,4 mSv/h · Média
              </text>
            </g>

            {/* Module B: ABRIGO CENTRAL (Storm Shelter - Max Shielded) */}
            <g
              className="cursor-pointer transition-all hover:opacity-90"
              onClick={() => setActiveShipZoneId('module-b')}
            >
              <rect
                x="340"
                y="55"
                width="150"
                height="130"
                rx="10"
                fill={getZoneFillColor('module-b', 'green')}
                stroke="#22C55E"
                strokeWidth="3"
                className="filter drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]"
              />
              {/* Water Tank border indicators */}
              <rect x="345" y="60" width="140" height="10" rx="3" fill="#38BDF8" opacity="0.6" />
              <rect x="345" y="170" width="140" height="10" rx="3" fill="#38BDF8" opacity="0.6" />

              <text x="415" y="105" fill="#FFFFFF" fontSize="12" fontWeight="black" textAnchor="middle">
                MÓDULO B · ABRIGO
              </text>
              <text x="415" y="122" fill="#A7F3D0" fontSize="10" fontFamily="monospace" textAnchor="middle">
                0,2 mSv/h · Blindagem Máx
              </text>

              {/* VOCÊ Indicator Badge */}
              <g transform="translate(390, 134)">
                <rect x="0" y="0" width="50" height="18" rx="9" fill="#0B1120" stroke="#38BDF8" strokeWidth="1.5" />
                <circle cx="9" cy="9" r="4" fill="#38BDF8" className="animate-pulse" />
                <text x="27" y="13" fill="#38BDF8" fontSize="9" fontWeight="bold">VOCÊ</text>
              </g>
            </g>

            {/* Module C: Carga & Suporte de Vida */}
            <g
              className="cursor-pointer transition-all hover:opacity-90"
              onClick={() => setActiveShipZoneId('module-c')}
            >
              <rect
                x="500"
                y="70"
                width="140"
                height="100"
                rx="8"
                fill={getZoneFillColor('module-c', 'yellow')}
                stroke="#F59E0B"
                strokeWidth="2"
              />
              <text x="570" y="115" fill="#FFFFFF" fontSize="11" fontWeight="bold" textAnchor="middle">
                Módulo C · Carga
              </text>
              <text x="570" y="132" fill="#FDE68A" fontSize="9" fontFamily="monospace" textAnchor="middle">
                1,2 mSv/h · Média
              </text>
            </g>

            {/* Thrusters at the back */}
            <polygon points="645,85 680,75 680,165 645,155" fill="#334155" stroke="#475569" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Selected Zone Details Card */}
        <div className="lg:col-span-4 p-4 rounded-xl bg-space-900 border border-space-700 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-sm">
              {selectedZone.name}
            </h4>
            <StatusPill level={selectedZone.level} size="sm" />
          </div>

          <div className="p-2.5 rounded-lg bg-space-850 border border-space-800">
            <span className="text-[10px] uppercase font-mono text-space-400 block mb-0.5">
              Blindagem Física Estrutural
            </span>
            <p className="text-xs text-space-200">{selectedZone.shielding}</p>
          </div>

          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-space-400">Dose Durante Tempestade:</span>
            <span className="font-bold text-white bg-space-800 px-2 py-0.5 rounded border border-space-700">
              {selectedZone.doseRate} mSv/h
            </span>
          </div>

          {selectedZone.isCurrentLocation && (
            <div className="flex items-center gap-1.5 text-xs text-astro-cyan bg-sky-500/10 p-2 rounded-lg border border-sky-500/30">
              <MapPin size={14} className="shrink-0" />
              <span>Você está localizado neste compartimento no momento.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
