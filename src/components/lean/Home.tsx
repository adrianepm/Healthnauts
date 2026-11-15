// Peças das telas: faixa de status do dia, blocos de instrumento com régua e a linha de detalhes por tópico.
// Genéricos: cada tela passa os dados que a API devolveu. Nada aqui decide nível.
import { ChevronRight, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { LEVEL_UI } from '../../lib/levels';
import type { DisplayLevel } from '../../services/api';
import { StatusPill } from '../ui';
import { MagicCard } from '../magic/magic-card';
import { TickerValue } from '../magic/number-ticker';
import { Ruler, type RulerProps } from '../instruments';
import { cn } from '../../lib/utils';

export interface AlsoItem { label: string; level: DisplayLevel; message: string }

/**
 * Faixa de status: nível (ícone + nome), a frase da API e o contexto. Barra de 2 px à esquerda na cor do nível.
 * Em Normal a frase fica em peso normal; acima de Normal, em negrito.
 */
export function TodayHero({ level, message, label = 'Today', sub, also = [], action }: {
  level: DisplayLevel; message: string; label?: string; sub?: string; also?: AlsoItem[]; action?: ReactNode; compact?: boolean;
}) {
  const ui = LEVEL_UI[level];
  const calm = level === 'normal';
  return (
    <section aria-label={`${label}: ${ui.label}`} className="card relative overflow-hidden !py-3 !pl-5">
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: ui.color }} aria-hidden="true" />
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="min-w-[min(100%,16rem)] flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-xs font-medium text-slate-300">{label}</span>
            <StatusPill level={level} small />
            {sub && <span className="text-xs text-slate-300">{sub}</span>}
          </div>
          <p className={cn('mt-1 leading-snug text-slate-50', calm ? 'text-base' : 'text-base md:text-lg font-semibold')}>{message}</p>
          {also.length > 0 && (
            <ul className="mt-2 space-y-1">
              {also.map((a, i) => (
                <li key={i} className="text-sm text-slate-200 flex flex-wrap items-center gap-2"><StatusPill level={a.level} small /><span className="text-slate-300">{a.label}:</span> {a.message}</li>
              ))}
            </ul>
          )}
        </div>
        {action}
      </div>
    </section>
  );
}

/** `level` só quando a API avalia aquele valor; sem avaliação, o bloco não mostra selo. */
export interface Tile {
  key: string; indicator?: string; title: string; icon: LucideIcon;
  /** Valor como texto ("2.19", "7h15", "No event") ou nó React. */
  value: ReactNode; unit?: string;
  level?: DisplayLevel; compare?: string; onClick?: () => void;
  ruler?: Omit<RulerProps, 'level'>;
}

const isNumeric = (v: ReactNode) => (typeof v === 'string' || typeof v === 'number') && /^-?\d/.test(String(v));

/** Colunas por número de blocos (todos do mesmo tamanho; 5 blocos = 2 largos + 3). */
function layout(n: number, i: number) {
  if (n === 5) return { grid: 'sm:grid-cols-2 lg:grid-cols-6', span: i < 2 ? 'lg:col-span-3' : 'lg:col-span-2' };
  if (n === 3) return { grid: 'sm:grid-cols-3', span: '' };
  return { grid: 'sm:grid-cols-2 xl:grid-cols-4', span: '' };
}

/** Blocos de instrumento: nome, valor grande em mono com unidade, nível, régua e comparação. */
export function KeyTiles({ tiles }: { tiles: Tile[]; cols?: number }) {
  return (
    <div className={cn('grid grid-cols-1 gap-3', layout(tiles.length, 0).grid)}>
      {tiles.map(({ key, indicator, title, icon: Icon, value, unit, level, compare, onClick, ruler }, i) => {
        const body = (<>
          <span className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-sm text-slate-200"><Icon size={16} aria-hidden="true" className="text-slate-300" />{title}</span>
            {onClick && <ChevronRight size={16} className="text-slate-300 shrink-0" aria-hidden="true" />}
          </span>
          <span className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
            <span className={cn('text-3xl font-medium tracking-tight text-slate-50 leading-none', isNumeric(value) && 'font-mono')}>
              <TickerValue value={value} />{unit && value !== '—' && <span className="font-sans text-sm font-normal text-slate-300 ml-1.5 tracking-normal">{unit}</span>}
            </span>
            {level && <StatusPill level={level} small />}
          </span>
          {ruler && <Ruler {...ruler} level={level} />}
          {compare && <span className="text-xs text-slate-300">{compare}</span>}
        </>);
        const cls = cn('text-left flex flex-col gap-3 !p-4', layout(tiles.length, i).span);
        return onClick
          ? <MagicCard as="button" type="button" key={key} data-indicator={indicator} onClick={onClick} className={cls}>{body}</MagicCard>
          : <MagicCard key={key} data-indicator={indicator} className={cls}>{body}</MagicCard>;
      })}
    </div>
  );
}

/** Detalhes por tópico: mesmos cartões-link do resto do app (nome, nível, seta). */
export function TopicLinks({ topics, onOpen }: { topics: { id: string; label: string; level: DisplayLevel }[]; onOpen: (id: string) => void }) {
  return (
    <section aria-labelledby="details-title">
      <h2 id="details-title" className="eyebrow mb-2">Details and history</h2>
      <div className={cn('grid grid-cols-1 gap-3', topics.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
        {topics.map(({ id, label, level }) => (
          <button key={id} type="button" onClick={() => onOpen(id)} className="card card-link !py-2.5 !px-4 flex items-center justify-between gap-3 text-left">
            <span className="text-sm font-medium text-slate-100">{label}</span>
            <span className="flex items-center gap-2"><StatusPill level={level} small /><ChevronRight size={16} className="text-slate-300" aria-hidden="true" /></span>
          </button>
        ))}
      </div>
    </section>
  );
}
