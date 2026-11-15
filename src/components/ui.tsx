// Componentes visuais compartilhados: StatusPill, Num, Card, Section, More, Modal, SourcesList, Stat.
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, ExternalLink, X } from 'lucide-react';
import { Fragment, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { LEVEL_UI } from '../lib/levels';
import { info, SOURCES } from '../lib/content';
import { TickerValue } from './magic/number-ticker';
import { cn } from '../lib/utils';
import type { DisplayLevel } from '../services/api';

/** Ícone do nível pulsa uma vez quando o nível muda (não na primeira exibição). Desligado com prefers-reduced-motion. */
function useChanged(level: DisplayLevel) {
  const prev = useRef(level); const [tick, setTick] = useState(0);
  useEffect(() => { if (prev.current !== level) { prev.current = level; setTick((t) => t + 1); } }, [level]);
  return tick;
}

/**
 * Regra 2.1: cor + ícone + texto, nunca só cor.
 * Normal e Unavailable ficam discretos (ícone na cor do nível, nome em texto secundário, sem fundo);
 * Advisory, Caution, Warning e Emergency ganham fundo tingido e borda na cor do nível.
 */
export function StatusPill({ level, small, className }: { level: DisplayLevel; small?: boolean; className?: string }) {
  const ui = LEVEL_UI[level] ?? LEVEL_UI.unavailable; const Icon = ui.Icon;
  const quiet = level === 'normal' || level === 'unavailable';
  const tick = useChanged(level); const reduced = useReducedMotion();
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md font-medium whitespace-nowrap',
      small ? 'text-xs' : 'text-sm', quiet ? 'text-slate-300' : cn('border', small ? 'px-1.5 py-px' : 'px-2 py-0.5'), className)}
      style={quiet ? undefined : { color: ui.text, borderColor: ui.color + '66', background: ui.color + '1A' }}>
      <motion.span key={tick} className="inline-flex" initial={tick && !reduced ? { scale: 1.6 } : false} animate={{ scale: 1 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
        <Icon size={small ? 14 : 16} strokeWidth={2.4} aria-hidden="true" style={{ color: ui.color }} />
      </motion.span>
      {ui.label}
    </span>
  );
}

/** Número em mono com o ponto decimal mais justo. Aceita texto como "32.2%" ou "2.19". */
export function Num({ children, className }: { children: string | number; className?: string }) {
  const parts = String(children).split(/(?<=\d)\.(?=\d)/);
  return (
    <span className={cn('font-mono', className)}>
      {parts.map((p, i) => <Fragment key={i}>{i > 0 && <span className="num-dot">.</span>}{p}</Fragment>)}
    </span>
  );
}

