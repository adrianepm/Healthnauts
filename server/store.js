import { mkdir, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createStore, parseStored } from '../shared/store-core.js';

// Adaptador de persistência em arquivo do "computador de bordo". As regras ficam em shared/store-core.js.
export async function openStore(file, now = new Date()) {
  await mkdir(dirname(file), { recursive: true });
  let state;
  try {
    state = parseStored(JSON.parse(await readFile(file, 'utf8')), now);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    state = parseStored(null, now);
    await writeFile(file, JSON.stringify(state.records, null, 2), { flag: 'wx' });
  }
  // Entrada de auditoria e registros resultantes entram num único rename atômico.
  async function persist(payload) {
    const temporary = `${file}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, JSON.stringify(payload, null, 2));
      await rename(temporary, file);
    } finally { await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
  }
  return createStore(state, persist, now);
}
