import { mkdir, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createDemo } from './demo.js';
export async function openStore(file, now = new Date()) {
  await mkdir(dirname(file), { recursive: true });
  let records;
  try {
    records = JSON.parse(await readFile(file, 'utf8'));
    if (!Array.isArray(records)) throw new Error('O armazenamento deve conter um array JSON.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    records = createDemo(now);
    await writeFile(file, JSON.stringify(records, null, 2), { flag: 'wx' });
  }
  let queue = Promise.resolve();
  return {
    all: () => structuredClone(records),
    append(batch) {
      const operation = queue.then(async () => {
        const next = [...records, ...batch];
        const temporary = `${file}.${randomUUID()}.tmp`;
        try {
          await writeFile(temporary, JSON.stringify(next, null, 2));
          await rename(temporary, file);
          records = next;
        } finally { await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
      });
      queue = operation.catch(() => {});
      return operation;
    },
  };
}