export function Card({ title, sub, icon, right, children, className = '', id, indicator }: {
  title?: string; sub?: string; icon?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; id?: string; indicator?: string;
}) {
  return (
    <section className={cn('card', className)} id={id} data-indicator={indicator}>
      {title && (
        <header className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 min-w-0">
            {icon && <div className="w-9 h-9 rounded-md bg-space-card2 border border-space-line grid place-items-center text-slate-300 shrink-0" aria-hidden="true">{icon}</div>}
            <div className="min-w-0"><h2 className="card-title">{title}</h2>{sub && <p className="card-sub mt-0.5">{sub}</p>}</div>
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

/** Título de página: nome da tela e uma linha de contexto. */
export function PageHeader({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">{title}</h1>
        {sub && <p className="text-sm text-slate-300 mt-0.5">{sub}</p>}
      </div>
      {right}
    </header>
  );
}

/** `indicator`: âncora para abrir este parâmetro direto (Overview → ?indicator=<id>). Vários ids separados por espaço. */
export function Section({ title, children, right, indicator }: { title: string; children: ReactNode; right?: ReactNode; indicator?: string }) {
  return (
    <section className="mt-6 rounded-lg" data-indicator={indicator}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2"><h3 className="text-sm font-semibold text-slate-200">{title}</h3>{right}</div>
      {children}
    </section>
  );
}

export function More({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="mt-5 rounded-lg border border-space-line bg-space-card group">
      <summary className="cursor-pointer list-none flex items-center justify-between px-4 py-3 text-sm text-slate-200">
        {title}<ChevronDown size={16} aria-hidden="true" className="text-slate-400 group-open:rotate-180 transition-transform" />
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}

/** Janela central (check-in, teste, formulários). */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Diálogo acessível: role="dialog", Esc fecha, Tab fica dentro dele e o foco volta para quem abriu. */
export function Modal({ open, onClose, title, sub, icon, children, wide }: {
  open: boolean; onClose: () => void; title: string; sub?: string; icon?: ReactNode; children: ReactNode; wide?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const back = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => (box.current?.querySelector<HTMLElement>('[data-autofocus]') ?? box.current)?.focus(), 0);
    return () => { window.clearTimeout(t); back?.focus?.(); };
  }, [open]);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
    if (e.key !== 'Tab' || !box.current) return;
    const items = [...box.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (!items.length) return;
    const first = items[0]; const last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === box.current)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] grid place-items-center bg-black/75 p-4 overflow-y-auto overscroll-contain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div ref={box} role="dialog" aria-modal="true" aria-labelledby={`${id}-t`} tabIndex={-1} onKeyDown={onKey}
            initial={{ y: 8 }} animate={{ y: 0 }} className={`w-full ${wide ? 'max-w-2xl' : 'max-w-xl'} bg-space-card border border-space-line rounded-lg p-5 md:p-6 relative my-8 outline-none`}>
            <button onClick={onClose} className="absolute right-3 top-3 text-slate-300 hover:text-slate-50" aria-label="Close"><X aria-hidden="true" /></button>
            <div className="flex items-center gap-3 mb-5 pr-10">
              {icon && <div className="w-9 h-9 rounded-md bg-space-card2 border border-space-line grid place-items-center" aria-hidden="true">{icon}</div>}
              <div><h2 id={`${id}-t`} className="card-title">{title}</h2>{sub && <p className="card-sub">{sub}</p>}</div>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SourcesList({ ids }: { ids: string[] }) {
  return (
    <ul className="mt-2 space-y-0.5">
      {ids.map((s) => {
        const src = SOURCES[s]; if (!src) return null;
        return <li key={s} className="text-xs">{src.url
          ? <a className="text-slate-200 underline underline-offset-2 decoration-slate-400 hover:decoration-slate-100 inline-flex items-center gap-1" href={src.url} target="_blank" rel="noreferrer">{src.label}<ExternalLink size={11} aria-hidden="true" /><span className="sr-only">(opens in a new tab)</span></a>
          : <span className="text-slate-400">{src.label}</span>}</li>;
      })}
    </ul>
  );
}

/** "Why measure this? · Sources" para uma lista de indicadores. */
export function WhyBlock({ ids }: { ids: string[] }) {
  return (
    <div className="space-y-4">
      {ids.map((id) => { const i = info(id); return (
        <div key={id}>
          <p className="text-sm font-semibold text-slate-200">{i.label}</p>
          {i.why && <p className="text-sm text-slate-300 mt-1">{i.why}</p>}
          {i.team && <p className="text-xs text-slate-300 mt-1">Team rule (no source): {i.team}</p>}
          <SourcesList ids={i.sources} />
        </div>
      ); })}
    </div>
  );
}

export const Stat = ({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) => (
  <div className="rounded-md border border-space-line bg-space-card2 p-3"><p className="text-xs text-slate-300">{label}</p><p className="text-xl font-medium mt-1"><TickerValue value={value} /></p>{sub && <p className="text-xs text-slate-300 mt-0.5">{sub}</p>}</div>
);

/** Eixos dos gráficos: linha na cor da borda, rótulos em texto secundário (7,3:1 sobre o card). */
export const axisProps = { stroke: '#232838', tick: { fill: '#9AA3B5', fontSize: 12 }, tickLine: false } as const;
export const GRID = '#1B2030';
