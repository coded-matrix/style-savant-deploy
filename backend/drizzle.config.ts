import { defineConfig } from 'drizzle-kit';

// Migration ownership: this backend and the frontend share one database. To avoid
// conflicting migrations, only ONE side runs `drizzle-kit migrate` in production.
// Coordinate with the team before applying schema changes here.
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
});
