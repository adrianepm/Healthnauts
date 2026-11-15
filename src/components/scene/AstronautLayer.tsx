// Astronauta (Isolation e sinais vitais): figura simples e estilizada dentro da cabine.
// Cérebro = nível de Isolation; coração bate a cada 60/FC s com a FC ao vivo; peito expande na frequência respiratória;
// pernas e olhos = nível de Gravity; gradiente mostra o deslocamento de fluidos do seletor (só visual).
import { motion } from 'framer-motion';
import type { SceneState, GravityView } from './sceneMapping';
import { GRAVITY_VIEWS } from './sceneMapping';
import { Hotspot, TOKENS, levelColor, slowPulse, type OpenFn } from './common';

const CX = 520;
const HEAD = { cy: 228, r: 22 };
const TORSO = { x: CX - 26, y: 254, w: 52, h: 64 };
const LEGS = { y: 314, h: 52 };

function Body({ fill, stroke }: { fill: string; stroke?: string }) {
  const sw = stroke ? 2 : 0;
  return (
    <g fill={fill} stroke={stroke} strokeWidth={sw}>
      <circle cx={CX} cy={HEAD.cy} r={HEAD.r} />
      <rect x={TORSO.x - 16} y={TORSO.y + 6} width={14} height={46} rx={7} transform={`rotate(14 ${TORSO.x - 9} ${TORSO.y + 6})`} />
      <rect x={TORSO.x + TORSO.w + 2} y={TORSO.y + 6} width={14} height={46} rx={7} transform={`rotate(-14 ${TORSO.x + TORSO.w + 9} ${TORSO.y + 6})`} />
      <rect x={CX - 21} y={LEGS.y} width={18} height={LEGS.h} rx={8} />
      <rect x={CX + 3} y={LEGS.y} width={18} height={LEGS.h} rx={8} />
    </g>
  );
}

export function AstronautLayer({ s, view, reduced, onOpen }: { s: SceneState; view: GravityView; reduced: boolean; onOpen: OpenFn }) {
  const share = GRAVITY_VIEWS[view].headShare;
  const vit = levelColor(s.vitals.level); const iso = levelColor(s.isolation.level); const grav = levelColor(s.gravity.level);
  const beat = s.vitals.beatSeconds; const breath = s.vitals.breathSeconds;
  const floating = view === 'MICRO' && !reduced;
  return (
    <motion.g animate={floating ? { y: [0, -4, 0] } : { y: 0 }} transition={floating ? { duration: 6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.6 }}>
      <defs>
        {/* Deslocamento de fluidos: mais concentrado na cabeça em microgravidade, nas pernas na Terra. */}
        <linearGradient id="fluid-shift" gradientUnits="userSpaceOnUse" x1={0} y1={HEAD.cy - HEAD.r} x2={0} y2={LEGS.y + LEGS.h}>
          <motion.stop offset="0" stopColor={TOKENS.band} initial={false} animate={{ stopOpacity: share }} transition={{ duration: reduced ? 0 : 0.8 }} />
          <motion.stop offset="1" stopColor={TOKENS.band} initial={false} animate={{ stopOpacity: 1 - share }} transition={{ duration: reduced ? 0 : 0.8 }} />
        </linearGradient>
      </defs>
      <Body fill={TOKENS.card} stroke={TOKENS.text2} />
      <Body fill="url(#fluid-shift)" />

      {/* Gravity: pernas e olhos. */}
      <Hotspot el={s.gravity} cx={CX} cy={LEGS.y + 26} hit={{ x: CX - 40, y: LEGS.y - 2, w: 80, h: LEGS.h + 10 }} onOpen={onOpen}
        label={{ x: CX - 46, y: LEGS.y + 30, anchor: 'end' }}>
        <motion.g {...slowPulse(s.gravity.pulse, reduced)}>
          <rect x={CX - 21} y={LEGS.y} width={18} height={LEGS.h} rx={8} fill="none" stroke={grav} strokeWidth={3} />
          <rect x={CX + 3} y={LEGS.y} width={18} height={LEGS.h} rx={8} fill="none" stroke={grav} strokeWidth={3} />
        </motion.g>
      </Hotspot>
      <circle cx={CX - 8} cy={HEAD.cy + 4} r={3} fill={grav} pointerEvents="none" />
      <circle cx={CX + 8} cy={HEAD.cy + 4} r={3} fill={grav} pointerEvents="none" />

      {/* Sinais vitais: peito (respiração) e coração (FC ao vivo). Sem dado avaliado: parado e cinza. */}
      <Hotspot el={s.vitals} cx={CX} cy={TORSO.y + 30} hit={{ x: CX - 40, y: TORSO.y - 2, w: 80, h: TORSO.h }} onOpen={onOpen}
        label={{ x: CX - 46, y: TORSO.y + 26, anchor: 'end' }}>
        <motion.rect x={TORSO.x} y={TORSO.y} width={TORSO.w} height={TORSO.h} rx={16} fill={TOKENS.card} stroke={vit} strokeWidth={3}
          style={{ originX: 0.5, originY: 0.5 }}
          animate={breath && !reduced ? { scaleX: [1, 1.07, 1] } : { scaleX: 1 }}
          transition={breath && !reduced ? { duration: breath, repeat: Infinity, ease: 'easeInOut' } : undefined} />
        <motion.rect x={TORSO.x} y={TORSO.y} width={TORSO.w} height={TORSO.h} rx={16} fill="url(#fluid-shift)" pointerEvents="none" />
        <motion.g {...slowPulse(s.vitals.pulse && !beat, reduced)}>
          <motion.path d={`M${CX + 4} ${TORSO.y + 22} c -6 -8 -18 -2 -12 8 l 12 12 l 12 -12 c 6 -10 -6 -16 -12 -8 z`}
            fill={beat ? vit : 'none'} stroke={vit} strokeWidth={2} style={{ originX: 0.5, originY: 0.5 }}
            animate={beat && !reduced ? { scale: [1, 1.28, 1] } : { scale: 1 }}
            transition={beat && !reduced ? { duration: beat, repeat: Infinity, ease: 'easeOut' } : undefined} />
        </motion.g>
      </Hotspot>

      {/* Isolation: cérebro. */}
      <Hotspot el={s.isolation} cx={CX} cy={HEAD.cy - 8} hit={{ x: CX - 36, y: HEAD.cy - 36, w: 72, h: 52 }} onOpen={onOpen}
        label={{ x: CX - 46, y: HEAD.cy - 12, anchor: 'end' }}>
        <motion.g {...slowPulse(s.isolation.pulse, reduced)}>
          <path d={`M${CX - 14} ${HEAD.cy - 6} c -2 -12 8 -18 14 -14 c 6 -4 16 2 14 14 z`} fill={iso} fillOpacity={0.35} stroke={iso} strokeWidth={2.5} strokeLinejoin="round" />
          <path d={`M${CX} ${HEAD.cy - 19} v 12`} stroke={iso} strokeWidth={2} />
        </motion.g>
      </Hotspot>
    </motion.g>
  );
}
