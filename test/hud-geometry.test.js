// Orbital HUD (src/components/scene/hudGeometry.ts): o cometa do relatório anda no arco de Distance
// com a mesma posição de signalPulse (sentAt → expectedArrivalAt → expectedReplyAt), e cada perigo tem a sua órbita.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ORBITS, LINK, cometGeometry, polar } from '../src/components/scene/hudGeometry.ts';
import { signalPulse } from '../src/components/scene/sceneMapping.ts';

test('hud: 5 órbitas concêntricas, uma por perigo do RIDGE, sem raio repetido', () => {
  assert.deepEqual(ORBITS.map((o) => o.key).sort(), ['distance', 'environment', 'gravity', 'isolation', 'radiation']);
  const radii = ORBITS.map((o) => o.r);
  assert.equal(new Set(radii).size, 5);
  assert.equal(Math.max(...radii), ORBITS.find((o) => o.key === 'radiation').r, 'Radiation é a órbita externa');
  assert.equal(ORBITS.find((o) => o.key === 'distance').r, LINK.r, 'a Terra fica na órbita de Distance');
});

test('hud: cometa segue o progresso do relatório no arco nave → Terra e volta', () => {
  const t0 = Date.parse('2026-11-14T15:00:00Z');
  const r = { createdAt: new Date(t0).toISOString(), transmission: { status: 'SENT', sentAt: new Date(t0).toISOString(),
    expectedArrivalAt: new Date(t0 + 480000).toISOString(), expectedReplyAt: new Date(t0 + 2 * 480000).toISOString() } };
  const out = cometGeometry(signalPulse(r, t0 + 240000));
  assert.equal(out.held, false);
  assert.equal(out.angle, (LINK.from + LINK.to) / 2);
  assert.deepEqual(out.head, polar(LINK.r, out.angle));
  assert.ok(out.trail.length > 0 && out.trail.every((p) => p.o > 0));
  // Ida: a cauda fica do lado da nave (ângulo menor). Volta: do lado da Terra.
  const tailAngle = (c) => (Math.atan2(c.trail[0].y - 300, c.trail[0].x - 300) * 180 / Math.PI + 360) % 360;
  assert.ok(tailAngle(out) < out.angle);
  const back = cometGeometry(signalPulse(r, t0 + 480000 + 120000));
  assert.ok(tailAngle(back) > back.angle);
  assert.equal(cometGeometry(signalPulse(r, t0 + 2 * 480000)), null, 'depois de expectedReplyAt não há cometa');
});

test('hud: relatório QUEUED (sem link) = cometa parado na nave, sem cauda', () => {
  const c = cometGeometry({ position: 0, phase: 'held' });
  assert.equal(c.held, true);
  assert.equal(c.angle, LINK.from);
  assert.deepEqual(c.trail, []);
  assert.equal(cometGeometry(null), null);
});
