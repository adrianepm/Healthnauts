// Orbital HUD: os 5 perigos do RIDGE (Radiation, Isolation, Distance, Gravity, Hostile environment) como órbitas finas
// em volta do astronauta, mostrado como dado vivo (ECG no ritmo da FC do sensor ao vivo). Visualização abstrata, sem ilustração.
// Estado de cada elemento = sceneMapping (nível e mensagem da API); geometria = hudGeometry. A tela não decide nível.
import { useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layers, ListChecks, Radio } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useSim } from '../DemoPanel';
import { useReminders } from '../Notifications';
import { KeyTiles } from '../lean/Home';
import { LEVEL_UI, isFlagged } from '../../lib/levels';
import { fmtDuration } from '../../lib/format';
import type { DisplayLevel } from '../../services/api';
import { ariaLabel, GRAVITY_VIEWS, sceneState, type ElementState, type GravityView } from './sceneMapping';
import { HUD, LINK, ORBITS, cometGeometry, orbitPath, arcPath, polar, type OrbitKey } from './hudGeometry';
import { HudLink, TOKENS, isAlert, levelColor } from './common';
import { GravityControl } from './GravityControl';

const FULL = `0 0 ${HUD.size} ${HUD.size}`;
const ZOOM = 2.4; // ~400 ms de aproximação em direção ao nó antes de abrir o detalhe
const C = HUD.c;

/** Um batimento de 40 unidades (P, QRS, T), em comandos relativos: a linha volta à base no fim. */
const BEAT = 'l8 0 q2 -3 4 0 l3 0 l1.5 3 l2 -19 l2 22 l1.5 -6 l5 0 q3 -5 6 0 l7 0 ';
const ECG = { x0: 236, x1: 364, y: 288, beat: 40 };

/** Partículas do evento solar: chegam de cima à direita e cruzam a órbita externa (recortadas num anel). */
const DIR = { x: -0.8, y: 0.6 };
const STREAKS = Array.from({ length: 11 }, (_, i) => {
  const t = -270 + i * 54; // espalhadas na perpendicular da direção
  return { x: C + 330 * -DIR.x + t * 0.6, y: C + 330 * -DIR.y + t * 0.8, dur: 2.4 + (i % 3) * 0.55, delay: (i * 0.41) % 2.6, f: (i * 0.137 + 0.35) % 1 };
});
const TRAVEL = 660;

function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}

/** Legenda compacta: ícone + nome de cada nível (nunca só cor). */
export function LevelLegend({ className = '' }: { className?: string }) {
  const order: DisplayLevel[] = ['normal', 'advisory', 'caution', 'warning', 'emergency', 'unavailable'];
  return (
    <ul className={`grid grid-cols-3 sm:grid-cols-1 gap-x-3 gap-y-1 text-xs ${className}`} aria-label="Level legend">
      {order.map((l) => { const ui = LEVEL_UI[l]; const Icon = ui.Icon; return (
        <li key={l} className="inline-flex items-center gap-1.5"><Icon size={14} style={{ color: ui.color }} aria-hidden="true" /><span style={{ color: ui.text }}>{ui.label}</span></li>
      ); })}
    </ul>
  );
}

interface Tip { x: number; y: number; title: string; level?: DisplayLevel; message: string | null; extra?: string | null }

/** Marca do nó: Normal discreto; Advisory com halo; Caution ou acima com brilho e pulsação lenta; Unavailable vazado e cinza. */
function NodeMark({ x, y, level, reduced, glow }: { x: number; y: number; level: DisplayLevel; reduced: boolean; glow: string }) {
  const c = levelColor(level);
  if (level === 'unavailable') return <circle cx={x} cy={y} r={4.5} fill={TOKENS.bg} stroke={c} strokeWidth={1.5} strokeDasharray="2 2" />;
  if (isAlert(level)) return (
    <g>
      {!reduced && <circle className="hud-pulse" cx={x} cy={y} r={7} fill="none" stroke={c} strokeWidth={1} />}
      <circle cx={x} cy={y} r={11} fill={c} opacity={0.16} />
      <circle cx={x} cy={y} r={5} fill={c} filter={`url(#${glow})`} />
    </g>
  );
  return (
    <g>
      <circle cx={x} cy={y} r={9} fill="none" stroke={c} strokeWidth={1} strokeOpacity={level === 'advisory' ? 0.55 : 0.28} />
      <circle cx={x} cy={y} r={4} fill={c} />
    </g>
  );
}

