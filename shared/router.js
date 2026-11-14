import { ApiError } from './validation.js';

// Mini-roteador com o subconjunto do Express que as rotas usam.
// A mesma tabela de rotas roda atrás do Express (server/app.js) e dentro do navegador.
export function createRouter() {
  const routes = [];
  const add = method => (path, handler) => { routes.push({ method, parts: path.split('/').filter(Boolean), handler }); };
  function match(method, pathname) {
    let parts;
    try { parts = pathname.split('/').filter(Boolean).map(decodeURIComponent); } catch { return null; }
    for (const route of routes) {
      if (route.method !== method || route.parts.length !== parts.length) continue;
      const params = {};
      if (route.parts.every((part, i) => part.startsWith(':') ? (params[part.slice(1)] = parts[i], true) : part === parts[i])) return { route, params };
    }
    return null;
  }
  return {
    get: add('GET'), post: add('POST'),
    // Devolve sempre { status, body }; nunca lança.
    async handle(method, pathname, { query = {}, body } = {}) {
      let status = 200, payload;
      const res = { status(code) { status = code; return res; }, json(value) { payload = value; return res; } };
      try {
        const found = match(method, pathname);
        if (!found) throw new ApiError(404, 'NOT_FOUND', 'Rota não encontrada.');
        await found.route.handler({ params: found.params, query, body }, res);
        return { status, body: payload };
      } catch (error) { return errorResponse(error); }
    },
  };
}

export function errorResponse(error) {
  if (!(error instanceof ApiError)) { console.error(error); error = new ApiError(500, 'INTERNAL_ERROR', 'Não foi possível concluir a operação.'); }
  return { status: error.status, body: { error: { code: error.code, message: error.message, fields: error.fields } } };
}
