import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { MOCK_ISOLATION } from '../mock/sono';
import { Users, Globe } from 'lucide-react';

export const SocialBars: React.FC = () => {
  const data = MOCK_ISOLATION.socialHistory7d;

  return (
    <div className="p-5 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/15 text-astro-cyan">
            <Users size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Contato Social Diário (Minutos)
            </h3>
            <p className="text-[11px] text-space-400">
              Tripulação a bordo vs. Terra (família & suporte)
            </p>
          </div>
        </div>
      </div>

      <div className="h-52 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis
              dataKey="day"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#26334D' }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#26334D' }}
              domain={[0, 240]}
              ticks={[60, 120, 180, 240]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="p-2.5 rounded-xl bg-space-900 border border-space-700 shadow-xl text-xs font-mono">
                      <span className="text-space-300 block font-sans font-semibold mb-1">
                        Dia: {label}
                      </span>
                      <div className="text-sky-400 font-bold mb-0.5">
                        Tripulação: {payload[0]?.value} min
                      </div>
                      <div className="text-emerald-400 font-bold">
                        Terra: {payload[1]?.value} min
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
            />
            <Bar
              name="Com a Tripulação"
              dataKey="crewMinutes"
              fill="#38BDF8"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              name="Com a Terra"
              dataKey="earthMinutes"
              fill="#22C55E"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
