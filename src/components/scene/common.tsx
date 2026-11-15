// Peças comuns do Orbital HUD: cores (espelho dos tokens de src/index.css) e o elemento clicável acessível.
import type { ReactNode, KeyboardEvent } from 'react';
import { LEVEL_UI } from '../../lib/levels';
import type { DisplayLevel } from '../../services/api';

/** Espelho dos tokens de src/index.css (SVG não lê var() em atributo de apresentação). */
export const TOKENS = { bg: '#0B1220', card: '#121B2E', border: '#24324D', text: '#E6EDF7', text2: '#A7B4C8', brand: '#A78BFA', brandSoft: '#C4B5FD', band: '#5B7FA6' };

export const levelColor = (level: DisplayLevel) => LEVEL_UI[level]?.color ?? LEVEL_UI.unavailable.color;

/** Caution ou acima: brilho e pulsação lenta (pedido de interface, não regra de saúde). */
export const isAlert = (level: DisplayLevel) => level === 'caution' || level === 'warning' || level === 'emergency';

/**
 * Elemento clicável do HUD: focável por teclado (Tab), abre com Enter ou Espaço, aria-label com área, nível e mensagem da API.
 * Hover e foco mostram o tooltip (onPeek); a área de toque é um círculo de 44 px.
 */
export function HudLink({ id, x, y, label, onOpen, onPeek, describedBy, children, hit = 22 }: {
  id: string; x: number; y: number; label: string; onOpen: () => void; onPeek: (id: string | null) => void;
  describedBy?: string; children: ReactNode; hit?: number;
}) {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); }
    if (e.key === 'Escape') onPeek(null);
  };
  return (
    <g role="link" tabIndex={0} aria-label={label} aria-describedby={describedBy} className="hud-hot" style={{ cursor: 'pointer' }}
      onClick={onOpen} onKeyDown={onKey} onMouseEnter={() => onPeek(id)} onMouseLeave={() => onPeek(null)} onFocus={() => onPeek(id)} onBlur={() => onPeek(null)}>
      <circle cx={x} cy={y} r={hit} fill="transparent" pointerEvents="all" />
      {children}
      <circle className="hud-focus" cx={x} cy={y} r={hit > 30 ? hit - 4 : 18} fill="none" stroke={TOKENS.brandSoft} strokeWidth={1.5} />
    </g>
  );
}
