// NumberTicker do Magic UI (magicui.design/r/number-ticker), adaptado: framer-motion no lugar de motion/react,
// Geist Mono, valor final para leitores de tela e sem animação com prefers-reduced-motion.
import { useEffect, useRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { useInView, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { cn } from '../../lib/utils';

interface NumberTickerProps extends ComponentPropsWithoutRef<'span'> {
  value: number;
  startValue?: number;
  direction?: 'up' | 'down';
  delay?: number;
  decimalPlaces?: number;
}

const format = (n: number, decimals: number) =>
  Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Number(n.toFixed(decimals)));

export function NumberTicker({ value, startValue = 0, direction = 'up', delay = 0, className, decimalPlaces = 0, ...props }: NumberTickerProps) {
  const reduced = !!useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === 'down' ? value : startValue);
  const springValue = useSpring(motionValue, { damping: 60, stiffness: 100 });
  const isInView = useInView(ref, { once: true, margin: '0px' });

  useEffect(() => {
    if (reduced) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (isInView) timer = setTimeout(() => motionValue.set(direction === 'down' ? startValue : value), delay * 1000);
    return () => { if (timer !== null) clearTimeout(timer); };
  }, [motionValue, isInView, delay, value, direction, startValue, reduced]);

  useEffect(() => springValue.on('change', (latest) => {
    if (ref.current) ref.current.textContent = format(latest, decimalPlaces);
  }), [springValue, decimalPlaces]);

  const final = format(direction === 'down' ? startValue : value, decimalPlaces);
  return (
    <span className={cn('relative inline-block font-mono tabular-nums', className)} {...props}>
      <span className="sr-only">{final}</span>
      <span ref={ref} aria-hidden="true">{reduced ? final : format(direction === 'down' ? value : startValue, decimalPlaces)}</span>
    </span>
  );
}

/**
 * Valor de cartão: conta até o número inicial do texto ("7.2 h", "2 of 4", "118") e mantém o resto igual.
 * Texto sem número no começo ("No link", "—") ou nó React aparece como veio.
 */
export function TickerValue({ value }: { value: ReactNode }) {
  if (typeof value !== 'string' && typeof value !== 'number') return <>{value}</>;
  const m = String(value).match(/^(-?\d+(?:\.(\d+))?)(.*)$/s);
  if (!m) return <span>{value}</span>;
  return (
    <span className="font-mono tabular-nums">
      <NumberTicker value={Number(m[1])} decimalPlaces={m[2]?.length ?? 0} />
      {m[3]}
    </span>
  );
}
