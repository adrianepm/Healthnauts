import express from 'express';
import { createRouter, errorResponse } from '../shared/router.js';
import { registerRoutes } from '../shared/routes.js';
import { ApiError } from '../shared/validation.js';

// O Express cuida só de HTTP (CORS, JSON, erros de corpo). As rotas vivem em shared/routes.js
// e são as mesmas que o navegador usa no modo local.
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
  const router = createRouter();
  registerRoutes(router, store, now);
  app.use(async (req, res) => {
    const result = await router.handle(req.method, req.path, { query: req.query, body: req.body });
    res.status(result.status).json(result.body);
  });
  app.use((error, req, res, next) => {
    if (error.type === 'entity.parse.failed') error = new ApiError(400, 'INVALID_JSON', 'JSON inválido.');
    if (error.type === 'entity.too.large') error = new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Corpo excede 1 MB.');
    const result = errorResponse(error);
    res.status(result.status).json(result.body);
  });
  return app;
}
