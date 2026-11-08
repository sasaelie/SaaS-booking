import { Pool } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { databasePoolOptions } from './pool-options';
export type DrizzlePgDb = NodePgDatabase<Record<string, never>>;
export function createDatabase(
  connectionString: string,
  schema?: string,
  ca?: string,
): {
  readonly db: DrizzlePgDb;
  readonly pool: Pool;
} {
  const pool = new Pool(databasePoolOptions(connectionString, schema, ca));
  return { db: drizzle(pool), pool };
}
