import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';
import { config } from './env';

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL must be set');
}

// prepare: false keeps us compatible with connection poolers
const client = postgres(config.databaseUrl, { prepare: false });

export const db = drizzle(client, { schema });
export { client };
