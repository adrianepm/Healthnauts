import { randomUUID } from 'node:crypto';
import { ASTRONAUT } from './demo.js';
export class ApiError extends Error {
  constructor(status, code, message, fields = []) { super(message); Object.assign(this, { status, code, fields }); }
}
export const invalid = (field, message) => { throw new ApiError(400, 'VALIDATION_ERROR', message, [{ field, message }]); };
export function timestamp(value) {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match || !Number.isFinite(Date.parse(value))) return false;
  const [, y, m, d, h, min, s, zone] = match;
  const days = new Date(Date.UTC(Number(y), Number(m), 0)).getUTCDate();
  return +m >= 1 && +m <= 12 && +d >= 1 && +d <= days && +h < 24 && +min < 60 && +s < 60
    && (zone === 'Z' || (+zone.slice(1, 3) <= 23 && +zone.slice(4) <= 59));
}
export function queryContext(query) {
  if (query.astronautId !== ASTRONAUT) invalid('astronautId', `Use ${ASTRONAUT}.`);
  const dataset = query.dataset ?? 'simulated';
  if (!['simulated', 'real'].includes(dataset)) invalid('dataset', 'Use simulated ou real.');
  return { apiVersion: 'v1', astronautId: ASTRONAUT, dataset, isSimulated: dataset === 'simulated' };
}
export function validateBatch(body, areaId, definitions) {
  if (!body || body.astronautId !== ASTRONAUT) invalid('astronautId', `Use ${ASTRONAUT}.`);
  if (!Array.isArray(body.records) || !body.records.length) invalid('records', 'Envie um array não vazio.');
  if (body.records.length > 100) invalid('records', 'Envie no máximo 100 registros por lote.');
  const createdAt = new Date().toISOString();
  const batch = body.records.map((r, index) => {
    const fail = (field, message) => invalid(`records[${index}].${field}`, message);
    if (!r || typeof r !== 'object' || Array.isArray(r)) fail('record', 'Envie um objeto.');
    const allowed = ['indicator', 'value', 'unit', 'recordedAt', 'source', 'notes', 'periodStart', 'groupId'];
    for (const key of Object.keys(r)) if (!allowed.includes(key)) fail(key, 'Campo desconhecido ou gerado pelo servidor.');
    const def = definitions.find(d => d.id === r.indicator);
    if (!def) fail('indicator', 'Indicador não pertence à área.');
    if (def.valueType === 'text') {
      if (typeof r.value !== 'string' || !r.value.trim() || r.value.length > 10000) fail('value', 'Envie texto não vazio, até 10000 caracteres.');
    } else {
      if (typeof r.value !== 'number' || !Number.isFinite(r.value)) fail('value', 'Envie um número finito.');
      const constraint = numericError(r.value, def.scale);
      if (constraint) fail('value', constraint);
    }
    if (r.unit !== def.unit) fail('unit', `Unidade esperada: ${JSON.stringify(def.unit)}.`);
    if (!timestamp(r.recordedAt)) fail('recordedAt', 'Envie data ISO 8601 válida com fuso.');
    if (!['manual', 'sensor', 'simulated'].includes(r.source)) fail('source', 'Use manual, sensor ou simulated.');
    if (r.notes != null && (typeof r.notes !== 'string' || r.notes.length > 10000)) fail('notes', 'Envie texto até 10000 caracteres ou null.');
    if (def.periodStartRequired && !r.periodStart) fail('periodStart', 'Início do intervalo obrigatório.');
    if (r.periodStart !== undefined) {
      if (!(def.periodStartRequired || def.allowsPeriodStart)) fail('periodStart', 'Indicador não admite intervalo.');
      if (!timestamp(r.periodStart) || Date.parse(r.periodStart) >= Date.parse(r.recordedAt)) fail('periodStart', 'Use data válida anterior a recordedAt.');
    }
    if (r.groupId !== undefined && (typeof r.groupId !== 'string' || !r.groupId.trim() || r.groupId.length > 200)) fail('groupId', 'Envie identificador textual de até 200 caracteres.');
    if (def.groupRequired && !r.groupId) fail('groupId', 'Identificador de execução obrigatório.');
    return { ...r, id: randomUUID(), astronautId: ASTRONAUT, areaId, isSimulated: r.source === 'simulated', notes: r.notes ?? null, createdAt };
  });
  const grouped = new Map();
  for (const record of batch) {
    const def = definitions.find(d => d.id === record.indicator);
    if (!def.aggregateGroup) continue;
    const key = `${def.aggregateGroup}:${record.groupId}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(record);
  }
  for (const records of grouped.values()) {
    const group = definitions.find(d => d.id === records[0].indicator).aggregateGroup;
    const expected = definitions.filter(d => d.aggregateGroup === group).map(d => d.id).sort();
    if (JSON.stringify(records.map(r => r.indicator).sort()) !== JSON.stringify(expected)) {
      invalid('records', 'Envie exatamente um de cada agregado PVT-B por groupId no mesmo lote.');
    }
    if (records.some(r => r.source !== records[0].source || Date.parse(r.recordedAt) !== Date.parse(records[0].recordedAt))) {
      invalid('records', 'Agregados da mesma execução devem ter a mesma origem e instante.');
    }
  }
  return batch;
}

export function numericError(value, constraint) {
  if (!constraint) return null;
  const { min, max, numericType, precision, step } = constraint;
  if (numericType === 'integer' && !Number.isSafeInteger(value)) return 'Envie um inteiro seguro.';
  if ((min !== undefined && value < min) || (max !== undefined && value > max)) return `Valor fora dos limites do catálogo (${min ?? 'sem mínimo'} a ${max ?? 'sem máximo'}).`;
  if (precision !== undefined && Math.abs(value - Number(value.toFixed(precision))) > 1e-10) return `Use no máximo ${precision} casas decimais.`;
  if (step !== undefined) {
    const steps = (value - (min ?? 0)) / step;
    if (Math.abs(steps - Math.round(steps)) > 1e-7) return `Use incrementos de ${step}.`;
  }
  return null;
}
