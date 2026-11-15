// Nave e cabine (Hostile environment): casco, antena (Distance), aura do evento solar (Radiation),
// luz da cabine e 4 sensores de parede (CO2, O2, pressão, ruído) coloridos pelo nível que a API devolveu.
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { DisplayLevel } from '../../services/api';
import type { SceneState } from './sceneMapping';
import { Hotspot, TOKENS, levelColor, slowPulse, type OpenFn } from './common';
import { DISH } from './SpaceLayer';

export const HULL = { x: 250, y: 150, width: 480, height: 262, rx: 120 };
export const CABIN = { x: 300, y: 186, width: 380, height: 190, rx: 70 };

const SENSORS: { key: keyof SceneState['sensors']; label: string }[] = [
  { key: 'co2', label: 'CO₂' }, { key: 'o2', label: 'O₂' }, { key: 'pressure', label: 'psia' }, { key: 'noise', label: 'dB' },
];

function Sensor({ y, level, label, reduced }: { y: number; level: DisplayLevel; label: string; reduced: boolean }) {
  const c = levelColor(level); const off = level === 'unavailable';
  return (
    <motion.g {...slowPulse(['caution', 'warning', 'emergency'].includes(level), reduced)}>
      <rect x={606} y={y} width={52} height={28} rx={8} fill={TOKENS.bg} stroke={c} strokeWidth={2.5} strokeDasharray={off ? '4 4' : undefined} />
      <circle cx={618} cy={y + 14} r={4.5} fill={off ? 'none' : c} stroke={c} strokeWidth={1.5} />
      <text x={628} y={y + 19} fontSize={12} fill={TOKENS.text} fontFamily="Inter, ui-sans-serif, system-ui, sans-serif">{label}</text>
    </motion.g>
  );
}

export function ShipLayer({ s, reduced, onOpen, children }: { s: SceneState; reduced: boolean; onOpen: OpenFn; children?: ReactNode }) {
  const env = levelColor(s.environment.level);
  const rad = levelColor(s.radiation.level);
  const dist = levelColor(s.distance.level);
  // Luz da cabine: neutra; em Warning ou acima (ou Emergency geral) pulsa na cor do nível.
  const glow = s.environment.cabinGlow || s.emergency;
  const glowColor = s.emergency ? levelColor('emergency') : env;
  return (
    <g>
      {/* Aura no casco só com evento solar ativo; cor = nível de Radiation. */}
      {s.radiation.solarActive && (
        <motion.rect x={HULL.x - 12} y={HULL.y - 12} width={HULL.width + 24} height={HULL.height + 24} rx={HULL.rx + 12} fill="none" stroke={rad} strokeWidth={6}
          pointerEvents="none" animate={reduced ? { opacity: 0.6 } : { opacity: [0.25, 0.7, 0.25] }} transition={reduced ? undefined : { duration: 2.2, repeat: Infinity }} />
      )}
      <rect {...HULL} fill={TOKENS.card} stroke={TOKENS.border} strokeWidth={3} />

      {/* Antena (Distance). */}
      <Hotspot el={s.distance} cx={DISH.cx} cy={DISH.cy} hit={{ x: DISH.cx - 40, y: DISH.cy - 34, w: 80, h: 84 }} onOpen={onOpen}
        label={{ x: DISH.cx + 44, y: DISH.cy - 6, anchor: 'start' }}>
        <motion.g {...slowPulse(s.distance.pulse, reduced)}>
          <line x1={DISH.cx + 4} y1={DISH.cy + 6} x2={HULL.x + 84} y2={HULL.y + 6} stroke={TOKENS.text2} strokeWidth={3} strokeLinecap="round" />
          <path d={`M${DISH.cx - 16} ${DISH.cy - 6} a 16 16 0 0 0 26 18 z`} fill={TOKENS.card} stroke={dist} strokeWidth={3} strokeLinejoin="round" />
          <circle cx={DISH.cx - 6} cy={DISH.cy + 2} r={3} fill={dist} />
        </motion.g>
      </Hotspot>

      {/* Cabine (Environment). A área clicável é a parede de sensores; o astronauta fica dentro e tem cliques próprios. */}
      <rect {...CABIN} fill={TOKENS.bg} stroke={TOKENS.border} strokeWidth={2} />
      {glow && (
        <motion.rect {...CABIN} fill={glowColor} pointerEvents="none"
          animate={reduced ? { opacity: 0.22 } : { opacity: [0.1, s.emergency ? 0.42 : 0.3, 0.1] }} transition={reduced ? undefined : { duration: s.emergency ? 1.2 : 2.4, repeat: Infinity }} />
      )}
      <Hotspot el={s.environment} cx={632} cy={262} hit={{ x: 596, y: 196, w: 72, h: 160 }} onOpen={onOpen}
        label={{ x: 690, y: 392, anchor: 'end' }}>
        <rect x={598} y={200} width={68} height={152} rx={12} fill={TOKENS.card} stroke={env} strokeOpacity={0.6} strokeWidth={1.5} />
        {SENSORS.map((x, i) => <Sensor key={x.key} y={208 + i * 36} level={s.sensors[x.key]} label={x.label} reduced={reduced} />)}
      </Hotspot>
      {children}
    </g>
  );
}
