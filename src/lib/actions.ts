// "What to do now": 1 a 3 passos curtos por indicador e por nível de alerta (Caution, Warning, Emergency).
// Arquivo PURO (sem React, testado em Node). Não cria nível nem limite: o nível vem da API; os limites citados
// em `limitText` são lidos de shared/config/research.js (os mesmos valores das regras).
//
// Fonte de cada caso (comentário ao lado):
//  - só NASA-STD-3001 Vol. 2 Rev. F, technical briefs da NASA OCHMO ou evidências do NASA HRP já citadas em docs/
//    (docs/SpaceApps2026_DEV_Especificacao.md, seção 5, números [n]);
//  - sem procedimento publicado nessas fontes: orientação segura e genérica (`source: null`), como
//    "Repeat the measurement" e "Inform the Crew Medical Officer". O procedimento da missão continua mandando.
import { rules } from '../../shared/config/research.js';
import { REFERENCE } from './content.ts'; // extensão explícita: o arquivo também roda nos testes do Node

export type ActionLevel = 'caution' | 'warning' | 'emergency';
export interface ActionPlan {
  steps: string[];
  /** Fonte publicada dos passos (rótulo curto); null = orientação genérica, sem procedimento publicado. */
  source: string | null;
}

const CMO = 'Inform the Crew Medical Officer.';
const REPEAT = 'Repeat the measurement.';
const generic = (...steps: string[]): ActionPlan => ({ steps, source: null });
const sourced = (source: string, ...steps: string[]): ActionPlan => ({ steps, source });

// Rótulos das fontes (mesma numeração de src/lib/content.ts SOURCES e da especificação v2, seção 5).
const TB004 = 'OCHMO-TB-004 Carbon Dioxide [4]';
const TB035 = 'OCHMO-TB-035 Acoustics [8]; NASA-STD-3001 Vol. 2 Rev. F V2 6077';
const TB037 = 'OCHMO-TB-037 Decompression Sickness [10]';
const RST = 'NASA HRP evidence: Reaction Self Test on the ISS, Jones et al. 2022 [26]';
const NUTRITION = 'NASA HRP Food and Nutrition Risk Record Rev. D [23]';
const OCULAR = 'NASA HRP evidence: ISS ocular surveillance [20]';
const CARDIO = 'NASA HRP Evidence Report, Risk of Cardiovascular Adaptations [21]';

