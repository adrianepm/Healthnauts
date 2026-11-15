import { calculateSleep, calculatePvt } from './calculations.js';
import { areas } from './config/areas.js';
import { catalog } from './config/catalog.js';
import { DAY, groups, restrictedExport } from './config/research.js';
import { acknowledgement, footer, levels, worstLevel } from './config/levels.js';
import { datasetFor, evaluateArea, news2, recordScope } from './evaluation.js';
import { observationList } from './assessment-history.js';
import { buildAlerts, currentAssessments } from './alerts.js';
import { buildGroundReports, linkAt, missionTimeline, transmissionSource } from './ground-reports.js';
import { ensureProfile } from './profile.js';
import { calculateResearch, inDataset, operationAreas } from './research-operations.js';
import { scenarios, buildScenario } from './scenarios.js';
import { chronological, trends } from './trends.js';
import { ApiError, invalid, queryContext, timestamp, validAstronaut, validateBatch, validId } from './validation.js';

export const areaResearch = areaId => ({
  groups:groups[areaId], operations:Object.keys(operationAreas).filter(kind => operationAreas[kind] === areaId),
  disclaimer:'This tool supports self-monitoring. It does not diagnose any condition.',
});
const areaIds = Object.keys(groups);
function reportSnapshot(operation, records, operations, time) {
  const ctx = { astronautId:operation.astronautId, dataset:operation.source === 'simulated' ? 'simulated' : 'real' };
  const recent = recordScope(records,ctx).filter(r => Date.parse(r.recordedAt) > time-DAY &&
    Date.parse(r.recordedAt) <= time && !restrictedExport.has(r.indicator));
  const evaluations = areaIds.flatMap(area => evaluateArea(area,records,operations,ctx,time)).filter(item => !restrictedExport.has(item.indicator));
  const rulesTriggered = evaluations.filter(e => e.level);
  const relevantIds = new Set(rulesTriggered.flatMap(e => e.recordIds));
  const scoped = recordScope(records,ctx).filter(r => Date.parse(r.recordedAt)<=time && !restrictedExport.has(r.indicator));
  const latest = new Map();
  for (const r of recent) {
    const key = JSON.stringify([r.areaId,r.indicator,r.source]);
    if (!latest.has(key) || Date.parse(latest.get(key).recordedAt) <= Date.parse(r.recordedAt)) latest.set(key,r);
  }
  for (const r of latest.values()) relevantIds.add(r.id);
  const mission = operations.flatMap(o => [o,...(o.children ?? [])]).filter(o => o.kind === 'mission' && o.astronautId === ctx.astronautId &&
    inDataset(o,ctx.dataset) && Date.parse(o.input.recordedAt)<=time)
    .sort((a,b) => Date.parse(a.input.recordedAt)-Date.parse(b.input.recordedAt)).at(-1);
  return { ...ctx, status:'prepared', deliveryStatus:'not_sent', preparedAt:new Date(time).toISOString(),
    mission:mission?.input ?? null,
    communication:mission ? { status:mission.input.communication,...mission.calculation } : { status:'unknown',estimatedResponseSeconds:null },
    indicators:scoped.filter(r => relevantIds.has(r.id)).map(({id,areaId,indicator,value,unit,recordedAt,source}) => ({ id,areaId,indicator,value,unit,recordedAt,source })),
    evaluations:rulesTriggered,
    trends:areaIds.flatMap(area => trends(recent.filter(r => r.areaId === area),
      catalog[area].filter(d => !restrictedExport.has(d.id)),ctx.dataset)).filter(t => t.status === 'available'),
    actions:operation.input.actions };
}

