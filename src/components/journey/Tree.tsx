// Árvore da saúde (SVG próprio). 6 estágios pelo XP total (src/lib/journey.ts). Copa esquerda = Mental, direita = Físico.
// Folhas verdes quando a área está Normal ou Advisory; levemente amareladas em Caution ou acima; nunca vermelhas, nunca
// murcham. Flores (lado mental) e frutos (lado físico) das missões semanais ficam desenhados. Ao concluir uma tarefa,
// a copa daquele lado brilha uma vez (desligado com prefers-reduced-motion). A árvore não decide nível: recebe o da API.
import { motion, useReducedMotion } from 'framer-motion';
import type { DisplayLevel } from '../../services/api';
import { cn } from '../../lib/utils';

/** Cores dos lados: violeta (Mental) e azul-esverdeado (Físico), fora das cores de nível. */
export const SIDE = { mental: '#A78BFA', physical: '#2DD4BF' } as const;

const LEAF = { healthy: ['#4ADE80', '#2F9E5B', '#86EFAC'], tired: ['#C2C46A', '#8F9446', '#DCDD95'] } as const;
const BARK = '#8A6A4F'; const BARK_DARK = '#6B503B';
/** Caution ou acima: folhas levemente amareladas. Unavailable ou sem dado: verdes (nunca pune falta de dado). */
const tired = (l: DisplayLevel | null | undefined) => l === 'caution' || l === 'warning' || l === 'emergency';

type Blob = [number, number, number]; // cx, cy, r
/** Copa de um lado: aglomerado de círculos, por estágio (2 = muda, 3 = jovem, 4 e 5 = adulta). */
function canopy(stage: number, side: -1 | 1): Blob[] {
  const x = (dx: number) => 120 + side * dx;
  if (stage === 2) return [[x(18), 146, 18], [x(28), 136, 13], [x(10), 132, 12]];
  if (stage === 3) return [[x(30), 118, 26], [x(46), 104, 19], [x(18), 96, 18], [x(48), 128, 16]];
  return [[x(38), 100, 32], [x(58), 82, 24], [x(22), 72, 24], [x(64), 112, 22], [x(14), 104, 20], [x(40), 64, 18]];
}

function Canopy({ blobs, level }: { blobs: Blob[]; level: DisplayLevel | null | undefined }) {
  const [fill, shade, light] = tired(level) ? LEAF.tired : LEAF.healthy;
  return (
    <g>
      {blobs.map(([cx, cy, r], i) => <circle key={`s${i}`} cx={cx} cy={cy + r * 0.18} r={r} fill={shade} />)}
      {blobs.map(([cx, cy, r], i) => <circle key={`f${i}`} cx={cx} cy={cy} r={r * 0.94} fill={fill} />)}
      {blobs.map(([cx, cy, r], i) => <circle key={`l${i}`} cx={cx - r * 0.3} cy={cy - r * 0.35} r={r * 0.32} fill={light} opacity={0.55} />)}
    </g>
  );
}

/** Pontos para flores e frutos sobre a copa (determinísticos). */
const spots = (blobs: Blob[]) => blobs.flatMap(([cx, cy, r], i) => [[cx + r * 0.35 * (i % 2 ? 1 : -1), cy + r * 0.25], [cx - r * 0.1, cy - r * 0.45]] as [number, number][]);

function Flower({ x, y, color = '#F5F3FF', center = SIDE.mental }: { x: number; y: number; color?: string; center?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx={0} cy={-3.2} rx={2.4} ry={3.4} fill={color} transform={`rotate(${a})`} />)}
      <circle r={1.9} fill={center} />
    </g>
  );
}
function Fruit({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 -6 q1 -3 3 -4" stroke={BARK_DARK} strokeWidth={1.2} fill="none" />
      <circle r={6} fill={SIDE.physical} /><circle cx={-1.8} cy={-1.8} r={1.7} fill="#CCFBF1" opacity={0.8} />
    </g>
  );
}

