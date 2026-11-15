// Overview: converte a resposta da API em estado de cada elemento da cena.
// Arquivo PURO (sem React, testado em Node). A tela não cria regra nem limite:
// cor = displayLevel que a API devolveu; texto = message da API; dado ausente = Unavailable (cinza, parado).
import type { DisplayLevel, GroundReport, Link, Overview } from '../../services/api';

export type SceneTarget = 'radiation' | 'distance' | 'earth' | 'environment' | 'isolation' | 'vitals' | 'gravity';

export interface ElementState {
  target: SceneTarget; area: string; level: DisplayLevel; message: string | null;
  /** Indicador da manchete que a API devolveu (null = sem manchete). */
  indicator: string | null;
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
  return { target, area, route, level: h.displayLevel, message: h.message ?? null, indicator: h.indicator ?? null, pulse: PULSING.includes(h.displayLevel) };
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
    const a = area(id); return a ? { level: a.level, displayLevel: a.displayLevel, message: a.headline?.message ?? null, indicator: a.headline?.indicator ?? null } : undefined;
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

/**
 * Corpo humano da Overview (react-body-highlighter, vista anterior). Cada região repete o nível de um elemento da cena:
 * cabeça e pescoço = Isolation; peito = sinais vitais; braços, coxas e panturrilhas = Gravity.
 * Cada músculo aparece em uma só região (a biblioteca soma frequências se o músculo se repetir).
 */
export const BODY_LEVELS: DisplayLevel[] = ['normal', 'advisory', 'caution', 'warning', 'emergency', 'unavailable'];
/** Nível → frequência da biblioteca (highlightedColors[frequency − 1] = cor do nível). */
export const levelFrequency = (level: DisplayLevel) => BODY_LEVELS.indexOf(level) + 1;

export type BodyRegionKey = 'head' | 'chest' | 'limbs';
/** `fallback`: parâmetro aberto quando a API não devolve manchete para a área (só navegação). */
const REGIONS: { key: BodyRegionKey; label: string; from: 'isolation' | 'vitals' | 'gravity'; muscles: string[]; fallback: string }[] = [
  { key: 'head', label: 'Head and neck', from: 'isolation', muscles: ['head', 'neck'], fallback: 'sleep_duration' },
  { key: 'chest', label: 'Chest', from: 'vitals', muscles: ['chest'], fallback: 'heart_rate' },
  { key: 'limbs', label: 'Arms and legs', from: 'gravity', muscles: ['biceps', 'triceps', 'forearm', 'quadriceps', 'abductors', 'calves'], fallback: 'aerobic_capacity' },
];

export interface BodyRegion { key: BodyRegionKey; label: string; muscles: string[]; element: ElementState; frequency: number; indicator: string }

export function bodyRegions(s: SceneState): BodyRegion[] {
  return REGIONS.map((r) => ({ key: r.key, label: r.label, muscles: r.muscles, element: s[r.from], frequency: levelFrequency(s[r.from].level),
    indicator: s[r.from].indicator ?? r.fallback }));
}

/** Endereço do detalhe com o parâmetro já aberto no tópico (?indicator=<id>). */
export const indicatorHref = (route: string, indicator: string | null) => (indicator ? `${route}?indicator=${encodeURIComponent(indicator)}` : route);

export interface TodayItem { label: string; level: DisplayLevel; message: string; indicator: string | null }
export interface TodaySummary { level: DisplayLevel; message: string; indicator: string | null; also: TodayItem[] }

const SEVERITY: Partial<Record<DisplayLevel, number>> = { emergency: 4, warning: 3, caution: 2, advisory: 1 };
export const ALL_NORMAL = 'All areas within expected range today.';

/**
 * Frase do TodayHero. Pior nível Normal: frase fixa, sem citar indicador. Algo em Advisory ou acima: a message do item
 * mais grave (empate: a manchete da API primeiro, depois a ordem das áreas). Só Unavailable: a manchete da API.
 * O nível mostrado é sempre o overallDisplayLevel da API.
 */
export function todaySummary(o: Overview, areaLabel: (id: string) => string): TodaySummary {
  const items: TodayItem[] = [
    { label: 'Vital signs', level: o.vitalSigns.displayLevel, message: o.vitalSigns.message ?? '', indicator: o.vitalSigns.indicator },
    ...o.areas.map((a) => ({ label: areaLabel(a.areaId), level: a.displayLevel, message: a.headline.message ?? '', indicator: a.headline.indicator })),
  ];
  const flagged = items.filter((i) => SEVERITY[i.level]);
  const isHeadline = (i: TodayItem) => i.indicator !== null && i.indicator === o.headline.indicator;
  const top = [...flagged].sort((a, b) => (SEVERITY[b.level]! - SEVERITY[a.level]!) || (Number(isHeadline(b)) - Number(isHeadline(a))))[0];
  const level = o.overallDisplayLevel;
  if (top) return { level, message: top.message, indicator: top.indicator, also: flagged.filter((i) => i !== top) };
  if (level === 'normal') return { level, message: ALL_NORMAL, indicator: null, also: [] };
  return { level, message: o.headline.message ?? '', indicator: o.headline.indicator, also: [] };
}

/**
 * Região do corpo ligada a um alerta (para destacar na cor do nível): Isolation = cabeça e pescoço;
 * Gravity, grupo de sinais vitais = peito; resto de Gravity = braços e pernas. Cabine, radiação e distância: nenhuma.
 */
export function alertRegion(areaId: string, group: string | null | undefined): BodyRegionKey | null {
  if (areaId === AREA.isolation) return 'head';
  if (areaId === AREA.gravity) return group === 'vital_signs' ? 'chest' : 'limbs';
  return null;
}

/** Região de um músculo clicado (null = parte do corpo sem área ligada). */
export const regionOfMuscle = (regions: BodyRegion[], muscle: string) => regions.find((r) => r.muscles.includes(muscle)) ?? null;