export function OrbitalHud({ reduced }: { reduced: boolean }) {
  const overview = useStore((st) => st.overview);
  const reports = useStore((st) => st.ground?.reports);
  const sim = useSim();
  const now = useNow();
  const nav = useNavigate();
  const reminders = useReminders();
  const [view, setView] = useState<GravityView>('MICRO');
  const [zoom, setZoom] = useState<string | null>(null);
  const [peek, setPeek] = useState<string | null>(null);
  const uid = useId().replace(/:/g, '');
  const ids = { glow: `${uid}-glow`, fluid: `${uid}-fluid`, band: `${uid}-band`, ecgClip: `${uid}-ecgc`, ecgFade: `${uid}-ecgf`, ecgGrad: `${uid}-ecgg`, tip: `${uid}-tip` };

  const m = sim.lastVitals?.measurements;
  const s = sceneState({ overview, reports, now,
    live: m ? { heartRate: Number(m.heart_rate.value), respiratoryRate: Number(m.respiratory_rate.value) } : null });

  const go = (el: ElementState) => nav(el.route, el.target === 'vitals' ? { state: { focus: 'vitals' } } : undefined);
  const open = (el: ElementState, x: number, y: number) => {
    if (zoom) return;
    setPeek(null);
    if (reduced) { go(el); return; }
    const w = HUD.size / ZOOM;
    setZoom(`${x - w / 2} ${y - w / 2} ${w} ${w}`);
    // Navega ao fim do zoom (400 ms). Temporizador em vez de onAnimationComplete, que não dispara de novo ao voltar à Overview.
    window.setTimeout(() => go(el), 400);
  };

  const nodes: Record<OrbitKey, ElementState> = { gravity: s.gravity, isolation: s.isolation, environment: s.environment, distance: s.distance, radiation: s.radiation };
  const dim = s.emergency ? 0.35 : 1; // Emergency: o HUD escurece e só a cabine fica acesa (o EmergencyOverlay cobre a tela).
  const earthAt = polar(LINK.r, LINK.earth);
  const comet = cometGeometry(s.earth.signal);
  const radColor = levelColor(s.radiation.level);
  const head = GRAVITY_VIEWS[view].headShare;

  // Tooltip: nível (ícone + nome) e message da API. Só aparece em hover e foco.
  const tips: Record<string, Tip> = {
    ...Object.fromEntries(ORBITS.map((o) => [o.key, { ...polar(o.r, o.angle), title: nodes[o.key].area, level: nodes[o.key].level, message: nodes[o.key].message }])),
    earth: { ...earthAt, title: 'Earth · mission link', level: s.earth.level, message: s.earth.message, extra: s.earth.text !== s.earth.message ? s.earth.text : null },
    vitals: { x: C, y: C - 70, title: 'Vital signs', level: s.vitals.level, message: s.vitals.message },
    ...(comet ? { signal: { ...comet.head, title: `Ground report · ${s.earth.reportStatus ?? ''}`, message: s.earth.text } } : {}),
  };
  const tip = !zoom && peek ? tips[peek] : null;

  const link = overview?.link;
  const done = reminders.filter((r) => r.done).length;
  const pending = reminders.find((r) => !r.done);
  // Sinais vitais entram na contagem: senão o cartão diria "0 of 5" com selo Caution.
  const flagged = overview ? overview.areas.filter((a) => isFlagged(a.displayLevel)).length + (isFlagged(s.vitals.level) ? 1 : 0) : null;
  const hr = s.vitals.heartRate; const rr = s.vitals.breathSeconds ? Math.round(60 / s.vitals.breathSeconds) : null;
  const ecgColor = levelColor(s.vitals.level);

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
      <div className="space-y-3">
        <div className="card relative !p-4 sm:!p-6 overflow-hidden">
          <div className="relative mx-auto w-full max-w-[640px]">
            <motion.svg viewBox={FULL} initial={false} animate={{ viewBox: zoom ?? FULL }}
              transition={{ duration: zoom ? 0.4 : 0, ease: [0.4, 0, 0.2, 1] }}
              className="block w-full h-auto select-none" role="group"
              aria-label={`Orbital HUD. Overall: ${LEVEL_UI[s.overall].label}. Use Tab to move between Radiation, Distance, Earth, Environment, Isolation, Gravity and vital signs; press Enter to open details.`}>
              <defs>
                <filter id={ids.glow} x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <linearGradient id={ids.fluid} x1="0" y1="0" x2="0" y2="1">
                  <motion.stop offset="0%" stopColor={TOKENS.band} initial={false} animate={{ stopOpacity: head * 0.3 }} transition={{ duration: reduced ? 0 : 0.6 }} />
                  <motion.stop offset="100%" stopColor={TOKENS.band} initial={false} animate={{ stopOpacity: (1 - head) * 0.3 }} transition={{ duration: reduced ? 0 : 0.6 }} />
                </linearGradient>
                <mask id={ids.band} maskUnits="userSpaceOnUse" x="0" y="0" width={HUD.size} height={HUD.size}>
                  <circle cx={C} cy={C} r={292} fill="#fff" /><circle cx={C} cy={C} r={240} fill="#000" />
                </mask>
                <clipPath id={ids.ecgClip}><rect x={ECG.x0} y={ECG.y - 26} width={ECG.x1 - ECG.x0} height={44} /></clipPath>
                <linearGradient id={ids.ecgGrad} x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="0.2" stopColor="#fff" stopOpacity="1" />
                  <stop offset="0.8" stopColor="#fff" stopOpacity="1" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
                <mask id={ids.ecgFade} maskUnits="userSpaceOnUse" x={ECG.x0} y={ECG.y - 26} width={ECG.x1 - ECG.x0} height={44}>
                  <rect x={ECG.x0} y={ECG.y - 26} width={ECG.x1 - ECG.x0} height={44} fill={`url(#${ids.ecgGrad})`} />
                </mask>
              </defs>

              {/* Fundo: escala de graus e eixo, bem apagados. */}
              <g aria-hidden="true" opacity={dim} stroke={TOKENS.text2}>
                {Array.from({ length: 60 }, (_, i) => {
                  const a = i * 6; const long = a % 30 === 0; const p0 = polar(284, a); const p1 = polar(long ? 292 : 288, a);
                  return <line key={i} x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} strokeWidth={1} strokeOpacity={long ? 0.3 : 0.14} />;
                })}
                <line x1={16} y1={C} x2={C - 100} y2={C} strokeOpacity={0.07} />
                <line x1={C + 100} y1={C} x2={HUD.size - 16} y2={C} strokeOpacity={0.07} />
                <line x1={C} y1={C + 100} x2={C} y2={HUD.size - 16} strokeOpacity={0.07} />
              </g>

              {/* Órbitas: linha fina e apagada; com alerta, a órbita toma a cor do nível. Nome em caixa alta na abertura do topo. */}
              <g aria-hidden="true">
                {ORBITS.map((o) => {
                  const lv = nodes[o.key].level; const alert = isAlert(lv); const c = levelColor(lv);
                  return (
                    <g key={o.key}>
                      <path opacity={o.key === 'environment' ? 1 : dim} d={orbitPath(o.r, o.label)} fill="none" stroke={alert ? c : TOKENS.text2} strokeWidth={alert ? 1.25 : 1}
                        strokeOpacity={alert ? 0.5 : lv === 'unavailable' ? 0.22 : 0.18} strokeDasharray={lv === 'unavailable' ? '2 5' : undefined} />
                      <text x={C} y={C - o.r + 4} textAnchor="middle" fontSize={11} letterSpacing={1.6} fontWeight={500}
                        fill={alert ? LEVEL_UI[lv].text : TOKENS.text2}>
                        {o.label.toUpperCase()}
                      </text>
                    </g>
                  );
                })}
                {/* Gravity: distribuição de fluidos (só visual): mais clara em cima na microgravidade, embaixo na Terra. */}
                <circle cx={C} cy={C} r={84} fill={`url(#${ids.fluid})`} />
                {/* Arco do link nave ↔ Terra na órbita de Distance. */}
                <path d={arcPath(LINK.r, LINK.ship, LINK.earth)} fill="none" opacity={dim}
                  stroke={link?.status === 'unavailable' ? LEVEL_UI.unavailable.color : TOKENS.text2}
                  strokeWidth={1.5} strokeOpacity={link?.status === 'unavailable' ? 0.7 : 0.38} strokeDasharray={link?.status === 'unavailable' ? '3 4' : undefined} />
              </g>

              {/* Radiation: partículas finas cruzam a órbita externa só com evento solar ativo (cor do nível de Radiation). */}
              {s.radiation.solarActive && (
                <g aria-hidden="true" mask={`url(#${ids.band})`} opacity={dim}>
                  {STREAKS.map((p, i) => (
                    <line key={i} x1={p.x} y1={p.y} x2={p.x - DIR.x * 16} y2={p.y - DIR.y * 16} stroke={radColor} strokeWidth={1} strokeLinecap="round"
                      className={reduced ? undefined : 'hud-streak'}
                      style={reduced
                        ? { transform: `translate(${DIR.x * TRAVEL * p.f}px, ${DIR.y * TRAVEL * p.f}px)`, opacity: 0.7 }
                        : { ['--dx' as string]: `${DIR.x * TRAVEL}px`, ['--dy' as string]: `${DIR.y * TRAVEL}px`, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }} />
                  ))}
                </g>
              )}

              {/* Nós (ordem de Tab): Radiation, Distance, Earth, sinal, Environment, Isolation, Gravity, sinais vitais. */}
              {(['radiation', 'distance'] as OrbitKey[]).map(orbitNode)}

              <g>
                <HudLink id="earth" x={earthAt.x} y={earthAt.y} label={`${ariaLabel(s.earth, LEVEL_UI[s.earth.level].label)}${s.earth.text ? ' ' + s.earth.text : ''}`}
                  describedBy={peek === 'earth' ? ids.tip : undefined} onPeek={setPeek} onOpen={() => open(s.earth, earthAt.x, earthAt.y)}>
                  <circle opacity={dim} cx={earthAt.x} cy={earthAt.y} r={7.5} fill="none" stroke={levelColor(s.earth.level)} strokeOpacity={isAlert(s.earth.level) ? 0.9 : 0.45} strokeWidth={1}
                    strokeDasharray={s.earth.level === 'unavailable' ? '2 2' : undefined} />
                  <circle opacity={dim} cx={earthAt.x} cy={earthAt.y} r={3} fill={TOKENS.text} />
                  <text x={earthAt.x - 14} y={earthAt.y + 4} textAnchor="end" fontSize={11} letterSpacing={1.6} fill={TOKENS.text2} aria-hidden="true">EARTH</text>
                </HudLink>
              </g>

              {comet && (
                <g opacity={dim}>
                  <HudLink id="signal" x={comet.head.x} y={comet.head.y} hit={18} label={`Ground report: ${s.earth.reportStatus ?? 'unknown'}.${s.earth.text ? ' ' + s.earth.text : ''} Opens Ground Control.`}
                    describedBy={peek === 'signal' ? ids.tip : undefined} onPeek={setPeek} onOpen={() => open(s.earth, comet.head.x, comet.head.y)}>
                    {comet.trail.map((t, i) => <circle key={i} cx={t.x} cy={t.y} r={t.r} fill={TOKENS.text} opacity={t.o * 0.6} />)}
                    {comet.held
                      ? <circle cx={comet.head.x} cy={comet.head.y} r={3.5} fill={TOKENS.bg} stroke={TOKENS.text2} strokeWidth={1.25} />
                      : <circle cx={comet.head.x} cy={comet.head.y} r={3} fill={TOKENS.text} filter={`url(#${ids.glow})`} />}
                  </HudLink>
                </g>
              )}

              {(['environment', 'isolation', 'gravity'] as OrbitKey[]).map(orbitNode)}

              {/* Centro: o astronauta como dado vivo. ECG no ritmo de 60/FC s; sem dado confiável = linha reta cinza. */}
              <g>
                <HudLink id="vitals" x={C} y={C} hit={72} label={ariaLabel(s.vitals, LEVEL_UI[s.vitals.level].label)}
                  describedBy={peek === 'vitals' ? ids.tip : undefined} onPeek={setPeek} onOpen={() => open(s.vitals, C, C)}>
                  {isAlert(s.vitals.level) && <circle cx={C} cy={C} r={74} fill="none" stroke={ecgColor} strokeWidth={1.25} strokeOpacity={0.55} opacity={dim} />}
                  <text x={C} y={C - 44} textAnchor="middle" fontSize={11} letterSpacing={1.6} fill={TOKENS.text2}>VITALS · LIVE</text>
                  {s.vitals.beatSeconds ? (
                    <g clipPath={`url(#${ids.ecgClip})`} mask={`url(#${ids.ecgFade})`} opacity={dim}>
                      <g className={reduced ? undefined : 'hud-ecg'} style={reduced ? undefined : { animationDuration: `${s.vitals.beatSeconds}s` }}>
                        <path d={`M ${ECG.x0} ${ECG.y} ${BEAT.repeat(6)}`} fill="none" stroke={ecgColor} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round"
                          filter={isAlert(s.vitals.level) ? `url(#${ids.glow})` : undefined} />
                      </g>
                    </g>
                  ) : (
                    <line x1={ECG.x0 + 12} y1={ECG.y} x2={ECG.x1 - 12} y2={ECG.y} stroke={LEVEL_UI.unavailable.color} strokeWidth={1.5} />
                  )}
                  <line x1={C} y1={C + 14} x2={C} y2={C + 46} stroke={TOKENS.text2} strokeOpacity={0.2} />
                  <text x={C - 36} y={C + 34} textAnchor="middle" className="font-mono tabular-nums" fontSize={24} fontWeight={500} fill={TOKENS.text}>{hr ?? '—'}</text>
                  <text x={C - 36} y={C + 50} textAnchor="middle" fontSize={10} letterSpacing={1.4} fill={TOKENS.text2}>HR · BPM</text>
                  <text x={C + 36} y={C + 34} textAnchor="middle" className="font-mono tabular-nums" fontSize={24} fontWeight={500} fill={TOKENS.text}>{rr ?? '—'}</text>
                  <text x={C + 36} y={C + 50} textAnchor="middle" fontSize={10} letterSpacing={1.4} fill={TOKENS.text2}>RR · /MIN</text>
                </HudLink>
              </g>
            </motion.svg>

            {tip && <HudTip tip={tip} id={ids.tip} />}
          </div>
          <div className="mt-4 sm:mt-0 sm:absolute sm:left-5 sm:bottom-5 flex sm:block items-end justify-between gap-3">
            <LevelLegend />
          </div>
          <p className="hidden sm:block absolute right-5 bottom-5 text-xs text-slate-400">Simulated data</p>
        </div>
        <GravityControl view={view} onChange={setView} />
      </div>

      <aside className="space-y-4" aria-label="Key indicators">
        <KeyTiles cols={1} tiles={[
          { key: 'flagged', title: 'Areas + vital signs flagged', icon: Layers, value: flagged === null ? '—' : `${flagged} of ${(overview?.areas.length ?? 5) + 1}`, level: s.overall,
            compare: `above Normal today (${overview?.areas.length ?? 5} areas + vital signs)` },
          { key: 'link', title: 'Earth link', icon: Radio, value: !link || link.status === 'unknown' ? '—' : link.status === 'unavailable' ? 'No link' : fmtDuration(link.oneWaySeconds),
            level: s.distance.level, compare: link && link.status !== 'unavailable' && link.status !== 'unknown' ? 'one-way delay' : undefined, onClick: () => go(s.distance) },
          { key: 'routine', title: "Today's routine", icon: ListChecks, value: `${done} of ${reminders.length}`, compare: pending ? `Next: ${pending.title}` : 'All done today',
            onClick: pending ? pending.go : undefined },
        ]} />
      </aside>
    </div>
  );

  // Função comum (não componente): um componente declarado aqui seria recriado a cada render e perderia o foco do teclado.
  function orbitNode(k: OrbitKey) {
    const o = ORBITS.find((x) => x.key === k)!; const el = nodes[k]; const p = polar(o.r, o.angle);
    return (
      <g key={k} opacity={k === 'environment' ? 1 : dim}>
        <HudLink id={k} x={p.x} y={p.y} label={ariaLabel(el, LEVEL_UI[el.level].label)} describedBy={peek === k ? ids.tip : undefined}
          onPeek={setPeek} onOpen={() => open(el, p.x, p.y)}>
          <NodeMark x={p.x} y={p.y} level={el.level} reduced={reduced} glow={ids.glow} />
        </HudLink>
      </g>
    );
  }
}

