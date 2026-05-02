/**
 * Raw SQL postgres connection for IR Agency Command Center.
 * Uses the `postgres` npm package (not Drizzle ORM).
 *
 * IMPORTANT: The built-in DATABASE_URL is MySQL/TiDB used by the auth/user
 * system (Drizzle ORM in server/db.ts). IR-specific tables (clients, settings,
 * insights_cache) live in Supabase PostgreSQL and require SUPABASE_DATABASE_URL.
 */
import postgres from 'postgres';

let _sql: ReturnType<typeof postgres> | null = null;

export function getSql() {
  if (!_sql) {
    const url = process.env.SUPABASE_DATABASE_URL;
    if (!url) {
      throw new Error(
        '[DB] SUPABASE_DATABASE_URL is not set. ' +
        'Add your Supabase PostgreSQL connection string in the Manus Secrets panel.'
      );
    }
    _sql = postgres(url, {
      ssl: 'require',
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return _sql;
}

export default getSql;
