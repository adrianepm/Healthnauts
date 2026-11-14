import { createDemo, isolationDemoAdditions } from './demo.js';
import { newAssessments } from './assessment-history.js';
import { ApiError } from './validation.js';

function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key =>
    JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
  return JSON.stringify(value);
}
const optional = (stored, key) => {
  if (stored[key] !== undefined && !Array.isArray(stored[key])) throw new Error('Invalid ' + key + ' history.');
  return stored[key] ?? [];
};

// Aceita o array legado ou o objeto schemaVersion 2; null cria a demonstração inicial.
export function parseStored(stored, now = new Date()) {
  if (stored === null) return { records: createDemo(now), operations: [], assessments: [], acknowledgements: [], groundReports: [], versioned: false };
  if (Array.isArray(stored)) return { records: stored, operations: [], assessments: [], acknowledgements: [], groundReports: [], versioned: false };
  if (stored?.schemaVersion === 2 && Array.isArray(stored.records) && Array.isArray(stored.operations)) {
    return { records: stored.records, operations: stored.operations, assessments: optional(stored, 'assessments'),
      acknowledgements: optional(stored, 'acknowledgements'), groundReports: optional(stored, 'groundReports'), versioned: true };
  }
  throw new Error('Armazenamento deve ser array legado ou objeto schemaVersion 2 com records/operations.');
}

// Núcleo puro do store. `persist(payload)` grava o estado completo de forma atômica
// (arquivo no Node, localStorage no navegador); o estado em memória só muda depois que ele conclui.
export async function createStore(initial, persist, now = new Date()) {
  let state = { ...initial };
  const payloadOf = s => s.versioned ? { schemaVersion: 2, records: s.records, operations: s.operations,
    ...(s.assessments.length ? { assessments: s.assessments } : {}),
    ...(s.acknowledgements.length ? { acknowledgements: s.acknowledgements } : {}),
    ...(s.groundReports.length ? { groundReports: s.groundReports } : {}) } : s.records;
  async function commit(changes) {
    const next = { ...state, ...changes };
    await persist(payloadOf(next));
    state = next;
  }
  const additions = isolationDemoAdditions(state.records, now);
  if (additions.length) await commit({ records: [...state.records, ...additions] });
  let queue = Promise.resolve();
  function enqueue(action) {
    const pending = queue.then(action);
    queue = pending.catch(() => {});
    return pending;
  }
  const result = (operation, replayed) => structuredClone({ operation,
    records: operation.recordIds.map(id => state.records.find(r => r.id === id)), replayed });
  function persistBatch(batch, incoming, time) {
    const records = [...state.records, ...batch], operations = [...state.operations, ...incoming];
    const added = newAssessments(records, operations, state.assessments, batch,
      incoming.flatMap(o => [o, ...(o.children ?? [])]), time);
    return commit({ records, operations, assessments: [...state.assessments, ...added],
      versioned: state.versioned || incoming.length > 0 || added.length > 0 });
  }
  return {
    operations: () => structuredClone(state.operations),
    assessments: () => structuredClone(state.assessments),
    acknowledgements: () => structuredClone(state.acknowledgements),
    groundReports: () => structuredClone(state.groundReports),
    all: () => structuredClone(state.records),
    append(batch, time = Date.now()) { return enqueue(() => persistBatch(batch, [], time)); },
    findOperation(kind, astronautId, id) {
      const operation = state.operations.flatMap(o => [o, ...(o.children ?? [])]).find(o => o.kind === kind && o.astronautId === astronautId && o.id === id);
      return operation ? result(operation, false) : null;
    },
    saveOperation(operation, batch, time = Date.now(), prepare) {
      return enqueue(async () => {
        const previous = state.operations.find(o => o.kind === operation.kind && o.astronautId === operation.astronautId && o.id === operation.id);
        if (previous) {
          if (canonical(previous.input) !== canonical(operation.input)) throw new ApiError(409, 'OPERATION_CONFLICT', 'Identificador já utilizado com conteúdo diferente.');
          return result(previous, true);
        }
        if (operation.kind === 'pvt' && state.records.some(r => r.astronautId === operation.astronautId && r.areaId === 'isolation_confinement'
          && r.groupId === operation.id && r.indicator.startsWith('pvt_'))) throw new ApiError(409, 'OPERATION_CONFLICT', 'Identificador já utilizado em agregados PVT legados.');
        if (prepare) operation = prepare(operation, [...state.records, ...batch], [...state.operations, operation]);
        await persistBatch(batch, [operation], time);
        return result(operation, false);
      });
    },
    // A primeira confirmação vale; repetir não muda o horário gravado.
    acknowledge(entry) {
      return enqueue(async () => {
        const previous = state.acknowledgements.find(a => a.alertId === entry.alertId && a.astronautId === entry.astronautId && a.dataset === entry.dataset);
        if (previous) return structuredClone(previous);
        await commit({ acknowledgements: [...state.acknowledgements, entry], versioned: true });
        return structuredClone(entry);
      });
    },
    saveGroundReport(report) {
      return enqueue(async () => {
        const previous = state.groundReports.find(r => r.id === report.id && r.astronautId === report.astronautId);
        if (previous) {
          if (canonical(previous.input) !== canonical(report.input)) throw new ApiError(409, 'OPERATION_CONFLICT', 'Identificador já utilizado com conteúdo diferente.');
          return { report: structuredClone(previous), replayed: true };
        }
        await commit({ groundReports: [...state.groundReports, report], versioned: true });
        return { report: structuredClone(report), replayed: false };
      });
    },
  };
}