/** Tooltip do nó: ícone + nome do nível + message da API (nunca só cor). Posição em % do quadro do SVG. */
function HudTip({ tip, id }: { tip: Tip; id: string }) {
  const ui = tip.level ? LEVEL_UI[tip.level] : null; const Icon = ui?.Icon;
  const below = tip.y < 170;
  const fx = tip.x < 170 ? '-15%' : tip.x > 430 ? '-85%' : '-50%';
  return (
    <div role="tooltip" id={id}
      className="hud-tip pointer-events-none absolute z-10 w-max max-w-[17rem] rounded-xl border border-white/10 bg-space-bg/95 px-3 py-2.5 shadow-xl backdrop-blur"
      style={{ left: `${(tip.x / HUD.size) * 100}%`, top: `${(tip.y / HUD.size) * 100}%`, transform: `translate(${fx}, ${below ? '22px' : 'calc(-100% - 22px)'})` }}>
      <p className="flex items-center gap-1.5 text-xs">
        {ui && Icon && <><Icon size={14} style={{ color: ui.color }} aria-hidden="true" /><span className="font-semibold" style={{ color: ui.text }}>{ui.label}</span><span className="text-slate-400">·</span></>}
        <span className="text-slate-300">{tip.title}</span>
      </p>
      {tip.message && <p className="text-sm text-slate-100 mt-1 leading-snug">{tip.message}</p>}
      {tip.extra && <p className="text-xs text-slate-300 mt-1 leading-snug">{tip.extra}</p>}
    </div>
  );
}
