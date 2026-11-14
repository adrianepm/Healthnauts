import { catalog } from './config/catalog.js';
import { DAY, groups, restrictedExport } from './config/research.js';
import { evaluateArea, news2, recordScope } from './evaluation.js';
import { observationList } from './assessment-history.js';
import { calculateResearch, inDataset, operationAreas } from './research-operations.js';
import { scenarios, buildScenario } from './scenarios.js';
import { trends } from './trends.js';
import { ApiError, invalid, queryContext, validAstronaut, validId } from './validation.js';

export const areaResearch = areaId => ({
  groups:groups[areaId], operations:Object.keys(operationAreas).filter(kind => operationAreas[kind] === areaId),
  disclaimer:'This tool supports self-monitoring. It does not diagnose any condition.',
});
const areas = Object.keys(groups);
function reportSnapshot(operation, records, operations, time) {
  const ctx = { astronautId:operation.astronautId, dataset:operation.source === 'simulated' ? 'simulated' : 'real' };
  const recent = recordScope(records,ctx).filter(r => Date.parse(r.recordedAt) > time-DAY &&
    Date.parse(r.recordedAt) <= time && !restrictedExport.has(r.indicator));
  const evaluations = areas.flatMap(area => evaluateArea(area,records,operations,ctx,time)).filter(item => !restrictedExport.has(item.indicator));
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
    trends:areas.flatMap(area => trends(recent.filter(r => r.areaId === area),
      catalog[area].filter(d => !restrictedExport.has(d.id)),ctx.dataset)).filter(t => t.status === 'available'),
    actions:operation.input.actions };
}

export function registerResearchRoutes(app, store, now) {
  const missing = () => { throw new ApiError(404,'OPERATION_NOT_FOUND','Resource not found in this dataset.'); };
  const response = result => ({ apiVersion:'v1',astronautId:result.operation.astronautId,...result });
  app.get('/api/v1/alerts', (req,res) => {
    const ctx = queryContext(req.query);
    const history = store.assessments().filter(e => e.astronautId === ctx.astronautId && e.dataset === ctx.dataset);
    res.json({ ...ctx, assessments:history, alerts:history.filter(e => e.level), inObservation:observationList(history) });
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
    if (!validAstronaut(body?.astronautId) || !validId(body?.id) || Object.keys(body).some(k => !['id','astronautId'].includes(k))) invalid('body','Send an astronautId and a run id.');
    const clock = now(), time = clock.getTime();
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
