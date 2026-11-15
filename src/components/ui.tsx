// Componentes visuais compartilhados (do protótipo): StatusPill, Card, Section, More, Modal, SourcesList.
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ExternalLink, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { LEVEL_UI } from '../lib/levels';
import { info, SOURCES } from '../lib/content';
import type { DisplayLevel } from '../services/api';

/** Regra 2.1: cor + ícone + texto, nunca só cor. */
export function StatusPill({ level, small }: { level: DisplayLevel; small?: boolean }) {
  const ui = LEVEL_UI[level] ?? LEVEL_UI.unavailable; const Icon = ui.Icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium whitespace-nowrap ${small ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2.5 py-0.5'}`}
      style={{ color: ui.text, borderColor: ui.color + '88', background: ui.color + '14' }}>
      <Icon size={small ? 13 : 15} strokeWidth={2.4} aria-hidden="true" style={{ color: ui.color }} />{ui.label}
    </span>
  );
}


export function Card({ title, sub, icon, right, children, className = '' }: {
  title?: string; sub?: string; icon?: ReactNode; right?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`card ${className}`}>
      {title && (
        <header className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3">
            {icon && <div className="w-9 h-9 rounded-xl bg-space-deep border border-space-line grid place-items-center text-slate-300 shrink-0">{icon}</div>}
            <div><h2 className="card-title">{title}</h2>{sub && <p className="card-sub mt-0.5">{sub}</p>}</div>
          </div>
          {right}
        </header>
      )}
      {children}
    </motion.section>
  );
}

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between gap-2 mb-2"><h4 className="text-sm font-semibold text-slate-200">{title}</h4>{right}</div>
      {children}
    </section>
  );
}

export function More({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="mt-5 rounded-xl border border-space-line group">
      <summary className="cursor-pointer list-none flex items-center justify-between px-4 py-3 text-sm text-slate-300">
        {title}<ChevronDown size={16} className="text-slate-500 group-open:rotate-180 transition-transform" />
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}

/** Janela central (check-in, teste, formulários). */
export function Modal({ open, onClose, title, sub, icon, children, wide }: {
  open: boolean; onClose: () => void; title: string; sub?: string; icon?: ReactNode; children: ReactNode; wide?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div initial={{ y: 12 }} animate={{ y: 0 }} className={`w-full ${wide ? 'max-w-2xl' : 'max-w-xl'} bg-space-deep border border-space-line rounded-2xl p-6 relative my-8`}>
            <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-white" aria-label="Close"><X /></button>
            <div className="flex items-center gap-3 mb-5 pr-8">
              {icon && <div className="w-9 h-9 rounded-xl bg-space-card border border-space-line grid place-items-center">{icon}</div>}
              <div><h2 className="card-title">{title}</h2>{sub && <p className="card-sub">{sub}</p>}</div>
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
    <ul className="mt-1 space-y-0.5">
      {ids.map((s) => {
        const src = SOURCES[s]; if (!src) return null;
        return <li key={s} className="text-xs">{src.url
          ? <a className="text-slate-100 underline underline-offset-2 decoration-slate-400 hover:decoration-slate-100 inline-flex items-center gap-1" href={src.url} target="_blank" rel="noreferrer">{src.label}<ExternalLink size={11} /></a>
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
  <div className="rounded-xl border border-space-line p-3"><p className="text-xs text-slate-400">{label}</p><p className="text-xl font-semibold mt-1">{value}</p>{sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}</div>
);

/** Cores de dado nos gráficos: normal neutro, só a exceção ganha cor. */
export const axisProps = { stroke: '#24324D', tick: { fill: '#A7B4C8', fontSize: 12 }, tickLine: false } as const;
