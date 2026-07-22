export function dbTimestamp(): Date {
  return new Date();
}

// SQLite stores jsonb columns as TEXT; serialise to string so both SQLite and
// PostgreSQL drivers receive a type they can bind without throwing.
export function toJsonField(value: unknown): string {
  return JSON.stringify(value);
}
