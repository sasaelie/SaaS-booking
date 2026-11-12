import type { PoolConfig } from 'pg';
import { DATABASE, DatabaseSchema, supportsSessionLocks } from '../../config/database';

function connectionOptions(connectionString: string, ca?: string): PoolConfig {
  const url = new URL(connectionString);
  const hosted = url.hostname.endsWith('.pooler.supabase.com') || url.hostname.endsWith('.supabase.co');
  if (!hosted) return { connectionString };
  for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) url.searchParams.delete(key);
  return {
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: true, ...(ca ? { ca } : {}) },
  };
}

export function databasePoolOptions(
  connectionString: string,
  schema: string = DATABASE.DEFAULT_SCHEMA,
  ca?: string,
): PoolConfig {
  if (!supportsSessionLocks(connectionString)) throw Error('Session connection required');
  const safeSchema = DatabaseSchema.parse(schema);
  return {
    ...connectionOptions(connectionString, ca),
    max: DATABASE.POOL_MAX,
    connectionTimeoutMillis: DATABASE.CONNECTION_TIMEOUT_MS,
    idleTimeoutMillis: DATABASE.IDLE_TIMEOUT_MS,
    options: `-c search_path=${safeSchema},pg_catalog`,
  };
}
