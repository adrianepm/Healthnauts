// RIDGE Scene: os 5 perigos da NASA (Radiation, Isolation, Distance, Gravity, Hostile environment) numa só cena SVG,
// que também é a navegação. Estado de cada elemento = sceneMapping (nível e mensagem da API). Sem abertura: abre no estado atual.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeartPulse, ListChecks, Radio } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useSim } from '../DemoPanel';
import { useReminders } from '../Notifications';
import { KeyTiles } from '../lean/Home';
import { LEVEL_UI } from '../../lib/levels';
import { fmtDuration } from '../../lib/format';
import type { DisplayLevel } from '../../services/api';
import { sceneState, type ElementState, type GravityView } from './sceneMapping';
import { TOKENS, VIEW } from './common';
import { SpaceLayer } from './SpaceLayer';
import { ShipLayer } from './ShipLayer';
import { AstronautLayer } from './AstronautLayer';
import { GravityControl } from './GravityControl';

const FULL = `0 0 ${VIEW.w} ${VIEW.h}`;
const ZOOM = 2.6; // ~400 ms de aproximação em direção ao elemento antes de abrir o detalhe

function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}

/** Legenda compacta: ícone + nome de cada nível (nunca só cor). */
export function LevelLegend() {
  const order: DisplayLevel[] = ['normal', 'advisory', 'caution', 'warning', 'emergency', 'unavailable'];
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs" aria-label="Level legend">
      {order.map((l) => { const ui = LEVEL_UI[l]; const Icon = ui.Icon; return (
        <li key={l} className="inline-flex items-center gap-1.5"><Icon size={15} style={{ color: ui.color }} aria-hidden="true" /><span style={{ color: ui.text }}>{ui.label}</span></li>
      ); })}
    </ul>
  );
}

export function RidgeScene({ reduced }: { reduced: boolean }) {
  const overview = useStore((s) => s.overview);
  const reports = useStore((s) => s.ground?.reports);
  const sim = useSim();
  const now = useNow();
  const nav = useNavigate();
  const reminders = useReminders();
  const [view, setView] = useState<GravityView>('MICRO');
  const [zoom, setZoom] = useState<{ box: string; el: ElementState } | null>(null);

  const m = sim.lastVitals?.measurements;
  const s = sceneState({ overview, reports, now,
    live: m ? { heartRate: Number(m.heart_rate.value), respiratoryRate: Number(m.respiratory_rate.value) } : null });

  const go = (el: ElementState) => nav(el.route, el.target === 'vitals' ? { state: { focus: 'vitals' } } : undefined);
  const open = (el: ElementState, cx: number, cy: number) => {
    if (zoom) return;
    if (reduced) { go(el); return; }
    const w = VIEW.w / ZOOM; const h = VIEW.h / ZOOM;
    setZoom({ el, box: `${cx - w / 2} ${cy - h / 2} ${w} ${h}` });
    // Navega ao fim do zoom (400 ms). Temporizador em vez de onAnimationComplete, que não dispara de novo ao voltar à Overview.
    window.setTimeout(() => go(el), 400);
  };

  const link = overview?.link;
  const done = reminders.filter((r) => r.done).length;
  const pending = reminders.find((r) => !r.done);

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-5 items-start">
      <div className="space-y-3">
        <div className="card !p-0 overflow-hidden">
          <motion.svg viewBox={FULL} initial={false} animate={{ viewBox: zoom?.box ?? FULL }}
            transition={{ duration: zoom ? 0.4 : 0, ease: 'easeInOut' }}
            className="block w-full h-auto" role="group"
            aria-label={`RIDGE scene. Overall: ${LEVEL_UI[s.overall].label}. Use Tab to move between Radiation, Earth, the antenna, the cabin and the astronaut; press Enter to open details.`}>
            <SpaceLayer s={s} reduced={reduced} onOpen={open} />
            {/* Emergency: a cena escurece e só a cabine fica na cor do nível. */}
            {s.emergency && <rect width={VIEW.w} height={VIEW.h} fill="#000" opacity={0.5} pointerEvents="none" />}
            <ShipLayer s={s} reduced={reduced} onOpen={open}>
              <AstronautLayer s={s} view={view} reduced={reduced} onOpen={open} />
            </ShipLayer>
            <text x={VIEW.w - 14} y={VIEW.h - 14} textAnchor="end" fontSize={12} fill={TOKENS.text2} aria-hidden="true">Simulated data · stylised illustration</text>
          </motion.svg>
        </div>
        <GravityControl view={view} onChange={setView} />
      </div>

      <aside className="space-y-4" aria-label="Key indicators">
        <KeyTiles cols={1} tiles={[
          { key: 'hr', title: 'Heart rate', icon: HeartPulse, value: s.vitals.heartRate ? `${s.vitals.heartRate} bpm` : '—', level: s.vitals.level,
            onClick: () => go(s.vitals) },
          { key: 'link', title: 'Earth link', icon: Radio, value: !link || link.status === 'unknown' ? '—' : link.status === 'unavailable' ? 'No link' : fmtDuration(link.oneWaySeconds),
            level: s.distance.level, compare: link && link.status !== 'unavailable' && link.status !== 'unknown' ? 'one-way delay' : undefined, onClick: () => go(s.distance) },
          { key: 'routine', title: "Today's routine", icon: ListChecks, value: `${done} of ${reminders.length}`, compare: pending ? `Next: ${pending.title}` : 'All done today',
            onClick: pending ? pending.go : undefined },
        ]} />
        <div className="card !p-4"><LevelLegend /></div>
      </aside>
    </div>
  );
}
