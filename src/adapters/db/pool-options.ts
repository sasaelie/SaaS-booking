import type { PoolConfig } from 'pg';
import { DATABASE, DatabaseSchema, supportsSessionLocks } from '../../config/database';

export function databasePoolOptions(
  connectionString: string,
  schema: string = DATABASE.DEFAULT_SCHEMA,
): PoolConfig {
  if (!supportsSessionLocks(connectionString)) throw Error('Session connection required');
  const safeSchema = DatabaseSchema.parse(schema);
  return {
    connectionString,
    max: DATABASE.POOL_MAX,
    connectionTimeoutMillis: DATABASE.CONNECTION_TIMEOUT_MS,
    idleTimeoutMillis: DATABASE.IDLE_TIMEOUT_MS,
    options: `-c search_path=${safeSchema},public`,
  };
}
