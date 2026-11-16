import 'server-only';
import { createHmac } from 'node:crypto';
import type { Environment } from '../config/env';
import { DATABASE } from '../config/database';
import { SIMULATION } from '../config/simulation';
import { createDatabase } from '../adapters/db/client';
let database: ReturnType<typeof createDatabase> | undefined;
export function simulationRuntime(env: Environment) {
  const sourceSchema = env.DATABASE_SCHEMA ?? DATABASE.DEFAULT_SCHEMA;
  database ??= createDatabase(
    env.DATABASE_URL,
    sourceSchema + SIMULATION.SCHEMA_SUFFIX,
    env.DATABASE_SSL_CA,
  );
  const secret = createHmac('sha256', env.SELF_CANCEL_HMAC_SECRET)
    .update(SIMULATION.SECRET_CONTEXT)
    .digest('hex');
  return { db: database.db, sourceSchema, secret };
}
