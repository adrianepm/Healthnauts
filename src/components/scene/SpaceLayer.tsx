// Espaço (Radiation e Distance): estrelas em 3 camadas com deslocamento lento, a fonte de radiação,
// partículas só com evento solar ativo (dito pela API), e a Terra ligada à nave por uma linha de sinal.
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { SceneState } from './sceneMapping';
import { Hotspot, TOKENS, VIEW, levelColor, slowPulse, type OpenFn } from './common';

// Geometria compartilhada com ShipLayer.
export const EARTH = { cx: 86, cy: 84, r: 24 };
export const DISH = { cx: 300, cy: 108 };
export const SUN = { cx: 728, cy: 66, r: 24 };

/** Estrelas determinísticas (sempre as mesmas), no máximo 78 no total. */
function stars(count: number, seed: number) {
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  return Array.from({ length: count }, () => ({ x: rnd() * VIEW.w, y: rnd() * VIEW.h, r: 0.6 + rnd() * 0.9 }));
}
const LAYERS = [
  { stars: stars(34, 11), seconds: 240, opacity: 0.35 },
  { stars: stars(26, 23), seconds: 160, opacity: 0.55 },
  { stars: stars(18, 37), seconds: 100, opacity: 0.85 },
];

function StarLayer({ layer, reduced, dim }: { layer: (typeof LAYERS)[number]; reduced: boolean; dim: boolean }) {
  // A camada é desenhada duas vezes, lado a lado, para o deslocamento contínuo não ter emenda.
  const op = layer.opacity * (dim ? 0.4 : 1);
  const dots = layer.stars.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={TOKENS.text} fillOpacity={op} />);
  return (
    <motion.g animate={reduced ? { x: 0 } : { x: [0, -VIEW.w] }}
      transition={reduced ? undefined : { duration: layer.seconds, repeat: Infinity, ease: 'linear' }}>
      {dots}<g transform={`translate(${VIEW.w} 0)`}>{dots}</g>
    </motion.g>
  );
}

export function SpaceLayer({ s, reduced, onOpen }: { s: SceneState; reduced: boolean; onOpen: OpenFn }) {
  const rad = levelColor(s.radiation.level);
  const particles = useMemo(() => Array.from({ length: 10 }, (_, i) => ({ dy: (i % 5) * 16 - 32, delay: i * 0.35 })), []);
  const pulse = s.earth.signal;
  const px = DISH.cx + (EARTH.cx - DISH.cx) * (pulse?.position ?? 0);
  const py = DISH.cy + (EARTH.cy - DISH.cy) * (pulse?.position ?? 0);
  const noLink = s.earth.linkStatus === 'unavailable';
  return (
    <g>
      <rect width={VIEW.w} height={VIEW.h} fill={TOKENS.bg} />
      {LAYERS.map((l, i) => <StarLayer key={i} layer={l} reduced={reduced} dim={s.emergency} />)}

      {/* Radiation: fonte estilizada; partículas só quando a API indica evento solar ativo. */}
      <Hotspot el={s.radiation} cx={SUN.cx} cy={SUN.cy} hit={{ x: SUN.cx - 46, y: SUN.cy - 46, w: 92, h: 92 }} onOpen={onOpen}
        label={{ x: VIEW.w - 8, y: SUN.cy + 52, anchor: 'end' }}>
        <motion.g {...slowPulse(s.radiation.pulse, reduced)}>
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4;
            return <line key={i} x1={SUN.cx + Math.cos(a) * (SUN.r + 5)} y1={SUN.cy + Math.sin(a) * (SUN.r + 5)} x2={SUN.cx + Math.cos(a) * (SUN.r + 13)} y2={SUN.cy + Math.sin(a) * (SUN.r + 13)}
              stroke={rad} strokeWidth={3} strokeLinecap="round" />;
          })}
          <circle cx={SUN.cx} cy={SUN.cy} r={SUN.r} fill={TOKENS.card} stroke={rad} strokeWidth={4} />
          <circle cx={SUN.cx} cy={SUN.cy} r={SUN.r - 10} fill={rad} opacity={0.35} />
        </motion.g>
      </Hotspot>
      {s.radiation.solarActive && particles.map((p, i) => (
        <motion.line key={i} x1={0} y1={0} x2={-10} y2={6} stroke={rad} strokeWidth={2.5} strokeLinecap="round" pointerEvents="none"
          initial={{ x: SUN.cx - 20, y: SUN.cy + 20 + p.dy, opacity: 0 }}
          animate={reduced ? { x: 640, y: 168 + p.dy, opacity: 1 } : { x: [SUN.cx - 20, 640], y: [SUN.cy + 20 + p.dy, 168 + p.dy], opacity: [0, 1, 0] }}
          transition={reduced ? undefined : { duration: 1.8, repeat: Infinity, delay: p.delay, ease: 'easeIn' }} />
      ))}

      {/* Distance: linha de sinal nave ↔ Terra. Tracejada e apagada sem link. */}
      <line x1={DISH.cx} y1={DISH.cy} x2={EARTH.cx} y2={EARTH.cy} stroke={TOKENS.text2} strokeOpacity={noLink ? 0.35 : 0.6}
        strokeWidth={2} strokeDasharray={noLink ? '3 7' : '6 6'} />
      {pulse && (
        <motion.circle r={7} fill={TOKENS.text} stroke={TOKENS.bg} strokeWidth={2} pointerEvents="none"
          initial={false} animate={{ cx: px, cy: py }} transition={{ duration: reduced ? 0 : 1, ease: 'linear' }} />
      )}
      {s.earth.text && (noLink || pulse?.phase === 'held') && (
        <foreignObject x={DISH.cx - 150} y={DISH.cy - 92} width={250} height={64} pointerEvents="none">
          <p style={{ margin: 0, fontSize: 13, lineHeight: '17px', color: TOKENS.text, background: 'rgba(11,18,32,0.88)', border: `1px solid ${TOKENS.border}`, borderRadius: 10, padding: '5px 8px' }}>
            {s.earth.text}
          </p>
        </foreignObject>
      )}

      {/* Terra pequena ao longe (ilustração neutra); o anel mostra o nível dos relatórios. Clique abre Ground Control. */}
      <Hotspot el={s.earth} cx={EARTH.cx} cy={EARTH.cy} hit={{ x: EARTH.cx - 44, y: EARTH.cy - 44, w: 88, h: 88 }} onOpen={onOpen}
        label={{ x: 16, y: EARTH.cy + 52, anchor: 'start' }}>
        <circle cx={EARTH.cx} cy={EARTH.cy} r={EARTH.r + 6} fill="none" stroke={levelColor(s.earth.level)} strokeWidth={2} strokeOpacity={0.8} />
        <circle cx={EARTH.cx} cy={EARTH.cy} r={EARTH.r} fill={TOKENS.band} />
        <path d={`M${EARTH.cx - 14} ${EARTH.cy - 8} q 8 -10 16 -2 q 6 6 -2 12 q -8 4 -14 -2 z M${EARTH.cx + 4} ${EARTH.cy + 10} q 8 -4 12 2 q -4 8 -12 4 z`} fill={TOKENS.border} />
      </Hotspot>
    </g>
  );
}
