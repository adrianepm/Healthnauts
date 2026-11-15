// Gráficos "puros" (estilo do protótipo): recebem registros por props.
// Normal fica neutro (#5B7FA6); só o último ponto ganha a cor do nível que a API devolveu.
// As réguas (linhas de referência) vêm de shared/config ou de REFERENCE, nunca decidem nível.
import { Area, Bar, CartesianGrid, Cell, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ApiRecord, DisplayLevel } from '../services/api';
import { LEVEL_UI, NEUTRAL } from '../lib/levels';
import { fmtDateTime, fmtDay, fmtHours, fmtTime } from '../lib/format';
import { axisProps } from './ui';

const tipBox = 'recharts-default-tooltip px-3 py-2 text-xs';
const tickEvery = (n: number) => (n > 16 ? Math.ceil(n / 8) - 1 : 0);
const lastColor = (level?: DisplayLevel) => level && level !== 'normal' && level !== 'unavailable' ? LEVEL_UI[level].color : '#E6EDF7';

export interface RefLine { y: number; label: string; color?: string }

export function Legend({ color, text, soft, dashed }: { color: string; text: string; soft?: boolean; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-3 h-3 rounded-sm" style={dashed ? { border: `1px dashed ${color}` } : { background: color, opacity: soft ? 0.45 : 1 }} />{text}
    </span>
  );
}

