// Regenera os exemplos que dependem do catálogo e das rotas v2: `node docs/generate-examples.mjs`.
// Usa o roteador e o store em memória, isto é, o mesmo caminho do modo local do navegador.
import { readFile, writeFile } from 'node:fs/promises';
import { createRouter } from '../shared/router.js';
import { registerRoutes } from '../shared/routes.js';
import { createStore, parseStored } from '../shared/store-core.js';
import { areas } from '../shared/config/areas.js';

const file = new URL('./examples.json', import.meta.url);
const examples = JSON.parse(await readFile(file, 'utf8'));
let clock = new Date(examples.generatedAt);
const store = await createStore(parseStored(null, clock), async () => {}, clock);
const router = createRouter();
registerRoutes(router, store, () => clock);
const astronautId = 'astro_demo_001', query = { astronautId, dataset: 'simulated' };
const search = '?' + new URLSearchParams(query);
const get = async (path, extra = {}) => {
  const { status, body } = await router.handle('GET', '/api/v1' + path, { query: { ...query, ...extra } });
  return { request: 'GET /api/v1' + path + search, status, response: body };
};
const post = async (path, body) => {
  const result = await router.handle('POST', '/api/v1' + path, { body });
  return { request: 'POST /api/v1' + path, body, status: result.status, response: result.body };
};

examples.description = 'Simulated examples; ids and dates vary. Levels follow specification v2 (normal, advisory, caution, warning, emergency, unavailable).';
examples.detail = await Promise.all(areas.map(area => get('/areas/' + area.id)));
examples.overview = await get('/overview');
examples.history = await get('/areas/radiation/history');

// Fluxo v2: perfil padrão, cenário de emergência, confirmação e relatório para a Terra.
const v2 = {};
v2.profile = await post('/demo/profile', { astronautId });
v2.scenarios = await get('/scenarios');
v2.scenario = await post('/scenarios/depressurization', { astronautId, id: 'example-depressurization' });
v2.overview = await get('/overview');
v2.alerts = await get('/alerts');
const alert = v2.alerts.response.active.find(a => a.requiresAcknowledgement);
v2.groundReportsSent = await get('/ground-reports');
clock = new Date(clock.getTime() + 60000);
v2.acknowledge = await post('/alerts/' + alert.id + '/acknowledge', { astronautId, dataset: 'simulated' });
clock = new Date(clock.getTime() + 40 * 60000);
v2.groundReportsReplied = await get('/ground-reports');
v2.manualGroundReport = await post('/ground-reports', { astronautId, id: 'example-manual-report', source: 'simulated',
  actions: [{ recordedAt: clock.toISOString(), description: 'Crew moved to the pressurized module.' }] });
// As respostas completas são grandes; os exemplos guardam só o essencial de cada avaliação.
const slim = e => ({ indicator: e.indicator, status: e.status, level: e.level, displayLevel: e.displayLevel, message: e.message, value: e.value ?? null });
v2.scenario.response = { ...v2.scenario.response, records: v2.scenario.response.records.length + ' records',
  operation: { ...v2.scenario.response.operation, children: v2.scenario.response.operation.children.length + ' child operations',
    recordIds: v2.scenario.response.operation.recordIds.length + ' ids',
    calculation: { ...v2.scenario.response.operation.calculation, assessments: v2.scenario.response.operation.calculation.assessments.map(slim) } } };
v2.profile.response = { ...v2.profile.response, records: v2.profile.response.records.length + ' records',
  operation: { ...v2.profile.response.operation, children: v2.profile.response.operation.children.map(c => ({ kind: c.kind, id: c.id, input: c.input })) } };
v2.alerts.response = { ...v2.alerts.response, assessments: v2.alerts.response.assessments.length + ' assessments',
  alerts: v2.alerts.response.alerts.map(slim), inObservation: v2.alerts.response.inObservation.map(slim) };
examples.v2 = v2;
await writeFile(file, JSON.stringify(examples, null, 2) + '\n');
console.log('docs/examples.json updated');
