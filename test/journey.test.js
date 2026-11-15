// Journey (src/lib/journey.ts): estágios por XP, sequência com 1 rest shield por semana e missão semanal.
import test from 'node:test';
import assert from 'node:assert/strict';
import { DAY, STAGE_COUNT, dayKeyOf, dayTasks, missionOfWeek, missionProgress, stageOf, stageProgress, startOfWeek, streak } from '../src/lib/journey.ts';

const plan = { pvtEveryDays: 4, weighEveryDays: 7, exercisePlanMin: 90 };
const empty = () => ({ checkins: new Set(), pvts: new Set(), weighs: new Set(), exerciseMin: new Map() });

test('estágios: 6, do Seed ao Flowering, só por XP', () => {
  assert.equal(STAGE_COUNT, 6);
  assert.equal(stageOf(0).name, 'Seed'); assert.equal(stageOf(199).name, 'Sapling'); assert.equal(stageOf(200).index, 3);
  assert.equal(stageOf(5000).name, 'Flowering'); assert.equal(stageOf(5000).next, null); assert.equal(stageProgress(5000), 1);
});

test('dia completo = todas as tarefas devidas feitas (PVT e pesagem só quando devidos)', () => {
  const now = new Date(2026, 10, 15, 12).getTime(); const key = dayKeyOf(now); const a = empty();
  a.checkins.add(key); a.exerciseMin.set(key, 90);
  // Sem PVT nem pesagem recentes: os dois são devidos hoje.
  assert.deepEqual(dayTasks(a, key, now, plan).due.sort(), ['checkin', 'exercise', 'pvt', 'weigh']);
  a.pvts.add(dayKeyOf(now - 2 * DAY)); a.weighs.add(dayKeyOf(now - 3 * DAY));
  const t = dayTasks(a, key, now, plan);
  assert.deepEqual(t.due.sort(), ['checkin', 'exercise']); assert.equal(t.complete, true);
});

test('sequência: um dia ruim por semana é protegido pelo rest shield; o segundo quebra', () => {
  const now = new Date(2026, 10, 15, 12).getTime(); // domingo
  const bad = new Set([dayKeyOf(now - 2 * DAY)]);
  const r = streak((k) => !bad.has(k), now);
  assert.ok(r.days >= 10); // cobre a semana e segue para trás (uma proteção por semana)
  assert.equal(r.week.filter((d) => d.state === 'shield').length, 1);
  bad.add(dayKeyOf(now - 3 * DAY));
  assert.equal(streak((k) => !bad.has(k), now).days, 2 /* hoje e ontem */);
});

test('missão semanal alterna e conta dias distintos; a recompensa só depende de fazer', () => {
  const mon = startOfWeek(new Date(2026, 10, 15, 12).getTime());
  const m = missionOfWeek(mon); const other = missionOfWeek(mon + 7 * DAY);
  assert.notEqual(m.side, other.side);
  const a = empty();
  for (let i = 0; i < 5; i++) { const k = dayKeyOf(mon + i * DAY + DAY / 2); a.checkins.add(k); a.exerciseMin.set(k, 20); }
  assert.equal(missionProgress(m, a, mon), m.target === 4 ? 4 : 5);
});
