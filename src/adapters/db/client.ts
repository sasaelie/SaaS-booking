import { Pool } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
export type DrizzlePgDb = NodePgDatabase<Record<string, never>>;
export function createDatabase(connectionString: string): {
  readonly db: DrizzlePgDb;
  readonly pool: Pool;
} {
  const pool = new Pool({ connectionString, max: 10 });
  return { db: drizzle(pool), pool };
}
