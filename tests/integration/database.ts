import { afterAll, beforeEach } from 'vitest';
import { sql } from 'drizzle-orm';
import { createDatabase } from '../../src/adapters/db/client';
const url = process.env['TEST_DATABASE_URL'];
if (!url || !/^postgresql:\/\/[^@]+@127\.0\.0\.1:[0-9]+\/booking_test$/.test(url))
  throw Error('TEST_DATABASE_URL must target local booking_test');
export const { db, pool } = createDatabase(url);
beforeEach(async () => {
  await db.execute(sql`TRUNCATE organizations, "user", "rateLimit" CASCADE`);
});
afterAll(async () => {
  await pool.end();
});
