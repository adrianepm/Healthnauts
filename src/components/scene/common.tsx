// Peças comuns da RIDGE Scene: cores (espelho dos tokens de src/index.css), ponto clicável acessível e etiqueta de nível.
import type { ReactNode, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { LEVEL_UI } from '../../lib/levels';
import type { DisplayLevel } from '../../services/api';
import { ariaLabel, type ElementState } from './sceneMapping';

/** Espelho dos tokens de src/index.css (SVG não lê var() em atributo de apresentação). */
export const TOKENS = { bg: '#0B1220', card: '#121B2E', border: '#24324D', text: '#E6EDF7', text2: '#A7B4C8', brand: '#A78BFA', brandSoft: '#C4B5FD', band: '#5B7FA6' };

export const VIEW = { w: 800, h: 460 };

export const levelColor = (level: DisplayLevel) => LEVEL_UI[level]?.color ?? LEVEL_UI.unavailable.color;

export type OpenFn = (el: ElementState, cx: number, cy: number) => void;

/** Pulso lento para Caution ou acima; nada se mexe com movimento reduzido. */
export const slowPulse = (on: boolean, reduced: boolean) =>
  on && !reduced ? { animate: { opacity: [1, 0.45, 1] }, transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' as const } } : { animate: { opacity: 1 } };

/**
 * Elemento clicável da cena: focável por teclado (Tab), abre com Enter ou Espaço, aria-label com área e nível.
 * `hit` é a área de toque (transparente), maior que o desenho.
 */
export function Hotspot({ el, cx, cy, hit, onOpen, children, label }: {
  el: ElementState; cx: number; cy: number; hit: { x: number; y: number; w: number; h: number }; onOpen: OpenFn; children: ReactNode;
  label?: { x: number; y: number; anchor?: 'start' | 'middle' | 'end' };
}) {
  const ui = LEVEL_UI[el.level];
  const open = () => onOpen(el, cx, cy);
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } };
  return (
    <g role="link" tabIndex={0} aria-label={ariaLabel(el, ui.label)} onClick={open} onKeyDown={onKey} className="scene-hot" style={{ cursor: 'pointer' }}>
      <title>{`${el.area}: ${ui.label}`}</title>
      <rect x={hit.x} y={hit.y} width={hit.w} height={hit.h} rx={14} fill="transparent" pointerEvents="all" />
      {children}
      <rect className="scene-focus" x={hit.x} y={hit.y} width={hit.w} height={hit.h} rx={14} fill="none" stroke={TOKENS.brandSoft} strokeWidth={3} />
      {label && <LevelTag level={el.level} name={el.area} {...label} />}
    </g>
  );
}

/** Etiqueta: ícone do nível + nome da área (e o nome do nível quando não é Normal). Nunca só cor. */
export function LevelTag({ level, name, x, y, anchor = 'middle' }: { level: DisplayLevel; name: string; x: number; y: number; anchor?: 'start' | 'middle' | 'end' }) {
  const ui = LEVEL_UI[level]; const Icon = ui.Icon;
  const text = level === 'normal' ? name : `${name} · ${ui.label}`;
  const w = 26 + text.length * 7.4; const h = 24;
  const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  return (
    <g aria-hidden="true" pointerEvents="none">
      <rect x={left} y={y - h / 2} width={w} height={h} rx={12} fill={TOKENS.bg} fillOpacity={0.88} stroke={ui.color} strokeOpacity={0.7} />
      <Icon x={left + 6} y={y - 7} width={14} height={14} color={ui.color} strokeWidth={2.4} />
      <text x={left + 24} y={y + 4.5} fontSize={13} fill={ui.text} fontFamily="Inter, ui-sans-serif, system-ui, sans-serif">{text}</text>
    </g>
  );
}

export { motion };
