import express from 'express';
import { areas } from './config/areas.js';
import { catalog } from './config/catalog.js';
import { ApiError, invalid, timestamp, queryContext, validateBatch } from './validation.js';
import { chronological, trends } from './trends.js';
export function createApp(store, { now = () => new Date(), corsOrigins = [] } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    const origin = req.get('Origin');
    const local = origin && /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin);
    if (origin && (local || corsOrigins.includes(origin))) {
      res.set('Access-Control-Allow-Origin', origin).vary('Origin');
      res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
  app.use(express.json({ limit: '1mb' }));
  const filtered = ctx => store.all().filter(r => r.astronautId === ctx.astronautId && (ctx.dataset === 'simulated' ? r.source === 'simulated' : ['manual', 'sensor'].includes(r.source)));
  const latest = (records, definitions) => definitions.map(d => records.filter(r => r.indicator === d.id).sort(chronological).at(-1)).filter(Boolean);
  app.get('/api/v1/overview', (req, res) => {
    const ctx = queryContext(req.query);
    const records = filtered(ctx);
    res.json({ ...ctx, areas: areas.map(area => {
      const own = records.filter(r => r.areaId === area.id).sort(chronological);
      return { areaId: area.id, title: area.title, summary: area.summary, isSimulated: ctx.isSimulated,
        dataStatus: own.length ? 'available' : 'no_data', recordCount: own.length,
        lastRecordedAt: own.at(-1)?.recordedAt ?? null, latestRecord: own.at(-1) ?? null,
        highlights: latest(own, catalog[area.id].filter(d => area.highlightIndicators.includes(d.id))) };
    }) });
  });
  app.param('areaId', (req, res, next, id) => {
    req.area = areas.find(a => a.id === id);
    if (!req.area) return next(new ApiError(404, 'AREA_NOT_FOUND', 'Área não encontrada.'));
    next();
  });
  app.get('/api/v1/areas/:areaId', (req, res) => {
    const ctx = queryContext(req.query);
    const { highlightIndicators, content, references, ...area } = req.area;
    res.json({ ...ctx, area, content, references, indicatorDefinitions: catalog[area.id],
      latestRecords: latest(filtered(ctx).filter(r => r.areaId === area.id), catalog[area.id]) });
  });
  app.get('/api/v1/areas/:areaId/history', (req, res) => {
    const ctx = queryContext(req.query);
    const { indicator, from, to } = req.query;
    let definitions = catalog[req.area.id];
    if (indicator !== undefined) {
      definitions = definitions.filter(d => d.id === indicator);
      if (!definitions.length) invalid('indicator', 'Indicador não pertence à área.');
    }
    if (from !== undefined && !timestamp(from)) invalid('from', 'Envie data ISO 8601 válida com fuso.');
    if (to !== undefined && !timestamp(to)) invalid('to', 'Envie data ISO 8601 válida com fuso.');
    const end = to === undefined ? now().getTime() : Date.parse(to);
    const start = from === undefined ? end - 7 * 86400000 : Date.parse(from);
    if (start >= end) invalid('from', 'from deve ser anterior a to.');
    const records = filtered(ctx).filter(r => r.areaId === req.area.id && definitions.some(d => d.id === r.indicator)
      && Date.parse(r.recordedAt) >= start && Date.parse(r.recordedAt) < end).sort(chronological);
    if (records.length > 10000) throw new ApiError(400, 'HISTORY_TOO_LARGE', 'Consulte um intervalo menor; limite de 10000 registros por resposta.');
    res.json({ ...ctx, areaId: req.area.id, period: { from: new Date(start).toISOString(), to: new Date(end).toISOString() }, records,
      trends: trends(records, definitions, ctx.dataset) });
  });
  app.post('/api/v1/areas/:areaId/records', async (req, res) => {
    const records = validateBatch(req.body, req.area.id, catalog[req.area.id]);
    await store.append(records);
    res.status(201).json({ apiVersion: 'v1', astronautId: req.body.astronautId, records });
  });
  app.use((req, res, next) => next(new ApiError(404, 'NOT_FOUND', 'Rota não encontrada.')));
  app.use((error, req, res, next) => {
    if (error.type === 'entity.parse.failed') error = new ApiError(400, 'INVALID_JSON', 'JSON inválido.');
    if (error.type === 'entity.too.large') error = new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Corpo excede 1 MB.');
    if (!(error instanceof ApiError)) { console.error(error); error = new ApiError(500, 'INTERNAL_ERROR', 'Não foi possível concluir a operação.'); }
    res.status(error.status).json({ error: { code: error.code, message: error.message, fields: error.fields } });
  });
  return app;
}
