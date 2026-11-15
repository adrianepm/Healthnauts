// Orbital HUD: geometria pura (sem React, testada em Node). Só posição e desenho; nível e texto vêm de sceneMapping.
import type { SignalPulse } from './sceneMapping';

export const HUD = { size: 600, c: 300 } as const;

export type OrbitKey = 'gravity' | 'isolation' | 'environment' | 'distance' | 'radiation';

/** Uma órbita por perigo do RIDGE, de dentro para fora. `angle` = posição do nó (graus, sentido horário a partir das 3 h). */
export const ORBITS: { key: OrbitKey; label: string; r: number; angle: number }[] = [
  { key: 'gravity', label: 'Gravity', r: 92, angle: 125 },
  { key: 'isolation', label: 'Isolation', r: 135, angle: -145 },
  { key: 'environment', label: 'Environment', r: 178, angle: 20 },
  { key: 'distance', label: 'Distance', r: 221, angle: 160 },
  { key: 'radiation', label: 'Radiation', r: 264, angle: -35 },
];

/** Arco do sinal na órbita de Distance: do nó da nave (160°) até a Terra (205°), com folga nas pontas. */
export const LINK = { r: 221, ship: 160, earth: 205, from: 168, to: 197 } as const;

const rad = (deg: number) => (deg * Math.PI) / 180;
const round = (n: number) => Math.round(n * 100) / 100;

export function polar(r: number, deg: number) {
  return { x: round(HUD.c + r * Math.cos(rad(deg))), y: round(HUD.c + r * Math.sin(rad(deg))) };
}

/** Arco de a0 até a1 (graus, sentido horário). */
export function arcPath(r: number, a0: number, a1: number) {
  const p0 = polar(r, a0); const p1 = polar(r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 1 ${p1.x} ${p1.y}`;
}

/** Largura aproximada do nome da órbita (caixa alta, 10,5 px, espaçamento 1,6). */
export const labelWidth = (label: string) => label.length * 8.6;

/** Órbita inteira com uma abertura no topo, onde fica o nome (sem retângulo de fundo, funciona sobre vidro). */
export function orbitPath(r: number, label: string) {
  const half = ((labelWidth(label) / 2 + 9) / r) * (180 / Math.PI);
  return arcPath(r, -90 + half, 270 - half);
}

export interface Comet { head: { x: number; y: number }; trail: { x: number; y: number; o: number; r: number }[]; held: boolean; angle: number }

/**
 * Cometa do relatório para a Terra no arco de Distance. A posição vem de signalPulse (sentAt → expectedArrivalAt → expectedReplyAt):
 * 0 = na nave, 1 = na Terra. Ida: cauda atrás (lado da nave). Volta: cauda do lado da Terra. QUEUED: parado na nave, sem cauda.
 */
export function cometGeometry(signal: SignalPulse | null): Comet | null {
  if (!signal) return null;
  const p = Math.min(1, Math.max(0, signal.position));
  const angle = LINK.from + (LINK.to - LINK.from) * p;
  const head = polar(LINK.r, angle);
  if (signal.phase === 'held') return { head, trail: [], held: true, angle };
  const dir = signal.phase === 'outbound' ? -1 : 1;
  const trail = [] as Comet['trail'];
  for (let k = 1; k <= 7; k++) {
    const a = angle + dir * k * 1.9;
    if (a < LINK.from - 0.01 || a > LINK.to + 0.01) break;
    trail.push({ ...polar(LINK.r, a), o: round(0.75 * (1 - k / 8)), r: round(2.6 * (1 - k / 10)) });
  }
  return { head, trail, held: false, angle };
}
