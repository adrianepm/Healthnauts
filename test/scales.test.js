// Escala de 1 a 10 do check-in (src/lib/scales.ts): grava n × 10 na escala interna de 0 a 100 das regras de shared/,
// que não mudaram. Dados antigos (0 a 100) continuam aceitos e aparecem divididos por 10.
import test from 'node:test';
import assert from 'node:assert/strict';
import { TEN_POINT, fmtTen, toAnswer, toStored, toTen } from '../src/lib/scales.ts';
import { validateBatch } from '../shared/validation.js';
import { catalog } from '../shared/config/catalog.js';
import { isolationMonitoring } from '../shared/config/isolation.js';

test('1 a 10 vira 10 a 100 e volta igual', () => {
  for (let n = 1; n <= 10; n++) { assert.equal(toStored(n), n * 10); assert.equal(toTen(toStored(n)), n); assert.equal(toAnswer(toStored(n)), n); }
  assert.equal(toStored(0), 10); assert.equal(toStored(12), 100); // fora da escala: preso nas pontas
  assert.equal(fmtTen(73), '7.3'); assert.equal(fmtTen(70), '7'); // dado antigo e novo
});

test('valores gravados passam na validação do catálogo de shared/ (escala 0 a 100 intacta)', () => {
  const recordedAt = '2026-11-15T08:00:00Z';
  for (const indicator of TEN_POINT) {
    const records = [1, 5, 10].map((n) => ({ indicator, value: toStored(n), unit: null, recordedAt, source: 'manual' }));
    assert.equal(validateBatch({ astronautId: 'astro_demo_001', records }, 'isolation_confinement', catalog.isolation_confinement).length, 3);
  }
});

test('regras de humor, estresse e qualidade do sono continuam com o piso de 5 pontos na escala interna', () => {
  for (const indicator of TEN_POINT) assert.equal(isolationMonitoring[indicator].baseline.minStandardDeviation, 5);
  assert.equal(toTen(5), 0.5); // meio ponto na escala da tela
});
