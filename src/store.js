import { mkdir, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createDemo, isolationDemoAdditions } from './demo.js';
import { newAssessments } from './assessment-history.js';
import { ApiError } from './validation.js';

function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key =>
    JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
  return JSON.stringify(value);
}

export async function openStore(file, now = new Date()) {
  await mkdir(dirname(file), { recursive: true });
  let records, operations = [], assessments = [], versioned = false;
  try {
    const stored = JSON.parse(await readFile(file, 'utf8'));
    if (Array.isArray(stored)) records = stored;
    else if (stored?.schemaVersion === 2 && Array.isArray(stored.records) && Array.isArray(stored.operations)) {
      records = stored.records; operations = stored.operations; versioned = true;
      if (stored.assessments !== undefined && !Array.isArray(stored.assessments)) throw new Error('Invalid assessment history.');
      assessments = stored.assessments ?? [];
    } else throw new Error('Armazenamento deve ser array legado ou objeto schemaVersion 2 com records/operations.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    records = createDemo(now);
    await writeFile(file, JSON.stringify(records, null, 2), { flag: 'wx' });
  }
  // Both audit input and resulting records commit in a single atomic rename.
  async function commit(nextRecords, nextOperations = operations, nextVersioned = versioned, nextAssessments = assessments) {
    const temporary = `${file}.${randomUUID()}.tmp`;
    const payload = nextVersioned ? { schemaVersion: 2, records: nextRecords, operations: nextOperations, ...(nextAssessments.length ? { assessments:nextAssessments } : {}) } : nextRecords;
    try {
      await writeFile(temporary, JSON.stringify(payload, null, 2));
      await rename(temporary, file);
      records = nextRecords; operations = nextOperations; versioned = nextVersioned; assessments = nextAssessments;
    } finally { await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
  }
  const additions = isolationDemoAdditions(records, now);
  if (additions.length) await commit([...records, ...additions]);
  let queue = Promise.resolve();
  function enqueue(action) {
    const pending = queue.then(action);
    queue = pending.catch(() => {});
    return pending;
  }
  const result = (operation, replayed) => structuredClone({ operation,
    records: operation.recordIds.map(id => records.find(r => r.id === id)), replayed });
  function persistBatch(batch, incoming, time) {
    const nextRecords = [...records,...batch], nextOperations = [...operations,...incoming];
    const added = newAssessments(nextRecords,nextOperations,assessments,batch,
      incoming.flatMap(o => [o,...(o.children ?? [])]),time);
    return commit(nextRecords,nextOperations,versioned || incoming.length > 0 || added.length > 0,[...assessments,...added]);
  }
  return {
    operations: () => structuredClone(operations),
    assessments: () => structuredClone(assessments),
    all: () => structuredClone(records),
    append(batch, time = Date.now()) { return enqueue(() => persistBatch(batch,[],time)); },
    findOperation(kind, astronautId, id) {
      const operation = operations.flatMap(o => [o,...(o.children ?? [])]).find(o => o.kind === kind && o.astronautId === astronautId && o.id === id);
      return operation ? result(operation, false) : null;
    },
    saveOperation(operation, batch, time = Date.now(), prepare) {
      return enqueue(async () => {
        const previous = operations.find(o => o.kind === operation.kind && o.astronautId === operation.astronautId && o.id === operation.id);
        if (previous) {
          if (canonical(previous.input) !== canonical(operation.input)) throw new ApiError(409, 'OPERATION_CONFLICT', 'Identificador já utilizado com conteúdo diferente.');
          return result(previous, true);
        }
        if (operation.kind === 'pvt' && records.some(r => r.astronautId === operation.astronautId && r.areaId === 'isolation_confinement'
          && r.groupId === operation.id && r.indicator.startsWith('pvt_'))) throw new ApiError(409, 'OPERATION_CONFLICT', 'Identificador já utilizado em agregados PVT legados.');
        if (prepare) operation = prepare(operation,[...records,...batch],[...operations,operation]);
        await persistBatch(batch,[operation],time);
        return result(operation, false);
      });
    },
  };
}
