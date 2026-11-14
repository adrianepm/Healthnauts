import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  CartesianGrid,
} from 'recharts';
import { ApiRecord } from '../services/api';
import { Activity, Clock } from 'lucide-react';

interface DoseRateChartProps {
  records?: ApiRecord[];
  isSimulated?: boolean;
}

export const DoseRateChart: React.FC<DoseRateChartProps> = ({
  records = [],
  isSimulated = true,
}) => {
  const rateRecords = records.filter((r) => r.indicator === 'dose_rate');

  const chartData = rateRecords.map((r) => {
    const d = new Date(r.recordedAt);
    return {
      day: `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}h`,
      rate: Number(r.value),
      unit: r.unit || 'uSv/h',
      timestamp: r.recordedAt,
    };
  });

  // Fallback demo points if no history yet
  const displayData = chartData.length > 0 ? chartData : [
    { day: 'D-6', rate: 12.0, unit: 'uSv/h' },
    { day: 'D-5', rate: 12.5, unit: 'uSv/h' },
    { day: 'D-4', rate: 12.0, unit: 'uSv/h' },
    { day: 'D-3', rate: 13.0, unit: 'uSv/h' },
    { day: 'D-2', rate: 12.5, unit: 'uSv/h' },
    { day: 'D-1', rate: 12.0, unit: 'uSv/h' },
    { day: 'Hoje', rate: 12.0, unit: 'uSv/h' },
  ];

  const maxVal = Math.max(...displayData.map((d) => d.rate), 20);

  return (
    <div className="p-5 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
            <Activity size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Taxa de Dose Instantânea (dose_rate)
            </h3>
            <p className="text-[11px] text-space-400">
              Taxa ambiental indicada pelo dosímetro em uSv/h · Histórico da API
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSimulated && (
            <span className="text-[10px] font-mono text-purple-400 bg-purple-500/15 px-2 py-0.5 rounded border border-purple-500/30">
              SIMULADO
            </span>
          )}
          <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
            {displayData.at(-1)?.rate} uSv/h
          </span>
        </div>
      </div>

      <div className="h-56 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="doseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
              </linearGradient>
            </defs>

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
              domain={[0, Math.ceil(maxVal * 1.2)]}
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
                          {item.rate} uSv/h
                        </span>
                      </div>
                      <span className="text-[10px] text-space-400 font-sans block mt-0.5">
                        Instrumental: Não integrar automaticamente nem comparar com limites de órgão.
                      </span>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Area
              type="monotone"
              dataKey="rate"
              stroke="#F59E0B"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#doseGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
