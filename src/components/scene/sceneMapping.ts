// RIDGE Scene: converte a resposta da API em estado de cada elemento da cena.
// Arquivo PURO (sem React, testado em Node). A cena não cria regra nem limite:
// cor = displayLevel que a API devolveu; texto = message da API; dado ausente = Unavailable (cinza, parado).
// Para juntar níveis usa worstLevel de shared/config/levels.js, a mesma prioridade da API.
import type { DisplayLevel, GroundReport, Link, Overview } from '../../services/api';
import { worstLevel } from '../../../shared/config/levels.js';

export type SceneTarget = 'radiation' | 'distance' | 'earth' | 'environment' | 'isolation' | 'vitals' | 'gravity';

export interface ElementState {
  target: SceneTarget; area: string; level: DisplayLevel; message: string | null;
  /** Caution ou acima pulsa devagar (pedido de interface, não regra de saúde). */
  pulse: boolean; route: string;
}

export interface SignalPulse {
  /** 0 = na nave, 1 = na Terra. */
  position: number;
  phase: 'outbound' | 'return' | 'held';
}

export interface SceneState {
  overall: DisplayLevel; emergency: boolean;
  radiation: ElementState & { solarActive: boolean };
  distance: ElementState;
  earth: ElementState & { linkStatus: Link["status"] | "unknown"; signal: SignalPulse | null; text: string | null; reportStatus: GroundReport['transmission']['status'] | null };
  environment: ElementState & { cabinGlow: boolean };
  sensors: { co2: DisplayLevel; o2: DisplayLevel; pressure: DisplayLevel; noise: DisplayLevel };
  isolation: ElementState;
  vitals: ElementState & { beatSeconds: number | null; breathSeconds: number | null; heartRate: number | null };
  gravity: ElementState;
}

export interface LiveVitals { heartRate: number | null; respiratoryRate: number | null }

const PULSING: DisplayLevel[] = ['caution', 'warning', 'emergency'];
const GLOWING: DisplayLevel[] = ['warning', 'emergency'];

const AREA = { radiation: 'radiation', isolation: 'isolation_confinement', distance: 'distance_from_earth', gravity: 'gravity_fields', cabin: 'hostile_closed_environment' } as const;

type Head = { level: any; displayLevel: DisplayLevel; message: string | null; indicator?: string | null };
const UNAVAILABLE: Head = { level: null, displayLevel: 'unavailable', message: null };

function element(target: SceneTarget, area: string, route: string, head: Head | undefined): ElementState {
  const h = head ?? UNAVAILABLE;
  return { target, area, route, level: h.displayLevel, message: h.message ?? null, pulse: PULSING.includes(h.displayLevel) };
}

/** Relatório mais recente (a linha de sinal mostra um por vez). */
export function latestReport(reports: GroundReport[] | undefined): GroundReport | null {
  if (!reports?.length) return null;
  return [...reports].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
}

/**
 * Posição do pulso na linha nave ↔ Terra, só com os horários que a API devolveu:
 * ida = (agora − sentAt) / (expectedArrivalAt − sentAt); volta do mesmo jeito até expectedReplyAt.
 * QUEUED (sem link): parado na nave. Depois de expectedReplyAt: sem pulso.
 */
export function signalPulse(report: GroundReport | null, now: number): SignalPulse | null {
  if (!report) return null;
  const t = report.transmission;
  if (t.status === 'QUEUED') return { position: 0, phase: 'held' };
  const sent = Date.parse(t.sentAt ?? ''); const arrival = Date.parse(t.expectedArrivalAt ?? ''); const reply = Date.parse(t.expectedReplyAt ?? '');
  if (![sent, arrival, reply].every(Number.isFinite)) return null;
  if (now >= reply) return null;
  if (now < arrival) {
    const span = arrival - sent;
    return { position: span > 0 ? Math.min(1, Math.max(0, (now - sent) / span)) : 1, phase: 'outbound' };
  }
  const span = reply - arrival;
  return { position: span > 0 ? Math.min(1, Math.max(0, 1 - (now - arrival) / span)) : 0, phase: 'return' };
}

