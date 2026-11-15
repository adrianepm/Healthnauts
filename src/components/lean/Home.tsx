// Tela inicial enxuta (do protótipo): resumo do dia, poucos indicadores-chave e atalhos para os tópicos.
// Genéricos: cada tela passa os dados que a API devolveu. Nada aqui decide nível.
import { ChevronRight, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { LEVEL_UI } from '../../lib/levels';
import type { DisplayLevel } from '../../services/api';
import { LevelDot, StatusPill } from '../ui';

export interface AlsoItem { label: string; level: DisplayLevel; message: string }

export function TodayHero({ level, message, label = 'Today', sub, also = [], action }: {
  level: DisplayLevel; message: string; label?: string; sub?: string; also?: AlsoItem[]; action?: ReactNode;
}) {
  const ui = LEVEL_UI[level]; const Icon = ui.Icon;
  const color = level === 'normal' ? LEVEL_UI.normal.color : ui.color;
  return (
    <section className="card relative overflow-hidden !p-6" style={{ borderColor: color + '55' }}>
      <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: color }} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <Icon size={18} style={{ color }} />
            <span className="text-sm font-semibold" style={{ color }}>{level === 'normal' ? `${label}: within expected` : `${label}: ${ui.label}`}</span>
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

export function KeyTiles({ tiles, cols = 4 }: { tiles: Tile[]; cols?: 3 | 4 | 5 }) {
  const grid = cols === 5 ? 'lg:grid-cols-5' : cols === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4';
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${grid} gap-4`}>
      {tiles.map(({ key, title, icon: Icon, value, level, compare, onClick }) => (
        <button key={key} onClick={onClick} disabled={!onClick}
          className="card text-left hover:border-slate-500 transition-colors flex flex-col gap-3 !p-5 disabled:hover:border-space-line">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-sm text-slate-300"><Icon size={16} />{title}</span>
            {onClick && <ChevronRight size={16} className="text-slate-500" />}
          </div>
          <span className="text-3xl xl:text-4xl font-semibold tracking-tight">{value}</span>
          {level && <StatusPill level={level} />}
          {compare && <span className="text-xs text-slate-400">{compare}</span>}
        </button>
      ))}
    </div>
  );
}

export function TopicLinks({ topics, onOpen }: { topics: { id: string; label: string; level: DisplayLevel }[]; onOpen: (id: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-slate-400 mr-1">See details:</span>
      {topics.map(({ id, label, level }) => (
        <button key={id} onClick={() => onOpen(id)} className="inline-flex items-center gap-2 rounded-full border border-space-line hover:border-slate-500 px-3 py-1.5">
          <LevelDot level={level} />{label}<ChevronRight size={14} className="text-slate-500" />
        </button>
      ))}
    </div>
  );
}
