// Journey (árvore da saúde): estágios por XP, sequência de dias completos com "rest shield" e missão semanal.
// Arquivo PURO (sem React, testado em Node). Gamificação só por FAZER: XP e sequência vêm de tarefas feitas
// (check-in, teste de reação, exercício, pesagem), nunca do valor de saúde. Nada aqui decide nível de alerta.

export const DAY = 86400000;

// ── Estágios da árvore (XP total) ──
export interface Stage { index: number; name: string; min: number; next: number | null }
const STAGES: [string, number][] = [['Seed', 0], ['Sprout', 30], ['Sapling', 100], ['Young tree', 200], ['Adult tree', 350], ['Flowering', 550]];
export const STAGE_COUNT = STAGES.length;
export function stageOf(xp: number): Stage {
  const i = STAGES.reduce((top, [, min], k) => (xp >= min ? k : top), 0);
  return { index: i, name: STAGES[i][0], min: STAGES[i][1], next: STAGES[i + 1]?.[1] ?? null };
}
/** 0 a 1 até o próximo estágio (1 no último). */
export const stageProgress = (xp: number) => { const s = stageOf(xp); return s.next === null ? 1 : (xp - s.min) / (s.next - s.min); };

// ── Dias ──
export const dayKeyOf = (ms: number) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const startOfDay = (ms: number) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };
/** Segunda-feira 00:00 local da semana de `ms` (a semana do rest shield e da missão). */
export const startOfWeek = (ms: number) => { const d = new Date(startOfDay(ms)); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };

// ── Tarefas do dia ──
export type TaskId = 'checkin' | 'pvt' | 'exercise' | 'weigh';
export const MENTAL_TASKS: TaskId[] = ['checkin', 'pvt'];
export const PHYSICAL_TASKS: TaskId[] = ['exercise', 'weigh'];

/** O que foi feito, por dia (YYYY-MM-DD local). Montado a partir dos registros da API e dos check-ins feitos no app. */
export interface Activity { checkins: Set<string>; pvts: Set<string>; weighs: Set<string>; exerciseMin: Map<string, number> }

export interface Plan { pvtEveryDays: number; weighEveryDays: number; exercisePlanMin: number }

/**
 * Tarefas devidas e feitas em um dia, com as mesmas regras da rotina (Notifications.tsx):
 * check-in e exercício todo dia; PVT-B devido se não houve teste nos (intervalo − 1) dias anteriores; pesagem idem.
 */
export function dayTasks(a: Activity, key: string, ms: number, plan: Plan) {
  const doneBefore = (set: Set<string>, every: number) => Array.from({ length: every - 1 }, (_, i) => dayKeyOf(startOfDay(ms) - (i + 1) * DAY + DAY / 2)).some((k) => set.has(k));
  const due: TaskId[] = ['checkin', 'exercise'];
  if (a.pvts.has(key) || !doneBefore(a.pvts, plan.pvtEveryDays)) due.push('pvt');
  if (a.weighs.has(key) || !doneBefore(a.weighs, plan.weighEveryDays)) due.push('weigh');
  const done = due.filter((t) => t === 'checkin' ? a.checkins.has(key) : t === 'pvt' ? a.pvts.has(key) : t === 'weigh' ? a.weighs.has(key)
    : (a.exerciseMin.get(key) ?? 0) >= plan.exercisePlanMin);
  return { due, done, complete: done.length === due.length };
}

export interface StreakResult { days: number; shieldUsedThisWeek: boolean; week: { key: string; state: 'complete' | 'shield' | 'missed' | 'today' | 'future' }[] }

/**
 * Sequência: dias seguidos com a rotina do dia completa, contando para trás a partir de ontem (hoje entra quando
 * completo). Um "rest shield" por semana (segunda a domingo) cobre o primeiro dia incompleto da semana: a sequência
 * não quebra, mas o dia protegido não soma. Para em `since` (início da missão) ou depois de 120 dias.
 */
export function streak(isComplete: (key: string, ms: number) => boolean, now: number, since?: number): StreakResult {
  const today = startOfDay(now);
  const shieldWeeks = new Set<number>();
  let days = 0;
  if (isComplete(dayKeyOf(today + DAY / 2), today + DAY / 2)) days++;
  for (let i = 1; i <= 120; i++) {
    const ms = today - i * DAY + DAY / 2;
    if (since !== undefined && ms < startOfDay(since)) break;
    if (isComplete(dayKeyOf(ms), ms)) { days++; continue; }
    const w = startOfWeek(ms);
    if (!shieldWeeks.has(w)) { shieldWeeks.add(w); continue; }
    break;
  }
  // Bolinhas da semana atual.
  const mon = startOfWeek(now);
  let shieldThisWeek = false;
  const week = Array.from({ length: 7 }, (_, i) => {
    const ms = mon + i * DAY + DAY / 2; const key = dayKeyOf(ms);
    if (ms > now && startOfDay(ms) > today) return { key, state: 'future' as const };
    const complete = isComplete(key, ms);
    if (startOfDay(ms) === today) return { key, state: complete ? 'complete' as const : 'today' as const };
    if (complete) return { key, state: 'complete' as const };
    if (!shieldThisWeek) { shieldThisWeek = true; return { key, state: 'shield' as const }; }
    return { key, state: 'missed' as const };
  });
  return { days, shieldUsedThisWeek: shieldThisWeek, week };
}

// ── Missão semanal ──
export interface TreeMission { id: string; side: 'mental' | 'physical'; title: string; target: number; reward: 'flower' | 'fruit' }
/** Alterna por semana: semana par = físico (fruto), ímpar = mental (flor). */
export function missionOfWeek(weekStart: number): TreeMission {
  const n = Math.round(weekStart / (7 * DAY));
  const id = dayKeyOf(weekStart + DAY / 2);
  return n % 2 === 0
    ? { id, side: 'physical', title: 'Exercise on 4 days this week', target: 4, reward: 'fruit' }
    : { id, side: 'mental', title: 'Do the morning check-in on 5 days this week', target: 5, reward: 'flower' };
}
/** Progresso: dias distintos da semana com a tarefa feita (exercício: qualquer sessão registrada). */
export function missionProgress(m: TreeMission, a: Activity, weekStart: number) {
  const keys = Array.from({ length: 7 }, (_, i) => dayKeyOf(weekStart + i * DAY + DAY / 2));
  const count = keys.filter((k) => m.side === 'physical' ? (a.exerciseMin.get(k) ?? 0) > 0 : a.checkins.has(k)).length;
  return Math.min(count, m.target);
}

// ── Dia da missão ──
/** Duração planejada da demonstração por destino (contexto de interface, não limite de saúde). */
export const PLANNED_DAYS: Record<string, number> = { ISS: 180, Moon: 30, Mars: 900 };
export function missionDay(startedAt: string | undefined, destination: string | undefined, now: number) {
  if (!startedAt) return null;
  const day = Math.floor((now - Date.parse(startedAt)) / DAY) + 1;
  const total = PLANNED_DAYS[destination ?? ''] ?? null;
  return { day, total };
}
