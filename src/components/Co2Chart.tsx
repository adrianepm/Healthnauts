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
import { Gauge, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ApiRecord, ApiAssessment } from '../services/api';

interface Co2ChartProps {
  records?: ApiRecord[];
  assessment?: ApiAssessment | null;
}

export const Co2Chart: React.FC<Co2ChartProps> = ({
  records = [],
  assessment,
}) => {
  const co2Records = records.filter(
    (r) => r.indicator === 'co2_concentration' || r.indicator === 'co2_partial_pressure'
  );

  const chartData = co2Records
    .filter((r) => r.indicator === 'co2_concentration')
    .map((r) => {
      const d = new Date(r.recordedAt);
      return {
        hour: `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`,
        co2: Number(r.value),
        timestamp: r.recordedAt,
      };
    });

  const displayData = chartData.length > 0 ? chartData : [
    { hour: '10:00', co2: 850 },
    { hour: '11:00', co2: 920 },
    { hour: '12:00', co2: 1100 },
    { hour: '13:00', co2: 1250 },
    { hour: '14:00', co2: 1400 },
    { hour: '15:00', co2: 1300 },
    { hour: '16:00', co2: 1150 },
  ];

  const maxVal = Math.max(...displayData.map((d) => d.co2), 3500);

  const windowCoverage = assessment?.window?.coverage;
  const isInsufficientCoverage = assessment?.status === 'insufficient_data';
  const isAboveReference = assessment?.level === 'attention';

  return (
    <div className="p-5 rounded-2xl bg-space-850/90 border border-space-700/80 shadow-card flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
              <Gauge size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Histórico de CO₂ da Cabine (ppm & ppCO₂)
              </h3>
              <p className="text-[11px] text-space-400">
                Padrão V2 6004: Média temporal ponderada de 1h em cabine nominal (&le; 3 mmHg)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAboveReference && (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                <AlertTriangle size={11} /> ATENÇÃO (&gt;3 mmHg)
              </span>
            )}
            {assessment?.status === 'assessed' && !isAboveReference && (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                <ShieldCheck size={11} /> DENTRO DA REFERÊNCIA
              </span>
            )}
          </div>
        </div>

        {/* Coverage warning when 1 hour window is not covered */}
        {isInsufficientCoverage && (
          <div className="mb-2 p-2 rounded-lg bg-space-900 border border-amber-500/30 text-[11px] text-amber-300 flex items-center justify-between font-mono">
            <span>
              Insuficiência de cobertura: Janela móvel de 1h incompleta ({windowCoverage !== undefined ? `${(windowCoverage * 100).toFixed(0)}%` : '&lt; 100%'}).
            </span>
            <span className="text-space-400 text-[10px]">Segmentos lineares &le; 10 min</span>
          </div>
        )}

        <div className="h-48 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="co2Gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                </linearGradient>
              </defs>

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
                domain={[0, Math.ceil(maxVal * 1.15)]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="p-2.5 rounded-xl bg-space-900 border border-space-700 shadow-xl text-xs font-mono">
                        <span className="text-space-300 block font-sans font-semibold mb-1">
                          Horário: {item.hour}
                        </span>
                        <div className="text-white font-bold text-sm mb-1">
                          {item.co2} ppm
                        </div>
                        <span className="text-[10px] text-space-400 font-sans block">
                          ppCO₂ aproximada a 760 mmHg: {(item.co2 / 1e6 * 760).toFixed(2)} mmHg
                        </span>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <ReferenceLine
                y={3947}
                stroke="#EF4444"
                strokeDasharray="4 4"
                label={{
                  value: 'Limite 3 mmHg (3947 ppm a 760 mmHg)',
                  fill: '#EF4444',
                  fontSize: 10,
                  position: 'insideTopLeft',
                }}
              />

              <Area
                type="monotone"
                dataKey="co2"
                stroke="#F59E0B"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#co2Gradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