export function HealthTree({ stage, mental, physical, flowers, fruits, glow, label }: {
  stage: number; mental: DisplayLevel | null; physical: DisplayLevel | null; flowers: number; fruits: number;
  /** Contadores que sobem quando uma tarefa daquele lado é concluída: a copa brilha uma vez. */
  glow: { mental: number; physical: number }; label: string;
}) {
  const reduced = useReducedMotion();
  const left = stage >= 2 ? canopy(stage, -1) : []; const right = stage >= 2 ? canopy(stage, 1) : [];
  const trunkW = [0, 0, 5, 9, 13, 14][stage]; const trunkTop = [0, 0, 150, 120, 92, 92][stage];
  const aura = (blobs: Blob[]) => { if (!blobs.length) return null; const xs = blobs.map((b) => b[0]); const ys = blobs.map((b) => b[1]); return { cx: (Math.min(...xs) + Math.max(...xs)) / 2, cy: (Math.min(...ys) + Math.max(...ys)) / 2, r: stage >= 4 ? 70 : stage === 3 ? 48 : 30 }; };
  const glowCircle = (side: 'mental' | 'physical', blobs: Blob[]) => {
    const a = aura(blobs); if (!a || reduced) return null;
    return <motion.circle key={`${side}-${glow[side]}`} cx={a.cx} cy={a.cy} r={a.r} fill={SIDE[side]}
      initial={{ opacity: glow[side] ? 0.5 : 0 }} animate={{ opacity: 0 }} transition={{ duration: 1.1, ease: 'easeOut' }} />;
  };
  return (
    <figure className="flex flex-col items-center">
      <svg viewBox={stage <= 1 ? '30 110 180 120' : stage === 2 ? '15 70 210 160' : '0 0 240 240'} className={cn('w-full h-auto', stage <= 1 ? 'max-w-[260px]' : 'max-w-[320px]')} role="img" aria-label={`Health tree: ${label}. Left canopy mental, right canopy physical.`}>
        {/* Halo fixo de cada lado: identifica Mental (violeta) e Físico (azul-esverdeado) */}
        {stage >= 2 && (<>
          <circle {...aura(left)!} fill={SIDE.mental} opacity={0.08} />
          <circle {...aura(right)!} fill={SIDE.physical} opacity={0.08} />
        </>)}
        {glowCircle('mental', left)}{glowCircle('physical', right)}
        {/* Chão */}
        <ellipse cx={120} cy={216} rx={84} ry={9} fill="#1B2030" />
        <path d="M76 216 q44 -14 88 0 z" fill="#3A2E25" />
        {stage === 0 && (<g>
          <ellipse cx={120} cy={206} rx={9} ry={6.5} fill={BARK} /><ellipse cx={117} cy={204} rx={3} ry={2} fill="#B08D6C" />
        </g>)}
        {stage === 1 && (<g>
          <path d="M120 212 C120 196 118 186 121 172" stroke="#3FA36A" strokeWidth={3} fill="none" strokeLinecap="round" />
          <path d="M121 180 C108 176 100 166 102 158 C112 158 120 168 121 180 z" fill={tired(mental) ? LEAF.tired[0] : LEAF.healthy[0]} />
          <path d="M121 176 C134 172 142 162 140 154 C130 154 122 164 121 176 z" fill={tired(physical) ? LEAF.tired[0] : LEAF.healthy[0]} />
        </g>)}
        {stage >= 2 && (<g>
          {/* Tronco e galhos */}
          <path d={`M${120 - trunkW / 2} 214 C${120 - trunkW / 2} 190 ${120 - trunkW / 3} 160 ${120 - 2} ${trunkTop} L${120 + 2} ${trunkTop} C${120 + trunkW / 3} 160 ${120 + trunkW / 2} 190 ${120 + trunkW / 2} 214 z`} fill={BARK} />
          {stage >= 3 && <path d={`M118 ${trunkTop + 40} C108 ${trunkTop + 26} 100 ${trunkTop + 14} ${stage >= 4 ? 84 : 96} ${trunkTop + (stage >= 4 ? 2 : 4)}`} stroke={BARK} strokeWidth={stage >= 4 ? 6 : 4} fill="none" strokeLinecap="round" />}
          {stage >= 3 && <path d={`M122 ${trunkTop + 34} C132 ${trunkTop + 22} 140 ${trunkTop + 12} ${stage >= 4 ? 156 : 144} ${trunkTop + (stage >= 4 ? 2 : 4)}`} stroke={BARK} strokeWidth={stage >= 4 ? 6 : 4} fill="none" strokeLinecap="round" />}
          <path d={`M${120 - trunkW / 2 + 2} 212 C${120 - 1} 190 ${120 - 1} 170 ${120} ${trunkTop + 20}`} stroke={BARK_DARK} strokeWidth={1.2} fill="none" opacity={0.6} />
          <Canopy blobs={left} level={mental} />
          <Canopy blobs={right} level={physical} />
          {stage === 5 && [...spots(left).slice(0, 5), ...spots(right).slice(0, 5)].map(([x, y], i) => <Flower key={`b${i}`} x={x + 4} y={y + 6} color="#FFF7ED" center="#F5D0A9" />)}
          {spots(left).slice(5, 5 + Math.min(flowers, 7)).concat(spots(left).slice(0, Math.max(0, Math.min(flowers, 12) - 7))).map(([x, y], i) => <Flower key={`f${i}`} x={x - 3} y={y - 4} />)}
          {spots(right).slice(5, 5 + Math.min(fruits, 7)).concat(spots(right).slice(0, Math.max(0, Math.min(fruits, 12) - 7))).map(([x, y], i) => <Fruit key={`r${i}`} x={x + 3} y={y - 2} />)}
        </g>)}
      </svg>
      <figcaption className="mt-1 text-sm text-slate-200">{label}</figcaption>
    </figure>
  );
}
