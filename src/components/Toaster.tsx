// Toasts de confirmação. Desktop: canto inferior direito. Celular: embaixo, centralizado, acima da barra de navegação.
// Não bloqueiam a tela (só o próprio toast recebe clique), empilham e ficam ABAIXO do EmergencyOverlay (z-index 70 < 100).
// Cores da marca ou neutras, nunca as cores de nível. Sucesso em aria-live="polite"; erro com role="alert".
// Com prefers-reduced-motion só aparecem e somem (sem deslizar).
import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { useToasts, type Toast } from '../store/toast';

function Item({ t }: { t: Toast }) {
  const dismiss = useToasts((s) => s.dismiss);
  const reduced = useReducedMotion();
  useEffect(() => { const id = window.setTimeout(() => dismiss(t.id), t.ms); return () => window.clearTimeout(id); }, [t.id, t.ms]);
  const error = t.kind === 'error';
  return (
    <motion.div layout={reduced ? false : 'position'}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      transition={{ duration: reduced ? 0.12 : 0.2, ease: 'easeOut' }}
      role={error ? 'alert' : undefined}
      className="pointer-events-auto w-full sm:w-[22rem] flex items-start gap-3 rounded-md border border-space-strong bg-space-card2 pl-3.5 pr-1 py-1 shadow-2xl shadow-black/60">
      {error
        ? <CircleAlert size={18} aria-hidden="true" className="mt-3 shrink-0 text-slate-50" />
        : <CircleCheck size={18} aria-hidden="true" className="mt-3 shrink-0 text-brand-soft" />}
      <p className="flex-1 py-2.5 text-sm text-slate-50">
        {error && <span className="block font-semibold">Couldn't save</span>}
        <span className={error ? 'text-slate-300' : ''}>{t.text}</span>
      </p>
      <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="w-11 h-11 shrink-0 grid place-items-center rounded-md text-slate-300 hover:text-slate-50 hover:bg-space-card">
        <X size={16} aria-hidden="true" />
      </button>
    </motion.div>
  );
}

export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  return (
    <div aria-live="polite" aria-relevant="additions"
      className="pointer-events-none fixed z-[70] inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] flex flex-col items-center gap-2 px-4 lg:inset-x-auto lg:right-4 lg:bottom-4 lg:items-end lg:px-0">
      <AnimatePresence initial={false}>
        {toasts.map((t) => <Item key={t.id} t={t} />)}
      </AnimatePresence>
    </div>
  );
}
