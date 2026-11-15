// Instrumentos da direção "Painel de voo": régua (valor + limites + faixa) e mini-gráfico de 7 dias.
// Só desenham números que a API ou shared/config já devolveram: nada aqui decide nível.
import { useLayoutEffect, useRef, useState } from 'react';
import { LEVEL_UI, NEUTRAL } from '../lib/levels';
import type { DisplayLevel } from '../services/api';

const flagged = (l?: DisplayLevel | null) => !!l && l !== 'normal' && l !== 'unavailable';
const clamp = (x: number) => Math.min(100, Math.max(0, x));

/** `priority`: maior = mais importante. Em sobreposição sem espaço na segunda linha, o de menor prioridade some. */
export interface RulerMark { at: number; label: string; priority?: number }

/** Traço de 1 px centrado em p% (nas pontas fica dentro da régua). */
export function Tick({ p, className = '' }: { p: number; className?: string }) {
  const shift = p <= 0 ? 'translateX(0)' : p >= 100 ? 'translateX(-100%)' : 'translateX(-50%)';
  return <span className={`absolute w-px bg-slate-300 ${className}`} style={{ left: `${p}%`, transform: shift }} aria-hidden="true" />;
}

interface Placed { left: number; row: 0 | 1; hidden: boolean }
const GAP = 8; // espaço mínimo entre dois rótulos na mesma linha (px)

/**
 * Rótulos de uma régua. Cada rótulo fica centrado exatamente embaixo do seu traço (posição em px, medida na tela).
 * Perto das pontas, se o centro faria o texto sair da régua, alinha pela esquerda (começo) ou pela direita (fim).
 * Se dois rótulos se sobrepõem, o menos importante desce para uma segunda linha; sem espaço nela, ele some
 * (o texto completo continua no aria-label da régua). Recalcula quando a largura muda.
 */
export function RulerLabels({ marks, pos }: { marks: RulerMark[]; pos: (x: number) => number }) {
  const box = useRef<HTMLDivElement>(null);
  const [placed, setPlaced] = useState<Placed[] | null>(null);
  const key = marks.map((m) => `${pos(m.at)}:${m.label}:${m.priority ?? 0}`).join("|");

  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const measure = () => {
      const W = el.clientWidth;
      const spans = [...el.querySelectorAll<HTMLElement>('[data-mark]')];
      const items = marks.map((m, i) => {
        const w = spans[i]?.offsetWidth ?? 0; const c = (pos(m.at) / 100) * W;
        const left = Math.min(Math.max(c - w / 2, 0), Math.max(W - w, 0));
        return { i, left, w, pr: m.priority ?? 0 };
      });
      const rows: [number, number][][] = [[], []];
      const free = (row: [number, number][], a: number, b: number) => row.every(([x, y]) => b + GAP <= x || a >= y + GAP);
      const out: Placed[] = marks.map(() => ({ left: 0, row: 0, hidden: true }));
      // Mais importantes primeiro; empate: ordem da lista.
      for (const it of [...items].sort((a, b) => b.pr - a.pr || a.i - b.i)) {
        const span: [number, number] = [it.left, it.left + it.w];
        const row = free(rows[0], ...span) ? 0 : free(rows[1], ...span) ? 1 : -1;
        if (row >= 0) rows[row].push(span);
        out[it.i] = { left: it.left, row: row === 1 ? 1 : 0, hidden: row < 0 };
      }
      setPlaced((prev) => (JSON.stringify(prev) === JSON.stringify(out) ? prev : out));
    };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el);
    document.fonts?.ready.then(measure).catch(() => undefined);
    return () => ro.disconnect();
  }, [key]);

  const two = !!placed?.some((p) => p.row === 1 && !p.hidden);
  return (
    <div ref={box} className={`relative mt-1 text-xs text-slate-300 font-mono ${two ? 'h-10' : 'h-5'}`} aria-hidden="true">
      {marks.map((m, i) => {
        const p = placed?.[i];
        return (
          <span key={m.label} data-mark className="absolute whitespace-nowrap leading-5"
            style={p ? { left: `${p.left}px`, top: p.row ? '1.25rem' : 0, visibility: p.hidden ? 'hidden' : 'visible' } : { left: `${pos(m.at)}%`, transform: 'translateX(-50%)', visibility: 'hidden' }}>
            {m.label}
          </span>
        );
      })}
    </div>
  );
}
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
      {/* Trilho e camada de marcas com a MESMA largura dos rótulos (a borda do trilho não desloca os traços). */}
      <div className="relative h-2">
        <div className="absolute inset-0 rounded-sm bg-space-card2 border border-space-line" />
        {range && <span className="absolute inset-y-0 bg-slate-300/30" style={seg(range)} />}
        {band && <span className="absolute inset-y-0" style={{ ...seg(band), background: NEUTRAL, opacity: 0.55 }} />}
        {marks.map((m) => <Tick key={m.label} p={pos(m.at)} className="-top-1 -bottom-1" />)}
        {value !== null && Number.isFinite(value) && (
          <span className="absolute -top-1.5 h-4 w-[3px] -translate-x-1/2 rounded-sm" style={{ left: `${pos(value)}%`, background: marker }} />
        )}
      </div>
      {marks.length > 0 && <RulerLabels marks={marks} pos={pos} />}
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
