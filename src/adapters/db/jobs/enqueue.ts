import { sql } from 'drizzle-orm';
import type { Executor } from '../transaction';
export async function enqueue(
  db: Executor,
  organizationId: string,
  type: string,
  key: string,
  payload: unknown,
  availableAt?: Date,
): Promise<void> {
  await db.execute(
    sql`INSERT INTO outbox_jobs(organization_id,type,deduplication_key,payload,available_at) VALUES(${organizationId},${type},${key},${JSON.stringify(payload)}::jsonb,COALESCE(${availableAt?.toISOString() ?? null}::timestamptz,now())) ON CONFLICT(deduplication_key) DO NOTHING`,
  );
}