export const ACTIONS: Record<string, Partial<Record<ActionLevel, ActionPlan>>> = {
  // ── Environment ──
  co2_partial_pressure: {
    // [4] OCHMO-TB-004: CO2 acima do limite de 1 h (V2 6004) está ligado a dor de cabeça e sono ruim; relatar à tripulação.
    caution: sourced(TB004, 'Tell the crew the cabin CO₂ reading.', 'Log any headache or poor sleep.', CMO),
    // [4] OCHMO-TB-004: faixa acima de 4,5 mmHg com sintomas relatados (fadiga, náusea, dor de cabeça).
    warning: sourced(TB004, "Follow your mission's CO₂ procedure.", 'Alert the crew and the ground team.', 'Log any headache, fatigue or nausea.'),
  },
  // Sem procedimento publicado nas fontes: o procedimento de despressurização é da missão.
  cabin_pressure: { emergency: generic("Follow your mission's depressurization procedure now.", 'Alert the crew.', CMO) },
  // Sem procedimento publicado nas fontes (V2 6003 dá só os valores).
  inspired_oxygen_pressure: {
    caution: generic('Ask the crew to check the life support system.', REPEAT, CMO),
    emergency: generic("Follow your mission's cabin atmosphere procedure now.", 'Alert the crew.', CMO),
  },
  // V2 6012 e V2 6013 dão só a zona de conforto: sem procedimento publicado.
  temperature_humidity: { caution: generic('Alert the crew.', REPEAT, CMO) },
  // [8] OCHMO-TB-035 e V2 6077: 85 dBA nunca deve ser ultrapassado; proteção auditiva ou sair do local.
  cabin_noise: { caution: sourced(TB035, 'Leave the area or put on hearing protection now.', 'Tell the crew where the noise is.') },
  // [10] OCHMO-TB-037: a maioria dos casos aparece de 60 a 240 min depois da descompressão; tratar cedo.
  post_eva_symptoms: { warning: sourced(TB037, 'Tell your Crew Medical Officer now.', 'Follow the decompression sickness procedure.', 'Do not wait for it to pass.') },

  // ── Isolation ──
  sleep_duration: {
    // [26] Jones et al. 2022 (HRP): sono curto no espaço está ligado a reação mais lenta.
    caution: sourced(RST, 'Protect your next sleep period.', 'Ask for help adjusting your schedule.', CMO),
    warning: sourced(RST, 'Avoid critical tasks if possible.', 'Talk to your Crew Medical Officer about fatigue countermeasures.'),
  },
  // Sem procedimento publicado: escala do protótipo comparada com a faixa pessoal.
  sleep_quality: { caution: generic('Check light, noise and temperature in your sleep station.', CMO) },
  // KSS e Samn-Perelli: escalas de aviação; sem procedimento publicado nas fontes.
  sleepiness_kss: { caution: generic('Postpone tasks that need full attention if possible.', 'Do a new check-in later today.', CMO) },
  fatigue_samn_perelli: {
    caution: generic('Rest before demanding tasks if possible.', 'Do a new check-in later today.', CMO),
    warning: generic('Do not start critical tasks.', 'Talk to your Crew Medical Officer now.'),
  },
  // Sem procedimento publicado nas três fontes (o texto da tela segue o C-O-N-N-E-C-T, artigo da NASA [33]).
  stress: { caution: generic('Take a break: exercise or a few minutes of journaling.', 'Talk privately with your Crew Medical Officer or flight surgeon.') },
  mood_score: { caution: generic('Plan free time and contact with family or friends.', 'Talk privately with your Crew Medical Officer or flight surgeon.') },
  // [26] Jones et al. 2022 (HRP): o PVT-B do Reaction Self Test é sensível à perda de sono.
  pvt_response_speed: { caution: sourced(RST, 'Check how you slept last night.', 'Repeat the reaction check before critical tasks.', CMO) },

  // ── Gravity ──
  // NEWS2 é referência terrestre (RCP), fora das três fontes: orientação genérica.
  news2: {
    caution: generic('Rest for 5 minutes.', REPEAT, 'If it stays the same, inform the Crew Medical Officer.'),
    warning: generic('Stop your current activity.', 'Stay where the crew can see you.', 'Contact your Crew Medical Officer now.'),
  },
  // V1 4003 e V1 4024 (Vol. 1) dão só o mínimo de 80%: sem procedimento publicado nas três fontes.
  aerobic_capacity: { caution: generic('Keep your full exercise schedule.', 'Review your exercise plan with the Crew Medical Officer.') },
  muscle_strength: { caution: generic('Keep your full exercise schedule.', 'Review your exercise plan with the Crew Medical Officer.') },
  // [23] Food and Nutrition Risk Record (HRP): perda de massa ligada a comer menos que o planejado.
  body_mass: { caution: sourced(NUTRITION, 'Eat your full planned meals.', 'Log your food.', 'Talk to your Crew Medical Officer about your nutrition plan.') },
  // V1 4001 e V1 4002 (Vol. 1): sem procedimento publicado nas três fontes.
  vo2max: { warning: generic('Do not start the EVA yet.', 'Follow the EVA readiness procedure.', CMO) },
  // Escala do protótipo (Standard Measures dá a escala, não o procedimento).
  motion_sickness: { caution: generic('Drink small amounts of water often.', CMO) },
  dizziness: { warning: generic('Lie down or stay secured.', 'Contact your Crew Medical Officer now.') },
  // [20] Vigilância ocular na ISS (HRP): acuidade, grade de Amsler e questionário em voo.
  vision_change: { caution: sourced(OCULAR, 'Note what changed and in which eye.', 'Inform the Crew Medical Officer. An eye check (acuity and Amsler grid) may be scheduled.') },
  amsler_change: { caution: sourced(OCULAR, 'Note what changed and in which eye.', 'Inform the Crew Medical Officer. An eye check (acuity and Amsler grid) may be scheduled.') },
  posture: {
    // [21] HRP Cardiovascular: intolerância ortostática é comum no dia do pouso; levantar devagar e seguir o plano pós-pouso.
    caution: sourced(CARDIO, 'Stand up slowly.', 'Follow your post-landing plan.'),
    // Desmaio iminente: sem procedimento publicado nas três fontes.
    warning: generic('Sit or lie down now.', 'Inform the Crew Medical Officer.'),
  },

  // ── Radiation ──
  // V1 4030 (Vol. 1) dá só o limite de 600 mSv: sem procedimento publicado nas três fontes.
  career_effective_dose: {
    caution: generic('Your Crew Medical Officer and the ground team will review your schedule.', CMO),
    warning: generic("Follow your mission's radiation procedure.", 'Talk to your Crew Medical Officer.'),
  },
  // SRAG [12] é operação da ISS, fora das três fontes: orientação genérica.
  solar_event_simulated: { warning: generic("Follow your mission's shelter or EVA radiation procedure now.", 'Move to the shielded area if told to.', CMO) },
};

