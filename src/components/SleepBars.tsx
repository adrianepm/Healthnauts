import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  CartesianGrid,
  Cell,
} from 'recharts';
import { MOCK_ISOLATION } from '../mock/sono';
import { Moon, Clock } from 'lucide-react';

export const SleepBars: React.FC = () => {
  const data = MOCK_ISOLATION.sleepHistory14d;
  const avg = 6.5;

  return (
    <div className="p-5 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400">
            <Moon size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Duração do Sono · 14 Dias
            </h3>
            <p className="text-[11px] text-space-400">
              Meta ideal entre 7h e 9h por ciclo diário
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-space-300 bg-space-800 px-2 py-0.5 rounded border border-space-700">
            MÉDIA: <strong className="text-amber-400">{avg}h</strong>
          </span>
        </div>
      </div>

      <div className="h-56 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            {/* Target zone 7 to 9h */}
            <ReferenceArea y1={7} y2={9} fill="#22C55E" fillOpacity={0.08} />

            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis
              dataKey="day"
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#26334D' }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#26334D' }}
              domain={[0, 10]}
              ticks={[2, 4, 6, 7, 8, 9, 10]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="p-2.5 rounded-xl bg-space-900 border border-space-700 shadow-xl text-xs font-mono">
                      <span className="text-space-300 block font-sans font-semibold mb-1">
                        {item.day}
                      </span>
                      <div className="text-white font-bold text-sm mb-1">
                        {item.hours} horas de sono
                      </div>
                      <div className="text-[11px] text-space-400 space-y-0.5 font-sans">
                        <div>Eficiência: {item.efficiency}%</div>
                        <div>Sono Profundo: {item.deepSleepHours}h</div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <ReferenceLine
              y={avg}
              stroke="#F59E0B"
              strokeDasharray="4 4"
              label={{
                value: `Média (${avg}h)`,
                fill: '#F59E0B',
                fontSize: 10,
                position: 'insideTopLeft',
              }}
            />

            <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => {
                const isOptimal = entry.hours >= 7 && entry.hours <= 9;
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={isOptimal ? '#22C55E' : '#F59E0B'}
                    opacity={entry.day === 'Hoje' ? 1 : 0.8}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-space-400 border-t border-space-800 pt-2 font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Faixa Meta (7 a 9h)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Déficit (&lt; 7h)
        </span>
      </div>
    </div>
  );
};
