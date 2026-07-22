// dotenv is loaded via -r dotenv/config in the dev script.
// In production, set env vars through the environment directly.

import { config, validateEnv } from './config/env';

// Validate before loading anything that touches the DB, so a missing var fails fast and clean
try {
  validateEnv();
} catch (err) {
  console.error((err as Error).message);
  process.exit(1);
}

// Loaded with require (not a top import) so the lines above run first
import type { Express } from 'express';
import type { client as DbClient } from './config/db';

const app: Express = require('./app').default;
const { client } = require('./config/db') as { client: typeof DbClient };

const server = app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

function shutdown() {
  console.log('Shutting down...');
  server.close(async () => {
    await client.end();
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
