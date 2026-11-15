// "Needs attention": topo da Overview quando há alerta ativo (Caution ou acima). Mais grave primeiro.
// Cada linha: área, indicador, valor, limite NASA (de shared/), nível (ícone + nome), "What to do now" e "Open details".
// A borda pulsa devagar na cor do nível mais grave (ciclo de 1,8 s) até o astronauta abrir o detalhe ou confirmar o alerta;
// com prefers-reduced-motion a borda fica fixa e mais grossa (src/index.css, .attention-*). Nada aqui decide nível.
import type { CSSProperties } from 'react';
import { useStore } from '../store/useStore';
import type { Alert } from '../services/api';
import { LEVEL_UI, severity } from '../lib/levels';
import { AREA_LABEL, info } from '../lib/content';
import { actionsFor, limitText } from '../lib/actions';
import { fmtReading, fmtTime } from '../lib/format';
import { fmtTen, isTenPoint } from '../lib/scales';
import { AckStatus, NO_ACK_TEXT, alertHref, useNow } from './AlertBanner';
import { OpenDetails, WhatToDo } from './AlertActions';
import { StatusPill } from './ui';
import { cn } from '../lib/utils';

const MAX = 3; // o cartão não ocupa a tela toda: no máximo 3 alertas, o resto em uma linha

export const sortAlerts = (active: Alert[]) => [...active].sort((a, b) => severity(b.level) - severity(a.level) || Date.parse(b.shownAt) - Date.parse(a.shownAt));

/** O alerta ainda pede atenção (pulso)? Para quando o detalhe foi aberto ou o alerta foi confirmado. */
export const stillPulsing = (a: Alert, seen: string[]) => !seen.includes(a.id) && a.acknowledgementStatus !== 'acknowledged';

export function NeedsAttention() {
  const active = useStore((s) => s.alerts?.active ?? []);
  const seen = useStore((s) => s.ui.seenAlerts);
  const now = useNow();
  if (!active.length) return null;
  const list = sortAlerts(active);
  const top = list[0]; const color = LEVEL_UI[top.level].color;
  const pulsing = list.some((a) => stillPulsing(a, seen));
  const needsAck = list.some((a) => a.requiresAcknowledgement);
  return (
    <section aria-labelledby="attention-title" role="alert"
      className={cn('card !p-0 overflow-hidden attention-card', pulsing && 'attention-pulse')} style={{ '--attention': color, borderColor: color } as CSSProperties}>
      <header className="flex items-center justify-between gap-3 px-4 pt-3 md:px-5">
        <h2 id="attention-title" className="text-sm font-semibold text-slate-50">Needs attention</h2>
        <span className="text-xs text-slate-300"><span className="font-mono">{list.length}</span> active {list.length === 1 ? 'alert' : 'alerts'}</span>
      </header>
      <ul className="divide-y divide-space-line">
        {list.slice(0, MAX).map((a, i) => <Row key={a.id} a={a} now={now} first={i === 0} />)}
      </ul>
      {(list.length > MAX || needsAck) && (
        <p className="px-4 md:px-5 pb-3 text-xs text-slate-300">
          {list.length > MAX && <>{list.length - MAX} more in the area pages. </>}
          {needsAck && <>{NO_ACK_TEXT} The device may be far away, switched off or offline.</>}
        </p>
      )}
    </section>
  );
}

function Row({ a, now, first }: { a: Alert; now: number; first: boolean }) {
  // Alguns alertas (ex.: sono) não trazem valor: usa o último registro do indicador que a API devolveu.
  const latest = useStore((s) => (s.details as Record<string, any>)[a.areaId]?.latestRecords?.find((r: any) => r.indicator === a.indicator));
  const raw = typeof a.value === 'number' ? a.value : Number(latest?.value);
  const reading = isTenPoint(a.indicator) && Number.isFinite(raw) ? { value: fmtTen(raw), unit: 'of 10' }
    : fmtReading(a.value, a.unit, a.indicator) ?? fmtReading(latest?.value, latest?.unit, a.indicator);
  return (
    <li className="px-4 py-3 md:px-5 grid gap-x-6 gap-y-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_12rem] md:items-start">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <StatusPill level={a.level} small />
          <span className="text-sm font-semibold text-slate-50">{AREA_LABEL[a.areaId]}</span>
          <span className="text-sm text-slate-200">{info(a.indicator).label}</span>
        </div>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
          {reading
            ? <span className={cn('font-mono font-medium text-slate-50 leading-tight', first ? 'text-2xl' : 'text-xl')}>{reading.value}{reading.unit && <span className="font-sans text-sm font-normal text-slate-300 ml-1">{reading.unit}</span>}</span>
            : <span className="text-sm text-slate-300">No single value</span>}
          <span className="text-xs text-slate-300">since <span className="font-mono">{fmtTime(a.shownAt)}</span></span>
        </p>
        <p className={cn('mt-0.5 text-xs text-slate-300', !first && 'hidden md:block')}>{limitText(a.indicator)}</p>
      </div>
      {/* No celular só o mais grave mostra os passos (os outros abrem no detalhe), para o cartão não ocupar a tela toda. */}
      <WhatToDo plan={actionsFor(a.indicator, a.level)} className={first ? '' : 'hidden md:block'} />
      <div className="flex flex-wrap md:flex-col items-center md:items-end gap-2">
        <OpenDetails to={alertHref(a)} alertIds={[a.id]} className={first ? '' : '!py-1.5'} />
        <AckStatus a={a} now={now} />
      </div>
    </li>
  );
}
