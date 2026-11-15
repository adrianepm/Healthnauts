// "What to do now" (passos de src/lib/actions.ts) e o botão "Open details" que leva direto ao indicador.
// Usados no AlertBanner, no cartão "Needs attention" da Overview e no resumo do topo de cada área. Nada aqui decide nível.
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { actionsFor, type ActionPlan } from '../lib/actions';
import { AREA_PATH } from '../lib/content';
import { indicatorHref } from './scene/sceneMapping';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

export function WhatToDo({ plan, className }: { plan: ActionPlan | null; className?: string }) {
  if (!plan?.steps.length) return null;
  return (
    <div className={cn('min-w-0', className)}>
      <p className="text-xs font-semibold text-slate-100">What to do now</p>
      <ol className="mt-1 space-y-0.5">
        {plan.steps.map((s, i) => (
          <li key={i} className="flex gap-2 text-sm text-slate-100 leading-snug">
            <span className="font-mono text-xs text-slate-300 mt-0.5 w-3 shrink-0" aria-hidden="true">{i + 1}</span><span>{s}</span>
          </li>
        ))}
      </ol>
      {!plan.source && <p className="mt-1 text-xs text-slate-300">General guidance. Your mission procedure comes first.</p>}
    </div>
  );
}

/** Link para o detalhe do indicador (indicatorHref). Abrir marca os alertas como vistos: o pulso do cartão para. */
export function OpenDetails({ to, alertIds = [], className, label = 'Open details' }: { to: string; alertIds?: string[]; className?: string; label?: string }) {
  const markSeen = useStore((s) => s.markSeen);
  return (
    <Link to={to} onClick={() => markSeen(alertIds)} className={cn('btn-ghost whitespace-nowrap', className)}>
      {label}<ArrowRight size={14} aria-hidden="true" />
    </Link>
  );
}

/**
 * Bloco do cartão de topo de uma área: com a manchete em Caution ou acima, os passos e "Open details" para o indicador.
 * Abrir marca como vistos os alertas ativos daquele indicador.
 */
export function AreaActions({ areaId, indicator, level }: { areaId: string; indicator: string | null | undefined; level: string }) {
  const active = useStore((s) => s.alerts?.active ?? []);
  const plan = actionsFor(indicator, level);
  if (!plan || !indicator) return null;
  const ids = active.filter((a) => a.areaId === areaId && a.indicator === indicator).map((a) => a.id);
  return (
    <div className="mt-3 pt-3 border-t border-space-line flex flex-wrap items-end justify-between gap-3">
      <WhatToDo plan={plan} className="flex-1 min-w-[14rem]" />
      <OpenDetails to={indicatorHref(AREA_PATH[areaId] ?? '/', indicator)} alertIds={ids} />
    </div>
  );
}
