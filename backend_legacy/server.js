import { fileURLToPath } from 'node:url';
import { openStore } from './store.js';
import { createApp } from './app.js';
const file = process.env.DATA_FILE || fileURLToPath(new URL('../data/records.json', import.meta.url));
const store = await openStore(file);
const app = createApp(store, { corsOrigins: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean) });
const port = Number(process.env.PORT || 3000);
app.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`API disponível em http://${process.env.HOST || '127.0.0.1'}:${port}/api/v1`));
