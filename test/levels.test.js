import test from 'node:test';
import assert from 'node:assert/strict';
import { acknowledgement, alertLevels, displayLevelOf, emergencyRules, finalize, levels, maxLevel, worstLevel } from '../shared/config/levels.js';
import { rules, assessmentMessages } from '../shared/config/research.js';
import { isolationMonitoring } from '../shared/config/isolation.js';
import { areas } from '../shared/config/areas.js';
import { catalog } from '../shared/config/catalog.js';
import { scenarios } from '../shared/scenarios.js';
import { memoryApi } from '../test-support/memory-api.js';

const names = ['normal', 'advisory', 'caution', 'warning', 'emergency', 'unavailable'];
const areaIds = areas.map(a => a.id);

test('item 1: cinco níveis + Unavailable com cor, ícone e prioridade da seção 2.1', () => {
  assert.deepEqual(Object.keys(levels), names);
  assert.deepEqual(names.map(n => levels[n].color), ['#22C55E', '#38BDF8', '#EAB308', '#F97316', '#EF4444', '#64748B']);
  assert.deepEqual(names.map(n => levels[n].icon), ['CircleCheck', 'Info', 'TriangleAlert', 'OctagonAlert', 'Siren', 'CircleDashed']);
  assert.deepEqual(alertLevels, ['advisory', 'caution', 'warning', 'emergency']);
  assert.equal(maxLevel(['advisory', null, 'warning', 'caution']), 'warning');
  assert.equal(maxLevel([]), null);
  // insufficient_data, stale e not_applicable continuam como status e aparecem como Unavailable.
  for (const status of ['insufficient_data', 'stale', 'not_applicable', 'no_data', 'baseline_collecting']) assert.equal(displayLevelOf(status, null), 'unavailable');
  for (const status of ['assessed', 'no_demonstrative_signal']) assert.equal(displayLevelOf(status, null), 'normal');
  assert.equal(displayLevelOf('assessed', 'caution'), 'caution');
  // Emergency > Warning > Caution > Unavailable de sensor crítico > Advisory > Normal > Unavailable comum.
  const item = (displayLevel, critical = false) => ({ displayLevel, critical, level: alertLevels.includes(displayLevel) ? displayLevel : null, indicator: displayLevel + critical });
  const order = [item('unavailable'), item('normal'), item('advisory'), item('unavailable', true), item('caution'), item('warning'), item('emergency')];
  for (let i = 1; i < order.length; i++) assert.equal(worstLevel(order.slice(0, i + 1)).indicator, order[i].indicator);
  assert.equal(worstLevel([]).displayLevel, 'unavailable');
  assert.equal(worstLevel([item('normal'), item('unavailable')]).displayLevel, 'normal');
});

test('item 1: toda avaliação usa os nomes novos e Emergency só vem de pressão da cabine ou O2', async () => {
  for (const scenario of scenarios) {
    const api = await memoryApi();
    const run = await api.scenario(scenario.id);
    assert.equal(run.status, 201, scenario.id);
    for (const area of areaIds) {
      const { assessments } = (await api.get('/areas/' + area)).body;
      for (const e of assessments) {
        assert.ok(e.level === null || alertLevels.includes(e.level), `${scenario.id}/${e.indicator}: ${e.level}`);
        assert.ok(names.includes(e.displayLevel));
        assert.equal(e.displayLevel, displayLevelOf(e.status, e.level));
        assert.equal(e.requiresAcknowledgement, ['warning', 'emergency'].includes(e.level));
        if (e.level === 'emergency') assert.ok(emergencyRules.includes(e.rule.id), e.indicator);
        if (e.level) assert.ok(e.message && !/attention|risk level/i.test(e.message));
      }
    }
  }
  assert.deepEqual(emergencyRules, ['cabin_pressure_total', 'cabin_inspired_oxygen']);
});