/** Uma barra por registro (ex.: horas de sono por noite). */
export function BarsChart({ records, unit, refs = [], lastLevel, domain, fmt = (v) => String(v) }: {
  records: ApiRecord[]; unit?: string; refs?: RefLine[]; lastLevel?: DisplayLevel; domain?: [number, number]; fmt?: (v: number) => string;
}) {
  const data = records.map((r) => ({ label: fmtDay(r.recordedAt), at: r.recordedAt, v: Number(r.value) }));
  if (!data.length) return <p className="text-sm text-slate-400">No data in this period.</p>;
  return (
    <div className="h-56">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: refs.length ? 92 : 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="#1F2A40" vertical={false} />
          <XAxis dataKey="label" {...axisProps} fontSize={10} interval={tickEvery(data.length)} />
          <YAxis domain={domain ?? ['auto', 'auto']} {...axisProps} unit={unit} />
          {refs.map((r) => <ReferenceLine key={r.label} y={r.y} stroke={r.color ?? '#A7B4C8'} strokeDasharray="4 4" label={{ value: r.label, position: 'right', fill: r.color ?? '#A7B4C8', fontSize: 12 }} />)}
          <Tooltip cursor={{ fill: '#ffffff08' }} content={({ active, payload }) => {
            if (!active || !payload?.length) return null; const p = payload[0].payload;
            return <div className={tipBox}><b>{fmtDateTime(p.at)}</b><br />{fmt(p.v)}</div>;
          }} />
          <Bar dataKey="v" radius={[5, 5, 0, 0]} maxBarSize={30} isAnimationActive={false}>
            {data.map((_, i) => <Cell key={i} fill={i === data.length - 1 ? lastColor(lastLevel) : NEUTRAL} />)}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export const sleepRefs = (planned: number, advisory: number, warning: number): RefLine[] => [
  { y: planned, label: `NASA plan ${planned} h`, color: '#7DD3FC' },
  { y: advisory, label: `${advisory} h`, color: LEVEL_UI.advisory.color },
  { y: warning, label: `${warning} h`, color: LEVEL_UI.warning.color },
];

/** Faixa de calor para escalas ordinais (KSS 1-9, Samn-Perelli 1-7). */
export function ScaleHeat({ records, max, labels, lastLevel }: { records: ApiRecord[]; max: number; labels: string[]; lastLevel?: DisplayLevel }) {
  if (!records.length) return <p className="text-sm text-slate-400">No data in this period.</p>;
  const n = records.length;
  return (
    <div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${n}, minmax(0,1fr))` }}>
        {records.map((r, i) => {
          const v = Number(r.value); const last = i === n - 1 && lastLevel && lastLevel !== 'normal' && lastLevel !== 'unavailable';
          return <div key={r.id} title={`${fmtDay(r.recordedAt)} · ${v}: ${labels[v - 1] ?? ''}`} className="h-9 rounded-md grid place-items-center text-xs font-semibold"
            style={last ? { background: LEVEL_UI[lastLevel!].color, color: '#0B1220' } : { background: `rgba(91,127,166,${0.25 + (v / max) * 0.45})`, color: '#E6EDF7' }}>{last && (() => { const I = LEVEL_UI[lastLevel!].Icon; return <span className="inline-flex items-center gap-0.5"><I size={12} aria-label={LEVEL_UI[lastLevel!].label} />{v}</span>; })()}{!last && v}</div>;
        })}
      </div>
      <div className="grid mt-1 text-xs text-slate-500" style={{ gridTemplateColumns: `repeat(${n}, minmax(0,1fr))` }}>
        {records.map((r, i) => <span key={r.id} className="text-center truncate">{n <= 10 || i === n - 1 || i % Math.ceil(n / 8) === 0 ? fmtDay(r.recordedAt) : ''}</span>)}
      </div>
    </div>
  );
}

/** Linha ao longo do tempo + faixa pessoal sombreada (quando a API já tem a faixa pronta) + réguas. */
export function TrendChart({ records, band, refs = [], lastLevel, domain, unit, height = 160, fmt = (v) => String(v), dayTicks = true }: {
  records: ApiRecord[]; band?: { lower: number; upper: number } | null; refs?: RefLine[]; lastLevel?: DisplayLevel;
  domain?: [number | 'auto', number | 'auto']; unit?: string; height?: number; fmt?: (v: number) => string; dayTicks?: boolean;
}) {
  // Leituras de sensor podem ser centenas: mostra no máximo ~300 pontos, sempre com o último.
  const step = Math.ceil(records.length / 300);
  const shown = step > 1 ? records.filter((_, i) => i % step === 0 || i === records.length - 1) : records;
  const data = shown.map((r) => ({ at: r.recordedAt, label: dayTicks ? fmtDay(r.recordedAt) : fmtTime(r.recordedAt),
    v: Number(r.value), band: band ? [band.lower, band.upper] : undefined }));
  if (!data.length) return <p className="text-sm text-slate-400">No data in this period.</p>;
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: refs.length ? 92 : 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="#1F2A40" vertical={false} />
          <XAxis dataKey="label" {...axisProps} fontSize={9} interval={tickEvery(data.length)} />
          <YAxis domain={domain ?? ['auto', 'auto']} {...axisProps} fontSize={9} unit={unit} />
          {band && <Area dataKey="band" fill={NEUTRAL} fillOpacity={0.3} stroke="none" isAnimationActive={false} />}
          {refs.map((r) => <ReferenceLine key={r.label} y={r.y} stroke={r.color ?? '#A7B4C8'} strokeDasharray="4 4" label={{ value: r.label, position: 'right', fill: r.color ?? '#A7B4C8', fontSize: 12 }} />)}
          <Line dataKey="v" stroke="#CBD5E1" strokeWidth={1.8} isAnimationActive={false}
            dot={(p: any) => {
              const last = p.index === data.length - 1;
              return <circle key={p.index} cx={p.cx} cy={p.cy} r={last ? 4.5 : 2} fill={last ? lastColor(lastLevel) : '#94A3B8'} stroke="none" />;
            }} />
          <Tooltip content={({ active, payload }) => {
            if (!active || !payload?.length) return null; const p = payload[0].payload;
            return <div className={tipBox}><b>{fmtDateTime(p.at)}</b>: {fmt(p.v)}</div>;
          }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export const hoursFmt = (v: number) => fmtHours(v);
