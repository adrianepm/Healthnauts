import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  CartesianGrid,
} from 'recharts';
import { MOCK_RADIATION } from '../mock/radiacao';
import { TrendingUp, Activity } from 'lucide-react';

export const DoseRateChart: React.FC = () => {
  const data = MOCK_RADIATION.history7d;

  return (
    <div className="p-5 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
            <Activity size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Taxa de Dose de Radiação · Últimos 7 Dias
            </h3>
            <p className="text-[11px] text-space-400">
              mSv/dia com destaque ao pico do evento solar (D-2)
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
          PICO: 4,8 mSv/d
        </span>
      </div>

      <div className="h-56 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="doseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            {/* Risk horizontal bands */}
            <ReferenceArea y1={0} y2={2.0} fill="#22C55E" fillOpacity={0.05} />
            <ReferenceArea y1={2.0} y2={3.5} fill="#F59E0B" fillOpacity={0.08} />
            <ReferenceArea y1={3.5} y2={6.0} fill="#EF4444" fillOpacity={0.12} />

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
              domain={[0, 6]}
              ticks={[1, 2, 3, 4, 5]}
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
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="text-white font-bold text-sm">
                          {item.rate} mSv/dia
                        </span>
                      </div>
                      {item.isFlare && (
                        <span className="text-[10px] text-rose-400 font-sans font-bold block mt-1">
                          ⚠ Pico da Tempestade Solar
                        </span>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            <ReferenceLine
              y={2.0}
              stroke="#F59E0B"
              strokeDasharray="3 3"
              label={{ value: 'Limite Alerta (2.0)', fill: '#F59E0B', fontSize: 10, position: 'insideTopLeft' }}
            />

            <Area
              type="monotone"
              dataKey="rate"
              stroke="#F59E0B"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#doseGradient)"
              dot={(props) => {
                const isFlare = props.payload.isFlare;
                return (
                  <circle
                    key={props.key}
                    cx={props.cx}
                    cy={props.cy}
                    r={isFlare ? 6 : 4}
                    fill={isFlare ? '#EF4444' : '#F59E0B'}
                    stroke="#0B1120"
                    strokeWidth={2}
                    className={isFlare ? 'animate-pulse' : ''}
                  />
                );
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-space-400 border-t border-space-800 pt-2 font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Faixa Segura (&lt; 2,0)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Atenção (2,0–3,5)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Crítica (&gt; 3,5)
        </span>
      </div>
    </div>
  );
};
