// "What to do now" (src/lib/actions.ts): 1 a 3 passos por caso, sem travessão, fonte declarada ou genérico,
// e o limite NASA mostrado vem dos mesmos valores de shared/ (nenhum número novo).
import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIONS, actionsFor, limitText } from '../src/lib/actions.ts';
import { rules } from '../shared/config/research.js';
import { alertRegion } from '../src/components/scene/sceneMapping.ts';

test('ações: cada caso tem de 1 a 3 passos curtos, sem travessão', () => {
  for (const [indicator, byLevel] of Object.entries(ACTIONS)) {
    for (const [level, plan] of Object.entries(byLevel)) {
      assert.ok(plan.steps.length >= 1 && plan.steps.length <= 3, `${indicator}/${level}`);
      for (const s of plan.steps) { assert.ok(!s.includes('—'), s); assert.ok(s.length <= 110, s); }
      assert.ok(plan.source === null || typeof plan.source === 'string');
    }
  }
});

test('ações: abaixo de Caution não há passos; caso sem instrução própria cai no genérico', () => {
  assert.equal(actionsFor('co2_partial_pressure', 'advisory'), null);
  assert.equal(actionsFor('co2_partial_pressure', null), null);
  const g = actionsFor('indicador_desconhecido', 'warning');
  assert.deepEqual(g.steps, ['Repeat the measurement.', 'Inform the Crew Medical Officer.']);
  assert.equal(g.source, null);
  assert.ok(actionsFor('co2_partial_pressure', 'caution').source.includes('OCHMO-TB-004'));
});

test('limite NASA na tela usa os valores das regras de shared/', () => {
  assert.ok(limitText('co2_partial_pressure').includes(`${rules.co2.limit} mmHg`));
  assert.ok(limitText('cabin_pressure').includes(`${rules.pressure.minimumPsia} to ${rules.pressure.maximumPsia} psia`));
  assert.ok(limitText('cabin_noise').includes(`${rules.noise.ceiling} dBA`));
  assert.ok(limitText('career_effective_dose').includes(`${rules.career.limit} mSv`));
  assert.match(limitText('stress'), /No NASA limit/);
});

test('região do corpo de um alerta: Isolation = cabeça, sinais vitais = peito, resto de Gravity = membros', () => {
  assert.equal(alertRegion('isolation_confinement', 'sleep'), 'head');
  assert.equal(alertRegion('gravity_fields', 'vital_signs'), 'chest');
  assert.equal(alertRegion('gravity_fields', 'fitness'), 'limbs');
  assert.equal(alertRegion('hostile_closed_environment', 'atmosphere'), null);
});