test('item 1: trava rebaixa para Warning qualquer Emergency fora da lista permitida', async () => {
  const api = await memoryApi();
  await api.scenario('depressurization');
  const pressure = async () => (await api.get('/areas/hostile_closed_environment')).body.assessments.find(e => e.indicator === 'cabin_pressure');
  assert.equal((await pressure()).level, 'emergency');
  const removed = emergencyRules.splice(emergencyRules.indexOf('cabin_pressure_total'), 1);
  try { assert.equal((await pressure()).level, 'warning'); } finally { emergencyRules.unshift(...removed); }
  assert.equal((await pressure()).level, 'emergency');
});

test('item 6: mensagens "What to do" terminam com o CMO em Caution ou acima e remetem ao procedimento nas ações operacionais', () => {
  assert.equal(finalize('Noise is high.', 'advisory'), 'Noise is high.');
  assert.equal(finalize('Noise is high.', 'caution'), 'Noise is high. Talk to your Crew Medical Officer.');
  assert.equal(finalize('Check the life support system.', 'caution', true), "Check the life support system. Follow your mission's approved procedure. Talk to your Crew Medical Officer.");
  assert.equal(finalize('Follow the EVA procedure. Talk to your Crew Medical Officer.', 'warning', true), 'Follow the EVA procedure. Talk to your Crew Medical Officer.');
  // Textos da especificação v2, seção 3.
  assert.equal(rules.pressure.messages.emergency, 'CABIN PRESSURE OUTSIDE SAFE LIMITS. Follow the depressurization emergency procedure now.');
  assert.equal(rules.oxygen.messages.emergency, 'OXYGEN OUTSIDE SAFE LIMITS. Follow the cabin atmosphere emergency procedure now.');
  assert.equal(rules.comm.messages.advisory, 'No contact with Earth. Follow the onboard procedure with your Crew Medical Officer.');
  assert.equal(assessmentMessages.stale, 'No reliable data. Check the sensor and measure again.');
  assert.match(acknowledgement.note, /^No acknowledgement does not mean loss of consciousness\./);
  const texts = [];
  const collect = (messages, operational) => {
    for (const [key, value] of Object.entries(messages ?? {})) {
      if (typeof value === 'string') texts.push([key, value, operational]); else collect(value, operational);
    }
  };
  for (const rule of Object.values(rules)) collect(rule.messages, rule.operational);
  for (const config of Object.values(isolationMonitoring)) for (const rule of config.rules) texts.push([rule.level, rule.message, false]);
  assert.ok(texts.length > 40);
  for (const [level, text, operational] of texts) {
    const final = finalize(text, level, operational);
    if (['caution', 'warning', 'emergency'].includes(level)) assert.match(final, /Crew Medical Officer/, text);
    if (operational && alertLevels.includes(level)) assert.match(final, /procedure/i, text);
    assert.doesNotMatch(final, /diagnos|you have a |caused by/i);
  }
});

test('item 3: toda regra com nível declara a origem do nível como proposta do time', () => {
  for (const [name, rule] of Object.entries(rules)) {
    if (!rule.messages) continue;
    const provenance = rule.levelSource ?? rule.source;
    assert.equal(provenance.classification, 'team_proposal', name);
    assert.ok(provenance.section, name);
  }
});

test('item 7: títulos, resumos, conteúdo das áreas e rótulos do catálogo em inglês', () => {
  const portuguese = /[ãõçáéíóúâêôà]|\b(da|para|com|sono|fadiga|humor|estresse|qualidade)\b/i;
  for (const area of areas) {
    for (const text of [area.title, area.summary, ...area.content.flatMap(c => [c.title, c.body])]) assert.doesNotMatch(text, portuguese, text);
  }
  for (const definitions of Object.values(catalog)) for (const d of definitions) {
    assert.doesNotMatch(d.label, portuguese, d.label);
    if (d.description) assert.doesNotMatch(d.description, portuguese, d.description);
  }
  assert.deepEqual(areas.map(a => a.title), ['Space radiation', 'Isolation and confinement', 'Distance from Earth', 'Gravity fields', 'Hostile closed environment']);
});
