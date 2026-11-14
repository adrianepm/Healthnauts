import { mkdir, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createDemo, isolationDemoAdditions } from './demo.js';
import { ApiError } from './validation.js';

export async function openStore(file, now = new Date()) {
  await mkdir(dirname(file), { recursive: true });
  let records, operations = [], versioned = false;
  try {
    const stored = JSON.parse(await readFile(file, 'utf8'));
    if (Array.isArray(stored)) records = stored;
    else if (stored?.schemaVersion === 2 && Array.isArray(stored.records) && Array.isArray(stored.operations)) {
      records = stored.records; operations = stored.operations; versioned = true;
    } else throw new Error('Armazenamento deve ser array legado ou objeto schemaVersion 2 com records/operations.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    records = createDemo(now);
    await writeFile(file, JSON.stringify(records, null, 2), { flag: 'wx' });
  }
  // Both audit input and resulting records commit in a single atomic rename.
  async function commit(nextRecords, nextOperations = operations, nextVersioned = versioned) {
    const temporary = `${file}.${randomUUID()}.tmp`;
    const payload = nextVersioned ? { schemaVersion: 2, records: nextRecords, operations: nextOperations } : nextRecords;
    try {
      await writeFile(temporary, JSON.stringify(payload, null, 2));
      await rename(temporary, file);
      records = nextRecords; operations = nextOperations; versioned = nextVersioned;
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
  return {
    all: () => structuredClone(records),
    append(batch) { return enqueue(() => commit([...records, ...batch])); },
    findOperation(kind, astronautId, id) {
      const operation = operations.find(o => o.kind === kind && o.astronautId === astronautId && o.id === id);
      return operation ? result(operation, false) : null;
    },
    saveOperation(operation, batch) {
      return enqueue(async () => {
        const previous = operations.find(o => o.kind === operation.kind && o.astronautId === operation.astronautId && o.id === operation.id);
        if (previous) {
          if (JSON.stringify(previous.input) !== JSON.stringify(operation.input)) throw new ApiError(409, 'OPERATION_CONFLICT', 'Identificador já utilizado com conteúdo diferente.');
          return result(previous, true);
        }
        if (operation.kind === 'pvt' && records.some(r => r.astronautId === operation.astronautId && r.areaId === 'isolation_confinement'
          && r.groupId === operation.id && r.indicator.startsWith('pvt_'))) throw new ApiError(409, 'OPERATION_CONFLICT', 'Identificador já utilizado em agregados PVT legados.');
        await commit([...records, ...batch], [...operations, operation], true);
        return result(operation, false);
      });
    },
  };
}
