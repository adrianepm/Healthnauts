import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { BodyHotspot } from '../types';
import { StatusPill } from './StatusPill';
import { ChevronRight, Activity, ArrowUpRight } from 'lucide-react';

interface BodyMapProps {
  compact?: boolean;
}

export const BodyMap: React.FC<BodyMapProps> = ({ compact = false }) => {
  const navigate = useNavigate();
  const { bodyHotspots, selectedHotspot, setSelectedHotspot } = useStore();

  const getHotspotColor = (hotspot: BodyHotspot) => {
    switch (hotspot.level) {
      case 'red':
        return '#EF4444';
      case 'yellow':
        return '#F59E0B';
      case 'green':
        return '#22C55E';
      default:
        return '#64748B';
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl bg-space-850/90 border border-space-700/80 p-4 lg:p-5 shadow-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/15 text-astro-cyan">
            <Activity size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Mapa Corporal Fisiológico
            </h2>
            <p className="text-[11px] text-space-400">
              Pontos de calor e estresse biológico
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-space-400 bg-space-800 px-2 py-0.5 rounded border border-space-700">
          5 FOCOS
        </span>
      </div>

      {/* SVG Silhouette & Interactive Hotspots */}
      <div className="relative flex-1 flex items-center justify-center my-2 min-h-[260px] bg-space-900/60 rounded-xl border border-space-800/80 p-2">
        <svg
          viewBox="0 0 300 400"
          className="w-full h-full max-h-[300px] select-none filter drop-shadow-md"
        >
          {/* Subtle Grid Lines in Background */}
          <line x1="50" y1="200" x2="250" y2="200" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="3,3" />
          <line x1="150" y1="20" x2="150" y2="380" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="3,3" />

          {/* Futuristic Head */}
          <path
            d="M 130 50 C 130 30, 170 30, 170 50 C 170 70, 160 80, 150 82 C 140 80, 130 70, 130 50 Z"
            fill="#1E293B"
            stroke="#334155"
            strokeWidth="1.5"
          />
          {/* Neck */}
          <rect x="144" y="80" width="12" height="15" fill="#1E293B" stroke="#334155" strokeWidth="1" />

          {/* Torso & Shoulders */}
          <path
            d="M 110 95 L 190 95 L 180 200 L 120 200 Z"
            fill="#1E293B"
            stroke="#334155"
            strokeWidth="1.5"
          />

          {/* Left Arm */}
          <path
            d="M 110 95 L 85 170 L 78 240 L 90 240 L 98 175 L 115 110 Z"
            fill="#1E293B"
            stroke="#334155"
            strokeWidth="1"
          />

          {/* Right Arm */}
          <path
            d="M 190 95 L 215 170 L 222 240 L 210 240 L 202 175 L 185 110 Z"
            fill="#1E293B"
            stroke="#334155"
            strokeWidth="1"
          />

          {/* Pelvis & Hip Bones */}
          <path
            d="M 120 200 L 180 200 L 175 235 L 125 235 Z"
            fill="#1E293B"
            stroke="#334155"
            strokeWidth="1.5"
          />

          {/* Left Leg */}
          <path
            d="M 125 235 L 115 310 L 112 375 L 128 375 L 138 310 L 145 235 Z"
            fill="#1E293B"
            stroke="#334155"
            strokeWidth="1"
          />

          {/* Right Leg */}
          <path
            d="M 175 235 L 185 310 L 188 375 L 172 375 L 162 310 L 155 235 Z"
            fill="#1E293B"
            stroke="#334155"
            strokeWidth="1"
          />

          {/* Decorative internal lines */}
          <circle cx="150" cy="140" r="14" fill="none" stroke="#26334D" strokeWidth="1" strokeDasharray="2,2" />
          <line x1="130" y1="225" x2="170" y2="225" stroke="#26334D" strokeWidth="1.5" />

          {/* Interactive Hotspots */}
          {bodyHotspots.map((spot) => {
            const isSelected = selectedHotspot?.id === spot.id;
            const spotColor = getHotspotColor(spot);

            return (
              <g
                key={spot.id}
                className="cursor-pointer transition-transform hover:scale-110"
                onClick={() => setSelectedHotspot(spot)}
              >
                {/* Outer pulsing ring for alert spots */}
                {spot.level === 'red' && (
                  <circle
                    cx={spot.cx}
                    cy={spot.cy}
                    r="14"
                    fill="none"
                    stroke={spotColor}
                    strokeWidth="1.5"
                    className="animate-ping opacity-60"
                  />
                )}
                {/* Selected glow ring */}
                {isSelected && (
                  <circle
                    cx={spot.cx}
                    cy={spot.cy}
                    r="12"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="2"
                    className="shadow-glow-cyan"
                  />
                )}
                {/* Main node */}
                <circle
                  cx={spot.cx}
                  cy={spot.cy}
                  r="7"
                  fill={spotColor}
                  stroke="#0B1120"
                  strokeWidth="2"
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Quick Legend */}
        <div className="absolute bottom-2 left-2 flex items-center gap-2 text-[10px] font-mono text-space-400 bg-space-950/80 px-2 py-1 rounded border border-space-800">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Ok
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Atenção
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Risco
          </span>
        </div>
      </div>

      {/* Selected Hotspot Bottom Diagnosis Panel */}
      {selectedHotspot && (
        <div className="mt-2 p-3 rounded-xl bg-space-900 border border-space-700/80 text-xs">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs">
                {selectedHotspot.name}
              </span>
              {selectedHotspot.lossText && (
                <span className="font-mono text-rose-400 font-bold bg-rose-500/15 px-1.5 py-0.5 rounded text-[10px]">
                  {selectedHotspot.lossText}
                </span>
              )}
            </div>
            <StatusPill level={selectedHotspot.level} size="sm" />
          </div>

          <p className="text-space-300 text-[11px] leading-relaxed mb-2">
            {selectedHotspot.summary}
          </p>

          <div className="flex items-center justify-between pt-1 border-t border-space-800 text-[11px]">
            <span className="text-space-400">
              Recomendação: {selectedHotspot.recommendation.split('.')[0]}.
            </span>
            {selectedHotspot.targetTab && (
              <button
                onClick={() => navigate(selectedHotspot.targetTab!)}
                className="flex items-center gap-1 text-astro-cyan hover:underline font-semibold shrink-0 ml-2"
              >
                <span>Ver tela</span>
                <ArrowUpRight size={12} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
