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
import { MOCK_ATMOSPHERE } from '../mock/ambiente';
import { Gauge, AlertTriangle } from 'lucide-react';

export const Co2Chart: React.FC = () => {
  const data = MOCK_ATMOSPHERE.co2History24h;

  return (
    <div className="p-5 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
            <Gauge size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Concentração de CO2 · Últimas 24 Horas
            </h3>
            <p className="text-[11px] text-space-400">
              ppm em tempo real com faixas semafóricas de tolerância
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/30">
          ATUAL: 2.800 ppm
        </span>
      </div>

      <div className="h-56 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="co2Gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            {/* Risk horizontal bands */}
            <ReferenceArea y1={1000} y2={3000} fill="#22C55E" fillOpacity={0.06} />
            <ReferenceArea y1={3000} y2={4000} fill="#F59E0B" fillOpacity={0.08} />
            <ReferenceArea y1={4000} y2={5000} fill="#EF4444" fillOpacity={0.12} />

            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis
              dataKey="hour"
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
              domain={[1500, 4500]}
              ticks={[2000, 3000, 4000]}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const val = payload[0].value as number;
                  return (
                    <div className="p-2.5 rounded-xl bg-space-900 border border-space-700 shadow-xl text-xs font-mono">
                      <span className="text-space-300 block font-sans font-semibold mb-1">
                        Momento: {label}
                      </span>
                      <div className="text-white font-bold text-sm">
                        {val.toLocaleString('pt-BR')} ppm
                      </div>
                      <span
                        className={`text-[10px] font-sans font-bold block mt-1 ${
                          val >= 4000
                            ? 'text-rose-400'
                            : val >= 3000
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {val >= 4000 ? '⚠ Acima do Limite Crítico' : val >= 3000 ? '⚠ Atenção aos Filtros' : '✓ Ar Nominal'}
                      </span>
                    </div>
                  );
                }
                return null;
              }}
            />

            <ReferenceLine
              y={3000}
              stroke="#F59E0B"
              strokeDasharray="4 4"
              label={{ value: 'Alerta (3.000 ppm)', fill: '#F59E0B', fontSize: 10, position: 'insideTopLeft' }}
            />
            <ReferenceLine
              y={4000}
              stroke="#EF4444"
              strokeDasharray="4 4"
              label={{ value: 'Crítico (4.000 ppm)', fill: '#EF4444', fontSize: 10, position: 'insideTopLeft' }}
            />

            <Area
              type="monotone"
              dataKey="co2"
              stroke="#F59E0B"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#co2Gradient)"
              dot={{ r: 3, fill: '#F59E0B', stroke: '#0B1120' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-space-400 border-t border-space-800 pt-2 font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> &lt; 3.000 (Nominal)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> 3.000–4.000 (Atenção)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> &gt; 4.000 (Crítico)
        </span>
      </div>
    </div>
  );
};
