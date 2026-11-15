// Instrumentos da direção "Painel de voo": régua (valor + limites + faixa) e mini-gráfico de 7 dias.
// Só desenham números que a API ou shared/config já devolveram: nada aqui decide nível.
import { LEVEL_UI, NEUTRAL } from '../lib/levels';
import type { DisplayLevel } from '../services/api';

const flagged = (l?: DisplayLevel | null) => !!l && l !== 'normal' && l !== 'unavailable';
const clamp = (x: number) => Math.min(100, Math.max(0, x));

export interface RulerMark { at: number; label: string }
export interface RulerProps {
  min: number; max: number; value: number | null;
  /** Faixa de referência (ex.: alvo, conforto, limite seguro), em cinza claro. */
  range?: [number, number] | null;
  /** Faixa pessoal (média ± 2 DP), no cinza-azulado #5B7FA6 da especificação 2.1. */
  band?: [number, number] | null;
  marks?: RulerMark[];
  level?: DisplayLevel | null;
  /** Texto para leitores de tela, ex.: "Limit 3 mmHg". */
  label: string;
}

/** Régua horizontal: trilho, faixa de referência, faixa pessoal, marcas de limite e o valor atual. */
export function Ruler({ min, max, value, range, band, marks = [], level, label }: RulerProps) {
  const pos = (x: number) => clamp(((x - min) / (max - min)) * 100);
  const seg = (r: [number, number]) => ({ left: `${pos(r[0])}%`, width: `${pos(r[1]) - pos(r[0])}%` });
  const marker = flagged(level) ? LEVEL_UI[level!].color : '#E6E9F0';
  return (
    <div className="pt-1" role="img" aria-label={label}>
      <div className="relative h-2 rounded-sm bg-space-card2 border border-space-line">
        {range && <span className="absolute inset-y-0 bg-slate-300/30" style={seg(range)} />}
        {band && <span className="absolute inset-y-0" style={{ ...seg(band), background: NEUTRAL, opacity: 0.55 }} />}
        {marks.map((m) => <span key={m.label} className="absolute -inset-y-1 w-px bg-slate-300" style={{ left: `${pos(m.at)}%` }} />)}
        {value !== null && Number.isFinite(value) && (
          <span className="absolute -top-1.5 h-4 w-[3px] -translate-x-1/2 rounded-sm" style={{ left: `${pos(value)}%`, background: marker }} />
        )}
      </div>
      {marks.length > 0 && (
        <div className="relative h-5 mt-1 text-xs text-slate-300 font-mono" aria-hidden="true">
          {marks.map((m) => { const p = pos(m.at); const edge = p > 82 ? '-translate-x-full' : p < 12 ? '' : '-translate-x-1/2';
            return <span key={m.label} className={`absolute whitespace-nowrap ${edge}`} style={{ left: `${p}%` }}>{m.label}</span>; })}
        </div>
      )}
    </div>
  );
}

/** Mini-gráfico de linha (7 dias). Linha neutra; o último ponto ganha a cor do nível só quando há alerta. */
export function Sparkline({ values, level, label }: { values: number[]; level?: DisplayLevel | null; label: string }) {
  const v = values.filter((x) => Number.isFinite(x));
  if (v.length < 2) return null;
  const lo = Math.min(...v); const hi = Math.max(...v); const span = hi - lo || 1;
  const pts = v.map((x, i) => [(i / (v.length - 1)) * 100, 24 - ((x - lo) / span) * 20 - 2] as const);
  const last = pts[pts.length - 1];
  const dot = flagged(level) ? LEVEL_UI[level!].color : '#E6E9F0';
  return (
    <span className="relative block h-6 w-full" role="img" aria-label={label}>
      <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={NEUTRAL} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
      <span className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: `${last[0]}%`, top: `${(last[1] / 24) * 100}%`, background: dot }} aria-hidden="true" />
    </span>
  );
}
