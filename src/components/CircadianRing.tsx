import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { MOCK_ISOLATION } from '../mock/sono';
import { Sun, Clock, AlertCircle } from 'lucide-react';

export const CircadianRing: React.FC = () => {
  const blocks = MOCK_ISOLATION.circadianBlocks;
  const offset = MOCK_ISOLATION.circadianOffsetMinutes;

  const [hoveredBlock, setHoveredBlock] = useState<typeof blocks[0] | null>(null);

  return (
    <div className="p-5 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
            <Sun size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Ciclo Circadiano de 24 Horas
            </h3>
            <p className="text-[11px] text-space-400">
              Distribuição biológica de luz e rotina
            </p>
          </div>
        </div>

        {/* Alert Pill: Desvio 40 min: ajustar */}
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/30">
          <AlertCircle size={13} />
          <span>Desvio {offset} min: ajustar</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Interactive Donut Chart */}
        <div className="sm:col-span-6 h-52 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={blocks}
                dataKey="hours"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                onMouseEnter={(_, index) => setHoveredBlock(blocks[index])}
                onMouseLeave={() => setHoveredBlock(null)}
              >
                {blocks.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="#0B1120"
                    strokeWidth={2}
                    className="cursor-pointer transition-transform hover:scale-105"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-xs font-mono font-bold text-space-400 uppercase">
              {hoveredBlock ? hoveredBlock.hours + 'h' : '24h Total'}
            </span>
            <span className="text-sm font-bold text-white max-w-[80px] leading-tight">
              {hoveredBlock ? hoveredBlock.name.split(' ')[0] : 'Ciclo Ares-1'}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="sm:col-span-6 space-y-1.5 text-xs">
          {blocks.map((b) => (
            <div
              key={b.name}
              onMouseEnter={() => setHoveredBlock(b)}
              onMouseLeave={() => setHoveredBlock(null)}
              className={`p-1.5 px-2 rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                hoveredBlock?.name === b.name
                  ? 'bg-space-800 border border-space-700'
                  : 'hover:bg-space-900/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: b.color }}
                />
                <span className="text-space-200 text-xs font-medium">
                  {b.name}
                </span>
              </div>
              <span className="font-mono text-space-400 text-[11px]">
                {b.hours}h
              </span>
            </div>
          ))}
        </div>
      </div>

      {hoveredBlock && (
        <div className="mt-2 p-2 rounded-lg bg-space-900 border border-space-800 text-[11px] text-space-300">
          <strong className="text-white">{hoveredBlock.name}:</strong> {hoveredBlock.desc}
        </div>
      )}
    </div>
  );
};