const FALLBACK: ActionPlan = generic(REPEAT, CMO);

/** Passos para um alerta. Nível abaixo de Caution: nenhum passo (não é alerta). Caso sem instrução própria: genérico. */
export function actionsFor(indicator: string | null | undefined, level: string | null | undefined): ActionPlan | null {
  if (level !== 'caution' && level !== 'warning' && level !== 'emergency') return null;
  return (indicator && ACTIONS[indicator]?.[level]) || FALLBACK;
}

const n = (x: number) => String(Number(x.toFixed(1)));
/**
 * Limite NASA do indicador, com os valores das regras de shared/ (sem número novo). Sem limite oficial: diz isso.
 * Vol. 1 (V1 …) também é limite NASA; Vol. 2 Rev. F (V2 …) é a revisão adotada no projeto.
 */
export function limitText(indicator: string | null | undefined): string {
  switch (indicator) {
    case 'co2_partial_pressure': return `NASA limit: 1-hour average ${n(rules.co2.limit)} mmHg (V2 6004)`;
    case 'co2_partial_pressure_7d': return `Research finding: 7-day average ${n(rules.co2Week.limit)} mmHg (OCHMO-TB-004)`;
    case 'cabin_pressure': return `NASA limits: ${n(rules.pressure.minimumPsia)} to ${n(rules.pressure.maximumPsia)} psia (V2 6006)`;
    case 'inspired_oxygen_pressure': return `NASA target: ${rules.oxygen.normal[0]} to ${rules.oxygen.normal[1]} mmHg (V2 6003)`;
    case 'temperature_humidity': return `NASA comfort zone: ${rules.climate.comfort.temperature[0]} to ${rules.climate.comfort.temperature[1]} °C, ${rules.climate.comfort.humidity[0]} to ${rules.climate.comfort.humidity[1]}% RH (V2 6012, V2 6013)`;
    case 'cabin_noise': return `NASA limit: never above ${rules.noise.ceiling} dBA (V2 6077)`;
    case 'aerobic_capacity': return `NASA minimum: ${rules.aerobic_capacity.minimum}% of pre-flight (V1 4003)`;
    case 'muscle_strength': return `NASA minimum: ${rules.muscle_strength.minimum}% of pre-flight (V1 4024)`;
    case 'vo2max': return `NASA minimum for EVA: ${rules.evaMicro.minimum} (microgravity) or ${rules.evaSurface.minimum} mL/kg/min (surface) (V1 4001, V1 4002)`;
    case 'career_effective_dose': return `NASA limit: ${rules.career.limit} mSv career effective dose (V1 4030)`;
    case 'sleep_duration': return `No NASA limit · NASA plans ${REFERENCE.sleepPlanH} h of sleep`;
    case 'body_mass': return `No NASA limit · ${rules.body_mass.cautionLoss}% loss is a risk-record milestone`;
    case 'news2': return 'No NASA limit · terrestrial early warning score';
    case 'stress': case 'mood_score': case 'sleep_quality': case 'pvt_response_speed': case 'pvt_lapses':
      return 'No NASA limit · compared with your usual range';
    default: return 'No NASA limit · team rule';
  }
}
