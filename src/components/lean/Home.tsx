// Tela inicial enxuta (do protótipo): resumo do dia, poucos indicadores-chave e atalhos para os tópicos.
// Genéricos: cada tela passa os dados que a API devolveu. Nada aqui decide nível.
import { ChevronRight, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { LEVEL_UI } from '../../lib/levels';
import type { DisplayLevel } from '../../services/api';
import { StatusPill } from '../ui';
import { MagicCard } from '../magic/magic-card';
import { BentoGrid, bentoLayout } from '../magic/bento-grid';
import { TickerValue } from '../magic/number-ticker';
import { cn } from '../../lib/utils';

export interface AlsoItem { label: string; level: DisplayLevel; message: string }

export function TodayHero({ level, message, label = 'Today', sub, also = [], action }: {
  level: DisplayLevel; message: string; label?: string; sub?: string; also?: AlsoItem[]; action?: ReactNode;
}) {
  const ui = LEVEL_UI[level]; const Icon = ui.Icon;
  const color = ui.color; const text = ui.text;
  return (
    <section className="card relative overflow-hidden !p-6" style={{ borderColor: color + '55' }}>
      <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: color }} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <Icon size={18} style={{ color }} aria-hidden="true" />
            <span className="text-sm font-semibold" style={{ color: text }}>{level === 'normal' ? `${label}: within expected` : `${label}: ${ui.label}`}</span>
            {sub && <span className="text-xs text-slate-500">· {sub}</span>}
          </div>
          <p className="text-xl md:text-2xl font-semibold mt-2 leading-snug">{message}</p>
          {also.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {also.map((a, i) => (
                <li key={i} className="text-sm text-slate-300 flex flex-wrap items-center gap-2"><StatusPill level={a.level} small /><span className="text-slate-400">{a.label}:</span> {a.message}</li>
              ))}
            </ul>
          )}
        </div>
        {action}
      </div>
    </section>
  );
}

/** `level` só quando a API avalia aquele valor; sem avaliação, o cartão não mostra selo. */
export interface Tile { key: string; title: string; icon: LucideIcon; value: ReactNode; level?: DisplayLevel; compare?: string; onClick?: () => void }

/**
 * Indicadores-chave em bento (BentoGrid + MagicCard do Magic UI): o primeiro cartão é o destaque.
 * cols = 1: uma coluna estreita (empilha em tela pequena). Números contam até o valor (NumberTicker).
 */
export function KeyTiles({ tiles, cols = 4 }: { tiles: Tile[]; cols?: 1 | 3 | 4 | 5 }) {
  const stacked = cols === 1;
  const bento = bentoLayout(tiles.length);
  return (
    <BentoGrid className={stacked ? 'sm:grid-cols-3 lg:grid-cols-1' : bento.grid}>
      {tiles.map(({ key, title, icon: Icon, value, level, compare, onClick }, i) => {
        const hero = !stacked && bento.hero(i);
        return (
          <MagicCard as="button" key={key} onClick={onClick} disabled={!onClick}
            className={cn('text-left flex flex-col gap-3 !p-5 disabled:cursor-default', !stacked && bento.span(i), hero && 'lg:!p-6 lg:justify-between')}>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-sm text-slate-300"><Icon size={16} aria-hidden="true" />{title}</span>
              {onClick && <ChevronRight size={16} className="text-slate-400" aria-hidden="true" />}
            </div>
            <span className={cn('font-medium tracking-tight text-slate-50', hero ? 'text-4xl xl:text-6xl' : 'text-3xl xl:text-4xl')}><TickerValue value={value} /></span>
            <span className="flex flex-col items-start gap-2">
              {level && <StatusPill level={level} />}
              {compare && <span className="text-xs text-slate-400">{compare}</span>}
            </span>
          </MagicCard>
        );
      })}
    </BentoGrid>
  );
}

export function TopicLinks({ topics, onOpen }: { topics: { id: string; label: string; level: DisplayLevel }[]; onOpen: (id: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-slate-400 mr-1">See details:</span>
      {topics.map(({ id, label, level }) => (
        <button key={id} onClick={() => onOpen(id)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] hover:border-white/25 px-3 py-1.5 transition-colors">
          {label}<StatusPill level={level} small /><ChevronRight size={14} className="text-slate-500" />
        </button>
      ))}
    </div>
  );
}
