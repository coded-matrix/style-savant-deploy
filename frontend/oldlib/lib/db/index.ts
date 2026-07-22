import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import postgres from "postgres";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { initSqliteDatabase } from "./sqlite-init";

type AppDatabase = PostgresJsDatabase<typeof schema>;

// Determine database type based on environment
const useSqlite = process.env.USE_SQLITE === "true" || process.env.NODE_ENV === "test";

let db: AppDatabase;
let client: postgres.Sql | null = null;

if (useSqlite) {
  const sqlite = new Database("dev.db");
  initSqliteDatabase(sqlite);
  db = drizzleSqlite(sqlite, { schema }) as unknown as AppDatabase;
  console.log("🗄️  Using SQLite database for local testing");
} else {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set and USE_SQLITE is not enabled. Set DATABASE_URL or set USE_SQLITE=true for local testing.");
    throw new Error("Missing DATABASE_URL environment variable");
  }

  client = postgres(connectionString, { prepare: false });
  db = drizzle(client, { schema });
  console.log("🐘 Using PostgreSQL database");
}

export { db, client };