// Registra todas as rotas num roteador com get/post (Express ou shared/router.js).
export function registerRoutes(app, store, now = () => new Date()) {
  const filtered = ctx => store.all().filter(r => r.astronautId === ctx.astronautId && (ctx.dataset === 'simulated' ? r.source === 'simulated' : ['manual', 'sensor'].includes(r.source)));
  const latest = (records, definitions) => definitions.map(d => records.filter(r => r.indicator === d.id).sort(chronological).at(-1)).filter(Boolean);
  const areaOf = req => {
    const area = areas.find(a => a.id === req.params.areaId);
    if (!area) throw new ApiError(404, 'AREA_NOT_FOUND', 'Área não encontrada.');
    return area;
  };
  const missing = () => { throw new ApiError(404,'OPERATION_NOT_FOUND','Resource not found in this dataset.'); };

  // Histórico, alertas e relatórios do astronauta/dataset no instante pedido.
  const lifecycle = (ctx, time) => {
    const history = store.assessments().filter(e => e.astronautId === ctx.astronautId && e.dataset === ctx.dataset);
    const alerts = buildAlerts(history, store.acknowledgements(), time);
    return { history, alerts };
  };
  const reportsFor = (ctx, alerts, time) => buildGroundReports({ alerts, stored: store.groundReports(), operations: store.operations(), ctx, time });

  app.get('/api/v1/overview', (req, res) => {
    const ctx = queryContext(req.query), time = now().getTime();
    const records = filtered(ctx), all = store.all(), operations = store.operations();
    const everything = [];
    let vitals = [];
    const summary = areas.map(area => {
      const own = records.filter(r => r.areaId === area.id).sort(chronological);
      const current = currentAssessments(evaluateArea(area.id, all, operations, ctx, time));
      everything.push(...current);
      // Sinais vitais têm nível próprio, separado do nível da área de gravidade.
      if (area.id === 'gravity_fields') vitals = current.filter(item => item.group === 'vital_signs');
      const scoped = area.id === 'gravity_fields' ? current.filter(item => item.group !== 'vital_signs') : current;
      const byGroup = Object.fromEntries(Object.keys(groups[area.id]).map(group => [group, worstLevel(current.filter(item => item.group === group))]));
      const worst = worstLevel(scoped);
      return { areaId: area.id, title: area.title, summary: area.summary, isSimulated: ctx.isSimulated,
        dataStatus: own.length ? 'available' : 'no_data', recordCount: own.length,
        lastRecordedAt: own.at(-1)?.recordedAt ?? null, latestRecord: own.at(-1) ?? null,
        highlights: latest(own, catalog[area.id].filter(d => area.highlightIndicators.includes(d.id))),
        level: worst.level, displayLevel: worst.displayLevel, headline: worst, groups: byGroup };
    });
    const overall = worstLevel(everything);
    const { alerts } = lifecycle(ctx, time);
    res.json({ ...ctx, asOf: new Date(time).toISOString(), overallLevel: overall.level, overallDisplayLevel: overall.displayLevel, headline: overall,
      vitalSigns: worstLevel(vitals), activeAlerts: alerts.filter(a => a.active), link: linkAt(missionTimeline(operations, ctx), time),
      levels, footer, areas: summary });
  });

  // Rotas específicas de isolamento vêm antes das genéricas de área.
  for (const [path, kind, calculate] of [['sleep-episodes', 'sleep', calculateSleep], ['pvt-sessions', 'pvt', calculatePvt]]) {
    const base = `/api/v1/areas/isolation_confinement/${path}`;
    const response = result => ({ apiVersion: 'v1', astronautId: result.operation.astronautId,
      replayed: result.replayed, operation: result.operation, records: result.records });
    app.post(base, async (req, res) => {
      const { operation, records } = calculate(req.body);
      const result = await store.saveOperation(operation, records,now().getTime());
      res.status(result.replayed ? 200 : 201).json(response(result));
    });
    app.get(`${base}/:operationId`, (req, res) => {
      const ctx = queryContext(req.query);
      const result = store.findOperation(kind, ctx.astronautId, req.params.operationId);
      if (!result || (result.operation.source === 'simulated') !== ctx.isSimulated) throw new ApiError(404, 'OPERATION_NOT_FOUND', 'Operação não encontrada neste dataset.');
      res.json(response(result));
    });
  }

  app.get('/api/v1/areas/:areaId', (req, res) => {
    const found = areaOf(req), ctx = queryContext(req.query);
    const { highlightIndicators, content, references, ...area } = found;
    const assessments = evaluateArea(area.id,store.all(),store.operations(),ctx,now().getTime());
    res.json({ ...ctx, area, content, references, indicatorDefinitions: catalog[area.id], ...areaResearch(area.id),
      latestRecords: latest(filtered(ctx).filter(r => r.areaId === area.id), catalog[area.id]), assessments,
      ...(area.id === 'isolation_confinement' ? { monitoring:assessments } : {}) });
  });
  app.get('/api/v1/areas/:areaId/history', (req, res) => {
    const area = areaOf(req), ctx = queryContext(req.query);
    const { indicator, from, to } = req.query;
    let definitions = catalog[area.id];
    if (indicator !== undefined) {
      definitions = definitions.filter(d => d.id === indicator);
      if (!definitions.length) invalid('indicator', 'Indicador não pertence à área.');
    }
    if (from !== undefined && !timestamp(from)) invalid('from', 'Envie data ISO 8601 válida com fuso.');
    if (to !== undefined && !timestamp(to)) invalid('to', 'Envie data ISO 8601 válida com fuso.');
    const end = to === undefined ? now().getTime() : Date.parse(to);
    const start = from === undefined ? end - 7 * 86400000 : Date.parse(from);
    if (start >= end) invalid('from', 'from deve ser anterior a to.');
    const records = filtered(ctx).filter(r => r.areaId === area.id && definitions.some(d => d.id === r.indicator)
      && Date.parse(r.recordedAt) >= start && Date.parse(r.recordedAt) < end).sort(chronological);
    if (records.length > 10000) throw new ApiError(400, 'HISTORY_TOO_LARGE', 'Consulte um intervalo menor; limite de 10000 registros por resposta.');
    const assessments = evaluateArea(area.id,store.all(),store.operations(),ctx,end-1)
      .filter(item => indicator === undefined || item.indicator === indicator);
    res.json({ ...ctx, areaId: area.id, period: { from: new Date(start).toISOString(), to: new Date(end).toISOString() }, records,
      trends: trends(records, definitions, ctx.dataset), assessments,
      ...(area.id === 'isolation_confinement' ? { monitoring:assessments } : {}) });
  });
  app.post('/api/v1/areas/:areaId/records', async (req, res) => {
    const area = areaOf(req);
    const records = validateBatch(req.body, area.id, catalog[area.id]);
    await store.append(records,now().getTime());
    res.status(201).json({ apiVersion: 'v1', astronautId: req.body.astronautId, records });
  });

  const response = result => ({ apiVersion:'v1',astronautId:result.operation.astronautId,...result });
  app.get('/api/v1/alerts', (req,res) => {
    const ctx = queryContext(req.query);
    const { history, alerts } = lifecycle(ctx,now().getTime());
    // `alerts` é o histórico de avaliações com nível (contrato antigo); `notifications` é o ciclo de vida (Caution ou acima).
    res.json({ ...ctx, assessments:history, alerts:history.filter(e => e.level), inObservation:observationList(history),
      notifications:alerts, active:alerts.filter(a => a.active), acknowledgement });
  });
  app.post('/api/v1/alerts/:id/acknowledge', async (req,res) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => !['astronautId','dataset'].includes(k))) invalid('body','Send an astronautId and, optionally, a dataset.');
    const ctx = queryContext(body), clock = now();
    const find = () => lifecycle(ctx,clock.getTime()).alerts.find(a => a.id === req.params.id);
    const alert = find();
    if (!alert) throw new ApiError(404,'ALERT_NOT_FOUND','Alert not found in this dataset.');
    if (!alert.requiresAcknowledgement) throw new ApiError(409,'ACKNOWLEDGEMENT_NOT_REQUIRED','Only Warning and Emergency alerts are acknowledged.');
    await store.acknowledge({ alertId:alert.id, astronautId:ctx.astronautId, dataset:ctx.dataset, acknowledgedAt:clock.toISOString() });
    res.json({ ...ctx, alert:find(), note:acknowledgement.note });
  });
  app.get('/api/v1/ground-reports', (req,res) => {
    const ctx = queryContext(req.query), time = now().getTime();
    const { alerts } = lifecycle(ctx,time);
    res.json({ ...ctx, asOf:new Date(time).toISOString(), isSimulation:true, link:linkAt(missionTimeline(store.operations(),ctx),time),
      reports:reportsFor(ctx,alerts,time), source:transmissionSource });
  });
  app.post('/api/v1/ground-reports', async (req,res) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => !['astronautId','id','source','actions','note'].includes(k))) invalid('body','Invalid fields.');
    if (!validAstronaut(body.astronautId)) invalid('astronautId','Invalid astronaut identifier.');
    if (!validId(body.id)) invalid('id','Invalid identifier.');
    if (!['manual','sensor','simulated'].includes(body.source)) invalid('source','Use manual, sensor or simulated.');
    if (!Array.isArray(body.actions) || body.actions.length > 50) invalid('actions','Expected up to 50 recorded actions.');
    for (const action of body.actions) {
      if (!action || typeof action !== 'object' || Object.keys(action).some(k => !['recordedAt','description'].includes(k)) || !timestamp(action.recordedAt)
        || typeof action.description !== 'string' || !action.description.trim() || action.description.length > 2000) invalid('actions','Each action needs recordedAt and a description.');
    }
    if (body.note !== undefined && (typeof body.note !== 'string' || body.note.length > 2000)) invalid('note','Invalid text.');
    const clock = now(), time = clock.getTime();
    const ctx = { apiVersion:'v1', astronautId:body.astronautId, dataset:datasetFor(body.source), isSimulated:body.source === 'simulated' };
    const saved = await store.saveGroundReport({ id:body.id, astronautId:body.astronautId, dataset:ctx.dataset, source:body.source,
      createdAt:clock.toISOString(), input:{ actions:body.actions, ...(body.note === undefined ? {} : { note:body.note }) } });
    const report = reportsFor(ctx,lifecycle(ctx,time).alerts,time).find(r => r.id === body.id && r.kind === 'manual');
    res.status(saved.replayed ? 200 : 201).json({ ...ctx, replayed:saved.replayed, report });
  });
  // Perfil padrão da demonstração (missão, referências pré-voo e histórico de dose atestado). Idempotente.
  app.post('/api/v1/demo/profile', async (req,res) => {
    const body = req.body;
    if (!validAstronaut(body?.astronautId) || Object.keys(body).some(k => k !== 'astronautId')) invalid('body','Send an astronautId.');
    const result = await ensureProfile(store,body.astronautId,now());
    res.status(result.replayed ? 200 : 201).json(response(result));
  });
  app.get('/api/v1/mission', (req,res) => {
    const ctx = queryContext(req.query), time = now().getTime();
    const operations = store.operations().flatMap(o => [o,...(o.children ?? [])]).filter(o =>
      o.astronautId === ctx.astronautId && inDataset(o,ctx.dataset) && Date.parse(o.input.recordedAt) <= time);
    const mission = operations.filter(o => o.kind === 'mission').sort((a,b) => Date.parse(a.input.recordedAt)-Date.parse(b.input.recordedAt)).at(-1);
    const references = operations.filter(o => o.kind === 'reference' && (!mission || o.input.missionId === mission.input.missionId));
    res.json({ ...ctx, status:mission ? 'available' : 'insufficient_data', mission:mission ?? null, references });
  });
  for (const [kind,area] of Object.entries(operationAreas)) {
    const base = '/api/v1/areas/' + area + '/operations/' + kind;
    app.post(base,async (req,res) => {
      const clock = now(), time = clock.getTime();
      const { operation,records } = calculateResearch(kind,req.body,clock);
      const prepare = kind === 'report'
        ? (o,rows,ops) => ({ ...o, calculation:reportSnapshot(o,rows,ops,time) })
        : kind === 'vitals' ? o => ({ ...o, calculation:news2(o,records,time) }) : undefined;
      const result = await store.saveOperation(operation,records,time,prepare);
      res.status(result.replayed ? 200 : 201).json(response(result));
    });
    app.get(base+'/:id',(req,res) => {
      const ctx = queryContext(req.query);
      const result = store.findOperation(kind,ctx.astronautId,req.params.id);
      if (!result || !inDataset(result.operation,ctx.dataset)) return missing();
      res.json(response(result));
    });
  }
  app.get('/api/v1/scenarios', (_req,res) => res.json({ apiVersion:'v1',source:'simulated',scenarios }));
  app.post('/api/v1/scenarios/:scenario',async (req,res) => {
    const scenario = scenarios.find(s => s.id === req.params.scenario);
    if (!scenario) return missing();
    const body = req.body;
    if (!validAstronaut(body?.astronautId) || !validId(body?.id) || Object.keys(body).some(k => !['id','astronautId','location'].includes(k))) invalid('body','Send an astronautId and a run id.');
    if (body.location !== undefined && !validId(body.location)) invalid('location','Invalid identifier.');
    const clock = now(), time = clock.getTime();
    // Os cenários rodam sobre o perfil padrão, para a dose de carreira continuar avaliada.
    await ensureProfile(store,body.astronautId,clock);
    const { records, operation } = buildScenario(scenario,body,clock);
    const result = await store.saveOperation(operation,records,time,(o,rows,ops) => {
      const ctx = { astronautId:body.astronautId, dataset:'simulated' };
      const assessments = evaluateArea(scenario.areaId,rows,ops,ctx,time);
      const report = o.children.find(child => child.kind === 'report');
      if (report) report.calculation = reportSnapshot(report,rows,ops,time);
      return { ...o, calculation:{ assessments, reportId:report?.id ?? null } };
    });
    res.status(result.replayed ? 200 : 201).json(response(result));
  });
}