export function sceneState({ overview, reports, live, now }: {
  overview: Overview | null; reports?: GroundReport[]; live?: LiveVitals | null; now: number;
}): SceneState {
  const area = (id: string) => overview?.areas.find((a) => a.areaId === id);
  const group = (id: string, g: string): Head | undefined => area(id)?.groups?.[g] as Head | undefined;
  const headOf = (id: string): Head | undefined => {
    const a = area(id); return a ? { level: a.level, displayLevel: a.displayLevel, message: a.headline?.message ?? null } : undefined;
  };

  const overall: DisplayLevel = overview?.overallDisplayLevel ?? 'unavailable';

  // Radiation: o evento solar está ativo quando o grupo "solar" da API tem nível de alerta.
  const solar = group(AREA.radiation, 'solar');
  const radiation = { ...element('radiation', 'Radiation', '/radiation', headOf(AREA.radiation)), solarActive: !!solar?.level };

  // Distance: antena da nave. Earth: linha de sinal + relatório mais recente.
  const distance = element('distance', 'Distance', '/distance', headOf(AREA.distance));
  const report = latestReport(reports);
  const link = overview?.link;
  const pulse = signalPulse(report, now);
  const earth = {
    // Anel da Terra = grupo "mission" (contexto da missão e link). O grupo "reports" não tem avaliação própria
    // na API; o estado do relatório aparece no pulso e no texto.
    ...element('earth', 'Earth', '/ground', group(AREA.distance, 'mission')),
    linkStatus: link?.status ?? 'unknown',
    signal: pulse,
    // Texto sempre da API: o do relatório quando há um; senão a mensagem do link (ex.: "No contact with Earth…").
    text: report && pulse ? report.transmission.message : link?.message ?? null,
    reportStatus: report?.transmission.status ?? null,
  };

  // Hostile environment: cabine e sensores de parede. CO2, O2 e pressão vêm do grupo "atmosphere"; ruído do grupo "noise".
  const envHead = headOf(AREA.cabin);
  const environment = { ...element('environment', 'Environment', '/environment', envHead), cabinGlow: GLOWING.includes(envHead?.displayLevel ?? 'unavailable') };
  const atmosphere = group(AREA.cabin, 'atmosphere')?.displayLevel ?? 'unavailable';
  const sensors = { co2: atmosphere, o2: atmosphere, pressure: atmosphere, noise: group(AREA.cabin, 'noise')?.displayLevel ?? 'unavailable' };

  const isolation = element('isolation', 'Isolation', '/isolation', headOf(AREA.isolation));

  // Sinais vitais: nível da API (vitalSigns). Coração e respiração só andam com dado avaliado e leitura ao vivo.
  const vitalsHead = overview?.vitalSigns as Head | undefined;
  const vitalsEl = element('vitals', 'Vital signs', '/gravity', vitalsHead);
  const assessed = vitalsEl.level !== 'unavailable';
  const hr = assessed && live?.heartRate && live.heartRate > 0 ? live.heartRate : null;
  const rr = assessed && live?.respiratoryRate && live.respiratoryRate > 0 ? live.respiratoryRate : null;
  const vitals = { ...vitalsEl, heartRate: hr, beatSeconds: hr ? 60 / hr : null, breathSeconds: rr ? 60 / rr : null };

  // Gravity: o nível da área já vem sem os sinais vitais (a API separa os dois grupos).
  const gravity = element('gravity', 'Gravity', '/gravity', headOf(AREA.gravity));

  return { overall, emergency: overall === 'emergency', radiation, distance, earth, environment, sensors, isolation, vitals, gravity };
}

/** Nível juntado de vários elementos, com a prioridade da API (para a legenda e o resumo). */
export const combined = (items: ElementState[]) =>
  worstLevel(items.map((i) => ({ level: null, displayLevel: i.level, message: i.message, critical: i.target === 'vitals' || i.target === 'environment' }))).displayLevel as DisplayLevel;

/** Texto acessível de cada elemento: área + nível (+ mensagem da API). */
export const ariaLabel = (e: ElementState, levelLabel: string) => `${e.area}: ${levelLabel}.${e.message ? ' ' + e.message : ''} Opens details.`;

/** Deslocamento de fluidos (só visual e educativo, não muda regra). Frases da especificação e do contexto. */
export const GRAVITY_VIEWS = {
  MICRO: { label: 'Micro', headShare: 0.8, text: 'Microgravity: fluids shift toward the head. Puffy face, thinner legs.' },
  MOON: { label: 'Moon', headShare: 0.6, text: 'Moon: partial gravity. Each gravity change can affect balance and coordination.' },
  MARS: { label: 'Mars', headShare: 0.45, text: 'Mars (3/8 g): another gravity change. Motion sickness and dizziness can happen.' },
  EARTH: { label: 'Earth', headShare: 0.2, text: 'Earth (1 g): fluids pull back to the legs. Dizziness when standing up is common after landing.' },
} as const;
export type GravityView = keyof typeof GRAVITY_VIEWS;
