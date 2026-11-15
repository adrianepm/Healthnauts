// Número que anima só quando o valor MUDA (300 ms), nunca ao aparecer na tela. JetBrains Mono com algarismos de largura igual,
// valor final para leitores de tela e sem animação com prefers-reduced-motion.
import { useEffect, useRef, type ReactNode } from 'react';
import { animate, useReducedMotion } from 'framer-motion';
import { Num } from '../ui';

const format = (n: number, decimals: number) =>
  Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: false }).format(Number(n.toFixed(decimals)));

export function NumberTicker({ value, decimalPlaces = 0, className }: { value: number; decimalPlaces?: number; className?: string }) {
  const reduced = !!useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current; prev.current = value;
    if (reduced || from === value || !ref.current) return;
    const controls = animate(from, value, { duration: 0.3, ease: 'easeOut', onUpdate: (v) => { if (ref.current) ref.current.textContent = format(v, decimalPlaces); } });
    return () => controls.stop();
  }, [value, decimalPlaces, reduced]);
  const final = format(value, decimalPlaces);
  return (
    <span className={className}>
      <span className="sr-only">{final}</span>
      <span ref={ref} aria-hidden="true" className="font-mono">{final}</span>
    </span>
  );
}

/**
 * Valor de cartão: anima o número inicial do texto ("7.2 h", "2 of 4", "118") e mantém o resto igual.
 * Texto sem número no começo ("No link", "—") ou nó React aparece como veio. Número com ponto decimal usa Num.
 */
export function TickerValue({ value }: { value: ReactNode }) {
  if (typeof value !== 'string' && typeof value !== 'number') return <>{value}</>;
  const m = String(value).match(/^(-?\d+(?:\.(\d+))?)(.*)$/s);
  if (!m) return <span>{value}</span>;
  // Resto que começa com espaço é unidade (" min", " mSv"): fica na fonte do texto. "7h15" continua inteiro em mono.
  const rest = /^\s/.test(m[3]) ? <span className="font-sans font-normal text-[0.6em] text-slate-300 tracking-normal">{m[3]}</span> : <span className="font-mono">{m[3]}</span>;
  if (m[2]) return <><Num>{m[1]}</Num>{rest}</>;
  return <><NumberTicker value={Number(m[1])} />{rest}</>;
}
