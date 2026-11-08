import type { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { Result } from '../../../lib/result';
import { failure } from '../../../lib/errors';
import { ERROR_CODES } from '../../../config/constants';
import type { DrizzlePgDb } from '../../db/client';
export async function billingLock<T>(
  pool: Pool,
  id: string,
  action: (db: DrizzlePgDb) => Promise<Result<T>>,
): Promise<Result<T>> {
  const client = await pool.connect();
  let locked = false;
  let discard = false;
  try {
    const result = await client.query<{ locked: boolean }>(
      'SELECT pg_try_advisory_lock(hashtextextended($1,0)) AS locked',
      [`billing:${id}`],
    );
    locked = result.rows[0]?.locked ?? false;
    if (!locked) return failure(ERROR_CODES.CONFLICT, 'Subscription', 'busy');
    return await action(drizzle(client));
  } catch {
    return failure(ERROR_CODES.PAYMENT_PROVIDER_ERROR, 'Subscription', 'provider');
  } finally {
    if (locked) {
      try {
        await client.query('SELECT pg_advisory_unlock(hashtextextended($1,0))', [`billing:${id}`]);
      } catch {
        discard = true;
      }
    }
    client.release(discard);
  }
}
