import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import { MOCK_GRAVITY_DATA } from '../mock/gravidade';
import { Bone, TrendingDown } from 'lucide-react';
import { useStore } from '../store/useStore';

export const BoneTrendChart: React.FC = () => {
  const { currentGravity } = useStore();
  const rawData = MOCK_GRAVITY_DATA.boneDensityHistory;

  // If partial gravity (Moon or Mars or Earth), loss is mitigated
  const gravityMultiplier = currentGravity === '1g' ? 0.05 : currentGravity === '0.38g' ? 0.4 : currentGravity === '0.16g' ? 0.7 : 1.0;

  const data = rawData.map((d) => ({
    ...d,
    actual: d.actual !== undefined ? +(d.actual * gravityMultiplier).toFixed(1) : undefined,
    projWithoutExercise: +(d.projWithoutExercise * gravityMultiplier).toFixed(1),
    projWithExercise: +(d.projWithExercise * gravityMultiplier).toFixed(1),
  }));

  return (
    <div className="p-5 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400">
            <Bone size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Projeção da Densidade Mineral Óssea (DMO)
            </h3>
            <p className="text-[11px] text-space-400">
              Variação % no colo do fêmur · Efeito das contramedidas ARED
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono text-rose-400 bg-rose-500/15 px-2.5 py-1 rounded-full border border-rose-500/30">
          HOJE: -3,1% (Atenção Crítica)
        </span>
      </div>

      <div className="h-60 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            {/* Risk horizontal bands */}
            <ReferenceArea y1={0} y2={-2.5} fill="#22C55E" fillOpacity={0.06} />
            <ReferenceArea y1={-2.5} y2={-5.0} fill="#F59E0B" fillOpacity={0.08} />
            <ReferenceArea y1={-5.0} y2={-14.0} fill="#EF4444" fillOpacity={0.12} />

            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis
              dataKey="month"
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
              domain={[-13, 0]}
              ticks={[0, -2.5, -5, -7.5, -10, -12.5]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="p-2.5 rounded-xl bg-space-900 border border-space-700 shadow-xl text-xs font-mono">
                      <span className="text-space-300 block font-sans font-semibold mb-1">
                        {label}
                      </span>
                      {payload.map((p, i) => (
                        <div key={i} className="flex items-center gap-2" style={{ color: p.color }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                          <span>{p.name}: <strong>{p.value}%</strong></span>
                        </div>
                      ))}
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

            {/* Threshold line */}
            <ReferenceLine
              y={-2.5}
              stroke="#F59E0B"
              strokeDasharray="4 4"
              label={{ value: 'Osteopenia (-2.5%)', fill: '#F59E0B', fontSize: 9, position: 'insideTopLeft' }}
            />

            {/* Actual measured points */}
            <Line
              type="monotone"
              dataKey="actual"
              name="Medição Real (Densitometria)"
              stroke="#FFFFFF"
              strokeWidth={3}
              dot={{ r: 4, fill: '#FFFFFF', stroke: '#0B1120' }}
              connectNulls={false}
            />

            {/* Projected with exercise (Cyan dashed) */}
            <Line
              type="monotone"
              dataKey="projWithExercise"
              name="Projeção COM Exercício ARED"
              stroke="#38BDF8"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />

            {/* Projected without exercise (Red dashed) */}
            <Line
              type="monotone"
              dataKey="projWithoutExercise"
              name="Projeção SEM Exercício (Risco)"
              stroke="#EF4444"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-space-400 border-t border-space-800 pt-2 font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Tolerável (&gt; -2,5%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Osteopenia (-2,5% a -5%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Osteoporose de Voo (&lt; -5%)
        </span>
      </div>
    </div>
  );
};
