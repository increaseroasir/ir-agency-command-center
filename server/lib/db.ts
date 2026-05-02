/**
 * Raw SQL postgres connection for IR Agency Command Center.
 * Uses the `postgres` npm package (not Drizzle ORM).
 * DATABASE_URL is injected at runtime — never hardcoded.
 */
import postgres from 'postgres';

let _sql: ReturnType<typeof postgres> | null = null;

export function getSql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('[DB] DATABASE_URL environment variable is not set');
    }
    _sql = postgres(url, { ssl: 'require' });
  }
  return _sql;
}

export default getSql;
