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
import { Moon, Clock, Plus, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ApiRecord } from '../services/api';

interface SleepBarsProps {
  records?: ApiRecord[];
  isSimulated?: boolean;
}

export const SleepBars: React.FC<SleepBarsProps> = ({
  records = [],
  isSimulated = true,
}) => {
  const { setIsSleepModalOpen, setIsPvtModalOpen } = useStore();

  const sleepRecords = records
    .filter((r) => r.indicator === 'sleep_duration')
    .sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt));

  const chartData = sleepRecords.map((r, i) => {
    const d = new Date(r.recordedAt);
    return {
      day: `D${i + 1} (${d.getDate()}/${d.getMonth() + 1})`,
      hours: Number(r.value),
      recordedAt: r.recordedAt,
    };
  });

  const displayData = chartData.length > 0 ? chartData : [
    { day: 'D1', hours: 7.0 },
    { day: 'D2', hours: 6.5 },
    { day: 'D3', hours: 7.2 },
    { day: 'D4', hours: 5.5 },
    { day: 'D5', hours: 7.0 },
    { day: 'D6', hours: 6.8 },
    { day: 'D7', hours: 7.5 },
  ];

  const totalHours = displayData.reduce((acc, d) => acc + d.hours, 0);
  const avg = displayData.length ? (totalHours / displayData.length).toFixed(1) : '7.0';

  return (
    <div className="p-5 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400">
            <Moon size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Duração do Sono · Histórico da API
            </h3>
            <p className="text-[11px] text-space-400">
              Cálculo server-side líquido (wakeAt − bedAt − latência − WASO)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-space-300 bg-space-800 px-2 py-0.5 rounded border border-space-700">
            MÉDIA: <strong className="text-amber-400">{avg}h</strong>
          </span>
          <button
            onClick={() => setIsSleepModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
            title="Lançar episódio de sono no servidor"
          >
            <Plus size={13} />
            <span>Registrar Sono</span>
          </button>
          <button
            onClick={() => setIsPvtModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md"
            title="Iniciar teste psicomotor de 3 minutos"
          >
            <Zap size={13} />
            <span>PVT-B</span>
          </button>
        </div>
      </div>

      <div className="h-56 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            {/* Target zone 7 to 9h */}
            <ReferenceArea y1={7} y2={9} fill="#22C55E" fillOpacity={0.08} />
            <ReferenceArea y1={0} y2={4} fill="#EF4444" fillOpacity={0.08} />

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
                      <span className="text-[10px] text-space-400 font-sans block">
                        Calculado pelo servidor através do endpoint /sleep-episodes
                      </span>
                    </div>
                  );
                }
                return null;
              }}
            />

            <ReferenceLine
              y={Number(avg)}
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
              {displayData.map((entry, index) => {
                const color = entry.hours <= 4 ? '#EF4444' : entry.hours <= 6 ? '#F59E0B' : '#22C55E';
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
